/**
 * Joins CSS class names, filtering out falsy values.
 *
 * @example
 * cn('foo', false, 'bar', null, undefined, 'baz') // "foo bar baz"
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
