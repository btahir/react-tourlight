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
import { measureElement } from '../overlay/measure.ts'
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
  const tours = useRef<Map<string, TourRegistration>>(new Map())
  const machineRef = useRef<TourStateMachineActions | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)
  const portalRootRef = useRef<HTMLDivElement | null>(null)
  const activeTourIdRef = useRef<string | null>(null)
  const highlightStepRef = useRef<SpotlightStep | null>(null)
  // Last step index reported via onStepChange for the active tour, so the
  // callback fires exactly once per step entered (state updates can repeat).
  const lastReportedStepRef = useRef<number | null>(null)

  // ---- Cross-navigation persistence ----
  const storage = useMemo(() => resolveStorage(persist), [persist])
  const resolvedKey = persistKey ?? DEFAULT_PERSIST_KEY
  // Snapshot persisted state once at mount (used both to resume a tour and to
  // seed the state machine's initial state when a tour is (re)started).
  const [persistedTours] = useState<Record<string, PersistedTourState>>(() =>
    storage ? loadPersistedTours(storage, resolvedKey) : {},
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

  useEffect(() => {
    activeTourIdRef.current = activeTourId
  }, [activeTourId])

  useEffect(() => {
    highlightStepRef.current = highlightStep
  }, [highlightStep])

  // Get the current step from active tour
  const getCurrentStep = useCallback((): SpotlightStep | null => {
    if (highlightStep) return highlightStep
    if (!activeTourId) return null
    const tour = tours.current.get(activeTourId)
    return tour?.steps[currentStepIndex] ?? null
  }, [activeTourId, currentStepIndex, highlightStep])

  const dismissHighlight = useCallback(() => {
    highlightStepRef.current?.onHide?.()
    highlightStepRef.current = null
    setHighlightStep(null)
    setHighlightElement(null)
    setHighlightRect(null)

    if (triggerElementRef.current) {
      triggerElementRef.current.focus()
      triggerElementRef.current = null
    }
  }, [])

  // Resolve target element and measure it
  const resolveAndMeasure = useCallback(
    async (step: SpotlightStep): Promise<HTMLElement | null> => {
      let el = resolveTarget(step.target)
      if (!el) {
        const timeout = step.timeout ?? waitForElementTimeout
        el =
          timeout !== undefined
            ? await waitForElement(step.target, { timeout })
            : await waitForElement(step.target)
      }
      if (!el) return null
      if (autoScroll) await scrollIntoView(el)
      return el
    },
    [waitForElementTimeout, autoScroll],
  )

  // Track target element rect via ResizeObserver + scroll
  useEffect(() => {
    const el = targetElement ?? highlightElement
    if (!el) {
      setTargetRect(null)
      setHighlightRect(null)
      return
    }

    const update = () => {
      const step = getCurrentStep()
      const padding = step?.spotlightPadding ?? 8
      const rect = measureElement(el, padding)
      if (activeTourId) setTargetRect(rect)
      if (highlightStep) setHighlightRect(rect)
    }

    update()

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)

    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [targetElement, highlightElement, activeTourId, highlightStep, getCurrentStep])

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
      setCurrentStepIndex(state.currentStepIndex)

      if (state.status === 'active' && lastReportedStepRef.current !== state.currentStepIndex) {
        lastReportedStepRef.current = state.currentStepIndex
        const tour = tours.current.get(tourId)
        const step = tour?.steps[state.currentStepIndex]
        if (step) {
          tour?.onStepChange?.(state.currentStepIndex, step)
          onStepChange?.(tourId, state.currentStepIndex, step)
        }
      }

      // Persist across navigations (best-effort). We keep 'completed' records
      // so a finished tour isn't auto-resumed on the next mount, but clear
      // 'idle' (explicitly stopped) records.
      if (storage) {
        if (state.status === 'idle') {
          clearPersistedTour(storage, resolvedKey, tourId)
        } else {
          const stepCount = tours.current.get(tourId)?.steps.length ?? state.currentStepIndex + 1
          savePersistedTour(storage, resolvedKey, tourId, state, stepCount)
        }
      }

      if (state.status === 'idle' || state.status === 'completed') {
        activeTourIdRef.current = null
        setActiveTourId(null)
        setTargetElement(null)
        setTargetRect(null)
        machineRef.current = null

        // Restore focus to trigger element
        if (triggerElementRef.current) {
          triggerElementRef.current.focus()
          triggerElementRef.current = null
        }
      }

      onStateChange?.(tourId, state)
    },
    [onStateChange, onStepChange, storage, resolvedKey],
  )

  // When step changes, resolve the new target
  useEffect(() => {
    if (!activeTourId) return
    const tour = tours.current.get(activeTourId)
    const step = tour?.steps[currentStepIndex]
    if (!step) return

    let cancelled = false
    const expectedIndex = currentStepIndex

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

      const el = await resolveAndMeasure(step)
      if (cancelled) return

      if (el) {
        setTargetElement(el)
        return
      }

      const machine = machineRef.current
      if (
        machine &&
        machine.getState().status === 'active' &&
        machine.getState().currentStepIndex === expectedIndex
      ) {
        void machine.next()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeTourId, currentStepIndex, resolveAndMeasure, navigate, isRouteActive])

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
        const matched = eventTarget.closest(advanceOn.selector)
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
      const persisted = persistedTours[tourId]
      const persistedInit =
        persisted &&
        persisted.status === 'active' &&
        isPersistedStateFresh(persisted, tour.steps.length, persistMaxAge)
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
        initialState: explicitInit ?? persistedInit ?? initialState?.[tourId],
        onComplete: () => {
          tour.onComplete?.()
          onComplete?.(tourId)
        },
        onSkip: (stepIndex) => {
          tour.onSkip?.(stepIndex)
          onSkip?.(tourId, stepIndex)
        },
        onStateChange: (state) => {
          handleStateChange(tourId, state)
        },
      })

      machineRef.current = machine
      activeTourIdRef.current = tourId
      setActiveTourId(tourId)
      setTotalSteps(tour.steps.length)
      tour.onStart?.()
      onStart?.(tourId)
      machine.start()
    },
    [
      dismissHighlight,
      handleStateChange,
      initialState,
      onComplete,
      onSkip,
      onStart,
      persistedTours,
      persistMaxAge,
    ],
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
      tours.current.delete(id)
      setTourRegistrationTick((t) => t + 1)
      if (activeTourId === id) {
        stop()
      }
    },
    [activeTourId, stop],
  )

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
      if (!isPersistedStateFresh(persisted, tour.steps.length, persistMaxAge)) continue

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

      const el = resolveTarget(step.target)
      if (el) {
        if (autoScroll) {
          scrollIntoView(el).then(() => setHighlightElement(el))
        } else {
          setHighlightElement(el)
        }
      }
    },
    [stop, autoScroll],
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
