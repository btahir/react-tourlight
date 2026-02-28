import type React from 'react'
import { forwardRef } from 'react'

export interface TooltipArrowProps {
  style?: React.CSSProperties
  fill?: string
}

/**
 * Arrow component for the spotlight tooltip.
 *
 * Renders an SVG triangle (12x12, pointing up by default).
 * CSS rotation handles other directions based on tooltip placement.
 */
export const TooltipArrow = forwardRef<HTMLDivElement, TooltipArrowProps>(function TooltipArrow(
  { style, fill = 'white' },
  ref,
) {
  return (
    <div ref={ref} className="spotlight-arrow" style={style}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon points="6,0 12,12 0,12" fill={fill} />
      </svg>
    </div>
  )
})
