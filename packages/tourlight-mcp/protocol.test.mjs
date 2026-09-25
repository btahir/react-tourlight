import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'

test('stdio handshake, discovery, and document tool round trip', { timeout: 15000 }, async () => {
  const client = new Client({ name: 'tourlight-protocol-test', version: '1.0.0' })
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('./index.mjs', import.meta.url))], stderr: 'pipe' })
  try {
    await client.connect(transport)
    const { tools } = await client.listTools()
    assert.equal(tools.length, 6)
    assert.ok(tools.every((tool) => tool.annotations.readOnlyHint))
    const call = async (name, args = {}) => {
      const result = await client.callTool({ name, arguments: args })
      assert.ok(!result.isError, JSON.stringify(result))
      return result.structuredContent ?? JSON.parse(result.content[0].text)
    }
    const schema = await call('tourlight_schema')
    assert.equal(schema.properties.schemaVersion.const, 1)
    const { document } = await call('tourlight_template', { id: 'onboarding', name: 'First project' })
    assert.equal(document.id, 'onboarding')
    assert.equal((await call('tourlight_validate', { document })).valid, true)
    assert.equal((await call('tourlight_validate', { document: {} })).valid, false)
    assert.equal((await call('tourlight_inspect', { document })).stepCount, 1)
    assert.deepEqual(JSON.parse((await call('tourlight_format', { document })).json), document)
    const tests = await call('tourlight_generate_tests', { document, baseUrl: 'http://localhost:3000' })
    assert.match(tests.source, /toHaveCount\(1\)/)
    const rejected = await client.callTool({ name: 'tourlight_generate_tests', arguments: { document, baseUrl: 'file:///private' } })
    assert.equal(rejected.isError, true)
    const invalid = await client.callTool({ name: 'tourlight_template', arguments: { id: false } })
    assert.equal(invalid.isError, true)
  } finally {
    await client.close()
  }
})
