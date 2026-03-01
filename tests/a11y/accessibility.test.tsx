import { act, render, screen } from '@testing-library/react'
import React from 'react'
import { SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { SpotlightTour } from '../../src/components/spotlight-tour.tsx'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'
import type { SpotlightStep } from '../../src/types.ts'

const testSteps: SpotlightStep[] = [
  {
    target: '#a11y-target',
    title: 'Accessible Step',
    content: 'This step should be accessible',
  },
  {
    target: '#a11y-target-2',
    title: 'Second Step',
    content: 'Second step content',
  },
]

/**
 * Helper component that auto-starts the tour once mounted.
 */
function AutoStarter({ tourId }: { tourId: string }) {
  const { start } = useSpotlight()
  React.useEffect(() => {
    start(tourId)
  }, [start, tourId])
  return null
}

function renderWithActiveTour(steps: SpotlightStep[] = testSteps) {
  // Create target elements in the DOM
  const target1 = document.createElement('div')
  target1.id = 'a11y-target'
  target1.getBoundingClientRect = () => ({
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    top: 100,
    right: 300,
    bottom: 150,
    left: 100,
    toJSON: () => {},
  })
  document.body.appendChild(target1)

  const target2 = document.createElement('div')
  target2.id = 'a11y-target-2'
  document.body.appendChild(target2)

  const result = render(
    <SpotlightProvider theme="light">
      <SpotlightTour id="a11y-tour" steps={steps} />
      <AutoStarter tourId="a11y-tour" />
    </SpotlightProvider>,
  )

  return {
    ...result,
    cleanup: () => {
      document.body.removeChild(target1)
      document.body.removeChild(target2)
    },
  }
}

describe('accessibility', () => {
  it('tooltip has role="dialog"', async () => {
    const { cleanup } = renderWithActiveTour()

    await act(async () => {
      // Allow state machine and effects to settle
      await new Promise((r) => setTimeout(r, 50))
    })

    const dialog = screen.queryByRole('dialog')
    expect(dialog).toBeInTheDocument()

    cleanup()
  })

  it('tooltip has aria-labelledby and aria-describedby', async () => {
    const { cleanup } = renderWithActiveTour()

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const dialog = screen.queryByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-labelledby', 'spotlight-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'spotlight-content')

    cleanup()
  })

  it('screen reader live region announces step changes', async () => {
    const { cleanup, container } = renderWithActiveTour()

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // There should be a live region with aria-live="polite" (portaled to document.body)
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion?.textContent).toContain('Step 1 of 2')
    expect(liveRegion?.textContent).toContain('Accessible Step')

    cleanup()
  })

  it('close button has aria-label', async () => {
    const { cleanup } = renderWithActiveTour()

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const closeButton = screen.queryByLabelText('Close')
    expect(closeButton).toBeInTheDocument()

    cleanup()
  })
})
