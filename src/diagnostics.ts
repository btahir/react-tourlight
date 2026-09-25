import { parseTourDocument, type TourDocument } from './document.ts'
import { getCurrentPath, isRouteActive } from './engine/route.ts'
import { isElementVisible } from './utils/visibility.ts'

export interface TargetDiagnostic {
  stepId: string
  target: string
  status: 'ready' | 'missing' | 'hidden' | 'ambiguous' | 'invalid' | 'other-route'
  matches: number
  message: string
}

/** A snapshot of the current page, not proof that other routes or user actions work. */
export function inspectTourTargets(
  input: TourDocument,
  root: Document | Element | ShadowRoot | undefined = typeof document === 'undefined'
    ? undefined
    : document,
  pathname: string = getCurrentPath(),
): TargetDiagnostic[] {
  return parseTourDocument(input).steps.map((step) => {
    const result = { stepId: step.id, target: step.target, matches: 0 }
    if (step.route && !isRouteActive(step.route, pathname)) {
      return { ...result, status: 'other-route', message: `Check this target on ${step.route}.` }
    }
    if (!root)
      return {
        ...result,
        status: 'missing',
        message: 'Target inspection requires a browser document.',
      }
    let elements: NodeListOf<Element>
    try {
      elements = root.querySelectorAll(step.target)
    } catch {
      return { ...result, status: 'invalid', message: 'Invalid CSS selector.' }
    }
    result.matches = elements.length
    if (!elements.length)
      return { ...result, status: 'missing', message: 'No matching element on this page.' }
    if (elements.length > 1)
      return {
        ...result,
        status: 'ambiguous',
        message: `${elements.length} elements match. Use a unique data-tour attribute.`,
      }
    if (!isElementVisible(elements[0]))
      return {
        ...result,
        status: 'hidden',
        message: 'The matching element is hidden or has no measurable size.',
      }
    return { ...result, status: 'ready', message: 'One visible target found.' }
  })
}

/** Prefer an explicit app-owned anchor; fall back to a unique, escaped id. */
export function suggestTourTarget(
  element: Element,
  root: Document | Element | ShadowRoot = element.ownerDocument,
): string | null {
  const escapeAttribute = (value: string) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/[\n\r\f]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `)
  for (const attribute of ['data-tour', 'data-testid', 'id']) {
    const value = element.getAttribute(attribute)
    if (!value) continue
    const selector = `[${attribute}="${escapeAttribute(value)}"]`
    try {
      const matches = root.querySelectorAll(selector)
      if (matches.length === 1 && matches[0] === element) return selector
    } catch {
      // Unusual attribute values may not be representable as a selector in this browser.
    }
  }
  return null
}
