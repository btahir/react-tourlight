import type { SpotlightTheme } from '../themes/types.ts'
import type { SpotlightLabels, SpotlightStep } from '../types.ts'
import { ProgressBar } from './progress-bar.tsx'

export interface TooltipContentProps {
  step: SpotlightStep
  currentIndex: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onClose: () => void
  theme: SpotlightTheme
  showProgress?: boolean
  showSkip?: boolean
  labels?: SpotlightLabels
}

const DEFAULT_LABELS = {
  next: 'Next',
  previous: 'Back',
  skip: 'Skip',
  done: 'Done',
  close: 'Close',
} as const

/**
 * Default tooltip content layout with title, body, progress, and navigation buttons.
 */
export function TooltipContent({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  theme,
  showProgress = true,
  showSkip = true,
  labels,
}: TooltipContentProps) {
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalSteps - 1

  const nextLabel = labels?.next ?? DEFAULT_LABELS.next
  const previousLabel = labels?.previous ?? DEFAULT_LABELS.previous
  const skipLabel = labels?.skip ?? DEFAULT_LABELS.skip
  const doneLabel = labels?.done ?? DEFAULT_LABELS.done
  const closeLabel = labels?.close ?? DEFAULT_LABELS.close
  const stepOfLabel = labels?.stepOf
    ? labels.stepOf(currentIndex + 1, totalSteps)
    : `${currentIndex + 1} / ${totalSteps}`

  return (
    <>
      {/* Close button */}
      <button
        className="spotlight-close"
        onClick={onClose}
        aria-label={closeLabel}
        type="button"
        style={{ color: theme.closeButton.color }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1L13 13M1 13L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Title */}
      <div
        id="spotlight-title"
        style={{
          fontSize: theme.title.fontSize,
          fontWeight: theme.title.fontWeight,
          color: theme.title.color,
          marginBottom: theme.title.marginBottom,
        }}
      >
        {step.title}
      </div>

      {/* Content */}
      <div
        id="spotlight-content"
        style={{
          fontSize: theme.content.fontSize,
          color: theme.content.color,
          lineHeight: theme.content.lineHeight,
        }}
      >
        {step.content}
      </div>

      {/* Action button */}
      {step.action && (
        <button
          type="button"
          className="spotlight-button"
          onClick={step.action.onClick}
          style={{
            background: theme.button.background,
            color: theme.button.color,
            borderRadius: theme.button.borderRadius,
            padding: theme.button.padding,
            fontSize: theme.button.fontSize,
            fontWeight: theme.button.fontWeight,
            border: theme.button.border,
            cursor: theme.button.cursor,
            marginTop: '12px',
          }}
        >
          {step.action.label}
        </button>
      )}

      {/* Progress bar */}
      {showProgress && (
        <div style={{ marginTop: '16px' }}>
          <ProgressBar current={currentIndex} total={totalSteps} theme={theme} />
        </div>
      )}

      {/* Button row */}
      <div className="spotlight-buttons">
        {/* Step info */}
        <span className="spotlight-step-info">{stepOfLabel}</span>

        {/* Skip button */}
        {showSkip && !isLast && (
          <button
            type="button"
            className="spotlight-button"
            onClick={onSkip}
            style={{
              background: theme.buttonSecondary.background,
              color: theme.buttonSecondary.color,
              border: theme.buttonSecondary.border,
              borderRadius: theme.button.borderRadius,
              padding: theme.button.padding,
              fontSize: theme.button.fontSize,
              fontWeight: theme.button.fontWeight,
              cursor: theme.button.cursor,
            }}
          >
            {skipLabel}
          </button>
        )}

        {/* Previous button */}
        {!isFirst && (
          <button
            type="button"
            className="spotlight-button"
            onClick={onPrevious}
            style={{
              background: theme.buttonSecondary.background,
              color: theme.buttonSecondary.color,
              border: theme.buttonSecondary.border,
              borderRadius: theme.button.borderRadius,
              padding: theme.button.padding,
              fontSize: theme.button.fontSize,
              fontWeight: theme.button.fontWeight,
              cursor: theme.button.cursor,
            }}
          >
            {previousLabel}
          </button>
        )}

        {/* Next / Done button */}
        <button
          type="button"
          className="spotlight-button"
          onClick={onNext}
          style={{
            background: theme.button.background,
            color: theme.button.color,
            borderRadius: theme.button.borderRadius,
            padding: theme.button.padding,
            fontSize: theme.button.fontSize,
            fontWeight: theme.button.fontWeight,
            border: theme.button.border,
            cursor: theme.button.cursor,
          }}
        >
          {isLast ? doneLabel : nextLabel}
        </button>
      </div>
    </>
  )
}
