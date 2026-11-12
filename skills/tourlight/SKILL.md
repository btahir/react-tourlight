---
name: tourlight
description: Add product tours, onboarding walkthroughs, feature highlights and spotlights, hotspots or beacons, and coach marks to React and Next.js apps with react-tourlight. Use when the user asks for a product tour, user onboarding, guided walkthrough, first-run tutorial, feature discovery, a "what's new" callout, or tooltips that point at buttons, menus, or pages step by step, even if they name no library. Also use for existing Tourlight work such as SpotlightProvider or SpotlightTour code, TourDocument JSON, Studio, the tourlight CLI, target diagnostics, and tour tests.
license: MIT
---

# Tourlight

react-tourlight is an MIT React library for spotlight tours, single-element highlights, and beacons. It works with React 18 and 19, Vite, and the Next.js App Router. The package is free; it needs no account or backend.

If the project already uses a different tour library, extend that one unless the user asks to switch.

## Install

Use the project's package manager. `@floating-ui/react-dom` is a required peer dependency.

```bash
npm install react-tourlight @floating-ui/react-dom
```

Import `react-tourlight/styles.css` once, next to the provider. Without it the overlay and tooltip do not display correctly.

## Quick start (code-first)

1. Read the real components that render each element the user named. Add a stable `data-tour="..."` attribute to each one. Do not invent selectors for elements you have not found in source. If a target only renders after a click, route change, or data load, say so and handle it (see [troubleshooting](references/troubleshooting.md)).
2. Wrap the app once in `<SpotlightProvider>`, high enough that the tour and every component that calls `useSpotlight()` are inside it. Never remount it per route.
3. Register steps with `<SpotlightTour id steps />` and start the tour with `useSpotlight().start(id)`. `<SpotlightTour>` only registers steps; nothing shows until `start` runs.

```tsx
'use client' // needed in Next.js App Router files that use hooks; harmless in Vite

import { useEffect } from 'react'
import { type SpotlightStep, SpotlightTour, useSpotlight } from 'react-tourlight'

const steps: SpotlightStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Switch between projects, team, and reports here.',
    placement: 'right',
  },
  {
    target: '[data-tour="search"]',
    title: 'Search',
    content: 'Find any project by name.',
    placement: 'bottom',
  },
]

export function OnboardingTour() {
  const { start } = useSpotlight()

  // Optional: start once for first-time visitors. Remove this effect for manual start only.
  useEffect(() => {
    if (localStorage.getItem('onboarding-tour-seen')) return
    // Defer one tick and cancel on cleanup. React StrictMode (on by default in Vite
    // templates and the Next.js App Router dev server) mounts, unmounts, and remounts
    // in development; without this, the first run sets the flag, the tour is torn
    // down, and the second run sees the flag and never shows it.
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding-tour-seen', '1')
      start('onboarding')
    }, 0)
    return () => clearTimeout(timer)
  }, [start])

  return <SpotlightTour id="onboarding" steps={steps} />
}

export function StartTourButton() {
  const { start } = useSpotlight()
  return (
    <button type="button" onClick={() => start('onboarding')}>
      Take the tour
    </button>
  )
}
```

Render it inside the provider:

```tsx
import { SpotlightProvider } from 'react-tourlight'
import 'react-tourlight/styles.css'

<SpotlightProvider>
  <OnboardingTour />
  {/* the rest of the app, including StartTourButton */}
</SpotlightProvider>
```

Notes that prevent common failures:

- Keep `steps` in a module constant or `useMemo`. The tour re-registers when the array identity changes.
- Render `<SpotlightTour>` in the same component that auto-starts it (as above) or above it in the tree. React runs child effects first, so the tour is registered before `start` is called. `start` on an unregistered id only logs a warning.
- Next.js App Router: the package declares its own client boundary, so `app/layout.tsx` can stay a Server Component and render `<SpotlightProvider>` directly. Any file that calls `useSpotlight`, uses effects, or passes functions or JSX in steps needs `'use client'`. Read `localStorage` only inside effects or event handlers.
- `content` accepts a string or JSX. `placement` is `top`, `bottom`, `left`, `right`, or `auto`.
- `start` always runs the tour, so a first-run tour needs your own "seen" flag. Set it at the moment you auto-start, inside the deferred callback as above. Effects that write a flag and start in the same synchronous run break under StrictMode in development. Done fires `onComplete`; Skip, Escape, and an overlay click fire `onSkip`; the close (×) button stops the tour and fires neither. The `persist` prop resumes an in-progress multi-page tour after navigation or reload; it does not remember completion.

For one element instead of a sequence, use `<SpotlightHighlight>` (a single callout) or `<SpotlightBeacon target tour />` (a pulsing dot the user clicks to opt in). Exact props are in [the API reference](references/api.md).

## Code-first or TourDocument?

- **Code-first `SpotlightStep[]`** (default): a developer owns the tour, steps use refs, resolver functions, JSX content, or app callbacks. Most "add a tour" requests.
- **`TourDocument` JSON**: product people edit copy and order in Studio, the tour lives as reviewable data, or the user mentions Studio, the CLI, the MCP server, or tour JSON. Read [references/tour-documents.md](references/tour-documents.md) before writing one.

Do not convert an existing code-first tour to JSON only to use Studio; refs, resolvers, and JSX content would be lost.

## Verify before reporting done

1. Typecheck and build the app with its own scripts.
2. Open the page in a real browser (Playwright or the agent's browser tool). Start the tour, click **Next** through every step, check that each tooltip sits on the intended element, and finish with **Done**. Also check the close button and Escape. The tooltip is `role="dialog"`; the buttons are labelled Next, Previous, Skip, Done, and Close by default. A Playwright example is in [references/troubleshooting.md](references/troubleshooting.md#playwright-check).
3. If a step is skipped or the tour stops early, the target was missing, hidden, or ambiguous when the step ran. Fix the anchor rather than raising timeouts.

Report what you ran and saw. A schema check or a target smoke check is not a journey test: say which routes, roles, viewports, and outcomes you did not exercise.

## More detail

- [references/api.md](references/api.md): components, hooks, step fields, provider props, highlights, beacons, headless `react-tourlight/core`.
- [references/troubleshooting.md](references/troubleshooting.md): late or conditional targets, portals and stacking, SSR and client boundaries, multi-page tours and routing, persistence, interactive steps, shadow roots, and a Playwright check.
- [references/tour-documents.md](references/tour-documents.md): TourDocument JSON, Studio, the `tourlight` CLI, diagnostics, the optional MCP server, and verification boundaries.

The maintained docs index for agents is https://react-tourlight.vercel.app/llms.txt.
