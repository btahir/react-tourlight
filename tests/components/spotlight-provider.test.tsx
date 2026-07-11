import { act, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { SpotlightTour } from '../../src/components/spotlight-tour.tsx'
import * as elementObserver from '../../src/engine/element-observer.ts'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'
import { darkTheme } from '../../src/themes/default-dark.ts'
import { lightTheme } from '../../src/themes/default-light.ts'
import type { SpotlightContextValue, SpotlightStep } from '../../src/types.ts'

/**
 * Test helper that exposes the context value via a ref-like callback.
 */
function ContextReader({ onContext }: { onContext: (ctx: SpotlightContextValue) => void }) {
  const ctx = useSpotlight()
  // Use a ref to avoid triggering onContext on every render
  const callbackRef = React.useRef(onContext)
  callbackRef.current = onContext
  React.useEffect(() => {
    callbackRef.current(ctx)
  })
  return null
}

/**
 * Helper component that renders a button to start a tour
 * and displays whether the tour is active.
 */
function TourController({ tourId }: { tourId: string }) {
  const { start, stop, isActive } = useSpotlight()
  return (
    <div>
      <span data-testid="status">{isActive ? 'active' : 'inactive'}</span>
      <button type="button" onClick={() => start(tourId)}>
        Start
      </button>
      <button type="button" onClick={() => stop()}>
        Stop
      </button>
    </div>
  )
}

const testSteps: SpotlightStep[] = [
  {
    target: '#step-target',
    title: 'Step 1',
    content: 'First step content',
  },
  {
    target: '#step-target-2',
    title: 'Step 2',
    content: 'Second step content',
  },
]

describe('SpotlightProvider', () => {
  it('renders children', () => {
    render(
      <SpotlightProvider>
        <div data-testid="child">Hello</div>
      </SpotlightProvider>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('provides context to children', () => {
    let capturedContext: SpotlightContextValue | null = null

    render(
      <SpotlightProvider>
        <ContextReader
          onContext={(ctx) => {
            capturedContext = ctx
          }}
        />
      </SpotlightProvider>,
    )

    expect(capturedContext).not.toBeNull()
    expect(capturedContext?.isActive).toBe(false)
    expect(capturedContext?.start).toBeTypeOf('function')
    expect(capturedContext?.stop).toBeTypeOf('function')
    expect(capturedContext?.next).toBeTypeOf('function')
    expect(capturedContext?.previous).toBeTypeOf('function')
    expect(capturedContext?.skip).toBeTypeOf('function')
    expect(capturedContext?.goToStep).toBeTypeOf('function')
    expect(capturedContext?.registerTour).toBeTypeOf('function')
    expect(capturedContext?.unregisterTour).toBeTypeOf('function')
    expect(capturedContext?.highlight).toBeTypeOf('function')
    expect(capturedContext?.dismissHighlight).toBeTypeOf('function')
  })

  it('start() activates the tour overlay', async () => {
    // Create the target element in the DOM so resolveTarget can find it
    const targetEl = document.createElement('div')
    targetEl.id = 'step-target'
    document.body.appendChild(targetEl)

    render(
      <SpotlightProvider>
        <SpotlightTour id="test-tour" steps={testSteps} />
        <TourController tourId="test-tour" />
      </SpotlightProvider>,
    )

    expect(screen.getByTestId('status').textContent).toBe('inactive')

    await act(async () => {
      screen.getByText('Start').click()
    })

    expect(screen.getByTestId('status').textContent).toBe('active')

    document.body.removeChild(targetEl)
  })

  it('stop() deactivates the tour', async () => {
    const targetEl = document.createElement('div')
    targetEl.id = 'step-target'
    document.body.appendChild(targetEl)

    render(
      <SpotlightProvider>
        <SpotlightTour id="test-tour" steps={testSteps} />
        <TourController tourId="test-tour" />
      </SpotlightProvider>,
    )

    // Start the tour
    await act(async () => {
      screen.getByText('Start').click()
    })
    expect(screen.getByTestId('status').textContent).toBe('active')

    // Stop the tour
    await act(async () => {
      screen.getByText('Stop').click()
    })
    expect(screen.getByTestId('status').textContent).toBe('inactive')

    document.body.removeChild(targetEl)
  })

  it('calls onStateChange with the active tour ID', async () => {
    const targetEl = document.createElement('div')
    targetEl.id = 'step-target'
    document.body.appendChild(targetEl)

    const onStateChange = vi.fn()

    render(
      <SpotlightProvider onStateChange={onStateChange}>
        <SpotlightTour id="test-tour" steps={testSteps} />
        <TourController tourId="test-tour" />
      </SpotlightProvider>,
    )

    await act(async () => {
      screen.getByText('Start').click()
      await Promise.resolve()
    })

    expect(onStateChange).toHaveBeenCalled()
    expect(onStateChange).toHaveBeenCalledWith(
      'test-tour',
      expect.objectContaining({
        status: 'active',
      }),
    )

    document.body.removeChild(targetEl)
  })

  it('skips a step when its target never appears and advances to the next step', async () => {
    const waitForElementSpy = vi
      .spyOn(elementObserver, 'waitForElement')
      .mockResolvedValueOnce(null as never)

    const targetEl = document.createElement('div')
    targetEl.id = 'step-target-2'
    document.body.appendChild(targetEl)

    const stepsWithMissingFirstTarget: SpotlightStep[] = [
      {
        target: '#missing-target',
        title: 'Missing Step',
        content: 'This target does not exist',
      },
      {
        target: '#step-target-2',
        title: 'Step 2',
        content: 'Second step content',
      },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="missing-target-tour" steps={stepsWithMissingFirstTarget} />
        <TourController tourId="missing-target-tour" />
      </SpotlightProvider>,
    )

    await act(async () => {
      screen.getByText('Start').click()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument()
    })

    expect(waitForElementSpy).toHaveBeenCalledWith('#missing-target')

    waitForElementSpy.mockRestore()
    document.body.removeChild(targetEl)
  })

  it('passes a per-step timeout override to waitForElement', async () => {
    const waitForElementSpy = vi
      .spyOn(elementObserver, 'waitForElement')
      .mockResolvedValueOnce(null as never)

    const steps: SpotlightStep[] = [
      {
        target: '#missing-with-timeout',
        title: 'Missing Step',
        content: 'This target does not exist',
        timeout: 1234,
      },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="timeout-tour" steps={steps} />
        <TourController tourId="timeout-tour" />
      </SpotlightProvider>,
    )

    await act(async () => {
      screen.getByText('Start').click()
      await Promise.resolve()
    })

    expect(waitForElementSpy).toHaveBeenCalledWith('#missing-with-timeout', { timeout: 1234 })

    waitForElementSpy.mockRestore()
  })

  it('passes the provider-level waitForElementTimeout as the default when the step has none', async () => {
    const waitForElementSpy = vi
      .spyOn(elementObserver, 'waitForElement')
      .mockResolvedValueOnce(null as never)

    const steps: SpotlightStep[] = [
      {
        target: '#missing-with-provider-timeout',
        title: 'Missing Step',
        content: 'This target does not exist',
      },
    ]

    render(
      <SpotlightProvider waitForElementTimeout={9999}>
        <SpotlightTour id="provider-timeout-tour" steps={steps} />
        <TourController tourId="provider-timeout-tour" />
      </SpotlightProvider>,
    )

    await act(async () => {
      screen.getByText('Start').click()
      await Promise.resolve()
    })

    expect(waitForElementSpy).toHaveBeenCalledWith('#missing-with-provider-timeout', {
      timeout: 9999,
    })

    waitForElementSpy.mockRestore()
  })

  it('dismissHighlight calls the step onHide callback', async () => {
    let capturedContext: SpotlightContextValue | null = null
    const targetEl = document.createElement('div')
    targetEl.id = 'highlight-target'
    document.body.appendChild(targetEl)

    const onHide = vi.fn()

    render(
      <SpotlightProvider>
        <ContextReader
          onContext={(ctx) => {
            capturedContext = ctx
          }}
        />
      </SpotlightProvider>,
    )

    await act(async () => {
      capturedContext?.highlight({
        target: '#highlight-target',
        title: 'Highlight',
        content: 'Highlight content',
        onHide,
      })
      await Promise.resolve()
    })

    await act(async () => {
      capturedContext?.dismissHighlight()
      await Promise.resolve()
    })

    expect(onHide).toHaveBeenCalledOnce()

    document.body.removeChild(targetEl)
  })

  it('theme="auto" updates live when the OS color scheme preference changes', async () => {
    let changeHandler: (() => void) | undefined

    const mediaQueryList = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: (event: string, handler: () => void) => {
        if (event === 'change') changeHandler = handler
      },
      removeEventListener: vi.fn(),
    }

    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi
      .fn()
      .mockReturnValue(mediaQueryList) as unknown as typeof window.matchMedia

    const targetEl = document.createElement('div')
    targetEl.id = 'auto-theme-target'
    document.body.appendChild(targetEl)

    const steps: SpotlightStep[] = [
      { target: '#auto-theme-target', title: 'Auto Theme Step', content: 'Content' },
    ]

    render(
      <SpotlightProvider theme="auto">
        <SpotlightTour id="auto-theme-tour" steps={steps} />
        <TourController tourId="auto-theme-tour" />
      </SpotlightProvider>,
    )

    await act(async () => {
      screen.getByText('Start').click()
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveStyle({ background: lightTheme.tooltip.background })
    })

    // Simulate the OS switching to dark mode while the tour is active.
    mediaQueryList.matches = true
    await act(async () => {
      changeHandler?.()
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveStyle({ background: darkTheme.tooltip.background })
    })

    window.matchMedia = originalMatchMedia
    document.body.removeChild(targetEl)
  })

  it('shows a dimmed loading overlay instead of a full black screen while the target resolves', async () => {
    let resolveWait: (el: HTMLElement | null) => void = () => {}
    const waitForElementSpy = vi.spyOn(elementObserver, 'waitForElement').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWait = resolve
        }),
    )

    const steps: SpotlightStep[] = [
      { target: '#lazy-target', title: 'Lazy Step', content: 'Content' },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="lazy-tour" steps={steps} />
        <TourController tourId="lazy-tour" />
      </SpotlightProvider>,
    )

    await act(async () => {
      screen.getByText('Start').click()
    })

    // While the target is still resolving: dimmed overlay + loading
    // indicator, and no tooltip dialog (which would otherwise be null,
    // leaving just a fully opaque black screen).
    await waitFor(() => {
      expect(document.querySelector('.spotlight-overlay--loading')).toBeInTheDocument()
      expect(document.querySelector('.spotlight-loading')).toBeInTheDocument()
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const lazyEl = document.createElement('div')
    lazyEl.id = 'lazy-target'
    document.body.appendChild(lazyEl)

    await act(async () => {
      resolveWait(lazyEl)
    })

    await waitFor(() => {
      expect(document.querySelector('.spotlight-overlay--loading')).not.toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    waitForElementSpy.mockRestore()
    document.body.removeChild(lazyEl)
  })
})
