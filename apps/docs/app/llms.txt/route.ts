import { source } from '@/lib/source'

const BASE_URL = 'https://react-tourlight.vercel.app'
export const revalidate = false

export function GET() {
  const lines = [
    '# React Tourlight', '',
    '> Free React product guidance with a visual Studio, portable JSON documents, headless engine, and local agent tools. MIT licensed.', '',
    'Use one versioned TourDocument across product-team visual edits, developer code review, and agent-authored changes. Studio is an optional entry at react-tourlight/studio; it does not enter player bundles. The existing React API remains supported.', '',
    'Runtime: React 18/19, route-aware tours, persistence and resume, real interactive steps, beacons, light/dark themes, custom tooltips, keyboard navigation, focus management, and headless react-tourlight/core. Styled runtime peer: @floating-ui/react-dom. Test accessibility in your application.', '',
    'Agent workflow: read the skill, generate data using the JSON Schema, validate with the CLI, inspect current-page targets, and run real browser scenarios. JSON content is plain text; application capabilities use named registry entries. Never put executable code or secrets in tour documents. A generated test is not evidence that it passed.', '',
    '## Entry points', '',
    `- [Portable agent skill](${BASE_URL}/tourlight-skill.md): Integration and authoring workflow`,
    `- [TourDocument JSON Schema](${BASE_URL}/tour.schema.json): Version 1 data contract`,
    `- [Complete documentation](${BASE_URL}/llms-full.txt): Concatenated source guides`,
    `- [Visual Studio](${BASE_URL}/studio): Local-draft authoring playground`,
    '- [Source repository](https://github.com/btahir/react-tourlight): Package, CLI, tests, and separate MCP workspace', '',
    '## Documentation', '',
    ...source.getPages().map((page) => `- [${page.data.title}](${BASE_URL}${page.url}): ${page.data.description || ''}`), '',
    '## Boundaries', '',
    'No Tourlight account, telemetry backend, model API key, or hosted service is required. Live picking works within the app where Studio is mounted, not on arbitrary third-party websites. The optional MCP server uses local stdio; clients requiring a remote HTTPS transport need a separate authenticated deployment. Read the current source/release notes before assuming unreleased workspace features are on npm.',
  ]
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
