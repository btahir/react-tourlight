'use client'

/**
 * react-tourlight/core — the unstyled, headless engine.
 *
 * This entry exposes the tour state machine, element resolution/measurement,
 * clip-path generation, focus/a11y utilities, route + persistence helpers, and
 * a headless `useTour` hook — with NO CSS, NO default tooltip, and (crucially)
 * NO Floating UI in its module graph. Use it to build a fully custom tour UI.
 */

// ---- Element resolution & measurement ----
export { type WaitForElementOptions, waitForElement } from './engine/element-observer.ts'
export {
  createKeyboardHandler,
  type KeyboardHandler,
  type KeyboardHandlerOptions,
} from './engine/keyboard.ts'
// ---- Persistence ----
export {
  clearPersistedTour,
  createMemoryStorage,
  DEFAULT_PERSIST_KEY,
  isPersistedStateFresh,
  loadPersistedTours,
  type PersistedTourState,
  resolveStorage,
  savePersistedTour,
  toTourState,
} from './engine/persistence.ts'
// ---- Route matching ----
export { getCurrentPath, isRouteActive } from './engine/route.ts'
// ---- State machine ----
export {
  createTourStateMachine,
  type TourStateMachineActions,
  type TourStateMachineOptions,
} from './engine/state-machine.ts'
export { getTargetRect, resolveTarget } from './engine/step-resolver.ts'
// ---- Headless controller hook ----
export { type UseTourOptions, type UseTourResult, useTour } from './hooks/use-tour.ts'
// ---- Clip-path generation ----
export { generateClipPath, generateEmptyClipPath } from './overlay/clip-path.ts'
export { measureElement } from './overlay/measure.ts'
// ---- Focus / accessibility utilities ----
export { createFocusTrap, type FocusTrap } from './tooltip/focus-trap.ts'
// ---- Shared types ----
export type {
  AdvanceOn,
  ElementRect,
  Placement,
  SpotlightStep,
  SpotlightStorage,
  TourState,
  TourStatus,
} from './types.ts'
export { getStepAriaLabel, setInert } from './utils/a11y.ts'
export { scrollIntoView } from './utils/scroll-into-view.ts'
