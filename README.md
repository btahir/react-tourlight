<p align="center">
  <img src="assets/logo.svg" alt="react-tourlight" width="120" />
</p>

<h1 align="center">react-tourlight</h1>

<p align="center">
  Beautiful onboarding tours & feature highlights for React.<br/>
  One small peer dependency (Floating UI). Looks like 2026, not 2018.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-tourlight"><img src="https://img.shields.io/npm/v/react-tourlight.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/react-tourlight"><img src="https://img.shields.io/bundlephobia/minzip/react-tourlight?style=flat-square&label=gzip" alt="bundle size" /></a>
  <a href="https://github.com/btahir/react-tourlight/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/react-tourlight.svg?style=flat-square" alt="license" /></a>
  <a href="https://www.npmjs.com/package/react-tourlight"><img src="https://img.shields.io/npm/dm/react-tourlight.svg?style=flat-square" alt="downloads" /></a>
</p>

<p align="center">
  <a href="assets/launch-video.mp4">Watch the launch video</a>
</p>

---

<p align="center">
  <img src="assets/readme-hero.gif" alt="react-tourlight spotlight tour demo" width="720" />
</p>

## The Problem

<p align="center">
  <img src="assets/readme-comparison.png" alt="react-tourlight vs React Joyride" width="720" />
</p>

React Joyride — the most popular tour library — is **broken on React 19**. It uses deprecated APIs (`unmountComponentAtNode`, `unstable_renderSubtreeIntoContainer`) and hasn't been updated in 9+ months. Shepherd.js requires a paid commercial license. Intro.js is GPL. Driver.js has no React bindings. Every developer evaluating tour libraries in 2025–2026 hit the same wall: **nothing modern, free, and React-native exists.**

react-tourlight fills that gap.

## Install

```bash
npm install react-tourlight @floating-ui/react-dom
```

`@floating-ui/react-dom` is a **required peer dependency** — it powers tooltip
positioning (flip, shift, overflow handling). It's a peer dep rather than a
bundled dependency so you control the version and it isn't duplicated if
something else in your app already depends on it.

```bash
# yarn
yarn add react-tourlight @floating-ui/react-dom

# pnpm
pnpm add react-tourlight @floating-ui/react-dom
```

**Next.js App Router:** as of v0.2.0 the package ships its own `"use client"`
directive, so `SpotlightProvider`, `SpotlightTour`, and friends can be
imported directly into a Server Component (like `app/layout.tsx`) without
wrapping them in your own client component first — Next.js honors the
boundary declared inside `react-tourlight` itself.

## Quickstart

```tsx
import { SpotlightProvider, SpotlightTour, useSpotlight } from 'react-tourlight'
import 'react-tourlight/styles.css'

function App() {
  return (
    <SpotlightProvider>
      <SpotlightTour
        id="onboarding"
        steps={[
          {
            target: '#search-input',
            title: 'Search',
            content: 'Find anything instantly with our search.',
            placement: 'bottom',
          },
          {
            target: '[data-tour="sidebar"]',
            title: 'Navigation',
            content: 'Browse your projects and teams here.',
            placement: 'right',
          },
        ]}
      />
      <Dashboard />
    </SpotlightProvider>
  )
}

function Dashboard() {
  const { start } = useSpotlight()
  return <button onClick={() => start('onboarding')}>Start Tour</button>
}
```

## Why react-tourlight

|  | What you get |
|---|---|
| **Beautiful by default** | Modern, polished tooltips with smooth CSS clip-path spotlight transitions. Light, dark, and custom themes out of the box. |
| **Accessible** | WCAG 2.1 AA compliant. Focus trap, keyboard navigation, ARIA roles, screen reader announcements. |
| **Tiny** | ~5KB gzipped core (vs ~30KB for Joyride). Floating UI is a required peer dependency for positioning. |
| **MIT License** | Free for commercial use. No GPL restrictions, no paid tiers. |

## Features

