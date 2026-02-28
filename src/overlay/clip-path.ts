import type { ElementRect } from '../types.ts'

/** Large value to ensure the outer rectangle covers any viewport size */
const VIEWPORT_SIZE = 10000

/**
 * Generates a CSS `clip-path: path(...)` value that covers the full viewport
 * but cuts out a rounded rectangle around the target element.
 *
 * The path uses the even-odd fill rule:
 * - An outer rectangle from (0,0) to (VIEWPORT_SIZE, VIEWPORT_SIZE)
 * - An inner rounded-rect cutout using quadratic bezier curves at each corner
 *
 * @param rect - The target element's viewport-relative bounding rect
 * @param padding - Extra padding around the cutout (px)
 * @param radius - Border radius for the cutout corners (px)
 */
export function generateClipPath(rect: ElementRect, padding: number, radius: number): string {
  const x = rect.x - padding
  const y = rect.y - padding
  const w = rect.width + padding * 2
  const h = rect.height + padding * 2

  // Clamp radius so it doesn't exceed half the width or height
  const r = Math.min(radius, w / 2, h / 2)

  const path = [
    // Outer rectangle (clockwise)
    `M 0 0`,
    `H ${VIEWPORT_SIZE}`,
    `V ${VIEWPORT_SIZE}`,
    `H 0`,
    `Z`,
    // Inner rounded-rect cutout (clockwise — even-odd rule creates the hole)
    `M ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `H ${x + w - r}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `Q ${x} ${y + h} ${x} ${y + h - r}`,
    `Z`,
  ].join(' ')

  return `path('${path}')`
}

/**
 * Returns a clip-path that covers the entire viewport with no cutout.
 * Used as the initial state before a target element is measured.
 */
export function generateEmptyClipPath(): string {
  const path = [
    `M 0 0`,
    `H ${VIEWPORT_SIZE}`,
    `V ${VIEWPORT_SIZE}`,
    `H 0`,
    `Z`,
  ].join(' ')

  return `path('${path}')`
}
