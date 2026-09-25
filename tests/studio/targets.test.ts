import { afterEach, describe, expect, it } from 'vitest'
import { getStudioSelector } from '../../src/studio/targets.ts'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Studio target picking', () => {
  it('prefers stable app attributes and escapes unusual values', () => {
    const target = document.createElement('button')
    target.setAttribute('data-tour', 'say "hello"\nnow')
    document.body.append(target)
    const selector = getStudioSelector(target)
    expect(document.querySelector(selector)).toBe(target)
  })

  it('selects a unique sibling when no stable attribute exists', () => {
    document.body.innerHTML = '<main><button>One</button><button>Two</button></main>'
    const target = document.querySelectorAll('button')[1]
    const selector = getStudioSelector(target)
    expect(document.querySelectorAll(selector)).toHaveLength(1)
    expect(document.querySelector(selector)).toBe(target)
  })

  it('resolves uniqueness within the embedded app, ignoring editor chrome', () => {
    document.body.innerHTML =
      '<button data-tour="save">Outside</button><main><button data-tour="save">Inside</button></main>'
    const app = document.querySelector('main') as HTMLElement
    const target = app.querySelector('button') as HTMLButtonElement
    const selector = getStudioSelector(target, app)
    expect(selector).toBe('[data-tour="save"]')
    expect(app.querySelector(selector)).toBe(target)
  })
})
