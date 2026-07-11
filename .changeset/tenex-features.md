---
"react-tourlight": minor
---

Three major, fully backward-compatible features:

- **Multi-page / route-aware tours.** New `SpotlightStep.route` and `onBeforeStep` fields plus provider `navigate`, `persist` (localStorage / custom / memory storage), `persistKey`, `persistMaxAge`, `resume`, and `isRouteActive` props. Tours can now pause on one route, navigate to another (SPA or full reload), and resume automatically. Persistence round-trips tour state and auto-resumes a still-active tour on mount, with staleness guards (age + step-count change). Ships a router-agnostic matcher (exact / `:param` / trailing `*`) exported as `isRouteActive` / `getCurrentPath`, plus `createMemoryStorage`.
- **Headless core (`react-tourlight/core`).** New subpath export exposing the unstyled engine — state machine, element resolution/measurement, clip-path generation, focus/a11y utilities, route + persistence helpers, and a new `useTour` hook — with no CSS, no default tooltip, and no Floating UI in its module graph, so you can build a fully custom tour UI.
- **True interactive steps.** `interactive: true` now uses real event pass-through (four transparent blocker rectangles around a genuine spotlight hole) instead of synthesizing clicks — typing, hovering, dragging, scrolling, and focus all work on the highlighted element. New `advanceOn?: { selector?; event }` step option auto-advances the tour when a real event fires on the target (e.g. "click this button to continue"), and composes with route steps. Non-interactive overlay visuals and class names are unchanged.
