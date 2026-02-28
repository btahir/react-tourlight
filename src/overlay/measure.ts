import type { ElementRect } from '../types.ts'

/**
 * Measures an element's position and dimensions using `getBoundingClientRect`.
 * Optionally adds padding on all sides.
 *
 * The returned rect is viewport-relative (same coordinate space as position: fixed).
 *
 * @param element - The DOM element to measure
 * @param padding - Optional padding to add on all sides (px). Default: 0
 */
export function measureElement(element: HTMLElement, padding: number = 0): ElementRect {
  const rect = element.getBoundingClientRect()

  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}
