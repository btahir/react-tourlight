import { renderHook } from '@testing-library/react'
import React from 'react'
import { SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'

describe('useSpotlight', () => {
  it('throws error outside SpotlightProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useSpotlight())
    }).toThrow('react-tourlight: useSpotlight() must be used within a <SpotlightProvider>.')

    consoleSpy.mockRestore()
  })

  it('returns context value inside SpotlightProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(SpotlightProvider, null, children)

    const { result } = renderHook(() => useSpotlight(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.isActive).toBe(false)
    expect(result.current.activeTourId).toBeNull()
    expect(result.current.currentStep).toBe(0)
    expect(result.current.totalSteps).toBe(0)
    expect(result.current.start).toBeTypeOf('function')
    expect(result.current.stop).toBeTypeOf('function')
    expect(result.current.next).toBeTypeOf('function')
    expect(result.current.previous).toBeTypeOf('function')
    expect(result.current.skip).toBeTypeOf('function')
    expect(result.current.goToStep).toBeTypeOf('function')
    expect(result.current.registerTour).toBeTypeOf('function')
    expect(result.current.unregisterTour).toBeTypeOf('function')
    expect(result.current.highlight).toBeTypeOf('function')
    expect(result.current.dismissHighlight).toBeTypeOf('function')
  })
})
