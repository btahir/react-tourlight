import { useContext, useEffect, useRef } from 'react'
import type { Placement, SpotlightStep } from '../types.ts'
import { SpotlightContext } from './spotlight-provider.tsx'

export interface SpotlightHighlightProps {
  /** CSS selector or React ref for the target element */
  target: SpotlightStep['target']
  /** Tooltip title */
  title: string
  /** Tooltip content */
  content: React.ReactNode
  /** Whether the highlight is active */
  active?: boolean
  /** Tooltip placement */
  placement?: Placement
  /** Padding around the spotlight cutout */
  spotlightPadding?: number
  /** Border radius of the spotlight cutout */
  spotlightRadius?: number
  /** Called when the highlight is dismissed */
  onDismiss?: () => void
}

/**
 * Highlights a single element with a spotlight overlay and tooltip.
 *
 * Unlike SpotlightTour, this is a standalone component for one-off
 * feature highlights (e.g., "What's new" callouts).
 */
export function SpotlightHighlight({
  target,
  title,
  content,
  active = true,
  placement,
  spotlightPadding,
  spotlightRadius,
  onDismiss,
}: SpotlightHighlightProps) {
  const context = useContext(SpotlightContext)
  const wasActive = useRef(false)

  if (!context) {
    throw new Error(
      'react-spotlight: <SpotlightHighlight> must be used within a <SpotlightProvider>.',
    )
  }

  const { highlight, dismissHighlight } = context

  useEffect(() => {
    if (active && !wasActive.current) {
      wasActive.current = true
      highlight({
        target,
        title,
        content,
        placement,
        spotlightPadding,
        spotlightRadius,
        onHide: onDismiss,
      })
    } else if (!active && wasActive.current) {
      wasActive.current = false
      dismissHighlight()
    }
  }, [
    active,
    target,
    title,
    content,
    placement,
    spotlightPadding,
    spotlightRadius,
    onDismiss,
    highlight,
    dismissHighlight,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wasActive.current) {
        dismissHighlight()
      }
    }
  }, [dismissHighlight])

  return null
}
