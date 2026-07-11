import type React from 'react'
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
  /** Extra class name(s) appended to the overlay element */
  className?: string
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
  className,
}: SpotlightOverlayProps): React.ReactElement {
  const clipPath = targetRect
    ? generateClipPath(targetRect, padding, radius)
    : generateEmptyClipPath()

  const style: React.CSSProperties = {
    backgroundColor: overlayColor,
    clipPath,
    WebkitClipPath: clipPath,
    transitionDuration: `${transitionDuration}ms`,
    pointerEvents: 'auto',
  }

  const handleClick = (event: React.MouseEvent): void => {
    if (interactive && targetRect) {
      const withinX =
        event.clientX >= targetRect.x && event.clientX <= targetRect.x + targetRect.width
      const withinY =
        event.clientY >= targetRect.y && event.clientY <= targetRect.y + targetRect.height

      if (withinX && withinY) {
        const overlay = event.currentTarget
        const previousPointerEvents = overlay.style.pointerEvents
        overlay.style.pointerEvents = 'none'
        const underlying = document.elementFromPoint(event.clientX, event.clientY)
        overlay.style.pointerEvents = previousPointerEvents

        if (underlying && underlying instanceof HTMLElement) {
          underlying.dispatchEvent(
            new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: event.clientX,
              clientY: event.clientY,
              view: window,
            }),
          )
        }
        return
      }
    }

    if (onClick) {
      event.stopPropagation()
      onClick()
    }
  }

  return (
    <div
      className={className ? `spotlight-overlay ${className}` : 'spotlight-overlay'}
      style={style}
      onClick={handleClick}
      aria-hidden="true"
    />
  )
}
