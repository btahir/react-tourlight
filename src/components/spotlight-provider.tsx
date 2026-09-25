import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { waitForElement } from '../engine/element-observer.ts'
import { createKeyboardHandler } from '../engine/keyboard.ts'
import {
  clearPersistedTour,
  DEFAULT_PERSIST_KEY,
  isPersistedStateFresh,
  loadPersistedTours,
  type PersistedTourState,
  resolveStorage,
  savePersistedTour,
} from '../engine/persistence.ts'
import { isRouteActive as defaultIsRouteActive, getCurrentPath } from '../engine/route.ts'
import type { TourStateMachineActions } from '../engine/state-machine.ts'
import { createTourStateMachine } from '../engine/state-machine.ts'
import { resolveTarget } from '../engine/step-resolver.ts'
import { trackTarget } from '../engine/target-tracker.ts'
import { SpotlightOverlay } from '../overlay/spotlight-overlay.tsx'
import { resolveTheme } from '../themes/index.ts'
import type { SpotlightTheme } from '../themes/types.ts'
import { SpotlightTooltip } from '../tooltip/spotlight-tooltip.tsx'
import type {
  ElementRect,
  SpotlightContextValue,
  SpotlightLabels,
  SpotlightProviderProps,
  SpotlightStep,
  StartOptions,
  TooltipRenderProps,
  TourState,
} from '../types.ts'
import { getStepAriaLabel, setInert } from '../utils/a11y.ts'
import { runCallback } from '../utils/callback.ts'
import { scrollIntoView } from '../utils/scroll-into-view.ts'

const SpotlightContext = React.createContext<SpotlightContextValue | null>(null)

export { SpotlightContext }

interface TourRegistration {
  steps: SpotlightStep[]
  onComplete?: () => void
  onSkip?: (stepIndex: number) => void
  onStart?: () => void
  onStepChange?: (stepIndex: number, step: SpotlightStep) => void
  renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
}

function stableStepIds(steps: SpotlightStep[]): string[] | undefined {
  return steps.every((step) => typeof step.id === 'string')
    ? steps.map((step) => step.id as string)
    : undefined
}

function resolvePortalContainer(
  container: SpotlightProviderProps['portalContainer'],
): HTMLElement | null {
  if (typeof document === 'undefined') return null
  if (typeof container === 'function') return container() ?? document.body
  return container ?? document.body
}

