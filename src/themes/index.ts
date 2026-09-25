import { darkTheme } from './default-dark.ts'
import { lightTheme } from './default-light.ts'
import type { SpotlightTheme, SpotlightThemeInput } from './types.ts'

export { darkTheme } from './default-dark.ts'
export { lightTheme } from './default-light.ts'
export type { SpotlightTheme, SpotlightThemeInput } from './types.ts'

/**
 * Resolves a theme value to a concrete SpotlightTheme object.
 *
 * - `'light'` returns the default light theme
 * - `'dark'` returns the default dark theme
 * - `'auto'` checks the user's OS preference via matchMedia
 * - A custom theme tokens are merged over the light theme
 */
export function resolveTheme(
  theme: 'light' | 'dark' | 'auto' | SpotlightThemeInput,
): SpotlightTheme {
  if (typeof theme === 'object') {
    return Object.fromEntries(
      Object.entries(lightTheme).map(([section, defaults]) => [
        section,
        { ...defaults, ...theme[section as keyof SpotlightTheme] },
      ]),
    ) as unknown as SpotlightTheme
  }

  if (theme === 'light') {
    return lightTheme
  }

  if (theme === 'dark') {
    return darkTheme
  }

  // 'auto' — detect OS preference
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return darkTheme
  }

  return lightTheme
}
