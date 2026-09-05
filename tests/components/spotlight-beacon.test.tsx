import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SpotlightBeacon } from '../../src/components/spotlight-beacon.tsx'
import { SpotlightContext, SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { SpotlightTour } from '../../src/components/spotlight-tour.tsx'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'
import type { SpotlightContextValue, SpotlightStep } from '../../src/types.ts'

vi.mock('../../src/utils/scroll-into-view.ts', () => ({
  scrollIntoView: vi.fn(() => Promise.resolve()),
}))

function mockContext(overrides: Partial<SpotlightContextValue> = {}): SpotlightContextValue {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    skip: vi.fn(),
    goToStep: vi.fn(),
    isActive: false,
    activeTourId: null,
    currentStep: 0,
    totalSteps: 0,
    registerTour: vi.fn(),
    unregisterTour: vi.fn(),
    highlight: vi.fn(),
    dismissHighlight: vi.fn(),
    ...overrides,
  }
}

function mountTarget(id = 'beacon-target') {
  const el = document.createElement('button')
  el.id = id
  el.textContent = 'Export'
  // jsdom has no layout — give the target a fake box
  el.getBoundingClientRect = () =>
    ({
      x: 100,
      y: 50,
      width: 80,
      height: 30,
      top: 50,
      left: 100,
      right: 180,
      bottom: 80,
    }) as DOMRect
  document.body.appendChild(el)
  return el
}

