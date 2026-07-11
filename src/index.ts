'use client'

// Components

export type { SpotlightHighlightProps, SpotlightTourProps } from './components/index.ts'
export { SpotlightHighlight, SpotlightProvider, SpotlightTour } from './components/index.ts'
// Engine primitives (advanced/low-level API — most consumers won't need
// these directly, but they're useful for building custom tour UIs).
export type {
  TourStateMachineActions,
  TourStateMachineOptions,
  WaitForElementOptions,
} from './engine/index.ts'
export {
  createTourStateMachine,
  getTargetRect,
  resolveTarget,
  waitForElement,
} from './engine/index.ts'
export type { SpotlightControl } from './hooks/index.ts'
// Hooks
export { useSpotlight, useSpotlightControl, useSpotlightTarget } from './hooks/index.ts'
// Overlay primitives
export { generateClipPath, measureElement } from './overlay/index.ts'
export type { SpotlightTheme } from './themes/index.ts'
// Themes
export { darkTheme, lightTheme, resolveTheme } from './themes/index.ts'

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
