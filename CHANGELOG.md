# react-tourlight

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
