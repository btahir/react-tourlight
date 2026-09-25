import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { SpotlightTour } from '../../src/components/spotlight-tour.tsx'
import {
  createMemoryStorage,
  loadPersistedTours,
  savePersistedTour,
} from '../../src/engine/persistence.ts'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'
import { useTour } from '../../src/hooks/use-tour.ts'
import type { SpotlightContextValue, SpotlightStep } from '../../src/types.ts'

let controls: SpotlightContextValue
function Controls() {
  controls = useSpotlight()
  return null
}
const steps: SpotlightStep[] = [
  { target: '#first', title: 'First', content: 'One' },
  { target: '#second', title: 'Second', content: 'Two' },
]
function Targets() {
  return (
    <>
      <button id="first" type="button">
        Target one
      </button>
      <button id="second" type="button">
        Target two
      </button>
    </>
  )
}
async function start() {
  await act(async () => controls.start('tour'))
  await screen.findByRole('dialog')
}

describe('runtime integration regressions', () => {
  it('keeps the active tour alive across inline steps and callback rerenders, using latest callbacks', async () => {
    const complete = vi.fn()
    function App({ revision }: { revision: number }) {
      return (
        <SpotlightProvider autoScroll={false}>
          <Targets />
          <SpotlightTour
            id="tour"
            steps={steps.map((step) => ({ ...step }))}
            onComplete={() => complete(revision)}
          />
          <Controls />
        </SpotlightProvider>
      )
    }
    const view = render(<App revision={1} />)
    await start()
    view.rerender(<App revision={2} />)
    await waitFor(() => expect(controls.isActive).toBe(true))
    await act(async () => controls.next())
    await waitFor(() => expect(controls.currentStep).toBe(1))
    await act(async () => controls.next())
    expect(complete).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('preserves active progress on provider unmount and resumes after remount', async () => {
    const storage = createMemoryStorage()
    const app = (
      <SpotlightProvider autoScroll={false} persist={storage}>
        <Targets />
        <SpotlightTour id="tour" steps={steps} />
        <Controls />
      </SpotlightProvider>
    )
    const view = render(app)
    await start()
    await act(async () => controls.next())
    await waitFor(() => expect(controls.currentStep).toBe(1))
    view.unmount()
    await Promise.resolve()
    expect(loadPersistedTours(storage, 'react-tourlight').tour.currentStepIndex).toBe(1)
    expect(loadPersistedTours(storage, 'react-tourlight').tour.status).toBe('active')
    render(app)
    await screen.findByRole('dialog')
    expect(controls.currentStep).toBe(1)
  })

  it('replays from the beginning after completing a resumed tour in the same mount', async () => {
    const storage = createMemoryStorage()
    savePersistedTour(
      storage,
      'react-tourlight',
      'tour',
      { status: 'active', currentStepIndex: 1, seenSteps: [0] },
      2,
    )
    render(
      <SpotlightProvider autoScroll={false} persist={storage}>
        <Targets />
        <SpotlightTour id="tour" steps={steps} />
        <Controls />
      </SpotlightProvider>,
    )
    await screen.findByRole('dialog')
    expect(controls.currentStep).toBe(1)
    await act(async () => controls.next())
    await start()
    expect(controls.currentStep).toBe(0)
  })

  it('does not report hidden, missing, or conditionally skipped steps as viewed', async () => {
    const viewed = vi.fn()
    render(
      <SpotlightProvider autoScroll={false} onStepChange={viewed} waitForElementTimeout={10}>
        <Targets />
        <SpotlightTour
          id="tour"
          steps={[
            { ...steps[0], when: () => false },
            { target: '#missing', title: 'Missing', content: 'Missing' },
            steps[1],
          ]}
        />
        <Controls />
      </SpotlightProvider>,
    )
    await start()
    expect(viewed).toHaveBeenCalledTimes(1)
    expect(viewed).toHaveBeenCalledWith('tour', 2, steps[1])
  })

  it('allows keyboard focus to reach an interactive target and advance the tour', async () => {
    render(
      <SpotlightProvider autoScroll={false}>
        <Targets />
        <SpotlightTour
          id="tour"
          steps={[{ ...steps[0], advanceOn: { event: 'click' } }, steps[1]]}
        />
        <Controls />
      </SpotlightProvider>,
    )
    await start()
    const next = screen.getByRole('button', { name: 'Next' })
    next.focus()
    fireEvent.keyDown(next, { key: 'Tab' })
    expect(document.activeElement).toBe(document.getElementById('first'))
    fireEvent.click(document.activeElement as HTMLElement)
    await waitFor(() => expect(controls.currentStep).toBe(1))
  })

  it('survives StrictMode registration replay and reports each visible step once', async () => {
    const viewed = vi.fn()
    render(
      <StrictMode>
        <SpotlightProvider autoScroll={false} onStepChange={viewed}>
          <Targets />
          <SpotlightTour id="tour" steps={steps} />
          <Controls />
        </SpotlightProvider>
      </StrictMode>,
    )
    await start()
    expect(viewed).toHaveBeenCalledTimes(1)
    await act(async () => controls.next())
    await waitFor(() => expect(viewed).toHaveBeenCalledTimes(2))
  })

  it('does not reuse the previous target to report a missing next step as viewed', async () => {
    const viewed = vi.fn()
    render(
      <SpotlightProvider autoScroll={false} onStepChange={viewed} waitForElementTimeout={10}>
        <Targets />
        <SpotlightTour id="tour" steps={[steps[0], { ...steps[1], target: '#missing' }]} />
        <Controls />
      </SpotlightProvider>,
    )
    await start()
    await act(async () => controls.next())
    await waitFor(() => expect(controls.isActive).toBe(false))
    expect(viewed).toHaveBeenCalledTimes(1)
  })

  it('waits for the destination route before accepting an identically named old target', async () => {
    const navigate = vi.fn()
    const viewed = vi.fn()
    render(
      <SpotlightProvider autoScroll={false} navigate={navigate} onStepChange={viewed}>
        <Targets />
        <SpotlightTour id="tour" steps={[{ ...steps[0], route: '/destination' }]} />
        <Controls />
      </SpotlightProvider>,
    )
    await act(async () => controls.start('tour'))
    expect(navigate).toHaveBeenCalledWith('/destination')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(viewed).not.toHaveBeenCalled()
    window.history.replaceState(null, '', '/destination')
    await screen.findByRole('dialog')
    expect(viewed).toHaveBeenCalledTimes(1)
    window.history.replaceState(null, '', '/')
  })

  it('accepts partial theme tokens without requiring a complete theme copy', async () => {
    render(
      <SpotlightProvider autoScroll={false} theme={{ tooltip: { background: 'rgb(12, 34, 56)' } }}>
        <Targets />
        <SpotlightTour id="tour" steps={steps} />
        <Controls />
      </SpotlightProvider>,
    )
    await start()
    expect(screen.getByRole('dialog')).toHaveStyle({ background: 'rgb(12, 34, 56)' })
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('contains asynchronous action failures and reports them to the provider', async () => {
    const error = new Error('Action failed')
    const onError = vi.fn()
    render(
      <SpotlightProvider autoScroll={false} onError={onError}>
        <Targets />
        <SpotlightTour
          id="tour"
          steps={[
            {
              ...steps[0],
              action: {
                label: 'Fail action',
                onClick: async () => {
                  throw error
                },
              },
            },
          ]}
        />
        <Controls />
      </SpotlightProvider>,
    )
    await start()
    fireEvent.click(screen.getByRole('button', { name: 'Fail action' }))
    await waitFor(() => expect(onError).toHaveBeenCalledWith(error, 'tour'))
    expect(controls.isActive).toBe(false)
  })

  it('does not stop a replay when an action from the previous session rejects', async () => {
    let reject!: (error: unknown) => void
    const pending = new Promise<void>((_resolve, fail) => {
      reject = fail
    })
    const onError = vi.fn()
    render(
      <SpotlightProvider autoScroll={false} onError={onError}>
        <Targets />
        <SpotlightTour
          id="tour"
          steps={[
            {
              ...steps[0],
              action: {
                label: 'Pending action',
                onClick: () => pending,
              },
            },
          ]}
        />
        <Controls />
      </SpotlightProvider>,
    )
    await start()
    fireEvent.click(screen.getByRole('button', { name: 'Pending action' }))
    await act(async () => {
      controls.stop()
      controls.start('tour')
    })
    await screen.findByRole('dialog')
    await act(async () => reject(new Error('Old action failed')))
    expect(onError).toHaveBeenCalledTimes(1)
    expect(controls.isActive).toBe(true)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('contains asynchronous afterShow and onHide failures', async () => {
    const afterError = new Error('After failed')
    const hideError = new Error('Hide failed')
    const onError = vi.fn()
    render(
      <SpotlightProvider autoScroll={false} onError={onError}>
        <Targets />
        <SpotlightTour
          id="tour"
          steps={[
            {
              ...steps[0],
              onAfterShow: async () => {
                throw afterError
              },
              onHide: async () => {
                throw hideError
              },
            },
          ]}
        />
        <Controls />
      </SpotlightProvider>,
    )
    await act(async () => controls.start('tour'))
    await waitFor(() => expect(onError).toHaveBeenCalledWith(afterError, 'tour'))
    await waitFor(() => expect(onError).toHaveBeenCalledWith(hideError, 'tour'))
    expect(controls.isActive).toBe(false)
  })

  it('invalidates persisted indices when stable IDs are reordered', async () => {
    const storage = createMemoryStorage()
    savePersistedTour(
      storage,
      'react-tourlight',
      'tour',
      { status: 'active', currentStepIndex: 1, seenSteps: [0] },
      2,
      ['one', 'two'],
    )
    render(
      <SpotlightProvider autoScroll={false} persist={storage}>
        <Targets />
        <SpotlightTour
          id="tour"
          steps={[
            { ...steps[0], id: 'two' },
            { ...steps[1], id: 'one' },
          ]}
        />
        <Controls />
      </SpotlightProvider>,
    )
    expect(controls.isActive).toBe(false)
    await start()
    expect(controls.currentStep).toBe(0)
  })

  it('keeps an inline headless tour stable and handles real target events', async () => {
    let tour: ReturnType<typeof useTour>
    function App() {
      tour = useTour({
        autoScroll: false,
        steps: [{ ...steps[0], advanceOn: { event: 'click' } }, { ...steps[1] }],
      })
      return <Targets />
    }
    render(<App />)
    await act(async () => tour.start())
    await waitFor(() => expect(tour.targetElement?.id).toBe('first'))
    fireEvent.click(document.getElementById('first') as HTMLElement)
    await waitFor(() => expect(tour.targetElement?.id).toBe('second'))
  })
})
