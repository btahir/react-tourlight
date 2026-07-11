import { createFocusTrap } from '../../src/tooltip/focus-trap.ts'

describe('createFocusTrap', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('focuses the element marked data-spotlight-primary instead of the first focusable element', () => {
    container.innerHTML = `
      <button id="close">Close</button>
      <button id="skip">Skip</button>
      <button id="next" data-spotlight-primary="true">Next</button>
    `

    const trap = createFocusTrap(container)
    trap.activate()

    const next = container.querySelector<HTMLElement>('#next')!
    expect(document.activeElement).toBe(next)

    trap.deactivate()
  })

  it('falls back to the first focusable element when nothing is marked primary', () => {
    container.innerHTML = `
      <button id="close">Close</button>
      <button id="next">Next</button>
    `

    const trap = createFocusTrap(container)
    trap.activate()

    const close = container.querySelector<HTMLElement>('#close')!
    expect(document.activeElement).toBe(close)

    trap.deactivate()
  })

  it('Tab cycles through focusable elements inside the container', () => {
    container.innerHTML = `
      <button id="btn1">One</button>
      <button id="btn2">Two</button>
      <button id="btn3">Three</button>
    `

    const trap = createFocusTrap(container)
    trap.activate()

    const btn1 = container.querySelector<HTMLElement>('#btn1')!
    const btn2 = container.querySelector<HTMLElement>('#btn2')!
    const btn3 = container.querySelector<HTMLElement>('#btn3')!

    // After activation, focus should be on the first focusable element
    expect(document.activeElement).toBe(btn1)

    // Tab from last element should wrap to first
    btn3.focus()
    expect(document.activeElement).toBe(btn3)

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(tabEvent)

    expect(document.activeElement).toBe(btn1)

    // Tab from middle element should NOT wrap (browser handles it)
    btn2.focus()
    const tabEvent2 = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(tabEvent2)

    // Focus stays on btn2 because browser native tab is not simulated,
    // and the trap only prevents default when at boundaries
    expect(document.activeElement).toBe(btn2)

    trap.deactivate()
  })

  it('Shift+Tab cycles backward', () => {
    container.innerHTML = `
      <button id="btn1">One</button>
      <button id="btn2">Two</button>
      <button id="btn3">Three</button>
    `

    const trap = createFocusTrap(container)
    trap.activate()

    const btn1 = container.querySelector<HTMLElement>('#btn1')!
    const btn3 = container.querySelector<HTMLElement>('#btn3')!

    // Focus is on first element after activate
    expect(document.activeElement).toBe(btn1)

    // Shift+Tab from first element should wrap to last
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(shiftTabEvent)

    expect(document.activeElement).toBe(btn3)

    trap.deactivate()
  })

  it('restores focus on deactivate', () => {
    const outsideButton = document.createElement('button')
    outsideButton.textContent = 'Outside'
    document.body.appendChild(outsideButton)
    outsideButton.focus()
    expect(document.activeElement).toBe(outsideButton)

    container.innerHTML = '<button id="inside">Inside</button>'

    const trap = createFocusTrap(container)
    trap.activate()

    // Focus moved to inside the container
    const insideBtn = container.querySelector<HTMLElement>('#inside')!
    expect(document.activeElement).toBe(insideBtn)

    // Deactivate should restore focus to the previously focused element
    trap.deactivate()
    expect(document.activeElement).toBe(outsideButton)

    document.body.removeChild(outsideButton)
  })

  it('handles container with no focusable elements', () => {
    container.innerHTML = '<p>No focusable elements here</p>'

    const trap = createFocusTrap(container)
    trap.activate()

    // Container itself should become focusable
    expect(container.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(container)

    // Tab should be prevented (no elements to cycle through)
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    const _prevented = !document.dispatchEvent(tabEvent)
    // Event was dispatched with capture: true in the trap, so
    // preventDefault was called
    expect(document.activeElement).toBe(container)

    trap.deactivate()
  })

  it('handles container with single focusable element', () => {
    container.innerHTML = '<button id="only">Only</button>'

    const trap = createFocusTrap(container)
    trap.activate()

    const onlyBtn = container.querySelector<HTMLElement>('#only')!
    expect(document.activeElement).toBe(onlyBtn)

    // Tab should keep focus on the single element
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(tabEvent)

    expect(document.activeElement).toBe(onlyBtn)

    // Shift+Tab should also keep focus on the single element
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(shiftTabEvent)

    expect(document.activeElement).toBe(onlyBtn)

    trap.deactivate()
  })
})
