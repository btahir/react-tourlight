import { useContext, useEffect } from 'react'
import type { SpotlightTourProps } from '../types.ts'
import { SpotlightContext } from './spotlight-provider.tsx'

export type { SpotlightTourProps }

/**
 * Registers a tour with the SpotlightProvider.
 *
 * This component doesn't render anything — it just registers its steps
 * with the provider so they can be activated via `start(tourId)`.
 */
export function SpotlightTour({
  id,
  steps,
  onComplete,
  onSkip,
  onStart,
  onStepChange,
  renderTooltip,
}: SpotlightTourProps) {
  const context = useContext(SpotlightContext)

  if (!context) {
    throw new Error('react-tourlight: <SpotlightTour> must be used within a <SpotlightProvider>.')
  }

  const { registerTour, unregisterTour } = context

  useEffect(() => {
    registerTour(id, steps, { onComplete, onSkip, onStart, onStepChange, renderTooltip })
    return () => unregisterTour(id)
  }, [
    id,
    steps,
    onComplete,
    onSkip,
    onStart,
    onStepChange,
    renderTooltip,
    registerTour,
    unregisterTour,
  ])

  return null
}
