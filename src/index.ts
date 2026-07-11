'use client'

// Components

export type { SpotlightHighlightProps, SpotlightTourProps } from './components/index.ts'
export { SpotlightHighlight, SpotlightProvider, SpotlightTour } from './components/index.ts'
// Engine primitives (advanced/low-level API — most consumers won't need
// these directly, but they're useful for building custom tour UIs).
export type {
  PersistedTourState,
  TourStateMachineActions,
  TourStateMachineOptions,
  WaitForElementOptions,
} from './engine/index.ts'
export {
  createMemoryStorage,
  createTourStateMachine,
  getCurrentPath,
  getTargetRect,
  isRouteActive,
  resolveTarget,
  waitForElement,
} from './engine/index.ts'
export type { SpotlightControl, UseTourOptions, UseTourResult } from './hooks/index.ts'
// Hooks
export { useSpotlight, useSpotlightControl, useSpotlightTarget, useTour } from './hooks/index.ts'
// Overlay primitives
export { generateClipPath, measureElement } from './overlay/index.ts'
export type { SpotlightTheme } from './themes/index.ts'
// Themes
export { darkTheme, lightTheme, resolveTheme } from './themes/index.ts'

// Types
export type {
  AdvanceOn,
  ElementRect,
  Placement,
  SpotlightContextValue,
  SpotlightLabels,
  SpotlightProviderProps,
  SpotlightStep,
  SpotlightStorage,
  TooltipRenderProps,
  TourState,
  TourStatus,
} from './types.ts'
