/**
 * Scrolls an element into the center of the viewport if it isn't already visible.
 * Uses instant scroll (no smooth animation) for reliability, then waits
 * two animation frames for layout to settle.
 */
export function scrollIntoView(element: HTMLElement): Promise<void> {
  const rect = element.getBoundingClientRect()
  const inView = rect.top >= 0 && rect.bottom <= window.innerHeight

  if (!inView) {
    element.scrollIntoView({ block: 'center', inline: 'nearest' })
  }

  // Two rAFs: one for the scroll, one for any resulting layout shifts.
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
