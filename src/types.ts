import type { RefObject } from 'react'
import type { SpotlightTheme } from './themes/types.ts'

/** Tooltip placement relative to the target element */
export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto'

/**
 * Auto-advance configuration for a step. When set, the tour advances to the
 * next step as soon as the given DOM `event` fires on the step's target (or a
 * descendant matching `selector`). Enables "click this real button to
 * continue" walkthroughs. A step with `advanceOn` is automatically treated as
 * interactive (pointer/keyboard events pass through to the target).
 */
export interface AdvanceOn {
  /** DOM event type to listen for on the target, e.g. 'click', 'input', 'submit' */
  event: string
  /**
   * Optional CSS selector. The tour only advances when the event originates
   * from an element matching this selector inside (or equal to) the target.
   * When omitted, any occurrence of `event` reaching the target advances.
   */
  selector?: string
}

/** Configuration for a single tour step */
export interface SpotlightStep {
  /** CSS selector or React ref for the target element */
  target: string | RefObject<HTMLElement | null>
  /** Step title — shown in tooltip header */
  title: string
  /** Step content — string or React node */
  content: React.ReactNode
  /** Tooltip placement relative to target */
  placement?: Placement
  /** Padding around the spotlight cutout (px) */
  spotlightPadding?: number
  /** Border radius of the spotlight cutout (px) */
  spotlightRadius?: number
  /** Optional CTA button inside the tooltip */
  action?: { label: string; onClick: () => void }
  /** Condition — step is skipped if this returns false */
  when?: () => boolean | Promise<boolean>
  /** Called before this step is shown */
  onBeforeShow?: () => void | Promise<void>
  /** Called after this step is shown */
  onAfterShow?: () => void
  /** Called when this step is hidden */
  onHide?: () => void
  /** Whether clicking the overlay dismisses the tour */
  disableOverlayClose?: boolean
  /** Whether the user can interact with the highlighted element */
  interactive?: boolean
  /**
   * Maximum time (ms) to wait for `target` to appear in the DOM before
   * skipping this step. Overrides `waitForElementTimeout` on the provider.
   * Defaults to 5000ms.
   */
  timeout?: number
  /**
   * The route/path this step lives on (multi-page tours). When advancing to
   * this step while the current location doesn't match, the provider calls
   * `navigate(route)` (see {@link SpotlightProviderProps.navigate}) and then
   * waits for the target on the destination page. Supports exact paths,
   * `:param` dynamic segments, and a trailing `*` wildcard.
   */
  route?: string
  /**
   * Escape hatch invoked just before the provider resolves this step's target
   * (and before any `route` navigation). Use it to run custom navigation or
   * setup. May be async — the provider awaits it.
   */
  onBeforeStep?: () => void | Promise<void>
  /**
   * Auto-advance the tour when a DOM event fires on the target (or a matching
   * descendant). Implies interactive pass-through for this step.
   */
  advanceOn?: AdvanceOn
}

/** Tour lifecycle state */
export type TourStatus = 'idle' | 'active' | 'completed'

/** Persisted state for a tour */
export interface TourState {
  /** Current status of the tour */
  status: TourStatus
  /** Index of the current step (when active) */
  currentStepIndex: number
  /** Indices of steps the user has seen */
  seenSteps: number[]
  /** Whether the tour was completed */
  completedAt?: number
  /** Whether the tour was skipped and at which step */
  skippedAt?: { stepIndex: number; timestamp: number }
}

/** Rect describing a target element's position and dimensions */
export interface ElementRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Minimal storage adapter used for cross-navigation persistence. The shape is
 * a subset of the Web Storage API, so `window.localStorage` and
 * `window.sessionStorage` are valid adapters as-is. Provide a custom object to
 * persist to memory, cookies, IndexedDB, or a remote store.
 */
export interface SpotlightStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

/** I18n labels */
export interface SpotlightLabels {
  next?: string
  previous?: string
  skip?: string
  done?: string
  close?: string
  stepOf?: (current: number, total: number) => string
}

