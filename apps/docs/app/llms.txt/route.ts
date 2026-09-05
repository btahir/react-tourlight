import { source } from '@/lib/source'

const BASE_URL = 'https://react-tourlight.vercel.app'

export const revalidate = false

export function GET() {
  const pages = source.getPages()

  const lines = [
    '# react-tourlight',
    '',
    '> Beautiful onboarding tours & feature highlights for React. Headless core, multi-page tours, interactive steps, beacons, WCAG 2.1 AA. MIT.',
    '',
    'react-tourlight is a modern React tour / onboarding library. It uses CSS clip-path for GPU-accelerated spotlight transitions, ships WCAG 2.1 AA accessibility out of the box (focus trap, inert, keyboard nav, ARIA, screen reader support), and works with React 18 and 19 including Next.js App Router / RSC (it ships its own "use client" directive). Features: multi-step tours, single-element highlights, beacons (pulsing hotspots that start a tour), route-aware multi-page tours with persistence and resume, interactive steps with real event pass-through and advanceOn, a headless engine at react-tourlight/core (no CSS, no Floating UI), targets as CSS selector / React ref / resolver function, and analytics callbacks (onStart, onStepChange, onComplete, onSkip). Size: ~8 kB gzipped headless, ~19 kB with the styled tooltip and CSS. One peer dependency: @floating-ui/react-dom. MIT licensed, no paid tiers.',
    '',
    'Install: npm install react-tourlight @floating-ui/react-dom',
    'Quickstart: wrap the app in <SpotlightProvider>, register steps with <SpotlightTour id="..." steps={[...]} />, import "react-tourlight/styles.css", and call useSpotlight().start("...").',
    '',
    '## Docs',
    '',
  ]

  for (const page of pages) {
    const url = `${BASE_URL}${page.url}`
    const title = page.data.title
    const desc = page.data.description || ''
    lines.push(`- [${title}](${url}): ${desc}`)
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
