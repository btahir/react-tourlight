import { useCallback } from 'react'
import type { SpotlightStep } from '../types.ts'
import { useSpotlight } from './use-spotlight.ts'

export interface SpotlightControl {
  /** Start a tour by ID */
  start: (tourId: string) => void
  /** Stop the currently active tour */
  stop: () => void
  /** Go to the next step */
  next: () => void
  /** Go to the previous step */
  previous: () => void
  /** Skip the current tour */
  skip: () => void
  /** Go to a specific step by index */
  goToStep: (index: number) => void
  /** Highlight a single element */
  highlight: (step: SpotlightStep) => void
  /** Dismiss a single-element highlight */
  dismissHighlight: () => void
  /** Whether a tour or highlight is active */
  isActive: boolean
}

/**
 * Hook for imperative spotlight control.
 *
 * @example
 * ```tsx
 * const spotlight = useSpotlightControl()
 *
 * spotlight.highlight({
 *   target: '#new-feature',
 *   title: 'New: Dark Mode',
 *   content: 'We just shipped dark mode!',
 * })
 * ```
 */
export function useSpotlightControl(): SpotlightControl {
  const ctx = useSpotlight()

  const start = useCallback((tourId: string) => ctx.start(tourId), [ctx])
  const stop = useCallback(() => ctx.stop(), [ctx])
  const next = useCallback(() => ctx.next(), [ctx])
  const previous = useCallback(() => ctx.previous(), [ctx])
  const skip = useCallback(() => ctx.skip(), [ctx])
  const goToStep = useCallback((index: number) => ctx.goToStep(index), [ctx])
  const highlight = useCallback((step: SpotlightStep) => ctx.highlight(step), [ctx])
  const dismissHighlight = useCallback(() => ctx.dismissHighlight(), [ctx])

  return {
    start,
    stop,
    next,
    previous,
    skip,
    goToStep,
    highlight,
    dismissHighlight,
    isActive: ctx.isActive,
  }
}
