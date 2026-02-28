const DEFAULT_TIMEOUT = 5000

export interface WaitForElementOptions {
  /** Maximum time to wait in milliseconds. Defaults to 5000. */
  timeout?: number
}

/**
 * Waits for an element matching the given CSS selector to appear in the DOM.
 *
 * Uses a `MutationObserver` on `document.body` to watch for `childList` and
 * `subtree` mutations. On each mutation batch it checks whether the selector
 * matches. The promise resolves with the element once found, or `null` if the
 * timeout expires first.
 *
 * The observer is always cleaned up — whether the element is found, the
 * timeout fires, or the caller no longer needs the result.
 */
export function waitForElement(
  target: string,
  options?: WaitForElementOptions,
): Promise<HTMLElement | null> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT

  return new Promise<HTMLElement | null>((resolve) => {
    // Check immediately — the element may already exist
    const existing = document.querySelector<HTMLElement>(target)
    if (existing) {
      resolve(existing)
      return
    }

    let settled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const observer = new MutationObserver(() => {
      const element = document.querySelector<HTMLElement>(target)
      if (element) {
        cleanup()
        resolve(element)
      }
    })

    function cleanup() {
      if (settled) return
      settled = true
      observer.disconnect()
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    timeoutId = setTimeout(() => {
      cleanup()
      resolve(null)
    }, timeout)
  })
}
