# API reference (react-tourlight 0.5)

Everything below is exported from `react-tourlight` unless another entry point is named. Check the installed version in `node_modules/react-tourlight/package.json`; the full type definitions are in `node_modules/react-tourlight/dist/index.d.mts`.

## Components

### `<SpotlightProvider>`

Wrap the app once. Optional props:

| Prop | Default | Purpose |
| --- | --- | --- |
| `theme` | `'light'` | `'light'`, `'dark'`, `'auto'`, or a partial theme object |
| `overlayColor` | from theme | Overlay color with alpha |
| `transitionDuration` | `300` | Milliseconds |
| `escToDismiss` | `true` | Escape skips the tour |
| `overlayClickToDismiss` | `true` | Clicking the overlay skips the tour |
| `showProgress` / `showSkip` | `true` | Progress bar and Skip button |
| `labels` | | `{ next, previous, skip, done, close, stepOf(current, total) }` for i18n |
| `onStart`, `onComplete`, `onSkip`, `onStepChange`, `onError` | | Callbacks for any tour, receive the tour id |
| `waitForElementTimeout` | `5000` | Milliseconds to wait for a target before skipping its step |
| `persist` | off | `true` for `localStorage`, or a `SpotlightStorage` object |
| `persistKey`, `persistMaxAge`, `resume` | | Persistence options; `resume` defaults to `true` |
| `navigate` | | `(path) => void`, your router's push, for steps with `route` |
| `isRouteActive` | | Custom `(route, pathname) => boolean` matcher |
| `portalContainer` | `document.body` | Where the overlay and tooltip render |
| `autoScroll` | `true` | Scroll each target into view before showing it |

### `<SpotlightTour>`

`id` and `steps` are required. Optional: `onStart`, `onComplete`, `onSkip(stepIndex)`, `onStepChange(stepIndex, step)`, `renderTooltip(props)`. It renders nothing itself; it registers the tour with the provider.

### `<SpotlightHighlight>`

A one-off callout on a single element. Props: `target`, `title`, `content`, `active` (default `true`), `placement`, `spotlightPadding`, `spotlightRadius`, `onDismiss`. Control visibility with `active`.

### `<SpotlightBeacon>`

A pulsing dot on an element that the user clicks to opt in. Props: `target`, and either `tour` (a registered tour id, optional `stepIndex`) or `highlight` (a step without a required target). Also `onClick`, `active`, `hideWhileActive` (default `true`), `position` (default `'top-right'`), `offset`, `size`, `color`, `label` (default `'Start tour'`), `className`, `container`, `timeout`.

```tsx
<SpotlightBeacon target='[data-tour="export"]' tour="export-tour" />
<SpotlightBeacon
  target='[data-tour="export"]'
  highlight={{ title: 'New: CSV export', content: 'Download your data any time.' }}
/>
```

## Step fields (`SpotlightStep`)

| Field | Notes |
| --- | --- |
| `target` | CSS selector string, React ref, or `() => HTMLElement \| null` resolver. Required |
| `title` | String. Required |
| `content` | String or JSX. Required |
| `id` | Stable id; reordering steps with ids invalidates stale persisted state |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` |
| `spotlightPadding`, `spotlightRadius` | Cutout padding and radius in px |
| `action` | `{ label, onClick }` extra button in the tooltip |
| `when` | `() => boolean \| Promise<boolean>`; the step is skipped when false |
| `onBeforeStep` | Runs before target resolution and before route navigation |
| `onBeforeShow`, `onAfterShow`, `onHide` | Step lifecycle hooks, may be async |
| `interactive` | Real pointer and keyboard events reach the target |
| `advanceOn` | `{ event, selector? }`; advance when that DOM event fires on the target. Implies `interactive` |
| `timeout` | Per-step wait in ms |
| `route` | Path the step lives on; exact, `:param`, or trailing `*` |
| `disableOverlayClose` | Overlay clicks do not dismiss on this step |

## Hooks

- `useSpotlight()` returns `{ start(tourId, { stepIndex? }), stop, next, previous, skip, goToStep, isActive, activeTourId, currentStep, totalSteps, highlight(step), dismissHighlight, registerTour, unregisterTour }`. It must run inside the provider.
- `useSpotlightControl()` returns the imperative subset: `start`, `stop`, `next`, `previous`, `skip`, `goToStep`, `highlight`, `dismissHighlight`, `isActive`.
- `useSpotlightTarget<T>()` returns a ref to attach to an element and use as a step `target`.

## Custom tooltip

`renderTooltip` receives `{ step, next, previous, skip, close, currentIndex, totalSteps, isFirst, isLast }`. `close` stops without marking the tour completed or skipped.

## Theming

`theme` accepts `'light'`, `'dark'`, `'auto'`, or a partial theme object (`SpotlightThemeInput`). `lightTheme`, `darkTheme`, and `resolveTheme` are exported. The stylesheet uses CSS custom properties such as `--spotlight-z-overlay` (9998) and `--spotlight-z-tooltip` (9999).

## Other entry points

- `react-tourlight/core`: headless engine and `useTour({ steps, ... })` with no CSS and no Floating UI. Use it when the user wants a fully custom overlay and tooltip.
- `react-tourlight/document`: `TourDocument` tools. See [tour-documents.md](tour-documents.md).
- `react-tourlight/diagnostics`: `inspectTourTargets(document)` and `suggestTourTarget(element)`.
- `react-tourlight/studio` plus `react-tourlight/studio.css`: the optional visual editor `TourStudio`.
- `react-tourlight/guidance` plus `react-tourlight/guidance.css`: `TourChecklist` and `TourLauncher`, an optional checklist and searchable guide launcher.
- `react-tourlight/schema.json`: the TourDocument JSON Schema.
