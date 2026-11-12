# Troubleshooting and edge cases

## Nothing appears

- `<SpotlightTour>` only registers steps. Call `useSpotlight().start(id)` from an effect, event handler, or button.
- `start` with an id that is not registered logs `Tour "<id>" not found` and does nothing. Render `<SpotlightTour>` before (or as a child of) the component that starts it.
- `useSpotlight()` outside `<SpotlightProvider>` throws. Move the provider higher.
- The tour auto-starts in a production build but not on the dev server: React StrictMode runs mount effects twice in development and the provider's first mount is torn down. An effect that writes a "seen" flag and calls `start` in the same run sets the flag, loses the tour, and then skips it on the second run. Defer the start with `setTimeout(..., 0)`, clear the timer in the effect cleanup, and write the flag inside the timer callback (see the quick start in SKILL.md).
- Missing `import 'react-tourlight/styles.css'`.
- Missing `@floating-ui/react-dom`. It is a required peer with no positioning fallback.

## A step is skipped or the tour ends early

The player waits for a connected, visible target with a measurable box, up to 5000 ms by default (`timeout` per step, `waitForElementTimeout` on the provider). When the wait expires, it skips that step. Usual causes:

- The selector matches nothing. Check the rendered DOM, not only the source; some components do not forward unknown props such as `data-tour` to the DOM element. Put the attribute on a wrapper element if needed.
- The selector matches several elements, for example a nav rendered twice for mobile and desktop. The first match may be the hidden one. Use a unique anchor.
- The element only exists after a click, menu expansion, data load, or route change. Options:
  - Point the step at a control that is always rendered (the menu trigger instead of the menu panel).
  - Prepare state in `onBeforeStep` or `onBeforeShow` (both may be async, and target waiting starts after they resolve), for example open the menu.
  - Use `when` to skip a step that does not apply to the current user.
  - Make the step `interactive` with `advanceOn: { event: 'click' }` so the user opens it.
- The element has zero size or `display: none` at the current viewport. Test the viewports you ship.

Do not raise timeouts to hide a wrong selector.

## Portals, modals, and stacking

- The overlay and tooltip render in a portal on `document.body` with z-index 9998 and 9999 (`--spotlight-z-overlay`, `--spotlight-z-tooltip`). If app chrome sits above them, raise those variables in CSS rather than lowering the app.
- For a tour inside a fullscreen element, modal root, or shadow root host, pass `portalContainer` to the provider (an element or a function that returns one).
- Another active focus trap, such as an open modal dialog, can fight with the tooltip's focus trap. Close it first or target elements inside it from a tour started after it opens.
- Ancestors with CSS `transform` change the containing block for fixed elements. Floating UI handles this, but check the result in a browser.
- With custom scroll containers or virtualized lists, set `autoScroll={false}` and scroll yourself in `onBeforeShow`.

## Server rendering and Next.js App Router

- The package entry declares `'use client'`, so `app/layout.tsx` can stay a Server Component and render `<SpotlightProvider>` with `children`.
- Files that call `useSpotlight`, `useEffect`, or define steps with functions, refs, or JSX need `'use client'`. Plain string steps can be passed from a Server Component, but keeping the tour definition in one client component is simpler.
- Read `localStorage`, `window`, and `document` only in effects or handlers, never during render, or hydration will mismatch.
- If the provider props need client-only values (router callbacks, theme from a client store), put the provider in a small `'use client'` wrapper component and render that from the layout.
- Pages Router and Remix: render the provider in the app shell and start tours from effects. The overlay never renders on the server.

## Multi-page tours

Give steps a `route`, give the provider `navigate`, and keep one provider mounted above all routes:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { SpotlightProvider } from 'react-tourlight'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <SpotlightProvider persist navigate={(path) => router.push(path)}>
      {children}
    </SpotlightProvider>
  )
}
```

- When the next step's `route` does not match `window.location.pathname`, the provider calls `navigate(route)` and waits for the target there. Routes match exactly, with `:param` segments, or with a trailing `*`. Override with `isRouteActive`.
- React Router: `const navigate = useNavigate()` inside the router; pass `navigate={(p) => navigate(p)}`. A full page load works with `navigate={(p) => location.assign(p)}` plus `persist`.
- Register the multi-page `<SpotlightTour>` somewhere that stays mounted across those routes (layout level). If it unmounts on navigation, the tour stops.
- Test every route in the browser. A target check on one page says nothing about the others.

## Persistence and resume

- `persist` saves tour state on every change (`localStorage` by default, key `react-tourlight`, change with `persistKey`). With `resume` (default `true`), an in-progress tour continues at the same step after a reload.
- Snapshots are ignored when older than `persistMaxAge` or when the step count or step ids changed.
- `persist` does not prevent a completed tour from starting again. Keep a separate "seen" flag (local storage, user profile, or your backend) and check it before `start`.
- `start(id, { stepIndex })` starts at a given step and overrides persisted state.

## Interactive steps

- `interactive: true` lets real clicks, typing, and scrolling reach the target while the rest of the page stays blocked.
- `advanceOn: { event: 'click' }` advances when the user performs that event on the target; add `selector` to require a specific descendant. A link that navigates combined with a `route` step resumes on the next page.
- An `advanceOn` step proves the event fired, not that the business action succeeded. Check the outcome separately.

## Targets the selector cannot reach

- Use a React ref (`useSpotlightTarget()` or `useRef`) or a resolver function `() => element` for elements inside shadow roots, same-origin iframes you control, or canvas-backed UIs. Coordinates, events, and accessibility in those cases need their own browser checks.
- Cross-origin frames are out of reach.

## Accessibility checks

The tooltip is a `role="dialog"` with a focus trap, Arrow Left/Right navigation, and Escape to skip. Focus returns to the element that started the tour. Custom tooltips (`renderTooltip`), custom content, and custom themes need their own keyboard and contrast checks.

## Playwright check

A minimal journey test for a tour that starts from a button. Adjust the start trigger, step count, and titles to the real app. Add assertions for anything a step is supposed to accomplish.

```ts
import { expect, test } from '@playwright/test'

test('onboarding tour runs start to finish', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Take the tour' }).click()

  const dialog = page.getByRole('dialog')
  const titles = ['Navigation', 'Search', 'New project', 'Your profile']
  for (const [index, title] of titles.entries()) {
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(title)
    await expect(dialog).toContainText(`Step ${index + 1} of ${titles.length}`)
    const isLast = index === titles.length - 1
    await dialog.getByRole('button', { name: isLast ? 'Done' : 'Next' }).click()
  }
  await expect(dialog).toBeHidden()

  // Close button stops the tour
  await page.getByRole('button', { name: 'Take the tour' }).click()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
})
```

For an auto-started first-run tour, use a fresh browser context (empty storage) and skip the button click. Run it against a production build as well as the dev server if the app's setup differs between them.
