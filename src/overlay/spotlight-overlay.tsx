import React from 'react'
import type { ElementRect } from '../types.ts'
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
}

/**
 * Renders the spotlight overlay — a full-viewport div with a clip-path cutout
 * that reveals the target element underneath.
 *
 * The clip-path transition is handled by CSS (see spotlight.css).
 * Inline styles override the transition duration and background color.
 */
export function SpotlightOverlay({
  targetRect,
  padding = 0,
  radius = 0,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  transitionDuration = 300,
  onClick,
  interactive = false,
}: SpotlightOverlayProps): React.ReactElement {
  const clipPath = targetRect
    ? generateClipPath(targetRect, padding, radius)
    : generateEmptyClipPath()

  const style: React.CSSProperties = {
    backgroundColor: overlayColor,
    clipPath,
    WebkitClipPath: clipPath,
    transitionDuration: `${transitionDuration}ms`,
    pointerEvents: interactive ? 'none' : 'auto',
  }

  const handleClick = (event: React.MouseEvent): void => {
    // Only fire onClick when clicking the overlay itself, not the cutout area
    if (onClick) {
      event.stopPropagation()
      onClick()
    }
  }

  return (
    <div
      className="spotlight-overlay"
      style={style}
      onClick={handleClick}
      aria-hidden="true"
    />
  )
}