describe('SpotlightBeacon', () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('throws when used outside SpotlightProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<SpotlightBeacon target="#x" tour="t" />)).toThrow(
      'react-tourlight: <SpotlightBeacon> must be used within a <SpotlightProvider>.',
    )
    spy.mockRestore()
  })

  it('renders a pulsing button anchored to the target (top-right by default)', async () => {
    mountTarget()
    render(
      <SpotlightContext.Provider value={mockContext()}>
        <SpotlightBeacon target="#beacon-target" tour="t" />
      </SpotlightContext.Provider>,
    )

    const beacon = await screen.findByRole('button', { name: 'Start tour' })
    expect(beacon).toHaveClass('spotlight-beacon')
    expect(beacon.querySelector('.spotlight-beacon-pulse')).not.toBeNull()
    // top-right corner of the 100,50 / 80x30 box
    expect(beacon.style.left).toBe('180px')
    expect(beacon.style.top).toBe('50px')
    expect(beacon.style.width).toBe('12px')
  })

  it('honours position, offset, size, color and label', async () => {
    mountTarget()
    render(
      <SpotlightContext.Provider value={mockContext()}>
        <SpotlightBeacon
          target="#beacon-target"
          tour="t"
          position="bottom-left"
          offset={4}
          size={20}
          color="hotpink"
          label="What's new"
        />
      </SpotlightContext.Provider>,
    )

    const beacon = await screen.findByRole('button', { name: "What's new" })
    expect(beacon.style.left).toBe('96px')
    expect(beacon.style.top).toBe('84px')
    expect(beacon.style.width).toBe('20px')
    expect(beacon.style.getPropertyValue('--spotlight-beacon-color')).toBe('hotpink')
  })

  it('centers on the target for position="center"', async () => {
    mountTarget()
    render(
      <SpotlightContext.Provider value={mockContext()}>
        <SpotlightBeacon target="#beacon-target" tour="t" position="center" />
      </SpotlightContext.Provider>,
    )
    const beacon = await screen.findByRole('button', { name: 'Start tour' })
    expect(beacon.style.left).toBe('140px')
    expect(beacon.style.top).toBe('65px')
  })

  it('starts the tour (with stepIndex) when clicked and calls onClick first', async () => {
    mountTarget()
    const ctx = mockContext()
    const order: string[] = []
    vi.mocked(ctx.start).mockImplementation(() => {
      order.push('start')
    })

    render(
      <SpotlightContext.Provider value={ctx}>
        <SpotlightBeacon
          target="#beacon-target"
          tour="export"
          stepIndex={2}
          onClick={() => order.push('onClick')}
        />
      </SpotlightContext.Provider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Start tour' }))
    expect(ctx.start).toHaveBeenCalledWith('export', { stepIndex: 2 })
    expect(order).toEqual(['onClick', 'start'])
  })

  it('shows a highlight (defaulting target to its own) when no tour is given', async () => {
    mountTarget()
    const ctx = mockContext()
    render(
      <SpotlightContext.Provider value={ctx}>
        <SpotlightBeacon
          target="#beacon-target"
          highlight={{ title: 'New', content: 'CSV export is here' }}
        />
      </SpotlightContext.Provider>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Start tour' }))
    expect(ctx.highlight).toHaveBeenCalledWith(
      expect.objectContaining({ target: '#beacon-target', title: 'New' }),
    )
    expect(ctx.start).not.toHaveBeenCalled()
  })

  it('is hidden while a tour is active (hideWhileActive default) and shown when hideWhileActive is false', async () => {
    mountTarget()
    const { rerender } = render(
      <SpotlightContext.Provider value={mockContext({ isActive: true })}>
        <SpotlightBeacon target="#beacon-target" tour="t" />
      </SpotlightContext.Provider>,
    )
    await act(async () => {})
    expect(screen.queryByRole('button', { name: 'Start tour' })).toBeNull()

    rerender(
      <SpotlightContext.Provider value={mockContext({ isActive: true })}>
        <SpotlightBeacon target="#beacon-target" tour="t" hideWhileActive={false} />
      </SpotlightContext.Provider>,
    )
    expect(await screen.findByRole('button', { name: 'Start tour' })).toBeInTheDocument()
  })

  it('renders nothing when active={false}', async () => {
    mountTarget()
    render(
      <SpotlightContext.Provider value={mockContext()}>
        <SpotlightBeacon target="#beacon-target" tour="t" active={false} />
      </SpotlightContext.Provider>,
    )
    await act(async () => {})
    expect(screen.queryByRole('button', { name: 'Start tour' })).toBeNull()
  })

  it('waits for a target that appears later', async () => {
    render(
      <SpotlightContext.Provider value={mockContext()}>
        <SpotlightBeacon target="#late-target" tour="t" timeout={2000} />
      </SpotlightContext.Provider>,
    )
    await act(async () => {})
    expect(screen.queryByRole('button', { name: 'Start tour' })).toBeNull()

    await act(async () => {
      mountTarget('late-target')
    })
    expect(await screen.findByRole('button', { name: 'Start tour' })).toBeInTheDocument()
  })

  it('renders into a custom container', async () => {
    mountTarget()
    const host = document.createElement('div')
    document.body.appendChild(host)
    render(
      <SpotlightContext.Provider value={mockContext()}>
        <SpotlightBeacon target="#beacon-target" tour="t" container={host} />
      </SpotlightContext.Provider>,
    )
    await screen.findByRole('button', { name: 'Start tour' })
    expect(host.querySelector('.spotlight-beacon')).not.toBeNull()
  })

  it('end-to-end: clicking the beacon starts a real tour and the beacon hides', async () => {
    mountTarget()
    const steps: SpotlightStep[] = [{ target: '#beacon-target', title: 'Export', content: 'Go' }]

    function Status() {
      const { isActive } = useSpotlight()
      return <span data-testid="status">{isActive ? 'active' : 'inactive'}</span>
    }

    render(
      <SpotlightProvider>
        <SpotlightTour id="export" steps={steps} />
        <SpotlightBeacon target="#beacon-target" tour="export" />
        <Status />
      </SpotlightProvider>,
    )

    const beacon = await screen.findByRole('button', { name: 'Start tour' })
    await act(async () => {
      fireEvent.click(beacon)
    })

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('active')
    })
    expect(screen.queryByRole('button', { name: 'Start tour' })).toBeNull()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