/** Provider configuration */
export interface SpotlightProviderProps {
  children: React.ReactNode
  /** Theme: 'light' | 'dark' | 'auto' | custom theme object */
  theme?: 'light' | 'dark' | 'auto' | SpotlightTheme
  /** Overlay color (with alpha). Default: 'rgba(0, 0, 0, 0.5)' */
  overlayColor?: string
  /** Transition duration in ms. Default: 300 */
  transitionDuration?: number
  /** Whether pressing Escape dismisses the tour. Default: true */
  escToDismiss?: boolean
  /** Whether clicking the overlay dismisses the tour. Default: true */
  overlayClickToDismiss?: boolean
  /** Whether to show a progress indicator. Default: true */
  showProgress?: boolean
  /** Whether to show a skip button. Default: true */
  showSkip?: boolean
  /** Labels for i18n */
  labels?: SpotlightLabels
  /** Called when any tour completes */
  onComplete?: (tourId: string) => void
  /** Called when any tour is skipped */
  onSkip?: (tourId: string, stepIndex: number) => void
  /** Persistence callback — called with tour state for saving */
  onStateChange?: (tourId: string, state: TourState) => void
  /** Initial state — for restoring persisted state */
  initialState?: Record<string, TourState>
  /**
   * Default maximum time (ms) to wait for a step's target to appear in the
   * DOM before skipping to the next step. Can be overridden per-step via
   * `SpotlightStep.timeout`. Defaults to 5000ms.
   */
  waitForElementTimeout?: number
  /**
   * Enable cross-navigation persistence so a tour survives SPA route changes
   * and full page reloads. `true` uses `localStorage`; pass a custom
   * {@link SpotlightStorage} (e.g. `createMemoryStorage()` or
   * `window.sessionStorage`) for other backends. Defaults to `undefined`
   * (no persistence — fully backward compatible with existing consumers).
   */
  persist?: boolean | SpotlightStorage
  /** Storage key used when `persist` is enabled. Default: `'react-tourlight'`. */
  persistKey?: string
  /**
   * Discard persisted state older than this many milliseconds (staleness
   * guard). When omitted, persisted state never expires by age — but it is
   * always discarded when the persisted step count no longer matches the
   * tour definition.
   */
  persistMaxAge?: number
  /**
   * When persistence is enabled, automatically resume a persisted, still-
   * active tour once it registers on mount. Default: `true`. Set `false` to
   * require an explicit `start()` call after a reload/navigation.
   */
  resume?: boolean
  /**
   * Called when advancing to a step whose `route` doesn't match the current
   * location. Plug in your router here — e.g. Next.js `router.push`, React
   * Router's `navigate`, or `location.assign` for a full page load.
   */
  navigate?: (path: string) => void
  /**
   * Custom route matcher. Given a step's `route` and the current
   * `window.location.pathname`, return whether the route is active. Overrides
   * the built-in matcher (exact / `:param` / trailing `*`).
   */
  isRouteActive?: (route: string, pathname: string) => boolean
}

/** Tour component props */
export interface SpotlightTourProps {
  /** Unique tour identifier */
  id: string
  /** Steps in this tour */
  steps: SpotlightStep[]
  /** Called when this tour completes */
  onComplete?: () => void
  /** Called when this tour is skipped */
  onSkip?: (stepIndex: number) => void
  /** Custom tooltip render function */
  renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
}

/** Props passed to custom tooltip render function */
export interface TooltipRenderProps {
  step: SpotlightStep
  next: () => void
  previous: () => void
  skip: () => void
  currentIndex: number
  totalSteps: number
}

/** Spotlight context value for consumers */
export interface SpotlightContextValue {
  /** Start a tour by ID */
  start: (tourId: string) => void
  /** Stop the currently active tour */
  stop: () => void
  /** Go to the next step */
  next: () => void
  /** Go to the previous step */
  previous: () => void
  /** Skip the current tour */
  skip: () => void
  /** Go to a specific step by index */
  goToStep: (index: number) => void
  /** Whether a tour is currently active */
  isActive: boolean
  /** ID of the currently active tour */
  activeTourId: string | null
  /** Index of the current step */
  currentStep: number
  /** Total steps in the active tour */
  totalSteps: number
  /** Register a tour's steps and callbacks */
  registerTour: (
    id: string,
    steps: SpotlightStep[],
    callbacks?: {
      onComplete?: () => void
      onSkip?: (stepIndex: number) => void
      renderTooltip?: (props: TooltipRenderProps) => React.ReactNode
    },
  ) => void
  /** Unregister a tour */
  unregisterTour: (id: string) => void
  /** Highlight a single element (no tour) */
  highlight: (step: SpotlightStep) => void
  /** Dismiss a single-element highlight */
  dismissHighlight: () => void
}
