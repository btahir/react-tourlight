# react-tourlight

## 0.4.0

### Minor Changes

- bef5f39: New features (all backward compatible):

  - **`<SpotlightBeacon>`** — a pulsing hotspot anchored to any element that starts a tour (`tour`, optional `stepIndex`) or shows a single-element `highlight` when clicked. Portal-rendered, follows the target across scroll/resize, waits for late targets, hides while a tour is active, honours `prefers-reduced-motion`. Positions: corners, edges, or center; themeable via `color` / `--spotlight-beacon-color`.
  - **Resolver-function targets.** `SpotlightStep.target` (and highlights / beacons) now accept `() => HTMLElement | null` in addition to a CSS selector or ref — for shadow DOM, iframes, canvas-backed UIs, or elements only reachable through a library API. All target kinds (including refs) are now waited for with `MutationObserver`; a throwing resolver is treated as "not found yet". New exported type `SpotlightTarget`.
  - **`start(tourId, { stepIndex })`** — start a tour at a specific step (deep links, "resume" buttons). Overrides a persisted position; out-of-range values are ignored. New exported type `StartOptions`.
  - **`onStart` and `onStepChange` callbacks** on both `<SpotlightTour>` (`onStart()`, `onStepChange(stepIndex, step)`) and `<SpotlightProvider>` (`onStart(tourId)`, `onStepChange(tourId, stepIndex, step)`). `onStepChange` fires exactly once per step entered, including the first — ideal for step-level analytics.
  - **`portalContainer`** provider prop — render the overlay and tooltip into a custom container (element or function) instead of `document.body`.
  - **`autoScroll`** provider prop — set `false` to disable scrolling targets into view (parity with `useTour`).
  - **`TooltipRenderProps`** gains `close()` (stop without completing/skipping), `isFirst`, and `isLast`.

  Docs and positioning:

  - Removed the stale "React Joyride is broken on React 19" claim (Joyride has supported React 19 since v3.2) and the outdated "~5 kB / zero dependencies" figures. Measured sizes: ~8 kB gzipped for the headless `/core` entry, ~19 kB with the styled tooltip and CSS, plus ~3 kB for the Floating UI peer dependency.
  - New Beacons guide; expanded Tours, Customization, Migration, and API Reference pages.

## 0.3.0

### Minor Changes

- [`8d321df`](https://github.com/btahir/react-tourlight/commit/8d321dfa7883c9b7aa01929fbe6252bc86fd3fbb) Thanks [@btahir](https://github.com/btahir)! - Three major, fully backward-compatible features:

  - **Multi-page / route-aware tours.** New `SpotlightStep.route` and `onBeforeStep` fields plus provider `navigate`, `persist` (localStorage / custom / memory storage), `persistKey`, `persistMaxAge`, `resume`, and `isRouteActive` props. Tours can now pause on one route, navigate to another (SPA or full reload), and resume automatically. Persistence round-trips tour state and auto-resumes a still-active tour on mount, with staleness guards (age + step-count change). Ships a router-agnostic matcher (exact / `:param` / trailing `*`) exported as `isRouteActive` / `getCurrentPath`, plus `createMemoryStorage`.
  - **Headless core (`react-tourlight/core`).** New subpath export exposing the unstyled engine — state machine, element resolution/measurement, clip-path generation, focus/a11y utilities, route + persistence helpers, and a new `useTour` hook — with no CSS, no default tooltip, and no Floating UI in its module graph, so you can build a fully custom tour UI.
  - **True interactive steps.** `interactive: true` now uses real event pass-through (four transparent blocker rectangles around a genuine spotlight hole) instead of synthesizing clicks — typing, hovering, dragging, scrolling, and focus all work on the highlighted element. New `advanceOn?: { selector?; event }` step option auto-advances the tour when a real event fires on the target (e.g. "click this button to continue"), and composes with route steps. Non-interactive overlay visuals and class names are unchanged.

## 0.2.0

### Minor Changes

- Bug fixes and new APIs from a full audit:

  - Add `"use client"` directive to the published entry (Next.js App Router / RSC compatibility)
  - New: configurable `waitForElement` timeout via `SpotlightStep.timeout` and `SpotlightProviderProps.waitForElementTimeout`
  - New: engine primitives exported (`createTourStateMachine`, `waitForElement`, `getTargetRect`, `resolveTarget`, `measureElement`, `generateClipPath`)
  - Fix: theme hover styles (buttons and close button) are now actually applied, including dark mode
  - Fix: `aria-labelledby`/`aria-describedby` no longer dangle when using a custom `renderTooltip`; ids are unique per instance via `useId`
  - Fix: `theme="auto"` now reacts to live OS theme changes
  - Fix: initial focus lands on the primary (Next/Done) button instead of the close button
  - Fix: while waiting for a target element, a dimmed overlay with a loading spinner is shown instead of a full black screen
  - Fix: no more orphan `dist/styles/spotlight.mjs` in the published tarball
  - Docs: corrected dependency claims (Floating UI is a required peer dependency)
