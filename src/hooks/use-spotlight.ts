import { useContext } from 'react'
import { SpotlightContext } from '../components/spotlight-provider.tsx'
import type { SpotlightContextValue } from '../types.ts'

/**
 * Hook to read spotlight/tour state.
 *
 * @example
 * ```tsx
 * const { isActive, currentStep, totalSteps, start } = useSpotlight()
 * ```
 */
export function useSpotlight(): SpotlightContextValue {
  const context = useContext(SpotlightContext)

  if (!context) {
    throw new Error('react-tourlight: useSpotlight() must be used within a <SpotlightProvider>.')
  }

  return context
}
