---
"react-tourlight": minor
---

New features (all backward compatible):

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
