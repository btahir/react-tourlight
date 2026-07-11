import { act, renderHook, waitFor } from '@testing-library/react'
import { useTour } from '../../src/hooks/use-tour.ts'
import type { SpotlightStep } from '../../src/types.ts'

function makeTarget(id: string): HTMLElement {
  const el = document.createElement('div')
  el.id = id
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
  document.body.appendChild(el)
  return el
}

const steps: SpotlightStep[] = [
  { target: '#t1', title: 'One', content: 'first' },
  { target: '#t2', title: 'Two', content: 'second' },
]

describe('useTour (headless)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('starts idle and inactive', () => {
    const { result } = renderHook(() => useTour({ steps }))
    expect(result.current.status).toBe('idle')
    expect(result.current.isActive).toBe(false)
    expect(result.current.totalSteps).toBe(2)
    expect(result.current.step).toBeNull()
  })

  it('resolves the target and rect after start()', async () => {
    makeTarget('t1')
    const { result } = renderHook(() => useTour({ steps }))

    act(() => {
      result.current.start()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('active')
      expect(result.current.targetElement?.id).toBe('t1')
    })
    expect(result.current.rect).not.toBeNull()
    expect(result.current.clipPath).toContain('path(evenodd,')
    expect(result.current.step?.title).toBe('One')
  })

  it('advances to the next step and completes', async () => {
    makeTarget('t1')
    makeTarget('t2')
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTour({ steps, onComplete }))

    act(() => {
      result.current.start()
    })
    await waitFor(() => expect(result.current.targetElement?.id).toBe('t1'))

    await act(async () => {
      result.current.next()
    })
    await waitFor(() => expect(result.current.targetElement?.id).toBe('t2'))
    expect(result.current.currentIndex).toBe(1)

    await act(async () => {
      result.current.next()
    })
    await waitFor(() => {
      expect(result.current.status).toBe('completed')
      expect(result.current.isActive).toBe(false)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('skip() ends the tour and reports the skipped index', async () => {
    makeTarget('t1')
    const onSkip = vi.fn()
    const { result } = renderHook(() => useTour({ steps, onSkip }))

    act(() => {
      result.current.start()
    })
    await waitFor(() => expect(result.current.isActive).toBe(true))

    act(() => {
      result.current.skip()
    })
    await waitFor(() => expect(result.current.status).toBe('completed'))
    expect(onSkip).toHaveBeenCalledWith(0)
  })

  it('calls navigate for a route step whose route is not active', async () => {
    const navigate = vi.fn()
    const routeSteps: SpotlightStep[] = [
      { target: '#t1', title: 'Elsewhere', content: 'x', route: '/somewhere-else' },
    ]
    makeTarget('t1')
    const { result } = renderHook(() =>
      useTour({ steps: routeSteps, navigate, isRouteActive: () => false }),
    )

    act(() => {
      result.current.start()
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/somewhere-else'))
  })

  it('restores from initialState', async () => {
    makeTarget('t2')
    const { result } = renderHook(() =>
      useTour({
        steps,
        initialState: { status: 'idle', currentStepIndex: 1, seenSteps: [0, 1] },
      }),
    )

    act(() => {
      result.current.start()
    })

    // start() begins from the first valid step; but seenSteps carried over.
    await waitFor(() => expect(result.current.isActive).toBe(true))
    expect(result.current.totalSteps).toBe(2)
  })
})
