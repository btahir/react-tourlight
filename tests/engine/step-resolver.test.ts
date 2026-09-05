import type { RefObject } from 'react'
import { getTargetRect, resolveTarget } from '../../src/engine/step-resolver.ts'

describe('resolveTarget', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('resolves a CSS selector string', () => {
    const el = document.createElement('div')
    el.id = 'my-target'
    document.body.appendChild(el)

    const result = resolveTarget('#my-target')
    expect(result).toBe(el)
  })

  it('returns null for a non-existent CSS selector', () => {
    const result = resolveTarget('#does-not-exist')
    expect(result).toBeNull()
  })

  it('resolves a class-based CSS selector', () => {
    const el = document.createElement('span')
    el.className = 'tour-step'
    document.body.appendChild(el)

    const result = resolveTarget('.tour-step')
    expect(result).toBe(el)
  })

  it('resolves a React ref with a current element', () => {
    const el = document.createElement('button')
    const ref: RefObject<HTMLElement> = { current: el }

    const result = resolveTarget(ref)
    expect(result).toBe(el)
  })

  it('returns null for a React ref with null current', () => {
    const ref: RefObject<HTMLElement | null> = { current: null }

    const result = resolveTarget(ref)
    expect(result).toBeNull()
  })
})

describe('getTargetRect', () => {
  it('returns correct dimensions from getBoundingClientRect', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      top: 20,
      right: 110,
      bottom: 70,
      left: 10,
      toJSON: () => {},
    })

    const rect = getTargetRect(el)
    expect(rect).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    })

    document.body.removeChild(el)
  })

  it('returns zero-based rect for elements with no layout', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    // jsdom getBoundingClientRect returns all zeros by default
    const rect = getTargetRect(el)
    expect(rect).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })

    document.body.removeChild(el)
  })
})

describe('resolveTarget — function targets', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('calls a resolver function and returns its element', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(resolveTarget(() => el)).toBe(el)
  })

  it('returns null when the resolver returns null', () => {
    expect(resolveTarget(() => null)).toBeNull()
  })

  it('treats a throwing resolver as "not found" instead of crashing', () => {
    expect(
      resolveTarget(() => {
        throw new Error('shadow root not ready')
      }),
    ).toBeNull()
  })

  it('reaches into a shadow root via a resolver function', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('button')
    inner.id = 'inner'
    shadow.appendChild(inner)

    // Not reachable via document.querySelector…
    expect(resolveTarget('#inner')).toBeNull()
    // …but trivially reachable with a resolver.
    expect(resolveTarget(() => shadow.querySelector<HTMLElement>('#inner'))).toBe(inner)
  })
})
