import { useContext, useEffect } from 'react'
import type { SpotlightStep, TooltipRenderProps } from '../types.ts'
import { SpotlightContext } from './spotlight-provider.tsx'

export interface SpotlightTourProps {
  /** Unique tour identifier */
  id: string
  /** Steps in this tour */
  steps: SpotlightStep[]
  /** Called when this tour completes */
  onComplete?: () => void
  /** Called when this tour is skipped */
  onSkip?: (stepIndex: number) => void
  /** Custom tooltip render function */
  renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
}

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
  renderTooltip,
}: SpotlightTourProps) {
  const context = useContext(SpotlightContext)

  if (!context) {
    throw new Error('react-spotlight: <SpotlightTour> must be used within a <SpotlightProvider>.')
  }

  const { registerTour, unregisterTour } = context

  useEffect(() => {
    registerTour(id, steps, { onComplete, onSkip, renderTooltip })
    return () => unregisterTour(id)
  }, [id, steps, onComplete, onSkip, renderTooltip, registerTour, unregisterTour])

  return null
}
