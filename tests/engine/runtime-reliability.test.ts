import { waitForElement } from '../../src/engine/element-observer.ts'
import { createKeyboardHandler } from '../../src/engine/keyboard.ts'
import { createMemoryStorage, loadPersistedTours } from '../../src/engine/persistence.ts'
import { createTourStateMachine } from '../../src/engine/state-machine.ts'
import { resolveTarget } from '../../src/engine/step-resolver.ts'
import type { SpotlightStep } from '../../src/types.ts'

const step = (extra: Partial<SpotlightStep> = {}): SpotlightStep => ({
  target: '#target',
  title: 'Step',
  content: 'Content',
  ...extra,
})
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('runtime reliability', () => {
  it('does not resurrect a stopped tour after a pending predicate resolves', async () => {
    const gate = deferred<boolean>()
    const shown = vi.fn()
    const machine = createTourStateMachine({
      steps: [step({ when: () => gate.promise, onAfterShow: shown })],
    })
    const pending = machine.start()
    machine.stop()
    gate.resolve(true)
    await pending
    expect(machine.getState().status).toBe('idle')
    expect(machine.getState().seenSteps).toEqual([])
    expect(shown).not.toHaveBeenCalled()
  })

  it('cancels a pending entry when skipped and does not call completion', async () => {
    const gate = deferred<void>()
    const completed = vi.fn()
    const shown = vi.fn()
    const machine = createTourStateMachine({
      steps: [step(), step({ onBeforeShow: () => gate.promise, onAfterShow: shown })],
      onComplete: completed,
    })
    await machine.start()
    const pending = machine.next()
    await Promise.resolve()
    machine.skip()
    gate.resolve()
    await pending
    expect(machine.getState().status).toBe('completed')
    expect(shown).not.toHaveBeenCalled()
    expect(completed).not.toHaveBeenCalled()
  })

  it('coalesces repeated next clicks while the next step is preparing', async () => {
    const gate = deferred<void>()
    const before = vi.fn(() => gate.promise)
    const machine = createTourStateMachine({
      steps: [step(), step({ onBeforeShow: before }), step()],
    })
    await machine.start()
    const first = machine.next()
    const duplicate = machine.next()
    gate.resolve()
    await Promise.all([first, duplicate])
    expect(before).toHaveBeenCalledOnce()
    expect(machine.getState().currentStepIndex).toBe(1)
  })

  it('reports failed async setup without an unhandled rejection or stuck active state', async () => {
    const error = new Error('Setup failed')
    const onError = vi.fn()
    const machine = createTourStateMachine({
      steps: [
        step({
          when: async () => {
            throw error
          },
        }),
      ],
      onError,
    })
    await machine.start()
    expect(machine.getState().status).toBe('idle')
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('ignores fractional and NaN indices', async () => {
    const machine = createTourStateMachine({ steps: [step(), step()] })
    await machine.start()
    await machine.goToStep(0.5)
    await machine.goToStep(Number.NaN)
    expect(machine.getState().currentStepIndex).toBe(0)
  })

  it('treats invalid selectors as unresolved instead of throwing', () => {
    expect(resolveTarget('[')).toBeNull()
  })

  it('waits for an existing target to acquire a measurable layout box', async () => {
    const element = document.createElement('button')
    document.body.append(element)
    let width = 0
    element.getBoundingClientRect = () => DOMRect.fromRect({ width, height: 20 })
    const result = waitForElement(() => element, { requireVisible: true, timeout: 200 })
    let resolved = false
    void result.then(() => {
      resolved = true
    })
    await Promise.resolve()
    expect(resolved).toBe(false)
    width = 100
    element.setAttribute('data-visible', 'true')
    expect(await result).toBe(element)
    element.remove()
  })

  it('resolves ref-only changes that do not cause DOM mutations', async () => {
    const element = document.createElement('button')
    document.body.append(element)
    const ref = { current: null as HTMLElement | null }
    const result = waitForElement(ref, { timeout: 200 })
    ref.current = element
    expect(await result).toBe(element)
    element.remove()
  })

  it('aborts observation immediately', async () => {
    const controller = new AbortController()
    const result = waitForElement('#never', { signal: controller.signal, timeout: 60_000 })
    controller.abort()
    expect(await result).toBeNull()
  })

  it('does not hijack arrow keys inside editable controls or modified shortcuts', () => {
    const onNext = vi.fn()
    const handler = createKeyboardHandler({ onNext, onPrevious: vi.fn(), onDismiss: vi.fn() })
    const input = document.createElement('input')
    document.body.append(input)
    handler.attach()
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(arrow)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }))
    expect(arrow.defaultPrevented).toBe(false)
    expect(onNext).not.toHaveBeenCalled()
    handler.detach()
    input.remove()
  })

  it('rejects malformed persisted envelopes and snapshots', () => {
    const storage = createMemoryStorage()
    for (const tours of [
      null,
      [],
      { broken: { status: 'active', stepCount: 1, currentStepIndex: 0 } },
    ]) {
      storage.setItem('test', JSON.stringify({ v: 1, tours }))
      expect(loadPersistedTours(storage, 'test')).toEqual({})
    }
  })
})
