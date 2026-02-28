import type { SpotlightTheme } from '../themes/types.ts'

export interface ProgressBarProps {
  current: number
  total: number
  theme: SpotlightTheme
}

/**
 * Progress bar showing how far through the tour the user is.
 */
export function ProgressBar({ current, total, theme }: ProgressBarProps) {
  const percentage = total > 0 ? ((current + 1) / total) * 100 : 0

  return (
    <div
      className="spotlight-progress"
      style={{
        background: theme.progress.background,
        height: theme.progress.height,
        borderRadius: theme.progress.borderRadius,
      }}
    >
      <div
        className="spotlight-progress-bar"
        style={{
          width: `${percentage}%`,
          background: theme.progress.fill,
          borderRadius: theme.progress.borderRadius,
        }}
      />
    </div>
  )
}
