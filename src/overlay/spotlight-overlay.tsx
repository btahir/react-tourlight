import type React from 'react'
import type { ElementRect } from '../types.ts'
import { cn } from '../utils/css.ts'
import { generateClipPath, generateEmptyClipPath } from './clip-path.ts'

export interface SpotlightOverlayProps {
  /** The target element's bounding rect (viewport-relative) */
  targetRect: ElementRect | null
  /** Padding around the spotlight cutout (px) */
  padding?: number
  /** Border radius for the cutout corners (px) */
  radius?: number
  /** Overlay background color (should include alpha) */
  overlayColor?: string
  /** Transition duration in ms */
  transitionDuration?: number
  /** Called when the overlay (outside the cutout) is clicked */
  onClick?: () => void
  /** If true, the target element beneath the cutout remains interactive */
  interactive?: boolean
  /** Extra class name(s) appended to the overlay element */
  className?: string
}

/**
 * Builds the four transparent "blocker" rectangles that surround the spotlight
 * hole in interactive mode. They cover everything except the target rect, so
 * they still capture backdrop clicks (for dismissal) and prevent interaction
 * with the rest of the page — while the hole itself is left completely
 * uncovered, letting ALL pointer/keyboard/focus/scroll events reach the target
 * naturally (no synthesized events, no `elementFromPoint` hit-testing).
 */
function buildBlockers(rect: ElementRect, onClick?: () => void): React.ReactElement[] {
  const base: React.CSSProperties = {
    position: 'fixed',
    background: 'transparent',
    pointerEvents: 'auto',
  }

  const handleClick = onClick
    ? (event: React.MouseEvent) => {
        event.stopPropagation()
        onClick()
      }
    : undefined

  const regions: Record<string, React.CSSProperties> = {
    top: { ...base, left: 0, top: 0, right: 0, height: Math.max(0, rect.y) },
    bottom: {
      ...base,
      left: 0,
      right: 0,
      top: rect.y + rect.height,
      bottom: 0,
    },
    left: {
      ...base,
      left: 0,
      top: rect.y,
      width: Math.max(0, rect.x),
      height: rect.height,
    },
    right: {
      ...base,
      left: rect.x + rect.width,
      right: 0,
      top: rect.y,
      height: rect.height,
    },
  }

  return Object.entries(regions).map(([side, style]) => (
    <div
      key={side}
      className="spotlight-overlay-blocker"
      style={style}
      onClick={handleClick}
      aria-hidden="true"
    />
  ))
}

/**
 * Renders the spotlight overlay — a full-viewport div with a clip-path cutout
 * that reveals the target element underneath.
 *
 * In the default (non-interactive) mode this is a single div whose clip-path
 * (transitioned via CSS, see spotlight.css) creates the rounded cutout, and
 * clicking it dismisses the tour.
 *
 * In interactive mode (target present) the visual div keeps the exact same
 * clip-path appearance but is made `pointer-events: none`, and four transparent
 * blocker rectangles are drawn around the target instead. The spotlight hole is
 * therefore a genuine gap in the pointer-capture surface — real clicks, typing,
 * hovering, dragging, and scrolling all reach the highlighted element.
 */
export function SpotlightOverlay({
  targetRect,
  padding = 0,
  radius = 0,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  transitionDuration = 300,
  onClick,
  interactive = false,
  className,
}: SpotlightOverlayProps): React.ReactElement {
  const clipPath = targetRect
    ? generateClipPath(targetRect, padding, radius)
    : generateEmptyClipPath()

  // Genuine pass-through only applies once there's a hole to pass through.
  const passthrough = interactive && targetRect != null

  const style: React.CSSProperties = {
    backgroundColor: overlayColor,
    clipPath,
    WebkitClipPath: clipPath,
    transitionDuration: `${transitionDuration}ms`,
    pointerEvents: passthrough ? 'none' : 'auto',
  }

  const handleClick = (event: React.MouseEvent): void => {
    if (onClick) {
      event.stopPropagation()
      onClick()
    }
  }

  const visual = (
    <div
      className={cn('spotlight-overlay', className)}
      style={style}
      onClick={passthrough ? undefined : handleClick}
      aria-hidden="true"
    />
  )

  if (!passthrough || !targetRect) {
    return visual
  }

  return (
    <>
      {visual}
      {buildBlockers(targetRect, onClick)}
    </>
  )
}
