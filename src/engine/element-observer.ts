import type { SpotlightTarget } from '../types.ts'
import { isElementVisible } from '../utils/visibility.ts'

export { isElementVisible } from '../utils/visibility.ts'

import { resolveTarget } from './step-resolver.ts'

const DEFAULT_TIMEOUT = 5000

export interface WaitForElementOptions {
  /** Maximum time to wait in milliseconds. Defaults to 5000. */
  timeout?: number
  /** Cancels observation immediately when the host changes step or unmounts. */
  signal?: AbortSignal
  /** Wait for a connected, visible target with a nonzero layout box. */
  requireVisible?: boolean
}

/** Wait for a target, including ref changes, CSS visibility and layout updates. */
export function waitForElement(
  target: SpotlightTarget,
  options: WaitForElementOptions = {},
): Promise<HTMLElement | null> {
  const { signal, requireVisible = false } = options
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  return new Promise((resolve) => {
    if (signal?.aborted || typeof document === 'undefined' || !document.body) {
      resolve(null)
      return
    }
    let settled = false
    let observer: MutationObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let poll: ReturnType<typeof setInterval> | undefined
    const finish = (element: HTMLElement | null) => {
      if (settled) return
      settled = true
      observer?.disconnect()
      clearTimeout(timer)
      clearInterval(poll)
      signal?.removeEventListener('abort', abort)
      resolve(element)
    }
    const abort = () => finish(null)
    const check = () => {
      const element = resolveTarget(target)
      if (element && (!requireVisible || isElementVisible(element))) finish(element)
    }
    check()
    if (settled) return
    signal?.addEventListener('abort', abort, { once: true })
    observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    // Ref-only changes and CSS animation/layout changes need not mutate the DOM.
    poll = setInterval(check, 50)
    timer = setTimeout(() => finish(null), Math.max(0, timeout))
  })
}
