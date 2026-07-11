'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { waitForElement } from '../engine/element-observer.ts'
import { isRouteActive as defaultIsRouteActive, getCurrentPath } from '../engine/route.ts'
import type { TourStateMachineActions } from '../engine/state-machine.ts'
import { createTourStateMachine } from '../engine/state-machine.ts'
import { resolveTarget } from '../engine/step-resolver.ts'
import { generateClipPath, generateEmptyClipPath } from '../overlay/clip-path.ts'
import { measureElement } from '../overlay/measure.ts'
import type { ElementRect, SpotlightStep, TourState, TourStatus } from '../types.ts'
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
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [rect, setRect] = useState<ElementRect | null>(null)

  const steps = options.steps
  const totalSteps = steps.length
  const isActive = status === 'active'
  const step = isActive ? (steps[currentIndex] ?? null) : null

  // Resolve (and optionally scroll to / navigate for) the current step target.
  const resolveAndMeasure = useCallback(
    async (target: SpotlightStep): Promise<HTMLElement | null> => {
      const opts = optionsRef.current

      await target.onBeforeStep?.()

      if (target.route) {
        const matcher = opts.isRouteActive ?? defaultIsRouteActive
        if (!matcher(target.route, getCurrentPath())) {
          opts.navigate?.(target.route)
        }
      }

      let el = resolveTarget(target.target)
      if (!el && typeof target.target === 'string') {
        const timeout = target.timeout ?? opts.waitForElementTimeout
        el =
          timeout !== undefined
            ? await waitForElement(target.target, { timeout })
            : await waitForElement(target.target)
      }
      if (!el) return null
      if (opts.autoScroll !== false) {
        await scrollIntoView(el)
      }
      return el
    },
    [],
  )

  // When the active step changes, resolve its target (or skip forward).
  useEffect(() => {
    if (status !== 'active') return
    const current = steps[currentIndex]
    if (!current) return

    let cancelled = false
    const expectedIndex = currentIndex

    setTargetElement(null)
    setRect(null)

    resolveAndMeasure(current).then((el) => {
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
    })

    return () => {
      cancelled = true
    }
  }, [status, currentIndex, steps, resolveAndMeasure])

  // Keep the measured rect in sync with the target (resize / scroll).
  useEffect(() => {
    if (!targetElement) {
      setRect(null)
      return
    }

    const update = () => {
      const current = optionsRef.current.steps[machineRef.current?.getState().currentStepIndex ?? 0]
      const padding = current?.spotlightPadding ?? 8
      setRect(measureElement(targetElement, padding))
    }

    update()

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(targetElement)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [targetElement])

  const start = useCallback(() => {
    const opts = optionsRef.current
    machineRef.current?.stop()

    const machine = createTourStateMachine({
      steps: opts.steps,
      initialState: opts.initialState,
      onComplete: opts.onComplete,
      onSkip: opts.onSkip,
      onStateChange: (state) => {
        setStatus(state.status)
        setCurrentIndex(state.currentStepIndex)
        if (state.status !== 'active') {
          setTargetElement(null)
          setRect(null)
        }
        opts.onStateChange?.(state)
      },
    })

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

  // Tear the machine down on unmount.
  useEffect(() => {
    return () => {
      machineRef.current?.stop()
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
