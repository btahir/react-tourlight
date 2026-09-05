import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { SpotlightProvider } from '../../src/components/spotlight-provider.tsx'
import { SpotlightTour } from '../../src/components/spotlight-tour.tsx'
import { useSpotlight } from '../../src/hooks/use-spotlight.ts'
import type { SpotlightContextValue, SpotlightStep, StartOptions } from '../../src/types.ts'

vi.mock('../../src/utils/scroll-into-view.ts', () => ({
  scrollIntoView: vi.fn(() => Promise.resolve()),
}))

function ContextReader({ onContext }: { onContext: (ctx: SpotlightContextValue) => void }) {
  const ctx = useSpotlight()
  const ref = React.useRef(onContext)
  ref.current = onContext
  React.useEffect(() => {
    ref.current(ctx)
  })
  return null
}

function Starter({ tourId, options }: { tourId: string; options?: StartOptions }) {
  const { start, isActive, currentStep } = useSpotlight()
  return (
    <div>
      <span data-testid="status">{isActive ? `active:${currentStep}` : 'inactive'}</span>
      <button type="button" onClick={() => start(tourId, options)}>
        Start
      </button>
    </div>
  )
}

function mountTargets(...ids: string[]) {
  const els = ids.map((id) => {
    const el = document.createElement('div')
    el.id = id
    document.body.appendChild(el)
    return el
  })
  return () => {
    for (const el of els) el.remove()
  }
}

const steps: SpotlightStep[] = [
  { target: '#t1', title: 'One', content: 'first' },
  { target: '#t2', title: 'Two', content: 'second' },
  { target: '#t3', title: 'Three', content: 'third' },
]

