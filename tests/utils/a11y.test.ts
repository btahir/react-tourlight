import { getStepAriaLabel, setInert } from '../../src/utils/a11y.ts'

describe('getStepAriaLabel', () => {
  it('formats step position and title', () => {
    expect(getStepAriaLabel(0, 3, 'Search')).toBe('Step 1 of 3: Search')
    expect(getStepAriaLabel(2, 5, 'Done')).toBe('Step 3 of 5: Done')
  })
})

describe('setInert', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('inerts siblings of the excluded element up the ancestor chain', () => {
    const app = document.createElement('div')
    const other = document.createElement('div')
    const portal = document.createElement('div')
    document.body.append(app, other, portal)

    const cleanup = setInert(portal)
    expect(app.inert).toBe(true)
    expect(other.inert).toBe(true)
    expect(portal.inert).toBeFalsy()

    cleanup()
    expect(app.inert).toBeFalsy()
    expect(other.inert).toBeFalsy()
  })

  it('keeps the interactive target and its subtree reachable', () => {
    // body > app > (sidebar, main > target > input); body > portal
    const app = document.createElement('div')
    const sidebar = document.createElement('div')
    const main = document.createElement('div')
    const target = document.createElement('div')
    const input = document.createElement('input')
    const portal = document.createElement('div')

    target.appendChild(input)
    main.appendChild(target)
    app.append(sidebar, main)
    document.body.append(app, portal)

    const cleanup = setInert(portal, target)

    // The branch containing the target stays live...
    expect(app.inert).toBeFalsy()
    expect(main.inert).toBeFalsy()
    expect(target.inert).toBeFalsy()
    expect(input.inert).toBeFalsy()
    // ...but off-path siblings within that branch are inerted.
    expect(sidebar.inert).toBe(true)

    cleanup()
    expect(sidebar.inert).toBeFalsy()
  })
})
