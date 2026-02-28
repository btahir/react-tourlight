import { useRef } from 'react'

/**
 * Hook to create a ref that marks an element as a tour target.
 *
 * Use this when you want to reference a target element via ref
 * instead of a CSS selector.
 *
 * @example
 * ```tsx
 * const searchRef = useSpotlightTarget()
 *
 * // In your tour steps:
 * { target: searchRef, title: 'Search', content: '...' }
 *
 * // In your JSX:
 * <input ref={searchRef} />
 * ```
 */
export function useSpotlightTarget<T extends HTMLElement = HTMLElement>() {
  return useRef<T>(null)
}
