// Components
export { SpotlightHighlight, SpotlightProvider, SpotlightTour } from './components/index.ts'
export type { SpotlightHighlightProps, SpotlightTourProps } from './components/index.ts'

// Hooks
export { useSpotlight, useSpotlightControl, useSpotlightTarget } from './hooks/index.ts'
export type { SpotlightControl } from './hooks/index.ts'

// Themes
export { darkTheme, lightTheme, resolveTheme } from './themes/index.ts'
export type { SpotlightTheme } from './themes/index.ts'

// Types
export type {
  ElementRect,
  Placement,
  SpotlightContextValue,
  SpotlightLabels,
  SpotlightProviderProps,
  SpotlightStep,
  TooltipRenderProps,
  TourState,
  TourStatus,
} from './types.ts'
