import type { Placement as FloatingPlacement } from '@floating-ui/react-dom'
import { arrow, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { SpotlightTheme } from '../themes/types.ts'
import type { Placement, SpotlightLabels, SpotlightStep, TooltipRenderProps } from '../types.ts'
import { cn } from '../utils/css.ts'
import { TooltipArrow } from './tooltip-arrow.tsx'
import { TooltipContent } from './tooltip-content.tsx'

export interface SpotlightTooltipProps {
  targetElement: HTMLElement | null
  step: SpotlightStep
  currentIndex: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onClose: () => void
  theme: SpotlightTheme
  showProgress?: boolean
  showSkip?: boolean
  labels?: SpotlightLabels
  renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
  transitionDuration?: number
}

/**
 * Converts our simplified Placement type to Floating UI's placement.
 * 'auto' means no preference — we pass undefined so Floating UI picks the best side.
 */
function toFloatingPlacement(placement?: Placement): FloatingPlacement | undefined {
  if (!placement || placement === 'auto') {
    return undefined
  }
  return placement
}

/**
 * Returns inline styles for the arrow based on Floating UI's computed arrow position.
 */
function getArrowStyle(placement: string, arrowX?: number, arrowY?: number): React.CSSProperties {
  const side = placement.split('-')[0]
  const style: React.CSSProperties = {}

  if (arrowX != null) {
    style.left = `${arrowX}px`
  }

  if (arrowY != null) {
    style.top = `${arrowY}px`
  }

  // Position the arrow on the opposite side of the tooltip and rotate it
  switch (side) {
    case 'top':
      style.bottom = '-6px'
      style.transform = 'rotate(180deg)'
      break
    case 'bottom':
      style.top = '-6px'
      style.transform = 'rotate(0deg)'
      break
    case 'left':
      style.right = '-6px'
      style.transform = 'rotate(90deg)'
      break
    case 'right':
      style.left = '-6px'
      style.transform = 'rotate(-90deg)'
      break
  }

  return style
}

/**
 * Positioned tooltip component that uses @floating-ui/react-dom
 * for smart placement and collision avoidance.
 */
export function SpotlightTooltip({
  targetElement,
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  theme,
  showProgress,
  showSkip,
  labels,
  renderTooltip,
  transitionDuration = 300,
}: SpotlightTooltipProps) {
  const arrowRef = useRef<HTMLDivElement>(null)
  const [animationClass, setAnimationClass] = useState('spotlight-tooltip-enter')

  const floatingPlacement = toFloatingPlacement(step.placement)

  const {
    refs,
    floatingStyles,
    placement: computedPlacement,
    middlewareData,
  } = useFloating({
    placement: floatingPlacement,
    middleware: [offset(12), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
  })

  // Attach the target element as the reference
  useEffect(() => {
    if (targetElement) {
      refs.setReference(targetElement)
    }
  }, [targetElement, refs])

  // Enter animation: start with enter class, add enter-active on next frame.
  // We intentionally depend on currentIndex to restart the animation when the step changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentIndex triggers animation restart on step change
  useEffect(() => {
    setAnimationClass('spotlight-tooltip-enter')

    const frameId = requestAnimationFrame(() => {
      setAnimationClass('spotlight-tooltip-enter spotlight-tooltip-enter-active')
    })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [currentIndex])

  if (!targetElement) {
    return null
  }

  const arrowData = middlewareData.arrow
  const arrowStyle = getArrowStyle(
    computedPlacement,
    arrowData?.x ?? undefined,
    arrowData?.y ?? undefined,
  )

  const tooltipContent = renderTooltip ? (
    renderTooltip({
      step,
      next: onNext,
      previous: onPrevious,
      skip: onSkip,
      currentIndex,
      totalSteps,
    })
  ) : (
    <TooltipContent
      step={step}
      currentIndex={currentIndex}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrevious={onPrevious}
      onSkip={onSkip}
      onClose={onClose}
      theme={theme}
      showProgress={showProgress}
      showSkip={showSkip}
      labels={labels}
    />
  )

  return (
    <div
      ref={refs.setFloating}
      className={cn('spotlight-tooltip', animationClass)}
      style={
        {
          ...floatingStyles,
          ...theme.tooltip,
          maxWidth: theme.tooltip.maxWidth,
          // Set the CSS custom property so animations respect the configured duration
          '--spotlight-duration': `${transitionDuration}ms`,
        } as React.CSSProperties
      }
      role="dialog"
      aria-labelledby="spotlight-title"
      aria-describedby="spotlight-content"
    >
      {tooltipContent}

      <TooltipArrow ref={arrowRef} style={arrowStyle} fill={theme.arrow.fill} />
    </div>
  )
}
