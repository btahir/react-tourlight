import type { RefObject } from 'react'
import type { SpotlightTheme } from './themes/types.ts'

/** Tooltip placement relative to the target element */
export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto'

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
