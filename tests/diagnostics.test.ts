import { afterEach, describe, expect, it, vi } from 'vitest'
import { inspectTourTargets, suggestTourTarget } from '../src/diagnostics.ts'
import { createTourDocument } from '../src/document.ts'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('live target diagnostics', () => {
  it('inspects shadow-root targets without ignoring a hidden host', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = host.attachShadow({ mode: 'open' })
    root.innerHTML = '<button data-tour="welcome">Hello</button>'
    const button = root.querySelector('button') as HTMLButtonElement
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 40 } as DOMRect)
    expect(inspectTourTargets(createTourDocument(), root)[0].status).toBe('ready')
    host.style.opacity = '0'
    expect(inspectTourTargets(createTourDocument(), root)[0].status).toBe('hidden')
  })

  it('does not suggest a selector resolving to a different element outside the supplied root', () => {
    document.body.innerHTML =
      '<button id="duplicate">Outside</button><div><button id="duplicate">Inside</button></div>'
    const outside = document.body.firstElementChild as Element
    const root = document.querySelector('div') as Element
    expect(suggestTourTarget(outside, root)).toBeNull()
  })
  it('distinguishes missing, ambiguous, hidden, invalid, and other-route targets', () => {
    const tour = createTourDocument()
    expect(inspectTourTargets(tour)[0].status).toBe('missing')
    document.body.innerHTML =
      '<button data-tour="welcome">Hello</button><button data-tour="welcome">Again</button>'
    expect(inspectTourTargets(tour)[0]).toMatchObject({ status: 'ambiguous', matches: 2 })
    document.body.lastElementChild?.remove()
    document.body.firstElementChild?.setAttribute('style', 'display:none')
    expect(inspectTourTargets(tour)[0].status).toBe('hidden')
    tour.steps[0].target = '['
    expect(inspectTourTargets(tour)[0].status).toBe('invalid')
    tour.steps[0].route = '/users/:id'
    expect(inspectTourTargets(tour, document, '/settings')[0].status).toBe('other-route')
    expect(inspectTourTargets(tour, document, '/users/42')[0].status).toBe('invalid')
  })

  it('checks ancestor visibility and measurable bounds', () => {
    const tour = createTourDocument()
    document.body.innerHTML = '<div><button data-tour="welcome">Hello</button></div>'
    const button = document.querySelector('button') as HTMLButtonElement
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 40 } as DOMRect)
    expect(inspectTourTargets(tour)[0].status).toBe('ready')
    document.body.firstElementChild?.setAttribute('style', 'opacity:0')
    expect(inspectTourTargets(tour)[0].status).toBe('hidden')
  })

  it('suggests stable unique attributes with escaped values and refuses guessing', () => {
    const element = document.createElement('button')
    document.body.append(element)
    expect(suggestTourTarget(element)).toBeNull()
    element.setAttribute('data-tour', 'some"quoted\\value')
    const selector = suggestTourTarget(element)
    expect(selector).toBeTruthy()
    expect(document.querySelector(selector ?? '')).toBe(element)
    document.body.append(element.cloneNode())
    expect(suggestTourTarget(element)).toBeNull()
    element.id = 'unique'
    expect(suggestTourTarget(element)).toBe('[id="unique"]')
  })
})
