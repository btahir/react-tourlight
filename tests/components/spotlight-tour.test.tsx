import { render } from '@testing-library/react'
import React from 'react'
import { SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { SpotlightTour } from '../../src/components/spotlight-tour.tsx'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'
import type { SpotlightContextValue, SpotlightStep } from '../../src/types.ts'

const testSteps: SpotlightStep[] = [
  { target: '#a', title: 'Step A', content: 'Content A' },
  { target: '#b', title: 'Step B', content: 'Content B' },
]

/**
 * Test helper that captures the context to inspect registration.
 */
function ContextCapture({ onContext }: { onContext: (ctx: SpotlightContextValue) => void }) {
  const ctx = useSpotlight()
  const callbackRef = React.useRef(onContext)
  callbackRef.current = onContext
  React.useEffect(() => {
    callbackRef.current(ctx)
  })
  return null
}

describe('SpotlightTour', () => {
  it('throws error outside SpotlightProvider', () => {
    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<SpotlightTour id="orphan" steps={testSteps} />)
    }).toThrow('react-tourlight: <SpotlightTour> must be used within a <SpotlightProvider>.')

    consoleSpy.mockRestore()
  })

  it('registers tour on mount', () => {
    let capturedCtx: SpotlightContextValue | null = null

    // Create target element so start can find it
    const targetEl = document.createElement('div')
    targetEl.id = 'a'
    document.body.appendChild(targetEl)

    render(
      <SpotlightProvider>
        <SpotlightTour id="my-tour" steps={testSteps} />
        <ContextCapture
          onContext={(ctx) => {
            capturedCtx = ctx
          }}
        />
      </SpotlightProvider>,
    )

    expect(capturedCtx).not.toBeNull()

    // The tour should be registered. Calling start should not warn about missing tour.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    capturedCtx?.start('my-tour')
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()

    // Cleanup
    capturedCtx?.stop()
    document.body.removeChild(targetEl)
  })

  it('unregisters tour on unmount', () => {
    let capturedCtx: SpotlightContextValue | null = null

    const { unmount } = render(
      <SpotlightProvider>
        <SpotlightTour id="temp-tour" steps={testSteps} />
        <ContextCapture
          onContext={(ctx) => {
            capturedCtx = ctx
          }}
        />
      </SpotlightProvider>,
    )

    expect(capturedCtx).not.toBeNull()

    // Unmount the entire tree (which unmounts SpotlightTour, triggering unregisterTour)
    unmount()

    // Re-render the provider without the tour
    const { unmount: unmount2 } = render(
      <SpotlightProvider>
        <ContextCapture
          onContext={(ctx) => {
            capturedCtx = ctx
          }}
        />
      </SpotlightProvider>,
    )

    // Now start should warn because the tour is not registered
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    capturedCtx?.start('temp-tour')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Tour "temp-tour" not found'))
    warnSpy.mockRestore()

    unmount2()
  })
})
