import { suggestTourTarget } from '../diagnostics.ts'

/** Generate a unique selector without modifying the application's DOM. */
export function getStudioSelector(element: Element, root: ParentNode = document): string {
  const unique = (selector: string) => {
    try {
      return root.querySelectorAll(selector).length === 1
    } catch {
      return false
    }
  }
  const stable = suggestTourTarget(element, root as Document | Element | ShadowRoot)
  if (stable) return stable
  const parts: string[] = []
  let current: Element | null = element
  while (current && current !== document.documentElement) {
    const parent: Element | null = current.parentElement
    const siblings = parent
      ? [...parent.children].filter((item) => item.tagName === current?.tagName)
      : []
    parts.unshift(
      `${current.tagName.toLowerCase()}${siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : ''}`,
    )
    const selector = parts.join(' > ')
    if (unique(selector)) return selector
    current = parent
  }
  return parts.join(' > ')
}
