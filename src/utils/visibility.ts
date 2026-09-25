/** Shared runtime/diagnostic visibility check, including transparent ancestor branches. */
export function isElementVisible(element: Element): boolean {
  if (!element.isConnected) return false
  const rect = element.getBoundingClientRect()
  const view = element.ownerDocument.defaultView
  if (!view || rect.width <= 0 || rect.height <= 0) return false
  let current: Element | null = element
  while (current) {
    const style = view.getComputedStyle(current)
    if (
      current.hasAttribute('hidden') ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0'
    )
      return false
    const root = current.getRootNode()
    current = current.parentElement ?? ('host' in root ? (root as ShadowRoot).host : null)
  }
  return true
}
