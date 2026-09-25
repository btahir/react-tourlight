import { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createTourDocument, formatTourDocument, generateTourTest, inspectTourDocument, parseTourDocument, validateTourDocument } from 'react-tourlight/document'

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
const require = createRequire(import.meta.url)
const documentInput = z.object({ document: z.unknown().describe('A Tourlight schemaVersion 1 JSON object. Content is plain text; callbacks are registered names, never code.') })
const output = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }], structuredContent: value })

export function createTourlightServer() {
  const server = new McpServer({ name: 'react-tourlight', version: '0.1.0' }, {
    instructions: 'Author source-owned Tourlight JSON documents. These tools only transform input and return results. They do not read project files, inspect a browser, execute handlers, save changes, or publish. Obtain actual selectors from the user application. Validate documents and verify the live journey before describing a tour as working.',
  })
  const register = (name, description, inputSchema, run) => server.registerTool(name, { description, inputSchema, annotations }, async (args) => {
    try { return output(await run(args)) }
    catch (error) { return { ...output({ error: error.message, ...(error.issues ? { issues: error.issues } : {}) }), isError: true } }
  })
  register('tourlight_schema', 'Get the full JSON Schema for portable Tourlight documents. Unique step ids are additionally checked by tourlight_validate.', z.object({}), () => JSON.parse(readFileSync(require.resolve('react-tourlight/schema.json'), 'utf8')))
  register('tourlight_template', 'Create a valid starter document to customize with real application targets and meaningful onboarding copy.', z.object({ id: z.string().optional(), name: z.string().optional() }), (args) => ({ document: createTourDocument(args) }))
  register('tourlight_validate', 'Validate a tour document, returning exact field paths and actionable errors. Does not resolve selectors in a browser.', documentInput, ({ document }) => validateTourDocument(document))
  register('tourlight_inspect', 'Summarize routes, selectors, action names, and conditions that an application must provide. Static analysis only.', documentInput, ({ document }) => inspectTourDocument(parseTourDocument(document)))
  register('tourlight_format', 'Return canonical JSON for review or saving by the caller. Does not write a file.', documentInput, ({ document }) => ({ json: formatTourDocument(parseTourDocument(document)) }))
  register('tourlight_generate_tests', 'Generate Playwright target smoke checks. Setup-dependent steps are explicitly skipped. Add app authentication, setup, tour navigation, and task outcome assertions; these checks alone do not prove the user journey.', z.object({ document: z.unknown(), baseUrl: z.string() }), ({ document, baseUrl }) => ({ filename: 'tourlight.targets.spec.ts', source: generateTourTest(parseTourDocument(document), baseUrl) }))
  return server
}
