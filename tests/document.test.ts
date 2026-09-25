import { describe, expect, it, vi } from 'vitest'
import {
  compileTourDocument,
  createTourDocument,
  formatTourDocument,
  generateTourTest,
  inspectTourDocument,
  parseTourDocument,
  TourDocumentError,
  validateTourDocument,
} from '../src/document.ts'

describe('portable tour documents', () => {
  it('rejects oversized escaped exports even when all individual fields fit', () => {
    const document = createTourDocument()
    document.steps = Array.from({ length: 200 }, (_, index) => ({
      ...document.steps[0],
      id: `step-${index}`,
      content: '\0'.repeat(10000),
    }))
    expect(validateTourDocument(document)).toMatchObject({
      valid: false,
      issues: [{ code: 'document-too-large' }],
    })
    expect(() => formatTourDocument(document)).toThrow('4 MB')
    expect(() => parseTourDocument(' '.repeat(4_000_001))).toThrow('4 MB')
  })

  it('keeps the byte bound invariant when canonical whitespace expands compact JSON', () => {
    const document = createTourDocument()
    document.steps = Array.from({ length: 200 }, (_, index) => ({
      ...document.steps[0],
      id: `step-${index}`,
      content: '"'.repeat(9920),
    }))
    expect(new TextEncoder().encode(JSON.stringify(document)).byteLength).toBeLessThan(4_000_000)
    expect(() => parseTourDocument(JSON.stringify(document))).toThrow('formatted document exceeds')
    for (const step of document.steps) step.content = '"'.repeat(9910)
    const exported = formatTourDocument(document)
    expect(new TextEncoder().encode(exported).byteLength).toBeLessThanOrEqual(4_000_000)
    expect(parseTourDocument(exported)).toEqual(document)
  })

  it('counts Unicode characters consistently with JSON Schema and preserves UTF-8 round trips', () => {
    const document = createTourDocument()
    document.steps[0].title = '💡'.repeat(300)
    document.steps[0].content = '漢字💡'.repeat(2500)
    expect(parseTourDocument(formatTourDocument(document))).toEqual(document)
    document.steps[0].title += '💡'
    expect(validateTourDocument(document).valid).toBe(false)
  })
  it('returns independent plain data and rejects inherited or sparse documents', () => {
    const document = createTourDocument()
    document.steps[0].advanceOn = { event: 'click' }
    const parsed = parseTourDocument(document)
    parsed.steps[0].advanceOn.event = 'change'
    expect(document.steps[0].advanceOn.event).toBe('click')
    expect(validateTourDocument(Object.create(document)).valid).toBe(false)
    expect(validateTourDocument({ ...document, steps: new Array(1) }).valid).toBe(false)
    const polluted = JSON.parse(formatTourDocument(document))
    polluted.steps[0] = JSON.parse(
      '{"__proto__":{"polluted":true},"id":"step","target":"body","title":"Hi","content":"Hello"}',
    )
    expect(validateTourDocument(polluted).valid).toBe(false)
    expect({}).not.toHaveProperty('polluted')
  })

  it('rejects limits, empty ids, and trailing control characters', () => {
    const document = createTourDocument()
    expect(validateTourDocument({ ...document, id: 'welcome\n' }).valid).toBe(false)
    expect(
      validateTourDocument({
        ...document,
        steps: Array.from({ length: 201 }, (_, index) => ({
          ...document.steps[0],
          id: `step-${index}`,
        })),
      }).valid,
    ).toBe(false)
    document.steps[0].content = 'x'.repeat(10001)
    expect(validateTourDocument(document).valid).toBe(false)
  })
  it('round trips without losing behavior settings or named callbacks', async () => {
    const document = createTourDocument()
    Object.assign(document.steps[0], {
      route: '/settings',
      interactive: true,
      advanceOn: { event: 'click', selector: 'button' },
      action: { label: 'Open', handler: 'open' },
      condition: 'eligible',
      beforeStep: 'prepare',
      spotlightPadding: 0,
      timeout: 500,
    })
    const roundTrip = parseTourDocument(formatTourDocument(document))
    expect(roundTrip).toEqual(document)
    const open = vi.fn()
    const prepare = vi.fn()
    const steps = compileTourDocument(roundTrip, {
      actions: { open, prepare },
      conditions: { eligible: () => false },
    })
    expect(await steps[0].when?.()).toBe(false)
    await steps[0].onBeforeStep?.()
    steps[0].action?.onClick()
    expect(open).toHaveBeenCalledOnce()
    expect(prepare).toHaveBeenCalledOnce()
    expect(steps[0]).toMatchObject({
      id: 'welcome',
      target: '[data-tour="welcome"]',
      spotlightPadding: 0,
      route: '/settings',
    })
  })

  it('reports exact paths for malformed imports and duplicates', () => {
    const document = createTourDocument()
    document.steps.push({ ...document.steps[0] })
    Object.assign(document.steps[0], {
      timeout: Number.NaN,
      content: { html: '<script>' },
      typo: true,
    })
    const result = validateTourDocument(document)
    expect(result.valid).toBe(false)
    expect(result.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        '$.steps[0].timeout',
        '$.steps[0].content',
        '$.steps[0].typo',
        '$.steps[1].id',
      ]),
    )
  })

  it.each([null, [], {}, { schemaVersion: 2 }, 'text'])('rejects invalid input %j', (input) => {
    expect(() => parseTourDocument(input)).toThrow(TourDocumentError)
  })

  it('does not execute callbacks while compiling and rejects inherited handler names', () => {
    const document = createTourDocument()
    document.steps[0].beforeStep = 'prepare'
    const prepare = vi.fn()
    compileTourDocument(document, { actions: { prepare } })
    expect(prepare).not.toHaveBeenCalled()
    expect(() => compileTourDocument(document)).toThrow('Register "prepare"')
    document.steps[0].beforeStep = 'toString'
    expect(() => compileTourDocument(document, { actions: {} })).toThrow('Register "toString"')
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/bad\npath'])(
    'rejects non-app routes %j',
    (route) => {
      const document = createTourDocument()
      document.steps[0].route = route
      expect(validateTourDocument(document).valid).toBe(false)
    },
  )

  it('treats imported content as data and warns about fragile selectors', () => {
    const document = createTourDocument()
    document.steps[0].content = '<img src=x onerror=alert(1)>'
    document.steps[0].target = 'div:nth-child(2)'
    expect(validateTourDocument(document)).toMatchObject({
      valid: true,
      issues: [{ code: 'fragile-target', severity: 'warning' }],
    })
    expect(compileTourDocument(document)[0].content).toBe(document.steps[0].content)
  })

  it('produces identical canonical formatting for differently ordered nested keys', () => {
    const document = createTourDocument()
    document.steps[0].action = { label: 'Open', handler: 'open' }
    const changed = {
      ...document,
      steps: [{ ...document.steps[0], action: { handler: 'open', label: 'Open' } }],
    }
    expect(formatTourDocument(changed)).toBe(formatTourDocument(document))
  })

  it('provides a useful manifest without running hooks', () => {
    const document = createTourDocument()
    Object.assign(document.steps[0], {
      route: '/settings',
      beforeStep: 'prepare',
      condition: 'eligible',
    })
    expect(inspectTourDocument(document)).toMatchObject({
      stepCount: 1,
      routes: ['/settings'],
      actions: ['prepare'],
      conditions: ['eligible'],
    })
  })

  it('generates escaped Playwright target tests and marks setup-dependent steps honestly', () => {
    const document = createTourDocument()
    document.steps[0].title = "Quoted ' title\nwith a newline"
    document.steps[0].target = '[data-tour="welcome"]'
    const generated = generateTourTest(document, 'http://localhost:3000')
    expect(generated).toContain('toHaveCount(1)')
    expect(generated).toContain(JSON.stringify(document.steps[0].target))
    expect(generated).not.toContain('test.skip(')
    document.steps[0].route = '/users/:id'
    expect(generateTourTest(document, 'http://localhost:3000')).toContain('test.skip(true')
    expect(() => generateTourTest(document, 'javascript:alert(1)')).toThrow('HTTP(S)')
    expect(() => generateTourTest(document, 'https://user:password@example.com')).toThrow(
      'credentials',
    )
  })
})
