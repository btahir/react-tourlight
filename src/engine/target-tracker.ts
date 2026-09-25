import { measureElement } from '../overlay/measure.ts'
import type { ElementRect, SpotlightTarget } from '../types.ts'
import { isElementVisible, waitForElement } from './element-observer.ts'
import { resolveTarget } from './step-resolver.ts'

interface TargetTrackerOptions {
  signal: AbortSignal
  timeout?: number
  padding: () => number
  onChange: (element: HTMLElement | null, rect: ElementRect | null) => void
  onTimeout: () => void
}

/** Track an active anchor's identity and geometry; all work ends with the step. */
export function trackTarget(
  target: SpotlightTarget,
  initialElement: HTMLElement,
  options: TargetTrackerOptions,
): () => void {
  let current: HTMLElement | null = null
  let previousRect: ElementRect | null = null
  let frame: number | undefined
  let stopped = false
  const controller = new AbortController()

  const stop = () => {
    if (stopped) return
    stopped = true
    controller.abort()
    if (frame !== undefined) cancelAnimationFrame(frame)
    options.signal.removeEventListener('abort', stop)
  }

  function emit(element: HTMLElement | null) {
    const rect = element ? measureElement(element, options.padding()) : null
    if (
      element === current &&
      rect?.x === previousRect?.x &&
      rect?.y === previousRect?.y &&
      rect?.width === previousRect?.width &&
      rect?.height === previousRect?.height
    )
      return
    current = element
    previousRect = rect
    options.onChange(element, rect)
  }

  function schedule() {
    if (!stopped) frame = requestAnimationFrame(check)
  }

  function check() {
    if (stopped) return
    const candidate = resolveTarget(target)
    if (candidate && isElementVisible(candidate)) {
      emit(candidate)
      schedule()
      return
    }
    // Remove the stale cutout and tooltip while React remounts/virtualizes the
    // anchor. A fresh bounded wait resumes without replaying setup callbacks.
    emit(null)
    void waitForElement(target, {
      requireVisible: true,
      timeout: options.timeout,
      signal: controller.signal,
    }).then((element) => {
      if (stopped) return
      if (!element) {
        stop()
        options.onTimeout()
        return
      }
      emit(element)
      schedule()
    })
  }

  if (options.signal.aborted) return stop
  options.signal.addEventListener('abort', stop, { once: true })
  emit(initialElement)
  schedule()
  return stop
}
