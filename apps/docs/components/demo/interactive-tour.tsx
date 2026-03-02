'use client'

import { useEffect, useRef } from 'react'
import type { SpotlightTheme } from 'react-tourlight'
import { SpotlightProvider, SpotlightTour, useSpotlight } from 'react-tourlight'
import 'react-tourlight/styles.css'

const TOUR_EVENT = 'start-docs-tour'

const amberDarkTheme: SpotlightTheme = {
  overlay: {
    background: 'rgba(0, 0, 0, 0.75)',
  },
  tooltip: {
    background: '#141416',
    color: '#fafaf9',
    borderRadius: '12px',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.15)',
    padding: '24px',
    maxWidth: '380px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fafaf9',
    marginBottom: '8px',
  },
  content: {
    fontSize: '14px',
    color: '#a1a1aa',
    lineHeight: '1.6',
  },
  button: {
    background: '#f59e0b',
    color: '#0c0c0e',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    hoverBackground: '#fbbf24',
  },
  buttonSecondary: {
    background: 'transparent',
    color: '#a1a1aa',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    hoverBackground: 'rgba(255, 255, 255, 0.04)',
  },
  progress: {
    background: 'rgba(255, 255, 255, 0.08)',
    fill: '#f59e0b',
    height: '4px',
    borderRadius: '2px',
  },
  arrow: {
    fill: '#141416',
  },
  closeButton: {
    color: 'rgba(255, 255, 255, 0.35)',
    hoverColor: '#fafaf9',
  },
}

const steps = [
  {
    target: '[data-tour="headline"]',
    title: 'Welcome to react-tourlight',
    content:
      "This is a live tour — you're experiencing the library right now. Every overlay, tooltip, and transition you see is react-tourlight.",
    placement: 'bottom' as const,
  },
  {
    target: '[data-tour="feature-card"]',
    title: 'Beautiful by default',
    content:
      'Smooth clip-path spotlight, dark mode that works, GPU-accelerated animations. No hacks required.',
    placement: 'bottom' as const,
  },
  {
    target: '[data-tour="terminal"]',
    title: 'One command to install',
    content:
      'Zero dependencies. Add the provider, define your steps, ship onboarding in under five minutes.',
    placement: 'right' as const,
  },
  {
    target: '[data-tour="comparison-table"]',
    title: 'See the difference',
    content:
      'Smaller, faster, more accessible, and MIT licensed. Compare react-tourlight against everything else.',
    placement: 'top' as const,
  },
]

function TourListener() {
  const { start, stop, isActive } = useSpotlight()
  const isActiveRef = useRef(isActive)
  isActiveRef.current = isActive

  useEffect(() => {
    const handler = () => {
      if (isActiveRef.current) {
        stop()
        requestAnimationFrame(() => start('docs-tour'))
      } else {
        start('docs-tour')
      }
    }
    window.addEventListener(TOUR_EVENT, handler)
    return () => window.removeEventListener(TOUR_EVENT, handler)
  }, [start, stop])

  return null
}

export function TourTriggerButton({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(TOUR_EVENT))}
      className={className}
      style={{ border: 'none', cursor: 'pointer', ...style }}
    >
      Try the Tour
    </button>
  )
}

export function InteractiveTour() {
  return (
    <SpotlightProvider theme={amberDarkTheme} transitionDuration={400}>
      <SpotlightTour id="docs-tour" steps={steps} />
      <TourListener />
    </SpotlightProvider>
  )
}
