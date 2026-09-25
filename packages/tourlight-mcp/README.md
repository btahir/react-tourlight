# React Tourlight MCP

Local tools for authoring portable Tourlight documents. MIT licensed. Requires Node.js 20+.

The server accepts JSON and returns JSON or generated source. It never reads application files, writes changes, executes callbacks, opens a browser, or sends data to a model provider. The MCP host supplies the model and any file/browser access.

## Run from this repository

After `pnpm install` and `pnpm build` at the repository root:

```sh
node /absolute/path/to/react-tourlight/packages/tourlight-mcp/index.mjs
```

Configure a local client using that exact absolute path:

```sh
claude mcp add --transport stdio tourlight -- node /absolute/path/to/react-tourlight/packages/tourlight-mcp/index.mjs
codex mcp add tourlight -- node /absolute/path/to/react-tourlight/packages/tourlight-mcp/index.mjs
```

The commands are alternative client configurations, not prerequisites for each other. Stdio intentionally prints protocol messages only; the process waits for a client connection. This workspace package is release-ready source, not evidence that its npm release or directory listing exists.

## Tools

| Tool | Input | Result |
| --- | --- | --- |
| `tourlight_schema` | `{}` | Full JSON Schema |
| `tourlight_template` | Optional `id`, `name` | Starter document |
| `tourlight_validate` | `document` | Validity and field-level issues |
| `tourlight_inspect` | `document` | Routes, targets, and required handlers |
| `tourlight_format` | `document` | Canonical JSON string |
| `tourlight_generate_tests` | `document`, `baseUrl` | Playwright target smoke-test source |

Every tool is read-only and deterministic. Validation does not check live selectors. Generated tests skip steps requiring application-specific setup; extend them before claiming full journey coverage.

## Client boundaries

- Claude Code and Codex support local stdio MCP servers. The protocol test verifies a real SDK client handshake, discovery, valid/invalid inputs, and all six tools. It is not a claim that every client version has been manually tested.
- ChatGPT web needs a supported remote/private connection path; it cannot directly launch this local stdio process. This package does not ship HTTP transport, authentication, a tunnel, or a published ChatGPT plugin. Follow the [current connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt) when adding a separate hosted adapter.
- The portable `skills/tourlight` workflow can be installed in [Claude Code](https://code.claude.com/docs/en/skills), [Codex](https://learn.chatgpt.com/docs/build-skills), or [OpenClaw](https://docs.openclaw.ai/tools/skills) using each host's documented skill directory. A copied skill is not a verified marketplace integration.

SDK reference: [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/), protocol 2026-07-28. SDK 2.1.0 is the verified baseline.

## Support Tourlight

This server and the Tourlight package are free under MIT. You can
[give once](https://buy.stripe.com/fZu14m0FO3v050PfqP3ks00) or explore
[monthly sponsorship](https://react-tourlight.vercel.app/support) to support maintenance,
documentation, and new features. Sponsorship does not unlock additional tools or dedicated support.
Stripe checkout uses our existing GPT Hotline account name and logo.
