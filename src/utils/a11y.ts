/**
 * Returns an ARIA label describing the current step position and title.
 *
 * @example
 * getStepAriaLabel(1, 5, 'Navigation') // "Step 2 of 5: Navigation"
 */
export function getStepAriaLabel(currentIndex: number, totalSteps: number, title: string): string {
  return `Step ${currentIndex + 1} of ${totalSteps}: ${title}`
}

function isSkippable(el: Element): boolean {
  return (
    !(el instanceof HTMLElement) ||
    el.tagName === 'SCRIPT' ||
    el.tagName === 'STYLE' ||
    el.tagName === 'LINK'
  )
}

/**
 * Sets the `inert` attribute on all siblings of the given element's ancestors,
 * effectively trapping user interaction within the element's subtree.
 *
 * This is used to make the rest of the page inert while a spotlight tooltip
 * is displayed, improving accessibility for screen reader and keyboard users.
 *
 * When `keepInteractive` is provided (used for interactive / `advanceOn`
 * steps), that element's ancestor branch is left un-inert and its entire
 * subtree stays interactive — only the *off-path* siblings within that branch
 * are inerted. This keeps the spotlighted target keyboard- and
 * screen-reader-reachable while everything else on the page is blocked.
 *
 * @returns A cleanup function that removes all `inert` attributes that were set.
 */
export function setInert(exclude: HTMLElement, keepInteractive?: HTMLElement | null): () => void {
  const inertedElements: HTMLElement[] = []

  // The ancestor chain (inclusive) of the element that must stay interactive.
  const keepPath = new Set<Element>()
  if (keepInteractive) {
    let node: Element | null = keepInteractive
    while (node) {
      keepPath.add(node)
      node = node.parentElement
    }
  }

  // Walks INTO a node that sits on the keep-path: inert its off-path children,
  // and recurse through the on-path child. Stops at `keepInteractive` itself so
  // the target and its whole subtree remain interactive.
  function inertOffPathChildren(node: Element) {
    if (node === keepInteractive) return
    for (const child of Array.from(node.children)) {
      if (isSkippable(child)) continue
      if (keepPath.has(child)) {
        inertOffPathChildren(child)
      } else if (!(child as HTMLElement).inert) {
        ;(child as HTMLElement).inert = true
        inertedElements.push(child as HTMLElement)
      }
    }
  }

  let current: HTMLElement | null = exclude

  while (current) {
    const parent: HTMLElement | null = current.parentElement
    if (!parent) break

    for (const sibling of Array.from(parent.children)) {
      if (sibling === current || isSkippable(sibling)) {
        continue
      }

      if (keepPath.has(sibling)) {
        // This sibling contains the interactive target — descend instead of
        // inerting the whole branch.
        inertOffPathChildren(sibling)
        continue
      }

      // Only set inert if it wasn't already inert
      if (!(sibling as HTMLElement).inert) {
        ;(sibling as HTMLElement).inert = true
        inertedElements.push(sibling as HTMLElement)
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
