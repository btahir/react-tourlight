import type { ElementRect, SpotlightTarget } from '../types.ts'

/**
 * Resolves a target element from a CSS selector string, a React ref, or a
 * resolver function.
 *
 * - For strings: uses `document.querySelector` to find the element.
 * - For functions: calls the function (use this for shadow DOM, iframes, etc.).
 * - For refs: reads `.current` directly.
 *
 * Returns `null` if the element cannot be found. Never throws — a resolver
 * function that throws is treated as "not found yet".
 */
export function resolveTarget(target: SpotlightTarget): HTMLElement | null {
  if (typeof target === 'string') {
    if (typeof document === 'undefined') return null
    return document.querySelector<HTMLElement>(target)
  }

  if (typeof target === 'function') {
    try {
      return target() ?? null
    } catch {
      return null
    }
  }

  // React ref object
  return target.current ?? null
}

/**
 * Returns the bounding rect of an element as a plain `ElementRect` object.
 * Uses `getBoundingClientRect` under the hood.
 */
export function getTargetRect(element: HTMLElement): ElementRect {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  }
}
