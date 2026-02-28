/**
 * Returns an ARIA label describing the current step position and title.
 *
 * @example
 * getStepAriaLabel(1, 5, 'Navigation') // "Step 2 of 5: Navigation"
 */
export function getStepAriaLabel(currentIndex: number, totalSteps: number, title: string): string {
  return `Step ${currentIndex + 1} of ${totalSteps}: ${title}`
}

/**
 * Sets the `inert` attribute on all siblings of the given element's ancestors,
 * effectively trapping user interaction within the element's subtree.
 *
 * This is used to make the rest of the page inert while a spotlight tooltip
 * is displayed, improving accessibility for screen reader and keyboard users.
 *
 * @returns A cleanup function that removes all `inert` attributes that were set.
 */
export function setInert(exclude: HTMLElement): () => void {
  const inertedElements: HTMLElement[] = []

  let current: HTMLElement | null = exclude

  while (current) {
    const parent: HTMLElement | null = current.parentElement
    if (!parent) break

    for (const sibling of Array.from(parent.children)) {
      if (
        sibling === current ||
        !(sibling instanceof HTMLElement) ||
        sibling.tagName === 'SCRIPT' ||
        sibling.tagName === 'STYLE' ||
        sibling.tagName === 'LINK'
      ) {
        continue
      }

      // Only set inert if it wasn't already inert
      if (!sibling.inert) {
        sibling.inert = true
        inertedElements.push(sibling)
      }
    }

    current = parent
  }

  return () => {
    for (const el of inertedElements) {
      el.inert = false
    }
  }
}
