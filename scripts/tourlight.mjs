#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises'
import { createTourDocument, formatTourDocument, generateTourTest, inspectTourDocument, MAX_TOUR_DOCUMENT_BYTES, parseTourDocument, validateTourDocument } from '../dist/document.mjs'

const HELP = `Tourlight — portable tours, owned by your team

Usage:
  tourlight template                         Print a starter document
  tourlight validate <file|->                Validate JSON; machine-readable result
  tourlight format <file|->                  Print canonical JSON
  tourlight inspect <file|->                 Print routes, targets, and named handlers
  tourlight test <file|-> --base-url <url>    Print Playwright target smoke checks

All output goes to stdout. Files are never modified. Use - to read JSON from stdin.
Validation does not inspect a browser. Generated tests require @playwright/test
and your application's authentication/setup; they do not prove a full journey.
`

async function readStdin() {
  const chunks = []
  let length = 0
  for await (const chunk of process.stdin) {
    length += chunk.length
    if (length > MAX_TOUR_DOCUMENT_BYTES) throw new Error('Input exceeds the 4 MB document limit.')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const [command, file, ...args] = process.argv.slice(2)
  if (!command || command === '--help' || command === 'help') { process.stdout.write(HELP); return }
  if (command === 'template') {
    if (file) throw new Error('template does not accept arguments.')
    process.stdout.write(formatTourDocument(createTourDocument()))
    return
  }
  if (!['validate', 'format', 'inspect', 'test'].includes(command)) throw new Error(`Unknown command "${command}". Run tourlight --help.`)
  if (!file) throw new Error('Provide a JSON file path, or - to read stdin.')
  if (command === 'test' ? args.length !== 2 || args[0] !== '--base-url' : args.length !== 0) throw new Error('Unexpected arguments. Run tourlight --help.')
  if (file !== '-' && (await stat(file)).size > MAX_TOUR_DOCUMENT_BYTES) throw new Error('Input exceeds the 4 MB document limit.')
  const content = file === '-' ? await readStdin() : await readFile(file, 'utf8')
  if (Buffer.byteLength(content) > MAX_TOUR_DOCUMENT_BYTES) throw new Error('Input exceeds the 4 MB document limit.')
  if (command === 'validate') {
    let result
    try { result = validateTourDocument(JSON.parse(content)) }
    catch { result = { valid: false, issues: [{ path: '$', code: 'invalid-json', message: 'Invalid JSON.', severity: 'error' }] } }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    process.exitCode = result.valid ? 0 : 1
    return
  }
  const document = parseTourDocument(content)
  if (command === 'format') process.stdout.write(formatTourDocument(document))
  if (command === 'inspect') process.stdout.write(`${JSON.stringify(inspectTourDocument(document), null, 2)}\n`)
  if (command === 'test') process.stdout.write(generateTourTest(document, args[1]))
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ error: error.message, ...(error.issues ? { issues: error.issues } : {}) })}\n`)
  process.exitCode = 1
})
