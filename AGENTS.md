# AGENTS.md

This file provides guidance to AI coding agents working with this repository.

## Project Overview

react-tourlight is a modern React library for building onboarding tours and feature highlights. It uses CSS clip-path for GPU-accelerated spotlight transitions, is WCAG 2.1 AA accessible out of the box, ships a headless `/core` entry (~8 kB gzipped) plus a styled default UI (~19 kB gzipped with CSS), and is MIT licensed. `@floating-ui/react-dom` is its only runtime peer dependency (positioning). It targets React 18+ and React 19 and ships its own `"use client"` directive for Next.js App Router.

Positioning notes for anyone editing docs or marketing copy: do **not** claim React Joyride is "broken on React 19" (it has supported React 19 since v3.2, July 2026) and do **not** claim "~5 kB" or "zero dependencies" — both are out of date. Differentiate on the headless core, multi-page persistence, true interactive steps, beacons, accessibility, and license.

## Structure

```
react-tourlight/
├── src/                    # Library source code
│   ├── components/         # React components (Provider, Tour, Highlight, Beacon)
│   ├── hooks/              # useSpotlight, useSpotlightControl, useSpotlightTarget
│   ├── tooltip/            # Tooltip rendering and positioning (Floating UI)
│   ├── overlay/            # Spotlight overlay and clip-path generation
│   ├── engine/             # State machine, element observer, keyboard handling
│   ├── themes/             # Light/dark theme definitions
│   ├── utils/              # Utilities (a11y, CSS, scroll)
│   ├── styles/             # CSS stylesheets
│   └── index.ts            # Public API exports
├── tests/                  # Vitest test files (mirrors src/ structure)
├── apps/
│   ├── docs/               # Fumadocs documentation site (Next.js App Router)
│   └── video/              # Remotion-based promotional videos
├── dist/                   # Build output (git-ignored)
├── .changeset/             # Changesets for versioning
├── biome.json              # Linter & formatter config
├── tsdown.config.ts        # Build config
├── vitest.config.ts        # Test config
└── package.json
```

## Commands

```bash
pnpm install              # install dependencies
pnpm build                # build library with tsdown
pnpm dev                  # watch mode
pnpm test                 # run tests in watch mode
pnpm test:run             # run tests once
pnpm test:coverage        # run tests with coverage
pnpm check                # lint and format check (Biome)
pnpm check:fix            # auto-fix lint and format issues
pnpm validate             # full pipeline: build + lint:pkg + check + test
```

## Conventions

- **Code style**: Single quotes, no semicolons, trailing commas, 2-space indentation, 100-char line width (enforced by Biome)
- **Module format**: ESM-only (`"type": "module"`)
- **Exports**: Main entry at `./dist/index.mjs`, CSS at `./dist/styles/spotlight.css`
- **Testing**: Vitest + Testing Library + jsdom. Tests in `tests/` directory, named `*.test.ts(x)`
- **Versioning**: Changesets for semantic versioning and changelogs
- **No console.log**: Banned in library source (allowed in tests/config)

## Architecture

- **State machine**: Tour state (idle, active, transitioning) is managed by a lightweight state machine in `src/engine/`
- **CSS clip-path overlay**: The spotlight effect uses a single SVG clip-path on a full-screen overlay div, avoiding `mix-blend-mode` hacks that break in dark mode
- **Floating UI**: Tooltip positioning uses `@floating-ui/react-dom` as an optional peer dependency for smart placement with flip/shift
- **Element observer**: Uses `MutationObserver` to wait for async/lazy-loaded target elements
- **Accessibility**: Focus trap, `inert` attribute on background content, ARIA live regions, keyboard navigation (Arrow keys, Escape, Tab)
- **Theming**: CSS custom properties with light/dark/auto modes
- **Peer dependencies**: React >=18, React DOM >=18, @floating-ui/react-dom >=2 (all peer deps, zero bundled runtime deps)
