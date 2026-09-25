# AGENTS.md

This file provides guidance to AI coding agents working with this repository.

## Project Overview

react-tourlight is an MIT-licensed React library and visual authoring toolkit for product guides. Its optional entry points include the player, headless `/core`, portable `/document` tools, `/diagnostics`, `/studio`, and `/guidance` components. It targets React 18 and 19 and declares client boundaries for the React entries used by Next.js App Router.

Positioning notes: describe concrete, tested capabilities. Do not claim that competitors are broken or universally inferior; verify specific comparisons against their current releases. Do not promise WCAG certification or automatic conversion improvements. Report bundle size only with a current build measurement, named entry point, and clear treatment of CSS and peer dependencies. The editor is optional and should not enter player-only bundles.

Studio edits data-only tour documents. Applications own named actions, conditions, completion state, authentication, storage, and publishing. A document validation pass is distinct from current-page target diagnostics and from a full browser journey. Do not imply that the standalone editor can inspect arbitrary remote websites.

## Structure

```
react-tourlight/
├── src/                    # Library source code
│   ├── components/         # React components (Provider, Tour, Highlight, Beacon)
│   ├── studio/             # Optional visual authoring UI
│   ├── guidance/           # Optional checklist and searchable guide launcher
│   ├── document.ts         # Portable schema, validation, compilation
│   ├── diagnostics.ts      # Current-page target inspection
│   ├── hooks/              # useSpotlight, useSpotlightControl, useSpotlightTarget
│   ├── tooltip/            # Tooltip rendering and positioning (Floating UI)
│   ├── overlay/            # Spotlight overlay and clip-path generation
│   ├── engine/             # State machine, element observer, keyboard handling
│   ├── themes/             # Light/dark theme definitions
│   ├── utils/              # Utilities (a11y, CSS, scroll)
│   ├── styles/             # CSS stylesheets
│   └── index.ts            # Public API exports
├── tests/                  # Vitest unit and integration tests
├── e2e/                    # Playwright real-browser verification
├── schema/                 # Tour document JSON Schema
├── scripts/                # Local CLI
├── skills/tourlight/       # Agent workflow guidance
├── packages/tourlight-mcp/ # Separate stdio MCP server
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

- **State machine**: Tour status and cancellable step transitions are managed in `src/engine/`. Late asynchronous work must not revive a stopped tour.
- **CSS clip-path overlay**: A cutout highlights the target. Interactive steps leave a real event path to the target while blocking surrounding page interaction.
- **Floating UI**: `@floating-ui/react-dom` is a required declared peer for the styled player. Headless and document imports do not load the tooltip positioning implementation.
- **Element readiness**: Wait for visible, measurable targets and cancel waiting when the guide stops. Test delayed layout, DOM changes, and missing targets in a real browser.
- **Accessibility**: Verify focus restoration after inert cleanup, target access for interactive steps, ARIA relationships, reduced motion, and contrast. Custom content and themes need application-level checks.
- **Theming**: CSS custom properties with light/dark/auto modes
- **Peer dependencies**: React >=18, React DOM >=18, @floating-ui/react-dom >=2. Check package.json for current constraints.
- **Agent tools**: MCP accepts documents as arguments and returns data/test source; it does not drive browsers, read application files, or publish guides.
