import { trackTarget } from '../../src/engine/target-tracker.ts'

describe('active target tracking', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  function setup() {
    const element = document.createElement('button')
    element.id = 'tracked'
    document.body.append(element)
    const controller = new AbortController()
    const onChange = vi.fn()
    const onTimeout = vi.fn()
    trackTarget('#tracked', element, {
      signal: controller.signal,
      timeout: 100,
      padding: () => 8,
      onChange,
      onTimeout,
    })
    return { element, controller, onChange, onTimeout }
  }

  it('tracks position-only changes and does not emit unchanged geometry each frame', async () => {
    const { element, controller, onChange } = setup()
    await vi.advanceTimersByTimeAsync(64)
    expect(onChange).toHaveBeenCalledTimes(1)
    element.getBoundingClientRect = () => DOMRect.fromRect({ x: 60, y: 40, width: 100, height: 32 })
    await vi.advanceTimersByTimeAsync(20)
    expect(onChange).toHaveBeenLastCalledWith(element, { x: 52, y: 32, width: 116, height: 48 })
    controller.abort()
    const count = onChange.mock.calls.length
    await vi.advanceTimersByTimeAsync(100)
    expect(onChange).toHaveBeenCalledTimes(count)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears a detached target and resumes with its replacement without timing out', async () => {
    const { element, controller, onChange, onTimeout } = setup()
    element.remove()
    await vi.advanceTimersByTimeAsync(20)
    expect(onChange).toHaveBeenLastCalledWith(null, null)
    const replacement = document.createElement('button')
    replacement.id = 'tracked'
    document.body.append(replacement)
    await vi.advanceTimersByTimeAsync(50)
    expect(onChange).toHaveBeenLastCalledWith(replacement, expect.objectContaining({ width: 116 }))
    expect(onTimeout).not.toHaveBeenCalled()
    controller.abort()
  })

  it('bounds recovery for a permanently missing target and cleans up all work', async () => {
    const { element, onTimeout } = setup()
    element.remove()
    await vi.advanceTimersByTimeAsync(200)
    expect(onTimeout).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels a pending replacement wait without firing timeout or stale changes', async () => {
    const { element, controller, onChange, onTimeout } = setup()
    element.remove()
    await vi.advanceTimersByTimeAsync(20)
    controller.abort()
    const count = onChange.mock.calls.length
    document.body.append(element)
    await vi.advanceTimersByTimeAsync(200)
    expect(onChange).toHaveBeenCalledTimes(count)
    expect(onTimeout).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
