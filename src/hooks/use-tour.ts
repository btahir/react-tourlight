'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { waitForElement } from '../engine/element-observer.ts'
import { isRouteActive as defaultIsRouteActive, getCurrentPath } from '../engine/route.ts'
import type { TourStateMachineActions } from '../engine/state-machine.ts'
import { createTourStateMachine } from '../engine/state-machine.ts'
import { resolveTarget } from '../engine/step-resolver.ts'
import { trackTarget } from '../engine/target-tracker.ts'
import { generateClipPath, generateEmptyClipPath } from '../overlay/clip-path.ts'
import type { ElementRect, SpotlightStep, TourState, TourStatus } from '../types.ts'
import { runCallback } from '../utils/callback.ts'
import { scrollIntoView } from '../utils/scroll-into-view.ts'

/** Options for the headless {@link useTour} hook. */
export interface UseTourOptions {
  /** Steps in this tour. */
  steps: SpotlightStep[]
  /** Called when the tour completes. */
  onComplete?: () => void
  /** Called when the tour is skipped, with the step index it was skipped at. */
  onSkip?: (stepIndex: number) => void
  /** Called on every state-machine transition (start / step / complete / skip). */
  onStateChange?: (state: TourState) => void
  /** Reports rejected setup hooks; the tour stops safely. */
  onError?: (error: unknown) => void
  /** Initial machine state — e.g. restored from persistence. */
  initialState?: Partial<TourState>
  /** Default max time (ms) to wait for a step target before skipping it. */
  waitForElementTimeout?: number
  /**
   * Called when advancing to a step whose `route` doesn't match the current
   * location. Plug in your router (e.g. `router.push`).
   */
  navigate?: (path: string) => void
  /** Custom route matcher. Overrides the built-in one. */
  isRouteActive?: (route: string, pathname: string) => boolean
  /** Scroll the target into view before showing it. Default: `true`. */
  autoScroll?: boolean
}

/** Value returned by the headless {@link useTour} hook. */
export interface UseTourResult {
  /** Lifecycle status of the tour. */
  status: TourStatus
  /** Whether a step is currently being shown. */
  isActive: boolean
  /** Index of the current step. */
  currentIndex: number
  /** Total number of steps. */
  totalSteps: number
  /** The current step definition (or `null` when inactive). */
  step: SpotlightStep | null
  /** The resolved target element for the current step (or `null` while resolving). */
  targetElement: HTMLElement | null
  /** The measured, padded rect of the current target (viewport-relative). */
  rect: ElementRect | null
  /** A ready-to-use CSS `clip-path` for the current rect (full overlay when none). */
  clipPath: string
  /** Whether the tour is waiting for the current step's target to appear. */
  isResolving: boolean
  start: () => void
  stop: () => void
  next: () => void
  previous: () => void
  skip: () => void
  goToStep: (index: number) => void
}

/**
 * Headless tour controller. Drives the tour state machine, resolves + measures
 * each step's target (with async waiting, optional scrolling, and route-aware
 * navigation), and returns everything needed to render your own overlay and
 * tooltip. It imports no styles and no positioning library — you own the
 * rendering entirely.
 *
 * @example
 * ```tsx
 * const tour = useTour({ steps })
 * // render your own overlay using tour.clipPath / tour.rect and your own
 * // tooltip anchored to tour.targetElement.
 * ```
 */