export function SpotlightProvider({
  children,
  theme: themeProp = 'light',
  overlayColor,
  transitionDuration = 300,
  escToDismiss = true,
  overlayClickToDismiss = true,
  showProgress = true,
  showSkip = true,
  labels,
  onComplete,
  onSkip,
  onStart,
  onStepChange,
  onStateChange,
  onError,
  initialState,
  waitForElementTimeout,
  persist,
  persistKey,
  persistMaxAge,
  resume = true,
  navigate,
  isRouteActive,
  portalContainer,
  autoScroll = true,
}: SpotlightProviderProps) {
  const [theme, setTheme] = useState<SpotlightTheme>(() => resolveTheme(themeProp))

  // Re-resolve the theme whenever `themeProp` changes, and — when it's
  // 'auto' — keep it in sync with live OS color-scheme changes so the tour
  // doesn't get stuck on whatever mode was active at mount time.
  useEffect(() => {
    setTheme(resolveTheme(themeProp))

    if (themeProp !== 'auto' || typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setTheme(resolveTheme(themeProp))

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Safari <14 fallback
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [themeProp])
  const callbacksRef = useRef({ onComplete, onSkip, onStart, onStepChange, onStateChange, onError })
  callbacksRef.current = { onComplete, onSkip, onStart, onStepChange, onStateChange, onError }
  const mountedRef = useRef(true)
  const highlightGeneration = useRef(0)
  const highlightAbortRef = useRef<AbortController | null>(null)
  const tours = useRef<Map<string, TourRegistration>>(new Map())
  const machineRef = useRef<TourStateMachineActions | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)
  const portalRootRef = useRef<HTMLDivElement | null>(null)
  const activeTourIdRef = useRef<string | null>(null)
  const highlightStepRef = useRef<SpotlightStep | null>(null)
  // Last step index reported via onStepChange for the active tour, so the
  // callback fires exactly once per step entered (state updates can repeat).
  const lastReportedStepRef = useRef<number | null>(null)
  const resolvedStepRef = useRef<number | null>(null)

  // ---- Cross-navigation persistence ----
  const storage = useMemo(() => resolveStorage(persist), [persist])
  const resolvedKey = persistKey ?? DEFAULT_PERSIST_KEY
  // Snapshot persisted state once at mount (used both to resume a tour and to
  // seed the state machine's initial state when a tour is (re)started).
  const persistedTours = useMemo<Record<string, PersistedTourState>>(
    () => (storage ? loadPersistedTours(storage, resolvedKey) : {}),
    [storage, resolvedKey],
  )
  // Tracks which tours have already been auto-resumed so we only do it once.
  const resumedRef = useRef<Set<string>>(new Set())
  // Bumped whenever tours register/unregister so the resume effect re-checks
  // once a persisted tour's steps become available.
  const [tourRegistrationTick, setTourRegistrationTick] = useState(0)

  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null)

  // Single-element highlight state
  const [highlightStep, setHighlightStep] = useState<SpotlightStep | null>(null)
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null)
  const [highlightRect, setHighlightRect] = useState<ElementRect | null>(null)

  const isActive = activeTourId !== null || highlightStep !== null

  // Get the current step from active tour
  const getCurrentStep = useCallback((): SpotlightStep | null => {
    if (highlightStep) return highlightStep
    if (!activeTourId) return null
    const tour = tours.current.get(activeTourId)
    return tour?.steps[currentStepIndex] ?? null
  }, [activeTourId, currentStepIndex, highlightStep])

  const restoreFocus = useCallback(() => {
    const trigger = triggerElementRef.current
    triggerElementRef.current = null
    // The page is still inert while state updates commit. Restore after the
    // overlay's cleanup, otherwise native browsers reject the focus request.
    requestAnimationFrame(() => {
      if (!activeTourIdRef.current && !highlightStepRef.current && trigger?.isConnected)
        trigger.focus()
    })
  }, [])

  const dismissHighlight = useCallback(() => {
    highlightGeneration.current++
    highlightAbortRef.current?.abort()
    runCallback(highlightStepRef.current?.onHide, (error) =>
      callbacksRef.current.onError?.(error, null),
    )
    highlightStepRef.current = null
    setHighlightStep(null)
    setHighlightElement(null)
    setHighlightRect(null)

    restoreFocus()
  }, [restoreFocus])

  // Resolve target element and measure it
  const resolveAndMeasure = useCallback(
    async (step: SpotlightStep, signal: AbortSignal): Promise<HTMLElement | null> => {
      const target = step.route
        ? () =>
            (isRouteActive ?? defaultIsRouteActive)(step.route as string, getCurrentPath())
              ? resolveTarget(step.target)
              : null
        : step.target
      const el = await waitForElement(target, {
        timeout: step.timeout ?? waitForElementTimeout,
        signal,
        requireVisible: true,
      })
      if (!el) return null
      if (autoScroll) await scrollIntoView(el)
      return signal.aborted ? null : el
    },
    [waitForElementTimeout, autoScroll, isRouteActive],
  )

  // Keyboard handler
  useEffect(() => {
    if (!isActive) return

    const handler = createKeyboardHandler({
      onNext: () => machineRef.current?.next(),
      onPrevious: () => machineRef.current?.previous(),
      onDismiss: () => {
        if (highlightStep) {
          dismissHighlight()
        } else {
          machineRef.current?.skip()
        }
      },
      escToDismiss,
    })

    handler.attach()
    return () => handler.detach()
  }, [isActive, escToDismiss, highlightStep, dismissHighlight])

  const handleStateChange = useCallback(
    (tourId: string, state: TourState) => {
      if (!state.isTransitioning) setCurrentStepIndex(state.currentStepIndex)

      // Persist across navigations (best-effort). We keep 'completed' records
      // so a finished tour isn't auto-resumed on the next mount, but clear
      // 'idle' (explicitly stopped) records.
      if (storage) {
        if (state.status === 'idle') {
          clearPersistedTour(storage, resolvedKey, tourId)
        } else {
          const stepCount = tours.current.get(tourId)?.steps.length ?? state.currentStepIndex + 1
          savePersistedTour(
            storage,
            resolvedKey,
            tourId,
            state,
            stepCount,
            stableStepIds(tours.current.get(tourId)?.steps ?? []),
          )
        }
      }

      if (state.status === 'idle' || state.status === 'completed') {
        activeTourIdRef.current = null
        setActiveTourId(null)
        setTargetElement(null)
        setTargetRect(null)
        machineRef.current = null

        // Restore focus to trigger element
        restoreFocus()
      }

      callbacksRef.current.onStateChange?.(tourId, state)
    },
    [storage, resolvedKey, restoreFocus],
  )

  const currentTarget = getCurrentStep()?.target

  // When step changes, resolve the new target
  useEffect(() => {
    if (!activeTourId) return
    const tour = tours.current.get(activeTourId)
    const step = tour?.steps[currentStepIndex]
    if (!step || currentTarget === undefined) return

    const controller = new AbortController()
    let cancelled = false
    const expectedIndex = currentStepIndex

    resolvedStepRef.current = null
    // Reset current target while the next step target is being resolved.
    setTargetElement(null)
    setTargetRect(null)

    void (async () => {
      // Step-level escape hatch — a place to run custom navigation/setup
      // before the target is resolved.
      await step.onBeforeStep?.()
      if (cancelled) return

      // Route-aware navigation: if this step lives on a different route than
      // the current location, ask the host app to navigate there. For SPA
      // navigation the component stays mounted and `waitForElement` picks up
      // the new page's target; for a full page load the page unloads and
      // persisted state resumes this step on the destination.
      if (step.route) {
        const matcher = isRouteActive ?? defaultIsRouteActive
        if (!matcher(step.route, getCurrentPath())) {
          navigate?.(step.route)
        }
      }

      const el = await resolveAndMeasure(step, controller.signal)
      if (cancelled) return

      const skipUnavailable = () => {
        const machine = machineRef.current
        if (
          !cancelled &&
          machine &&
          machine.getState().status === 'active' &&
          machine.getState().currentStepIndex === expectedIndex
        )
          void machine.next()
      }
      if (!el) {
        skipUnavailable()
        return
      }
      const resolver = () => {
        const latestStep = tours.current.get(activeTourId)?.steps[expectedIndex]
        if (!latestStep) return null
        if (
          latestStep.route &&
          !(isRouteActive ?? defaultIsRouteActive)(latestStep.route, getCurrentPath())
        )
          return null
        return resolveTarget(latestStep.target)
      }
      trackTarget(resolver, el, {
        signal: controller.signal,
        timeout: step.timeout ?? waitForElementTimeout,
        padding: () => tours.current.get(activeTourId)?.steps[expectedIndex]?.spotlightPadding ?? 8,
        onChange: (element, rect) => {
          resolvedStepRef.current = element ? expectedIndex : null
          setTargetElement(element)
          setTargetRect(rect)
        },
        onTimeout: skipUnavailable,
      })
    })().catch((error: unknown) => {
      if (cancelled) return
      machineRef.current?.stop()
      callbacksRef.current.onError?.(error, activeTourId)
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    activeTourId,
    currentStepIndex,
    currentTarget,
    resolveAndMeasure,
    navigate,
    isRouteActive,
    waitForElementTimeout,
  ])

  // Mark the rest of the page inert while spotlight UI is active. For
  // interactive / advanceOn steps, keep the spotlighted target reachable so
  // real pointer/keyboard/focus interaction works.
  const activeElementForInert = highlightStep ? highlightElement : targetElement
  const currentStepForInert = getCurrentStep()
  const keepTargetInteractive =
    !!currentStepForInert && (!!currentStepForInert.interactive || !!currentStepForInert.advanceOn)

  useEffect(() => {
    if (!isActive) return
    const root = portalRootRef.current
    if (!root) return

    return setInert(root, keepTargetInteractive ? activeElementForInert : null)
  }, [isActive, keepTargetInteractive, activeElementForInert])

  // Auto-advance when a step's `advanceOn` event fires on its target.
  useEffect(() => {
    if (!activeTourId) return
    const tour = tours.current.get(activeTourId)
    const step = tour?.steps[currentStepIndex]
    const advanceOn = step?.advanceOn
    if (!advanceOn || !targetElement) return

    const handler = (event: Event) => {
      if (advanceOn.selector) {
        const eventTarget = event.target
        if (!(eventTarget instanceof Element)) return
        let matched: Element | null
        try {
          matched = eventTarget.closest(advanceOn.selector)
        } catch {
          return
        }
        if (!matched || !targetElement.contains(matched)) return
      }
      void machineRef.current?.next()
    }

    // Capture phase: non-bubbling events (e.g. `focus`, `blur`) still travel
    // through the capturing phase on their way down to the actual target, so
    // listening here — rather than the (default) bubble phase — lets
    // `advanceOn.selector` delegate for those events too, not just ones that
    // bubble (click, input, submit, ...). `event.target` / `closest()` below
    // are unaffected by which phase the handler runs in.
    targetElement.addEventListener(advanceOn.event, handler, true)
    return () => {
      targetElement.removeEventListener(advanceOn.event, handler, true)
    }
  }, [activeTourId, currentStepIndex, targetElement])

  const start = useCallback(
    (tourId: string, options?: StartOptions) => {
      const tour = tours.current.get(tourId)
      if (!tour) {
        // biome-ignore lint/suspicious/noConsole: Intentional developer warning for invalid tour ID
        console.warn(
          `react-tourlight: Tour "${tourId}" not found. Make sure <SpotlightTour id="${tourId}"> is mounted.`,
        )
        return
      }

      // If a one-off highlight is active, dismiss it before starting a tour.
      if (highlightStepRef.current) {
        dismissHighlight()
      }

      // Only one tour can be active at a time.
      if (activeTourIdRef.current) {
        machineRef.current?.stop()
      }

      // Store the element that triggered the tour for focus restoration
      triggerElementRef.current = document.activeElement as HTMLElement | null

      // Prefer a fresh persisted snapshot (resume across reloads) over the
      // static `initialState` prop; fall back to the prop otherwise. We seed
      // only the step index + seen steps (status stays 'idle') so `start()`
      // actually re-enters the persisted step rather than short-circuiting on
      // an already-'active' status. Only an `'active'` snapshot represents an
      // in-progress tour to resume — a `'completed'`/`'idle'` (skipped)
      // snapshot must NOT be resumed here, otherwise calling `start()` again
      // after a tour finished (e.g. a "Replay tour" button) would jump
      // straight back to the last step instead of restarting at step 0.
      const persisted = storage ? loadPersistedTours(storage, resolvedKey)[tourId] : undefined
      const persistedInit =
        persisted &&
        persisted.status === 'active' &&
        isPersistedStateFresh(
          persisted,
          tour.steps.length,
          persistMaxAge,
          stableStepIds(tour.steps),
        )
          ? { currentStepIndex: persisted.currentStepIndex, seenSteps: persisted.seenSteps }
          : undefined

      // An explicit `stepIndex` wins over persisted / initial state.
      const requestedIndex = options?.stepIndex
      const explicitInit =
        requestedIndex !== undefined &&
        Number.isInteger(requestedIndex) &&
        requestedIndex >= 0 &&
        requestedIndex < tour.steps.length
          ? { currentStepIndex: requestedIndex, seenSteps: [] }
          : undefined

      lastReportedStepRef.current = null

      const machine = createTourStateMachine({
        steps: tour.steps,
        getSteps: () => tours.current.get(tourId)?.steps ?? tour.steps,
        deferAfterShow: true,
        onError: (error) => callbacksRef.current.onError?.(error, tourId),
        initialState: {
          ...(explicitInit ?? persistedInit ?? initialState?.[tourId]),
          status: 'idle',
        },
        onComplete: () => {
          tours.current.get(tourId)?.onComplete?.()
          callbacksRef.current.onComplete?.(tourId)
        },
        onSkip: (stepIndex) => {
          tours.current.get(tourId)?.onSkip?.(stepIndex)
          callbacksRef.current.onSkip?.(tourId, stepIndex)
        },
        onStateChange: (state) => {
          if (machineRef.current === machine && mountedRef.current) handleStateChange(tourId, state)
        },
      })

      machineRef.current = machine
      activeTourIdRef.current = tourId
      setCurrentStepIndex(-1)
      setActiveTourId(tourId)
      setTotalSteps(tour.steps.length)
      tour.onStart?.()
      callbacksRef.current.onStart?.(tourId)
      void machine.start()
    },
    [dismissHighlight, handleStateChange, initialState, storage, resolvedKey, persistMaxAge],
  )

  const stop = useCallback(() => {
    machineRef.current?.stop()
  }, [])

  const next = useCallback(() => {
    machineRef.current?.next()
  }, [])

  const previous = useCallback(() => {
    machineRef.current?.previous()
  }, [])

  const skip = useCallback(() => {
    machineRef.current?.skip()
  }, [])

  const goToStep = useCallback((index: number) => {
    machineRef.current?.goToStep(index)
  }, [])

  const registerTour = useCallback(
    (
      id: string,
      steps: SpotlightStep[],
      callbacks?: {
        onComplete?: () => void
        onSkip?: (stepIndex: number) => void
        onStart?: () => void
        onStepChange?: (stepIndex: number, step: SpotlightStep) => void
        renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
      },
    ) => {
      if (activeTourIdRef.current === id) {
        setTotalSteps(steps.length)
        if (machineRef.current && machineRef.current.getState().currentStepIndex >= steps.length) {
          machineRef.current.stop()
        }
      }
      tours.current.set(id, {
        steps,
        onComplete: callbacks?.onComplete,
        onSkip: callbacks?.onSkip,
        onStart: callbacks?.onStart,
        onStepChange: callbacks?.onStepChange,
        renderTooltip: callbacks?.renderTooltip,
      })
      // Signal the auto-resume effect that a (possibly persisted) tour is now
      // available to resume.
      setTourRegistrationTick((t) => t + 1)
    },
    [],
  )

  const unregisterTour = useCallback(
    (id: string) => {
      const registration = tours.current.get(id)
      // React StrictMode may immediately register again. Defer removal so a
      // real unmount can be distinguished without destroying resumed progress.
      queueMicrotask(() => {
        if (tours.current.get(id) !== registration) return
        tours.current.delete(id)
        if (!mountedRef.current) return
        setTourRegistrationTick((tick) => tick + 1)
        if (activeTourIdRef.current === id) stop()
      })
    },
    [stop],
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      machineRef.current?.dispose()
      highlightGeneration.current++
      highlightAbortRef.current?.abort()
    }
  }, [])

  // A viewed event means a target was found and measured, not merely requested.
  useEffect(() => {
    if (
      !activeTourId ||
      !targetElement ||
      !targetRect ||
      resolvedStepRef.current !== currentStepIndex ||
      lastReportedStepRef.current === currentStepIndex
    )
      return
    lastReportedStepRef.current = currentStepIndex
    const tour = tours.current.get(activeTourId)
    const step = tour?.steps[currentStepIndex]
    if (!step) return
    const originatingMachine = machineRef.current
    const report = (error: unknown) => {
      if (machineRef.current === originatingMachine) originatingMachine?.stop()
      callbacksRef.current.onError?.(error, activeTourId)
    }
    runCallback(step.onAfterShow, report)
    runCallback(() => tour?.onStepChange?.(currentStepIndex, step), report)
    runCallback(
      () => callbacksRef.current.onStepChange?.(activeTourId, currentStepIndex, step),
      report,
    )
  }, [activeTourId, currentStepIndex, targetElement, targetRect])

  // Auto-resume a persisted, still-active tour once it registers on mount.
  // `tourRegistrationTick` isn't read in the body — it's an intentional
  // trigger so this re-runs after a (possibly persisted) tour registers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: tourRegistrationTick re-triggers the resume check when tours register
  useEffect(() => {
    if (!storage || resume === false) return
    if (activeTourIdRef.current) return

    for (const [tourId, tour] of tours.current) {
      if (resumedRef.current.has(tourId)) continue
      const persisted = persistedTours[tourId]
      if (persisted?.status !== 'active') continue
      if (
        !isPersistedStateFresh(
          persisted,
          tour.steps.length,
          persistMaxAge,
          stableStepIds(tour.steps),
        )
      )
        continue

      resumedRef.current.add(tourId)
      start(tourId)
      break
    }
  }, [tourRegistrationTick, storage, resume, persistMaxAge, persistedTours, start])

  const highlight = useCallback(
    (step: SpotlightStep) => {
      // Stop any active tour
      if (activeTourIdRef.current) stop()

      triggerElementRef.current = document.activeElement as HTMLElement | null
      highlightStepRef.current = step
      setHighlightStep(step)

      const generation = ++highlightGeneration.current
      setHighlightElement(null)
      setHighlightRect(null)
      highlightAbortRef.current?.abort()
      const controller = new AbortController()
      highlightAbortRef.current = controller
      void resolveAndMeasure(step, controller.signal)
        .then((el) => {
          if (generation !== highlightGeneration.current || !mountedRef.current) return
          if (!el) {
            dismissHighlight()
            return
          }
          trackTarget(step.target, el, {
            signal: controller.signal,
            timeout: step.timeout ?? waitForElementTimeout,
            padding: () => step.spotlightPadding ?? 8,
            onChange: (element, rect) => {
              setHighlightElement(element)
              setHighlightRect(rect)
            },
            onTimeout: dismissHighlight,
          })
        })
        .catch((error: unknown) => {
          if (generation !== highlightGeneration.current) return
          dismissHighlight()
          callbacksRef.current.onError?.(error, null)
        })
    },
    [stop, resolveAndMeasure, dismissHighlight, waitForElementTimeout],
  )

  const handleOverlayClick = useCallback(() => {
    if (!overlayClickToDismiss) return

    if (highlightStep) {
      const disableOverlay = highlightStep.disableOverlayClose
      if (!disableOverlay) dismissHighlight()
    } else {
      const step = getCurrentStep()
      const disableOverlay = step?.disableOverlayClose
      if (!disableOverlay) skip()
    }
  }, [overlayClickToDismiss, highlightStep, dismissHighlight, getCurrentStep, skip])

  const contextValue = useMemo<SpotlightContextValue>(
    () => ({
      start,
      stop,
      next,
      previous,
      skip,
      goToStep,
      isActive,
      activeTourId,
      currentStep: currentStepIndex,
      totalSteps,
      registerTour,
      unregisterTour,
      highlight,
      dismissHighlight,
    }),
    [
      start,
      stop,
      next,
      previous,
      skip,
      goToStep,
      isActive,
      activeTourId,
      currentStepIndex,
      totalSteps,
      registerTour,
      unregisterTour,
      highlight,
      dismissHighlight,
    ],
  )

  // Determine current display state
  const currentStep = getCurrentStep()
  const renderedMachine = machineRef.current
  const renderedHighlightGeneration = highlightGeneration.current
  const activeElement = highlightStep ? highlightElement : targetElement
  const activeRect = highlightStep ? highlightRect : targetRect
  const activeLabels: SpotlightLabels | undefined = labels
  const activeTour = activeTourId ? tours.current.get(activeTourId) : null
  // The target hasn't been found/measured yet (e.g. still waiting for a
  // lazily-rendered element). Avoid painting a fully opaque overlay with no
  // tooltip and no spotlight cutout in this window — that reads as a broken
  // black screen. Show a dimmed overlay + loading indicator instead.
  const isResolvingTarget = !activeElement
  const container = isActive ? resolvePortalContainer(portalContainer) : null

  return (
    <SpotlightContext.Provider value={contextValue}>
      {children}

      {isActive &&
        currentStep &&
        container &&
        createPortal(
          <div ref={portalRootRef}>
            <SpotlightOverlay
              targetRect={activeRect}
              padding={0}
              radius={currentStep.spotlightRadius ?? 8}
              overlayColor={overlayColor ?? theme.overlay.background}
              transitionDuration={transitionDuration}
              onClick={handleOverlayClick}
              interactive={currentStep.interactive || !!currentStep.advanceOn}
              className={isResolvingTarget ? 'spotlight-overlay--loading' : undefined}
            />

            {isResolvingTarget ? (
              // <output> carries an implicit role="status"/aria-live="polite",
              // so screen readers announce this without extra ARIA plumbing.
              <output className="spotlight-loading">
                <span className="spotlight-loading-spinner" aria-hidden="true" />
                <span
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Loading tour step…
                </span>
              </output>
            ) : (
              <SpotlightTooltip
                targetElement={activeElement}
                step={currentStep}
                currentIndex={highlightStep ? 0 : currentStepIndex}
                totalSteps={highlightStep ? 1 : totalSteps}
                onNext={highlightStep ? dismissHighlight : next}
                onPrevious={previous}
                onSkip={highlightStep ? dismissHighlight : skip}
                onClose={highlightStep ? dismissHighlight : stop}
                onError={(error) => {
                  if (highlightStep) {
                    if (highlightGeneration.current === renderedHighlightGeneration)
                      dismissHighlight()
                  } else if (machineRef.current === renderedMachine) renderedMachine?.stop()
                  callbacksRef.current.onError?.(error, activeTourId)
                }}
                theme={theme}
                showProgress={highlightStep ? false : showProgress}
                showSkip={highlightStep ? false : showSkip}
                labels={activeLabels}
                renderTooltip={activeTour?.renderTooltip}
                transitionDuration={transitionDuration}
              />
            )}

            {/* Live region for screen reader step announcements */}
            <div
              aria-live="polite"
              className="sr-only"
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
              }}
            >
              {currentStep.title &&
                activeElement &&
                getStepAriaLabel(
                  highlightStep ? 0 : currentStepIndex,
                  highlightStep ? 1 : totalSteps,
                  currentStep.title,
                )}
            </div>
          </div>,
          container,
        )}
    </SpotlightContext.Provider>
  )
}