describe('SpotlightProvider v0.4 additions', () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  describe('function targets', () => {
    it('resolves a step whose target is a resolver function', async () => {
      const cleanup = mountTargets('fn-target')
      const fnSteps: SpotlightStep[] = [
        {
          target: () => document.getElementById('fn-target'),
          title: 'Fn',
          content: 'resolved via function',
        },
      ]

      render(
        <SpotlightProvider>
          <SpotlightTour id="fn" steps={fnSteps} />
          <Starter tourId="fn" />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      expect(screen.getByText('Fn')).toBeInTheDocument()
      cleanup()
    })

    it('waits for a function target that appears later', async () => {
      const fnSteps: SpotlightStep[] = [
        {
          target: () => document.querySelector<HTMLElement>('[data-late]'),
          title: 'Late',
          content: 'late target',
          timeout: 2000,
        },
      ]

      render(
        <SpotlightProvider>
          <SpotlightTour id="late" steps={fnSteps} />
          <Starter tourId="late" />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })

      // Not yet resolvable — loading state
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      const late = document.createElement('div')
      late.setAttribute('data-late', '')
      await act(async () => {
        document.body.appendChild(late)
      })

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      expect(screen.getByText('Late')).toBeInTheDocument()
    })

    it('waits for a ref target whose current is populated later', async () => {
      const ref: React.RefObject<HTMLElement | null> = { current: null }
      const refSteps: SpotlightStep[] = [
        { target: ref, title: 'Ref', content: 'ref target', timeout: 2000 },
      ]

      render(
        <SpotlightProvider>
          <SpotlightTour id="ref" steps={refSteps} />
          <Starter tourId="ref" />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      const el = document.createElement('div')
      ref.current = el
      await act(async () => {
        // Any DOM mutation triggers a re-resolve
        document.body.appendChild(el)
      })

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('start(tourId, { stepIndex })', () => {
    it('starts the tour at the requested step', async () => {
      const cleanup = mountTargets('t1', 't2', 't3')

      render(
        <SpotlightProvider>
          <SpotlightTour id="tour" steps={steps} />
          <Starter tourId="tour" options={{ stepIndex: 2 }} />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('active:2')
      })
      expect(screen.getByText('Three')).toBeInTheDocument()
      cleanup()
    })

    it('ignores an out-of-range stepIndex and starts from the beginning', async () => {
      const cleanup = mountTargets('t1', 't2', 't3')

      render(
        <SpotlightProvider>
          <SpotlightTour id="tour" steps={steps} />
          <Starter tourId="tour" options={{ stepIndex: 42 }} />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('active:0')
      })
      cleanup()
    })

    it('explicit stepIndex overrides a persisted position', async () => {
      const cleanup = mountTargets('t1', 't2', 't3')
      const storage = new Map<string, string>()
      const adapter = {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => {
          storage.set(k, v)
        },
        removeItem: (k: string) => {
          storage.delete(k)
        },
      }
      adapter.setItem(
        'react-tourlight',
        JSON.stringify({
          v: 1,
          tours: {
            tour: {
              status: 'active',
              currentStepIndex: 2,
              seenSteps: [0, 1, 2],
              savedAt: Date.now(),
              stepCount: 3,
            },
          },
        }),
      )

      render(
        <SpotlightProvider persist={adapter} resume={false}>
          <SpotlightTour id="tour" steps={steps} />
          <Starter tourId="tour" options={{ stepIndex: 1 }} />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('active:1')
      })
      cleanup()
    })
  })

  describe('onStart / onStepChange', () => {
    it('fires onStart once and onStepChange for each step entered, at tour and provider level', async () => {
      const cleanup = mountTargets('t1', 't2', 't3')
      const tourStart = vi.fn()
      const tourStep = vi.fn()
      const providerStart = vi.fn()
      const providerStep = vi.fn()
      let ctx: SpotlightContextValue | null = null

      render(
        <SpotlightProvider onStart={providerStart} onStepChange={providerStep}>
          <SpotlightTour id="tour" steps={steps} onStart={tourStart} onStepChange={tourStep} />
          <ContextReader
            onContext={(c) => {
              ctx = c
            }}
          />
        </SpotlightProvider>,
      )

      await act(async () => {
        ctx?.start('tour')
      })
      await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())

      expect(tourStart).toHaveBeenCalledTimes(1)
      expect(providerStart).toHaveBeenCalledWith('tour')
      expect(tourStep).toHaveBeenCalledTimes(1)
      expect(tourStep).toHaveBeenLastCalledWith(0, steps[0])
      expect(providerStep).toHaveBeenLastCalledWith('tour', 0, steps[0])

      await act(async () => {
        ctx?.next()
      })
      await waitFor(() => expect(screen.getByText('Two')).toBeInTheDocument())

      expect(tourStep).toHaveBeenCalledTimes(2)
      expect(tourStep).toHaveBeenLastCalledWith(1, steps[1])

      await act(async () => {
        ctx?.previous()
      })
      await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())
      expect(tourStep).toHaveBeenCalledTimes(3)
      expect(tourStep).toHaveBeenLastCalledWith(0, steps[0])

      // Completing the tour does not emit another step change
      await act(async () => {
        ctx?.skip()
      })
      expect(tourStep).toHaveBeenCalledTimes(3)
      expect(tourStart).toHaveBeenCalledTimes(1)
      cleanup()
    })
  })

  describe('portalContainer', () => {
    it('renders the overlay and tooltip into a custom container', async () => {
      const cleanup = mountTargets('t1')
      const host = document.createElement('div')
      host.id = 'tour-host'
      document.body.appendChild(host)

      render(
        <SpotlightProvider portalContainer={host}>
          <SpotlightTour id="tour" steps={[steps[0]]} />
          <Starter tourId="tour" />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })

      await waitFor(() => {
        expect(host.querySelector('.spotlight-overlay')).not.toBeNull()
      })
      expect(host.querySelector('[role="dialog"]')).not.toBeNull()
      cleanup()
    })

    it('accepts a function that returns the container', async () => {
      const cleanup = mountTargets('t1')
      const host = document.createElement('section')
      document.body.appendChild(host)

      render(
        <SpotlightProvider portalContainer={() => host}>
          <SpotlightTour id="tour" steps={[steps[0]]} />
          <Starter tourId="tour" />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })
      await waitFor(() => {
        expect(host.querySelector('.spotlight-overlay')).not.toBeNull()
      })
      cleanup()
    })
  })

  describe('autoScroll', () => {
    it('does not scroll the target when autoScroll is false', async () => {
      const { scrollIntoView } = await import('../../src/utils/scroll-into-view.ts')
      vi.mocked(scrollIntoView).mockClear()
      const cleanup = mountTargets('t1')

      render(
        <SpotlightProvider autoScroll={false}>
          <SpotlightTour id="tour" steps={[steps[0]]} />
          <Starter tourId="tour" />
        </SpotlightProvider>,
      )

      await act(async () => {
        screen.getByText('Start').click()
      })
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
      expect(scrollIntoView).not.toHaveBeenCalled()
      cleanup()
    })
  })

  describe('renderTooltip', () => {
    it('receives close / isFirst / isLast and close() stops the tour without completing it', async () => {
      const cleanup = mountTargets('t1', 't2', 't3')
      const onComplete = vi.fn()
      const onSkip = vi.fn()
      const seen: Array<{ isFirst: boolean; isLast: boolean }> = []
      let ctx: SpotlightContextValue | null = null

      render(
        <SpotlightProvider>
          <SpotlightTour
            id="tour"
            steps={steps}
            onComplete={onComplete}
            onSkip={onSkip}
            renderTooltip={({ step, close, isFirst, isLast }) => {
              seen.push({ isFirst, isLast })
              return (
                <div>
                  <span>{step.title}</span>
                  <button type="button" onClick={close}>
                    close-me
                  </button>
                </div>
              )
            }}
          />
          <ContextReader
            onContext={(c) => {
              ctx = c
            }}
          />
        </SpotlightProvider>,
      )

      await act(async () => {
        ctx?.start('tour')
      })
      await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())
      expect(seen.at(-1)).toEqual({ isFirst: true, isLast: false })

      await act(async () => {
        ctx?.goToStep(2)
      })
      await waitFor(() => expect(screen.getByText('Three')).toBeInTheDocument())
      expect(seen.at(-1)).toEqual({ isFirst: false, isLast: true })

      await act(async () => {
        fireEvent.click(screen.getByText('close-me'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Three')).not.toBeInTheDocument()
      })
      expect(onComplete).not.toHaveBeenCalled()
      expect(onSkip).not.toHaveBeenCalled()
      cleanup()
    })
  })
})
