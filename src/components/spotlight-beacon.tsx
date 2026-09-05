import type React from 'react'
import { useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { waitForElement } from '../engine/element-observer.ts'
import { resolveTarget } from '../engine/step-resolver.ts'
import { measureElement } from '../overlay/measure.ts'
import type { ElementRect, SpotlightStep, SpotlightTarget } from '../types.ts'
import { cn } from '../utils/css.ts'
import { SpotlightContext } from './spotlight-provider.tsx'

/** Where the beacon dot sits relative to its target's bounding box. */
export type BeaconPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'

export interface SpotlightBeaconProps {
  /** CSS selector, React ref, or resolver function for the element to attach to */
  target: SpotlightTarget
  /**
   * ID of a registered `<SpotlightTour>` to start when the beacon is clicked.
   * Mutually exclusive with `highlight` (if both are given, `tour` wins).
   */
  tour?: string
  /** Step index to start `tour` at. Default: `0` (or the persisted position). */
  stepIndex?: number
  /**
   * A single-element highlight to show when clicked (a "What's new" callout).
   * `target` defaults to the beacon's own target.
   */
  highlight?: Omit<SpotlightStep, 'target'> & { target?: SpotlightTarget }
  /** Extra click handler (fires before starting the tour / highlight). */
  onClick?: () => void
  /** Whether the beacon is rendered. Default: `true`. */
  active?: boolean
  /** Hide the beacon while a tour or highlight is active. Default: `true`. */
  hideWhileActive?: boolean
  /** Position relative to the target's bounding box. Default: `'top-right'`. */
  position?: BeaconPosition
  /** Pixel offset applied along both axes, pushing the dot outward. Default: `0`. */
  offset?: number
  /** Dot diameter in px. Default: `12`. */
  size?: number
  /** Dot color (any CSS color). Defaults to the `--spotlight-beacon-color` CSS var / `#3b82f6`. */
  color?: string
  /** Accessible label for the button. Default: `'Start tour'`. */
  label?: string
  /** Extra class name(s) for the beacon button */
  className?: string
  /** Portal container. Default: `document.body`. */
  container?: HTMLElement | (() => HTMLElement | null) | null
  /** Max time (ms) to wait for the target to appear. Default: `5000`. */
  timeout?: number
}

function anchorPoint(rect: ElementRect, position: BeaconPosition, offset: number) {
  const left = rect.x - offset
  const right = rect.x + rect.width + offset
  const top = rect.y - offset
  const bottom = rect.y + rect.height + offset
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2

  switch (position) {
    case 'top-left':
      return { x: left, y: top }
    case 'top-right':
      return { x: right, y: top }
    case 'bottom-left':
      return { x: left, y: bottom }
    case 'bottom-right':
      return { x: right, y: bottom }
    case 'top':
      return { x: cx, y: top }
    case 'bottom':
      return { x: cx, y: bottom }
    case 'left':
      return { x: left, y: cy }
    case 'right':
      return { x: right, y: cy }
    default:
      return { x: cx, y: cy }
  }
}

/**
 * A pulsing "hotspot" dot anchored to an element. Clicking it starts a tour
 * (or shows a single-element highlight). Use beacons to let users opt into
 * a walkthrough instead of interrupting them with one.
 *
 * Renders through a portal (like the overlay) so it isn't clipped by
 * `overflow: hidden` ancestors, and tracks the target across scroll/resize.
 *
 * @example
 * ```tsx
 * <SpotlightBeacon target="#export-button" tour="export-tour" />
 * ```
 */
export function SpotlightBeacon({
  target,
  tour,
  stepIndex,
  highlight,
  onClick,
  active = true,
  hideWhileActive = true,
  position = 'top-right',
  offset = 0,
  size = 12,
  color,
  label = 'Start tour',
  className,
  container,
  timeout,
}: SpotlightBeaconProps) {
  const context = useContext(SpotlightContext)
  if (!context) {
    throw new Error('react-tourlight: <SpotlightBeacon> must be used within a <SpotlightProvider>.')
  }
  const { start, highlight: showHighlight, isActive } = context

  const [element, setElement] = useState<HTMLElement | null>(null)
  const [rect, setRect] = useState<ElementRect | null>(null)

  // Resolve the target (waiting for it if needed).
  useEffect(() => {
    if (!active) {
      setElement(null)
      return
    }
    let cancelled = false
    const existing = resolveTarget(target)
    if (existing) {
      setElement(existing)
      return
    }
    setElement(null)
    void waitForElement(target, timeout !== undefined ? { timeout } : undefined).then((el) => {
      if (!cancelled) setElement(el)
    })
    return () => {
      cancelled = true
    }
  }, [target, active, timeout])

  // Track the target's rect.
  useEffect(() => {
    if (!element) {
      setRect(null)
      return
    }
    const update = () => {
      if (!element.isConnected) {
        setRect(null)
        return
      }
      setRect(measureElement(element, 0))
    }
    update()

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    resizeObserver?.observe(element)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [element])

  if (!active || !rect) return null
  if (hideWhileActive && isActive) return null
  if (typeof document === 'undefined') return null

  const portalTarget = (typeof container === 'function' ? container() : container) ?? document.body

  const point = anchorPoint(rect, position, offset)

  const handleClick = () => {
    onClick?.()
    if (tour) {
      start(tour, stepIndex !== undefined ? { stepIndex } : undefined)
      return
    }
    if (highlight) {
      showHighlight({ ...highlight, target: highlight.target ?? target })
    }
  }

  const style = {
    left: `${point.x}px`,
    top: `${point.y}px`,
    width: `${size}px`,
    height: `${size}px`,
    ...(color ? { '--spotlight-beacon-color': color } : {}),
  } as React.CSSProperties

  return createPortal(
    <button
      type="button"
      className={cn('spotlight-beacon', className)}
      style={style}
      onClick={handleClick}
      aria-label={label}
      data-spotlight-beacon=""
    >
      <span className="spotlight-beacon-pulse" aria-hidden="true" />
    </button>,
    portalTarget,
  )
}
