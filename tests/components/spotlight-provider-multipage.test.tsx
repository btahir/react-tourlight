import { act, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { SpotlightTour } from '../../src/components/spotlight-tour.tsx'
import {
  createMemoryStorage,
  DEFAULT_PERSIST_KEY,
  loadPersistedTours,
  savePersistedTour,
} from '../../src/engine/persistence.ts'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'
import type { SpotlightStep, SpotlightStorage } from '../../src/types.ts'

function stubRect(el: HTMLElement) {
  el.getBoundingClientRect = () =>
    ({
      x: 10,
      y: 20,
      width: 100,
      height: 40,
      top: 20,
      left: 10,
      right: 110,
      bottom: 60,
      toJSON() {},
    }) as DOMRect
}

const createdNodes: HTMLElement[] = []

function makeTarget(id: string): HTMLElement {
  const el = document.createElement('div')
  el.id = id
  stubRect(el)
  document.body.appendChild(el)
  createdNodes.push(el)
  return el
}

function cleanupTargets() {
  // Remove only the nodes we appended — leave React Testing Library's own
  // container alone so its automatic cleanup can unmount it safely.
  while (createdNodes.length) {
    createdNodes.pop()?.remove()
  }
}

function AutoStarter({ tourId }: { tourId: string }) {
  const { start } = useSpotlight()
  React.useEffect(() => {
    start(tourId)
  }, [start, tourId])
  return null
}

function Starter({ tourId }: { tourId: string }) {
  const { start } = useSpotlight()
  return (
    <button type="button" onClick={() => start(tourId)}>
      Start
    </button>
  )
}

const twoSteps: SpotlightStep[] = [
  { target: '#mp-1', title: 'Step 1', content: 'first' },
  { target: '#mp-2', title: 'Step 2', content: 'second' },
]

describe('SpotlightProvider — multi-page & persistence', () => {
  afterEach(() => {
    cleanupTargets()
  })

  it('calls navigate() when a step route does not match the current location', async () => {
    makeTarget('mp-1')
    const navigate = vi.fn()

    const steps: SpotlightStep[] = [
      { target: '#mp-1', title: 'Away', content: 'x', route: '/not-here' },
    ]

    render(
      <SpotlightProvider navigate={navigate}>
        <SpotlightTour id="route-tour" steps={steps} />
        <AutoStarter tourId="route-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/not-here'))
  })

  it('does NOT call navigate when the step route matches the current location', async () => {
    makeTarget('mp-1')
    const navigate = vi.fn()

    const steps: SpotlightStep[] = [
      { target: '#mp-1', title: 'Here', content: 'x', route: window.location.pathname || '/' },
    ]

    render(
      <SpotlightProvider navigate={navigate}>
        <SpotlightTour id="match-tour" steps={steps} />
        <AutoStarter tourId="match-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => expect(screen.getByText('Here')).toBeInTheDocument())
    expect(navigate).not.toHaveBeenCalled()
  })

  it('invokes onBeforeStep before resolving the target', async () => {
    makeTarget('mp-1')
    const onBeforeStep = vi.fn()

    const steps: SpotlightStep[] = [
      { target: '#mp-1', title: 'Hooked', content: 'x', onBeforeStep },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="hook-tour" steps={steps} />
        <AutoStarter tourId="hook-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => expect(onBeforeStep).toHaveBeenCalled())
  })

  it('persists tour state to the provided storage', async () => {
    makeTarget('mp-1')
    makeTarget('mp-2')
    const storage = createMemoryStorage()

    render(
      <SpotlightProvider persist={storage}>
        <SpotlightTour id="persist-tour" steps={twoSteps} />
        <AutoStarter tourId="persist-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => {
      const tours = loadPersistedTours(storage, DEFAULT_PERSIST_KEY)
      expect(tours['persist-tour']).toMatchObject({ status: 'active', stepCount: 2 })
    })
  })

  it('uses a custom persistKey', async () => {
    makeTarget('mp-1')
    makeTarget('mp-2')
    const storage = createMemoryStorage()

    render(
      <SpotlightProvider persist={storage} persistKey="my-key">
        <SpotlightTour id="key-tour" steps={twoSteps} />
        <AutoStarter tourId="key-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => {
      expect(loadPersistedTours(storage, 'my-key')['key-tour']).toBeDefined()
    })
    expect(loadPersistedTours(storage, DEFAULT_PERSIST_KEY)['key-tour']).toBeUndefined()
  })

  it('auto-resumes a persisted active tour on mount', async () => {
    makeTarget('mp-1')
    makeTarget('mp-2')
    const storage: SpotlightStorage = createMemoryStorage()
    // Simulate a tour that was mid-flight before a reload (on step index 1).
    savePersistedTour(
      storage,
      DEFAULT_PERSIST_KEY,
      'resume-tour',
      { status: 'active', currentStepIndex: 1, seenSteps: [0, 1] },
      2,
    )

    render(
      <SpotlightProvider persist={storage}>
        <SpotlightTour id="resume-tour" steps={twoSteps} />
        {/* No AutoStarter — resume must happen on its own */}
      </SpotlightProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument()
    })
  })

  it('does not auto-resume when resume={false}', async () => {
    makeTarget('mp-1')
    makeTarget('mp-2')
    const storage = createMemoryStorage()
    savePersistedTour(
      storage,
      DEFAULT_PERSIST_KEY,
      'no-resume-tour',
      { status: 'active', currentStepIndex: 1, seenSteps: [0, 1] },
      2,
    )

    render(
      <SpotlightProvider persist={storage} resume={false}>
        <SpotlightTour id="no-resume-tour" steps={twoSteps} />
      </SpotlightProvider>,
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(screen.queryByText('Step 2')).not.toBeInTheDocument()
  })

  it('does not auto-resume a stale persisted tour (step count changed)', async () => {
    makeTarget('mp-1')
    makeTarget('mp-2')
    const storage = createMemoryStorage()
    // Persisted with stepCount 5 but the tour now has 2 steps → stale.
    savePersistedTour(
      storage,
      DEFAULT_PERSIST_KEY,
      'stale-tour',
      { status: 'active', currentStepIndex: 4, seenSteps: [0] },
      5,
    )

    render(
      <SpotlightProvider persist={storage}>
        <SpotlightTour id="stale-tour" steps={twoSteps} />
      </SpotlightProvider>,
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('restarts a previously-completed persisted tour from step 0 (not the persisted index)', async () => {
    makeTarget('mp-1')
    makeTarget('mp-2')
    const storage = createMemoryStorage()
    // Simulate a tour that was already completed in a prior session, parked
    // on its last step index.
    savePersistedTour(
      storage,
      DEFAULT_PERSIST_KEY,
      'replay-tour',
      { status: 'completed', currentStepIndex: 1, seenSteps: [0, 1], completedAt: Date.now() },
      2,
    )

    render(
      <SpotlightProvider persist={storage}>
        <SpotlightTour id="replay-tour" steps={twoSteps} />
        {/* Manual start (e.g. a "Replay tour" button) — not auto-resume. */}
        <Starter tourId="replay-tour" />
      </SpotlightProvider>,
    )

    // Auto-resume must not have kicked in (status is 'completed', not 'active').
    expect(screen.queryByText('Step 2')).not.toBeInTheDocument()

    await act(async () => {
      screen.getByText('Start').click()
    })

    // A manual restart must begin at step 0, not resume at the persisted
    // (completed) index.
    await waitFor(() => expect(screen.getByText('Step 1')).toBeInTheDocument())
    expect(screen.queryByText('Step 2')).not.toBeInTheDocument()
  })

  it('clears persisted state when the tour is explicitly stopped', async () => {
    makeTarget('mp-1')
    makeTarget('mp-2')
    const storage = createMemoryStorage()

    function StopController() {
      const { stop } = useSpotlight()
      return (
        <button type="button" onClick={() => stop()}>
          Stop
        </button>
      )
    }

    render(
      <SpotlightProvider persist={storage}>
        <SpotlightTour id="stop-tour" steps={twoSteps} />
        <Starter tourId="stop-tour" />
        <StopController />
      </SpotlightProvider>,
    )

    await act(async () => {
      screen.getByText('Start').click()
    })
    await waitFor(() =>
      expect(loadPersistedTours(storage, DEFAULT_PERSIST_KEY)['stop-tour']).toBeDefined(),
    )

    await act(async () => {
      screen.getByText('Stop').click()
    })
    await waitFor(() =>
      expect(loadPersistedTours(storage, DEFAULT_PERSIST_KEY)['stop-tour']).toBeUndefined(),
    )
  })
})

describe('SpotlightProvider — advanceOn', () => {
  afterEach(() => {
    cleanupTargets()
  })

  it('advances to the next step when the advanceOn event fires on the target', async () => {
    const target1 = makeTarget('ao-1')
    makeTarget('ao-2')

    const steps: SpotlightStep[] = [
      { target: '#ao-1', title: 'Click me', content: 'x', advanceOn: { event: 'click' } },
      { target: '#ao-2', title: 'Second', content: 'y' },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="advance-tour" steps={steps} />
        <AutoStarter tourId="advance-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => expect(screen.getByText('Click me')).toBeInTheDocument())

    await act(async () => {
      target1.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => expect(screen.getByText('Second')).toBeInTheDocument())
  })

  it('only advances for events matching advanceOn.selector', async () => {
    const target1 = makeTarget('ao-sel-1')
    const inner = document.createElement('button')
    inner.className = 'go'
    target1.appendChild(inner)
    makeTarget('ao-sel-2')

    const steps: SpotlightStep[] = [
      {
        target: '#ao-sel-1',
        title: 'Selector step',
        content: 'x',
        advanceOn: { event: 'click', selector: '.go' },
      },
      { target: '#ao-sel-2', title: 'Advanced', content: 'y' },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="sel-tour" steps={steps} />
        <AutoStarter tourId="sel-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => expect(screen.getByText('Selector step')).toBeInTheDocument())

    // Click on the target but NOT the matching selector — should not advance.
    await act(async () => {
      target1.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })
    expect(screen.queryByText('Advanced')).not.toBeInTheDocument()

    // Click on the matching selector — should advance.
    await act(async () => {
      inner.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await waitFor(() => expect(screen.getByText('Advanced')).toBeInTheDocument())
  })

  it('advances for non-bubbling events (e.g. focus) firing on a selector-matched descendant', async () => {
    const target1 = makeTarget('ao-focus-1')
    const input = document.createElement('input')
    target1.appendChild(input)
    makeTarget('ao-focus-2')

    const steps: SpotlightStep[] = [
      {
        target: '#ao-focus-1',
        title: 'Focus step',
        content: 'x',
        advanceOn: { event: 'focus', selector: 'input' },
      },
      { target: '#ao-focus-2', title: 'Focused', content: 'y' },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="focus-tour" steps={steps} />
        <AutoStarter tourId="focus-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => expect(screen.getByText('Focus step')).toBeInTheDocument())

    // 'focus' does not bubble — it must still be delegated from the
    // descendant input up to the target container via capture-phase.
    await act(async () => {
      input.focus()
    })

    await waitFor(() => expect(screen.getByText('Focused')).toBeInTheDocument())
  })

  it('keeps the advanceOn target interactive (not inert)', async () => {
    makeTarget('ao-live-1')

    const steps: SpotlightStep[] = [
      { target: '#ao-live-1', title: 'Live', content: 'x', advanceOn: { event: 'click' } },
    ]

    render(
      <SpotlightProvider>
        <SpotlightTour id="live-tour" steps={steps} />
        <AutoStarter tourId="live-tour" />
      </SpotlightProvider>,
    )

    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(document.getElementById('ao-live-1')?.inert).toBeFalsy()
  })
})
