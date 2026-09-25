import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const cli = fileURLToPath(new URL('./tourlight.mjs', import.meta.url))
const run = (args, input) => spawnSync(process.execPath, [cli, ...args], { input, encoding: 'utf8' })

test('CLI stdin workflow validates, formats, inspects, and exports tests without writing', () => {
  const starter = run(['template'])
  assert.equal(starter.status, 0, starter.stderr)
  const document = JSON.parse(starter.stdout)
  assert.equal(run(['validate', '-'], starter.stdout).status, 0)
  const formatted = run(['format', '-'], JSON.stringify(document))
  assert.equal(formatted.stdout, starter.stdout)
  const manifest = run(['inspect', '-'], starter.stdout)
  assert.equal(JSON.parse(manifest.stdout).targets[0].stepId, 'welcome')
  const spec = run(['test', '-', '--base-url', 'http://localhost:3000'], starter.stdout)
  assert.equal(spec.status, 0, spec.stderr)
  assert.match(spec.stdout, /toHaveCount\(1\)/)
  const invalid = run(['validate', '-'], '{invalid')
  assert.equal(invalid.status, 1)
  assert.equal(JSON.parse(invalid.stdout).issues[0].code, 'invalid-json')
  const unknown = run(['publish'])
  assert.equal(unknown.status, 1)
  assert.match(JSON.parse(unknown.stderr).error, /Unknown command/)
  const malformed = run(['test', '-', '--base-url', 'file:///etc/passwd'], starter.stdout)
  assert.equal(malformed.status, 1)
})