- **CSS clip-path spotlight** — GPU-accelerated, perfect in dark mode (no `mix-blend-mode` hacks)
- **Floating UI positioning** — smart flip, shift, and overflow handling
- **Full keyboard navigation** — Arrow keys, Escape, Tab focus trap that opens with focus on the primary (Next/Done) button
- **Async element waiting** — `MutationObserver`-based, handles lazy-loaded content, with a configurable timeout (`SpotlightStep.timeout` / `SpotlightProviderProps.waitForElementTimeout`) and a dimmed loading overlay while a target is still resolving
- **Light / Dark / Custom themes** — auto-detect OS preference (and stay in sync when it changes live), or bring your own theme, including working hover states on buttons and the close button
- **Responsive & mobile-friendly** — works on any screen size
- **React 19 compatible** — built for modern React, no deprecated APIs
- **Next.js / RSC ready** — ships its own `"use client"` directive, no manual wrapper required
- **i18n support** — customize all button labels and step text
- **Single-element highlights** — one-off "What's new" callouts without a full tour
- **Custom tooltips** — full render prop API for complete control, with unique per-instance ARIA ids (`useId`) so multiple tooltips never collide and no `aria-labelledby`/`aria-describedby` reference is left dangling
- **Interactive targets** — `interactive: true` on a step forwards click events through the overlay to the highlighted element (it does not forward hover, focus, or other event types)
- **Headless engine primitives** — the state machine, element-waiting, and geometry/clip-path logic are exported separately for building fully custom tour UIs (see below)

## Headless / engine primitives

Most consumers only need `SpotlightProvider`, `SpotlightTour`, and
`useSpotlight`. If you're building a fully custom tour UI, the underlying
engine is also exported so you don't have to reimplement it:

```tsx
import {
  createTourStateMachine, // drives step/lifecycle state without any UI
  waitForElement,         // MutationObserver-based "wait for selector" helper
  resolveTarget,          // resolve a CSS selector or ref to an HTMLElement
  getTargetRect,          // getBoundingClientRect() as a plain ElementRect
  measureElement,         // getBoundingClientRect() + padding
  generateClipPath,       // build the CSS clip-path for a spotlight cutout
} from 'react-tourlight'

const machine = createTourStateMachine({
  steps,
  onComplete: () => console.log('done'),
})

machine.subscribe((state) => console.log(state.status, state.currentStepIndex))
await machine.start()

const el = await waitForElement('#lazy-loaded-button', { timeout: 8000 })
if (el) {
  const rect = getTargetRect(el)
  const clipPath = generateClipPath(rect, /* padding */ 8, /* radius */ 8)
}
```

These are the same primitives `SpotlightProvider` uses internally — they're
low-level and framework-agnostic (no React state or rendering), so treat them
as a building block rather than a drop-in replacement for the components.

## Comparison

| Feature | react-tourlight | React Joyride | Shepherd.js | Driver.js | Intro.js |
|---|---|---|---|---|---|
| **React 19** | Yes | Broken | Wrapper | No React | No React |
| **License** | MIT | MIT | Paid commercial | MIT | GPL / Paid |
| **Bundle size** | ~5KB | ~30KB | ~25KB | ~5KB | ~12KB |
| **React-first** | Yes | Yes | No (vanilla JS) | No (vanilla JS) | No (vanilla JS) |
| **Dark mode** | clip-path | mix-blend breaks | SVG | Yes | Partial |
| **Accessibility** | WCAG 2.1 AA | Limited | Limited | Limited | Poor |
| **Focus trap** | Yes | No | No | No | No |
| **Zero deps** | No (1 peer: Floating UI) | No | No | Yes | No |

## Documentation

Visit **[react-tourlight.vercel.app](https://react-tourlight.vercel.app)** for the full docs — API reference, interactive examples, theming guide, accessibility details, and recipes for Next.js, Remix, and shadcn/ui.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, project structure, and PR workflow.

## License

[MIT](LICENSE)
