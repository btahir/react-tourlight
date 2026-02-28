export interface KeyboardHandlerOptions {
  /** Called when the user presses ArrowRight */
  onNext: () => void
  /** Called when the user presses ArrowLeft */
  onPrevious: () => void
  /** Called when the user presses Escape (if allowed) */
  onDismiss: () => void
  /** Whether pressing Escape dismisses the tour. Default: true */
  escToDismiss?: boolean
}

export interface KeyboardHandler {
  /** Attaches the keydown listener to `document` */
  attach: () => void
  /** Detaches the keydown listener from `document` */
  detach: () => void
}

/**
 * Creates a keyboard handler for tour navigation.
 *
 * Listens for `keydown` events on `document`:
 * - **ArrowRight** — advance to the next step
 * - **ArrowLeft** — go back to the previous step
 * - **Escape** — dismiss/skip the tour (respects `escToDismiss` option)
 *
 * Returns an `attach` / `detach` pair so the caller controls the lifecycle.
 */
export function createKeyboardHandler(options: KeyboardHandlerOptions): KeyboardHandler {
  const { onNext, onPrevious, onDismiss, escToDismiss = true } = options

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        onNext()
        break
      case 'ArrowLeft':
        event.preventDefault()
        onPrevious()
        break
      case 'Escape':
        if (escToDismiss) {
          event.preventDefault()
          onDismiss()
        }
        break
    }
  }

  function attach() {
    document.addEventListener('keydown', handleKeyDown)
  }

  function detach() {
    document.removeEventListener('keydown', handleKeyDown)
  }

  return { attach, detach }
}
