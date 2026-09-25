# Tourlight Studio product contract

A free, source-owned authoring and playback workflow for product people, developers, and agents.

## Shared outcome

One versioned TourDocument travels between visual authoring, code review, agent tools, browser inspection, and the existing React player. No accounts, telemetry service, or remote storage are required. Studio is an optional import so the player stays independent. Existing React steps remain supported.

## Release gates

- Stable runtime under inline props, React StrictMode, async targets, cancellation, and route transitions.
- Real interactive steps remain keyboard reachable; editable controls retain arrow-key behavior.
- Strict data validation with stable IDs, plain text content, named application-owned capabilities, and explicit errors.
- Studio: pick a real app target, edit all supported fields, add/reorder/duplicate/delete, undo/redo, import/export, local recovery, preview the real player, inspect current-page targets.
- Distinguish schema validity, current-page target checks, and executed browser scenarios. Never label unvisited routes as tested.
- Agent tooling: documented schema, portable skill, CLI, optional MCP server, safe test generation, truthful transport/setup boundaries.
- App-owned embedded authoring plus a functional standalone demo; self-host instructions without required external services.
- Useful launcher/checklist companions reuse tours and explicit application completion state.
- Responsive, keyboard-usable Studio and polished documentation. No unsupported certification or universal competitor claims.
- Unit/regression tests, real-browser authoring round trip and runtime scenarios, production docs build, packed consumer checks, package size/isolation inspection.

## Boundaries

A standalone site cannot inspect arbitrary third-party websites. Live picking runs inside the app where Studio is mounted. JSON never executes code; handlers are registered explicitly by the application. Browser target checks do not prove activation or conversion. A generated Playwright spec is not a test result. MCP integration is a protocol implementation, not a claim of vendor certification. Voluntary sponsorship uses Stripe-hosted links and a customer portal. All features remain free; a managed hosted service is deferred.

## Design

Warm paper, charcoal, amber signal color. A focused working instrument: step sequence on the left, the actual app in the center, content and behavior on the right. Clear Editing / Picking / Previewing modes. Stable controls, legible content, visible errors, and keyboard alternatives to drag operations.
