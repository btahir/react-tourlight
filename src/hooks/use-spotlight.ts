import { useContext } from 'react'
import type { SpotlightContextValue } from '../types.ts'
import { SpotlightContext } from '../components/spotlight-provider.tsx'

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
    throw new Error('react-spotlight: useSpotlight() must be used within a <SpotlightProvider>.')
  }

  return context
}
