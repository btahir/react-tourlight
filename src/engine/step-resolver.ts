import type { RefObject } from 'react'
import type { ElementRect } from '../types.ts'

/**
 * Resolves a target element from either a CSS selector string or a React ref.
 *
 * - For strings: uses `document.querySelector` to find the element.
 * - For refs: reads `.current` directly.
 *
 * Returns `null` if the element cannot be found.
 */
export function resolveTarget(target: string | RefObject<HTMLElement | null>): HTMLElement | null {
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target)
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