export function useTour(options: UseTourOptions): UseTourResult {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const machineRef = useRef<TourStateMachineActions | null>(null)

  const [status, setStatus] = useState<TourStatus>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const lastShownRef = useRef<number | null>(null)
  const resolvedIndexRef = useRef<number | null>(null)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [rect, setRect] = useState<ElementRect | null>(null)

  const steps = options.steps
  const totalSteps = steps.length
  const isActive = status === 'active'
  const step = isActive ? (steps[currentIndex] ?? null) : null

  // Resolve (and optionally scroll to / navigate for) the current step target.
  const resolveAndMeasure = useCallback(
    async (target: SpotlightStep, signal: AbortSignal): Promise<HTMLElement | null> => {
      const opts = optionsRef.current

      await target.onBeforeStep?.()
      if (signal.aborted) return null

      if (target.route) {
        const matcher = opts.isRouteActive ?? defaultIsRouteActive
        if (!matcher(target.route, getCurrentPath())) {
          opts.navigate?.(target.route)
        }
      }

      const resolver = target.route
        ? () =>
            (opts.isRouteActive ?? defaultIsRouteActive)(target.route as string, getCurrentPath())
              ? resolveTarget(target.target)
              : null
        : target.target
      const el = await waitForElement(resolver, {
        timeout: target.timeout ?? opts.waitForElementTimeout,
        signal,
        requireVisible: true,
      })
      if (!el) return null
      if (opts.autoScroll !== false) {
        await scrollIntoView(el)
      }
      return signal.aborted ? null : el
    },
    [],
  )

  // When the active step changes, resolve its target (or skip forward).
  useEffect(() => {
    if (status !== 'active') return
    const current = optionsRef.current.steps[currentIndex]
    if (!current) return

    const controller = new AbortController()
    let cancelled = false
    const expectedIndex = currentIndex

    resolvedIndexRef.current = null
    setTargetElement(null)
    setRect(null)

    resolveAndMeasure(current, controller.signal)
      .then((el) => {
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
          const opts = optionsRef.current
          const latest = opts.steps[expectedIndex]
          if (!latest) return null
          if (
            latest.route &&
            !(opts.isRouteActive ?? defaultIsRouteActive)(latest.route, getCurrentPath())
          )
            return null
          return resolveTarget(latest.target)
        }
        trackTarget(resolver, el, {
          signal: controller.signal,
          timeout: current.timeout ?? optionsRef.current.waitForElementTimeout,
          padding: () => optionsRef.current.steps[expectedIndex]?.spotlightPadding ?? 8,
          onChange: (element, rect) => {
            resolvedIndexRef.current = element ? expectedIndex : null
            setTargetElement(element)
            setRect(rect)
          },
          onTimeout: skipUnavailable,
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        machineRef.current?.stop()
        optionsRef.current.onError?.(error)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [status, currentIndex, resolveAndMeasure])

  const start = useCallback(() => {
    const opts = optionsRef.current
    machineRef.current?.stop()

    const machine = createTourStateMachine({
      steps: opts.steps,
      getSteps: () => optionsRef.current.steps,
      deferAfterShow: true,
      onError: (error) => optionsRef.current.onError?.(error),
      initialState: { ...opts.initialState, status: 'idle' },
      onComplete: () => optionsRef.current.onComplete?.(),
      onSkip: (index) => optionsRef.current.onSkip?.(index),
      onStateChange: (state) => {
        if (machineRef.current !== machine) return
        setStatus(state.status)
        if (!state.isTransitioning) setCurrentIndex(state.currentStepIndex)
        if (state.status !== 'active') {
          setTargetElement(null)
          setRect(null)
        }
        optionsRef.current.onStateChange?.(state)
      },
    })

    lastShownRef.current = null
    setCurrentIndex(-1)
    machineRef.current = machine
    void machine.start()
  }, [])

  const stop = useCallback(() => machineRef.current?.stop(), [])
  const next = useCallback(() => {
    void machineRef.current?.next()
  }, [])
  const previous = useCallback(() => {
    void machineRef.current?.previous()
  }, [])
  const skip = useCallback(() => machineRef.current?.skip(), [])
  const goToStep = useCallback((index: number) => {
    void machineRef.current?.goToStep(index)
  }, [])

  useEffect(() => {
    if (
      !isActive ||
      !targetElement ||
      !rect ||
      resolvedIndexRef.current !== currentIndex ||
      lastShownRef.current === currentIndex
    )
      return
    lastShownRef.current = currentIndex
    const machine = machineRef.current
    runCallback(optionsRef.current.steps[currentIndex]?.onAfterShow, (error) => {
      if (machineRef.current === machine) machine?.stop()
      optionsRef.current.onError?.(error)
    })
  }, [isActive, targetElement, rect, currentIndex])

  useEffect(() => {
    const advanceOn = optionsRef.current.steps[currentIndex]?.advanceOn
    if (!isActive || !targetElement || !advanceOn) return
    const handler = (event: Event) => {
      if (advanceOn.selector) {
        if (!(event.target instanceof Element)) return
        try {
          const match = event.target.closest(advanceOn.selector)
          if (!match || !targetElement.contains(match)) return
        } catch {
          return
        }
      }
      void machineRef.current?.next()
    }
    targetElement.addEventListener(advanceOn.event, handler, true)
    return () => targetElement.removeEventListener(advanceOn.event, handler, true)
  }, [isActive, targetElement, currentIndex])

  // Tear the machine down on unmount.
  useEffect(() => {
    return () => {
      machineRef.current?.dispose()
      machineRef.current = null
    }
  }, [])

  const clipPath = rect
    ? generateClipPath(rect, 0, step?.spotlightRadius ?? 8)
    : generateEmptyClipPath()

  return {
    status,
    isActive,
    currentIndex,
    totalSteps,
    step,
    targetElement,
    rect,
    clipPath,
    isResolving: isActive && targetElement === null,
    start,
    stop,
    next,
    previous,
    skip,
    goToStep,
  }
}
