import type { Placement as FloatingPlacement } from '@floating-ui/react-dom'
import { arrow, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import type { SpotlightTheme } from '../themes/types.ts'
import type { Placement, SpotlightLabels, SpotlightStep, TooltipRenderProps } from '../types.ts'
import { cn } from '../utils/css.ts'
import { createFocusTrap } from './focus-trap.ts'
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
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [animationClass, setAnimationClass] = useState('spotlight-tooltip-enter')

  // Unique ids for the default title/content elements. Generated per
  // instance (via useId) so multiple tooltips on the page never collide,
  // and only wired up to aria-labelledby/aria-describedby below when the
  // default TooltipContent is actually rendering those elements — a custom
  // renderTooltip has no guarantee of producing matching ids, so pointing
  // aria-labelledby/aria-describedby at ids that don't exist would leave
  // screen readers with dangling references.
  const generatedTitleId = useId()
  const generatedContentId = useId()

  const floatingPlacement = toFloatingPlacement(step.placement)

  const {
    refs,
    floatingStyles,
    placement: computedPlacement,
    middlewareData,
  } = useFloating({
    strategy: 'fixed',
    placement: floatingPlacement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(12), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
  })

  // Attach the target element as the reference
  useEffect(() => {
    if (targetElement) {
      refs.setReference(targetElement)
    }
  }, [targetElement, refs])

  // Keep keyboard focus trapped inside the tooltip while it's visible.
  useEffect(() => {
    const tooltip = tooltipRef.current
    if (!tooltip || !targetElement) return

    const trap = createFocusTrap(tooltip)
    trap.activate()

    return () => {
      trap.deactivate()
    }
  }, [targetElement])

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
      close: onClose,
      currentIndex,
      totalSteps,
      isFirst: currentIndex === 0,
      isLast: currentIndex === totalSteps - 1,
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
      titleId={generatedTitleId}
      contentId={generatedContentId}
    />
  )

  // Only point aria-labelledby/aria-describedby at the generated ids when
  // the default TooltipContent (which renders elements with those ids) is
  // actually being rendered. A custom renderTooltip controls its own markup
  // and has no obligation to emit matching ids, so referencing them here
  // would create dangling ARIA refs.
  const titleId = renderTooltip ? undefined : generatedTitleId
  const contentId = renderTooltip ? undefined : generatedContentId

  return (
    <div
      ref={(node) => {
        tooltipRef.current = node
        refs.setFloating(node)
      }}
      className={cn('spotlight-tooltip', animationClass)}
      style={
        {
          ...floatingStyles,
          ...theme.tooltip,
          maxWidth: theme.tooltip.maxWidth,
          // Set the CSS custom property so animations respect the configured duration
          '--spotlight-duration': `${transitionDuration}ms`,
          // Theme-driven hover states, consumed by :hover rules in
          // spotlight.css. These properties are otherwise dead (defined on
          // the theme but never applied) without this wiring.
          '--spotlight-btn-hover-bg': theme.button.hoverBackground,
          '--spotlight-btn-secondary-hover-bg': theme.buttonSecondary.hoverBackground,
          '--spotlight-close-hover-color': theme.closeButton.hoverColor,
        } as React.CSSProperties
      }
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={contentId}
    >
      {tooltipContent}

      <TooltipArrow ref={arrowRef} style={arrowStyle} fill={theme.arrow.fill} />
    </div>
  )
}
