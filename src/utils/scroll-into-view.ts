/**
 * Smooth-scrolls an element into the viewport center if it is not already visible.
 *
 * Uses IntersectionObserver to detect whether the element is currently visible,
 * then calls `element.scrollIntoView` with smooth behavior. The returned promise
 * resolves once scrolling completes (or immediately if the element is already in view).
 */
export function scrollIntoView(element: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    // Use IntersectionObserver to check if the element is already fully visible
    const observer = new IntersectionObserver(
      (entries) => {
        observer.disconnect()

        const entry = entries[0]
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.95) {
          // Element is already (nearly) fully visible — nothing to do
          resolve()
          return
        }

        // Element is not fully visible — scroll to it
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

        // Wait for the scroll to finish.
        // We detect scroll completion by listening for scroll events and resolving
        // once no scroll event has fired for a settled duration.
        let scrollTimeout: ReturnType<typeof setTimeout> | null = null
        const settledMs = 100
        const maxWaitMs = 1500

        const cleanup = () => {
          if (scrollTimeout) clearTimeout(scrollTimeout)
          window.removeEventListener('scroll', onScroll, true)
        }

        const done = () => {
          cleanup()
          resolve()
        }

        const onScroll = () => {
          if (scrollTimeout) clearTimeout(scrollTimeout)
          scrollTimeout = setTimeout(done, settledMs)
        }

        // Listen on the capture phase to catch scrolls on any scrollable ancestor
        window.addEventListener('scroll', onScroll, true)

        // Start the idle timer immediately in case the scroll has already begun
        scrollTimeout = setTimeout(done, settledMs)

        // Safety net — resolve after maxWaitMs regardless
        setTimeout(done, maxWaitMs)
      },
      { threshold: [0.95] },
    )

    observer.observe(element)
  })
}
