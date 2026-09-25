# Architecture

## One artifact, several interfaces

`TourDocument` version 1 is the source-owned contract. The pure `/document` entry validates and normalizes unknown data, compiles plain content into existing `SpotlightStep` objects, reports named capability requirements, and generates a Playwright starter. It has no React runtime or browser dependency. The JSON Schema covers structural constraints; the runtime additionally enforces unique step IDs and the canonical 4,000,000 UTF-8 byte limit.

Studio uses that exact validator, formatter, compiler, and target diagnostics. It does not invent a second private tour format. The CLI and optional MCP server call those functions too. Stable step IDs survive reordering and invalidate persisted progress if the ordered guide changes. Code-first tours keep React nodes, refs, and callbacks; they are not silently converted to lossy JSON.

## Dependencies and ownership

- Main entry: styled React player, Floating UI peer, existing components/hooks.
- `/core`: headless state/element/focus primitives and React hook; no default UI or Floating UI.
- `/document`: data-only API, safe to import in Node or server components.
- `/diagnostics`: DOM inspection when explicitly called; safe to import on a server.
- `/studio` and `/studio.css`: optional authoring UI. These stay outside player imports.
- `/guidance` and `/guidance.css`: optional inline checklist and searchable launcher. Application state determines task completion.
- `scripts/tourlight.mjs`: read-only file/stdin CLI. It prints documents/results/test source and never executes app code.
- `packages/tourlight-mcp`: separate SDK dependencies, local stdio protocol, deterministic data-only tools. The host owns model, file, and browser access.

A document can name actions and conditions, but only the application's explicit registry can resolve them. Content stays plain text. Imported data is never evaluated. The package has no telemetry transport, credentials, or hosted-service dependency.

## Runtime invariants

Registration updates are distinct from unmount. Inline definitions and new callback identities do not terminate an active guide. The machine uses generation/transition guards, and provider work is bound to its originating session. Stopping, skipping, replacing, or unmounting cancels stale async work. Rejected application callbacks report through `onError` without stopping a newer session.

Targets must be present and measurable before a visible-step callback fires. Active target tracking follows position and identity changes, hides stale overlays while reacquiring targets, and stops its frame/timer work on teardown. Route checks precede target resolution. Interactive steps expose the real target to keyboard and pointer input while retaining tooltip focus navigation. Focus restoration runs after inert cleanup.

Persistence remains synchronous Web Storage style. Remote or IndexedDB adapters require an application-owned synchronous cache; the package does not pretend an async storage API fits that interface.

## Studio boundaries

The child application is the picking/inspection/preview scope. Studio's control styles are scoped to its own chrome. A selector typed or imported for an editor button cannot bind preview to that button. Portalled targets must be within the embedded scope; arbitrary external URLs, cross-origin frames, and shadow-root focus are not advertised as supported authoring surfaces.

Controlled documents use `value`/`onChange`; uncontrolled drafts use `defaultValue`. Optional local storage distinguishes saving, saved, invalid, and failed states. Unreadable/future-version stored drafts are preserved until an explicit edit/import. Unapplied JSON has a separate unsaved indicator and unload warning. Undo/redo keeps 50 prior document versions. Imports and exported canonical output share a byte limit.

## Why this scope

Official research found visual editors, open-source self-hosting, and MCP already offered by competitors. The chosen advantage is a compact complete workflow, with explicit evidence boundaries and no required platform migration. Useful references: [Driver.js Builder](https://support.inlinemanual.com/support/solutions/articles/80000663125-driverjs), [Flows](https://flows.sh/), [Usertour](https://www.usertour.io/), [Jimo AI builder](https://help.usejimo.com/docs/build/builders/ai-builder), [Userflow Action Flows](https://help.userflow.com/docs/action-flows), and [Frigade](https://frigade.com/how-it-works). These references establish documented offerings, not a hands-on quality ranking.

Managed hosting, collaborative storage, billing, arbitrary end-user automation, and a hosted authenticated ChatGPT transport are separate future products. The present implementation is a free package and a self-hostable authoring experience.
