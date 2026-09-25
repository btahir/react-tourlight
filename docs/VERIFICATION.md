# Verification contract

The product story is: a product author edits a guide in the real application; the exported artifact is valid and reviewable; a developer or agent consumes it without losing semantics; the runtime guides a real task; a team can run this without Tourlight services.

## Reproduce

From the repository root on Node 24 / pnpm 11:

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm test:tools
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
pnpm --filter react-tourlight-docs build
```

For an installed Google Chrome instead of the Playwright browser download, use `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e`. Tests start the docs consumer on port 4317. CI uses bundled Chromium, Firefox, and WebKit. The package remains compatible with its advertised Node 18+ runtime; workspace tooling uses newer Node.

## Evidence boundaries

- Vitest exercises runtime state/cancellation, persistence, focus, target resolution, serialization, diagnostics, and companion UI contracts.
- CLI tests launch the actual executable, and MCP tests use a real stdio SDK client handshake and tools.
- Playwright exercises built package exports in the Next.js app, including editor round trip, local recovery, real target picking, actual task completion, keyboard behavior, route/resume, and layout changes.
- Axe checks default pages for WCAG-tagged machine-detectable violations. It is not an accessibility certification; custom content, themes, browsers, and assistive technologies need application-specific review.
- Generated tour tests are target smoke-test starters. They do not independently prove business completion, route setup, or selector resilience.
- A local production build and Node standalone smoke check are distinct from deployment. Docker execution depends on an available daemon. Npm publication, live-site deployment, and market leadership are not established by passing tests.

See the final validation record below for the actual results of this implementation run.

## Validation record — 2026-09-25

- `pnpm validate`: passed. Build, package export/type lint, Biome (zero errors; 12 warnings), 34 Vitest files / 292 tests. Nine warnings are existing non-null assertions in focus-trap tests; three are disjoint Studio CSS specificity warnings.
- `pnpm test:tools`: passed. Actual CLI process round trip and real MCP SDK stdio initialization, discovery, all six tools, malformed inputs and unsafe URLs.
- `pnpm --filter react-tourlight-docs build`: passed. 37 static pages generated, plus the search route. The upstream Fumadocs build emitted cache-dependency tracing warnings; compilation and type checks completed.
- Standalone Node production server: started with copied public/static assets; all browser tests ran against this server, not a development-only mock.
- `pnpm test:e2e`: 66/66 passed — 22 scenarios each in Chromium, Firefox and WebKit. Covers authoring/import/export, picking, undo/redo, local recovery, unsupported saved drafts, mobile overflow, real task completion, accessibility checks, runtime cancellation, keyboard focus, reload persistence, route gating, and target movement/replacement.
- Automated axe WCAG-tagged checks: no reported violations on the default landing, Studio, or guidance page in the three tested engines. This is bounded automated evidence, not certification.
- Independent packed consumer: pure document and diagnostics imports without React/browser globals, schema parity samples, CLI round trip, registry compilation, generated test source, and packed MCP/core protocol interaction passed.
- Dependency graph audit: core imports React without Floating UI; main player does not import Studio or MCP. Pure document tooling has no external runtime imports.
- Manual production review: desktop/mobile landing and guidance, keyboard interaction, all six new docs, sidebar/search navigation; no reported page errors or horizontal overflow.
- `git diff --check` and library/docs TypeScript: passed.

### Remaining boundaries

Docker recipe is provided but container execution was not tested because the local Docker daemon was unavailable. Standalone Node hosting was verified. Route gating uses a simulated history transition in the browser fixture, while reload/resume is a real browser reload; this is not certification of every router adapter. Cross-origin frames and shadow-root focus are not advertised as supported Studio surfaces. Local MCP is protocol-tested; no hosted ChatGPT transport or marketplace listing is claimed. Remote CI, npm publication, website deployment, sponsorship checkout, and demand validation have not occurred.

All task-started servers and temporary browser/test artifacts were stopped or removed after recording these results. Editable source, tests, documentation, CI configuration, and release changeset are retained.
