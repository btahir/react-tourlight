const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export interface FocusTrap {
  /** Activates the focus trap — traps Tab/Shift+Tab inside the container */
  activate: () => void
  /** Deactivates the focus trap and restores previously focused element */
  deactivate: () => void
}

/**
 * Creates a lightweight focus trap that keeps keyboard focus
 * cycling within the given container element.
 *
 * When activated, Tab and Shift+Tab cycle only through focusable
 * elements inside the container. The previously focused element
 * is stored and restored when the trap is deactivated.
 */
export function createFocusTrap(container: HTMLElement): FocusTrap {
  let previousActiveElement: Element | null = null

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return

    const focusable = getFocusableElements()

    // No focusable elements — prevent tabbing out entirely
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    // Single focusable element — keep focus on it
    if (focusable.length === 1) {
      event.preventDefault()
      first?.focus()
      return
    }

    if (event.shiftKey) {
      // Shift+Tab: if focus is on the first element, wrap to the last
      if (document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
    } else {
      // Tab: if focus is on the last element, wrap to the first
      if (document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  function activate() {
    previousActiveElement = document.activeElement

    document.addEventListener('keydown', handleKeyDown, true)

    // Move focus into the container
    const focusable = getFocusableElements()
    if (focusable.length > 0) {
      focusable[0]?.focus()
    } else {
      // If no focusable children, make the container itself focusable
      container.setAttribute('tabindex', '-1')
      container.focus()
    }
  }

  function deactivate() {
    document.removeEventListener('keydown', handleKeyDown, true)

    // Restore focus to the previously active element
    if (previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus()
    }
    previousActiveElement = null
  }

  return { activate, deactivate }
}
