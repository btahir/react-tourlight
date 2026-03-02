import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createKeyboardHandler } from '../engine/keyboard.ts'
import type { TourStateMachineActions } from '../engine/state-machine.ts'
import { createTourStateMachine } from '../engine/state-machine.ts'
import { resolveTarget } from '../engine/step-resolver.ts'
import { measureElement } from '../overlay/measure.ts'
import { SpotlightOverlay } from '../overlay/spotlight-overlay.tsx'
import { resolveTheme } from '../themes/index.ts'
import { SpotlightTooltip } from '../tooltip/spotlight-tooltip.tsx'
import type {
  ElementRect,
  SpotlightContextValue,
  SpotlightLabels,
  SpotlightProviderProps,
  SpotlightStep,
  TooltipRenderProps,
  TourState,
} from '../types.ts'
import { getStepAriaLabel } from '../utils/a11y.ts'
import { scrollIntoView } from '../utils/scroll-into-view.ts'

const SpotlightContext = React.createContext<SpotlightContextValue | null>(null)

export { SpotlightContext }

interface TourRegistration {
  steps: SpotlightStep[]
  onComplete?: () => void
  onSkip?: (stepIndex: number) => void
  renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
}

export function SpotlightProvider({
  children,
  theme: themeProp = 'auto',
  overlayColor,
  transitionDuration = 300,
  escToDismiss = true,
  overlayClickToDismiss = true,
  showProgress = true,
  showSkip = true,
  labels,
  onComplete,
  onSkip,
  onStateChange,
  initialState,
}: SpotlightProviderProps) {
  const theme = useMemo(() => resolveTheme(themeProp), [themeProp])
  const tours = useRef<Map<string, TourRegistration>>(new Map())
  const machineRef = useRef<TourStateMachineActions | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)

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

  // Resolve target element and measure it
  const resolveAndMeasure = useCallback(
    async (step: SpotlightStep): Promise<HTMLElement | null> => {
      const el = resolveTarget(step.target)
      if (!el) return null
      await scrollIntoView(el)
      return el
    },
    [],
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
          setHighlightStep(null)
          setHighlightElement(null)
        } else {
          machineRef.current?.skip()
        }
      },
      escToDismiss,
    })

    handler.attach()
    return () => handler.detach()
  }, [isActive, escToDismiss, highlightStep])

  const handleStateChange = useCallback(
    (state: TourState) => {
      setCurrentStepIndex(state.currentStepIndex)

      if (state.status === 'idle' || state.status === 'completed') {
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

      if (activeTourId) {
        onStateChange?.(activeTourId, state)
      }
    },
    [activeTourId, onStateChange],
  )

  // When step changes, resolve the new target
  useEffect(() => {
    if (!activeTourId) return
    const tour = tours.current.get(activeTourId)
    const step = tour?.steps[currentStepIndex]
    if (!step) return

    let cancelled = false
    resolveAndMeasure(step).then((el) => {
      if (!cancelled) {
        setTargetElement(el)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeTourId, currentStepIndex, resolveAndMeasure])

  const start = useCallback(
    (tourId: string) => {
      const tour = tours.current.get(tourId)
      if (!tour) {
        // biome-ignore lint/suspicious/noConsole: Intentional developer warning for invalid tour ID
        console.warn(
          `react-tourlight: Tour "${tourId}" not found. Make sure <SpotlightTour id="${tourId}"> is mounted.`,
        )
        return
      }

      // Store the element that triggered the tour for focus restoration
      triggerElementRef.current = document.activeElement as HTMLElement | null

      const machine = createTourStateMachine({
        steps: tour.steps,
        initialState: initialState?.[tourId],
        onComplete: () => {
          tour.onComplete?.()
          onComplete?.(tourId)
        },
        onSkip: (stepIndex) => {
          tour.onSkip?.(stepIndex)
          onSkip?.(tourId, stepIndex)
        },
        onStateChange: handleStateChange,
      })

      machineRef.current = machine
      setActiveTourId(tourId)
      setTotalSteps(tour.steps.length)
      machine.start()
    },
    [handleStateChange, initialState, onComplete, onSkip],
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
        renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
      },
    ) => {
      tours.current.set(id, {
        steps,
        onComplete: callbacks?.onComplete,
        onSkip: callbacks?.onSkip,
        renderTooltip: callbacks?.renderTooltip,
      })
    },
    [],
  )

  const unregisterTour = useCallback(
    (id: string) => {
      tours.current.delete(id)
      if (activeTourId === id) {
        stop()
      }
    },
    [activeTourId, stop],
  )

  const highlight = useCallback(
    (step: SpotlightStep) => {
      // Stop any active tour
      if (activeTourId) stop()

      triggerElementRef.current = document.activeElement as HTMLElement | null
      setHighlightStep(step)

      const el = resolveTarget(step.target)
      if (el) {
        scrollIntoView(el).then(() => setHighlightElement(el))
      }
    },
    [activeTourId, stop],
  )

  const dismissHighlight = useCallback(() => {
    setHighlightStep(null)
    setHighlightElement(null)
    setHighlightRect(null)

    if (triggerElementRef.current) {
      triggerElementRef.current.focus()
      triggerElementRef.current = null
    }
  }, [])

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

  return (
    <SpotlightContext.Provider value={contextValue}>
      {children}

      {isActive && currentStep && createPortal(
        <>
          <SpotlightOverlay
            targetRect={activeRect}
            padding={0}
            radius={currentStep.spotlightRadius ?? 8}
            overlayColor={overlayColor ?? theme.overlay.background}
            transitionDuration={transitionDuration}
            onClick={handleOverlayClick}
            interactive={currentStep.interactive}
          />

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
        </>,
        document.body
      )}
    </SpotlightContext.Provider>
  )
}
