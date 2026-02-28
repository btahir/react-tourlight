'use client'

import { SpotlightProvider, SpotlightTour, useSpotlight } from 'react-spotlight'
import 'react-spotlight/styles.css'

const steps = [
  {
    target: '[data-tour="hero"]',
    title: 'Welcome to react-spotlight',
    content: 'This is a live tour running on the docs page itself. You\'re experiencing the product right now.',
    placement: 'bottom' as const,
  },
  {
    target: '[data-tour="features"]',
    title: 'Feature Highlights',
    content: 'Beautiful by default, accessible, tiny bundle, and MIT licensed. Everything you need.',
    placement: 'top' as const,
  },
  {
    target: '[data-tour="install"]',
    title: 'Quick Install',
    content: 'One command to install. Add the provider, define your steps, and you\'re live.',
    placement: 'top' as const,
  },
  {
    target: '[data-tour="comparison"]',
    title: 'See the Difference',
    content: 'Compare react-spotlight against other tour libraries. We win on every metric that matters.',
    placement: 'top' as const,
  },
]

function TourButton() {
  const { start, isActive } = useSpotlight()

  if (isActive) return null

  return (
    <button
      onClick={() => start('docs-tour')}
      style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      Try the Tour
    </button>
  )
}

export function InteractiveTour() {
  return (
    <SpotlightProvider theme="dark" transitionDuration={400}>
      <SpotlightTour id="docs-tour" steps={steps} />
      <TourButton />
    </SpotlightProvider>
  )
}
