import type { AdvanceOn, Placement, SpotlightStep } from './types.ts'

/** Maximum UTF-8 bytes for imported JSON and canonical exports (decimal 4 MB). */
export const MAX_TOUR_DOCUMENT_BYTES = 4_000_000

function documentBytes(json: string): number {
  return new TextEncoder().encode(json).byteLength
}

/** The portable, data-only format shared by Studio, agents, and the runtime. */
export interface TourDocument {
  $schema?: string
  schemaVersion: 1
  id: string
  name: string
  description?: string
  steps: TourDocumentStep[]
}

export interface TourDocumentStep {
  id: string
  target: string
  title: string
  /** Plain text. HTML and JavaScript are never evaluated. */
  content: string
  placement?: Placement
  route?: string
  interactive?: boolean
  advanceOn?: AdvanceOn
  timeout?: number
  spotlightPadding?: number
  spotlightRadius?: number
  disableOverlayClose?: boolean
  action?: { label: string; handler: string }
  condition?: string
  beforeShow?: string
  beforeStep?: string
  afterShow?: string
  onHide?: string
}

export interface TourRegistry {
  actions?: Record<string, () => void | Promise<void>>
  conditions?: Record<string, () => boolean | Promise<boolean>>
}

export interface TourDocumentIssue {
  path: string
  code: string
  message: string
  severity: 'error' | 'warning'
}

export interface TourDocumentValidation {
  valid: boolean
  issues: TourDocumentIssue[]
}

export class TourDocumentError extends Error {
  readonly issues: TourDocumentIssue[]

  constructor(issues: TourDocumentIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'))
    this.name = 'TourDocumentError'
    this.issues = issues
  }
}

const identifier = /^[a-zA-Z0-9][a-zA-Z0-9._-]*(?![\s\S])/
const documentKeys = ['$schema', 'schemaVersion', 'id', 'name', 'description', 'steps']
const stepKeys = [
  'id',
  'target',
  'title',
  'content',
  'placement',
  'route',
  'interactive',
  'advanceOn',
  'timeout',
  'spotlightPadding',
  'spotlightRadius',
  'disableOverlayClose',
  'action',
  'condition',
  'beforeShow',
  'beforeStep',
  'afterShow',
  'onHide',
]
const hookKeys = ['beforeShow', 'beforeStep', 'afterShow', 'onHide'] as const
const placements = ['top', 'bottom', 'left', 'right', 'auto']

function isObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Validates structure without touching the DOM or executing any application callbacks. */
export function validateTourDocument(input: unknown): TourDocumentValidation {
  const issues: TourDocumentIssue[] = []
  const error = (path: string, code: string, message: string) => {
    issues.push({ path, code, message, severity: 'error' })
  }
  const keys = (value: Record<string, unknown>, allowed: string[], path: string) => {
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key))
        error(`${path}.${key}`, 'unknown-field', `Unknown field "${key}".`)
    }
  }
  const string = (value: unknown, path: string, max: number, empty = false) => {
    if (
      typeof value !== 'string' ||
      (!empty && !value.trim()) ||
      value.length > max * 2 ||
      [...value].length > max
    ) {
      error(
        path,
        'invalid-string',
        `Expected ${empty ? 'a' : 'a non-empty'} string of at most ${max} characters.`,
      )
      return false
    }
    return true
  }
  const id = (value: unknown, path: string) => {
    if (string(value, path, 128) && !identifier.test(value as string)) {
      error(
        path,
        'invalid-id',
        'Use letters, numbers, dots, underscores, or hyphens; start with a letter or number.',
      )
    }
  }
  if (!isObject(input)) {
    error('$', 'invalid-document', 'Expected a tour document object.')
    return { valid: false, issues }
  }
  keys(input, documentKeys, '$')
  if (input.schemaVersion !== 1)
    error('$.schemaVersion', 'unsupported-version', 'Expected schemaVersion 1.')
  if (input.$schema !== undefined) string(input.$schema, '$.$schema', 2048)
  id(input.id, '$.id')
  string(input.name, '$.name', 200)
  if (input.description !== undefined) string(input.description, '$.description', 5000, true)
  if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 200) {
    error('$.steps', 'invalid-steps', 'Expected between 1 and 200 steps.')
    return { valid: false, issues }
  }
  const seen = new Set<string>()
  for (let index = 0; index < input.steps.length; index++) {
    if (!Object.hasOwn(input.steps, index)) {
      error(`$.steps[${index}]`, 'invalid-step', 'Sparse arrays are not valid tour documents.')
    }
  }
  input.steps.forEach((step: unknown, index: number) => {
    const path = `$.steps[${index}]`
    if (!isObject(step)) {
      error(path, 'invalid-step', 'Expected a step object.')
      return
    }
    keys(step, stepKeys, path)
    id(step.id, `${path}.id`)
    if (typeof step.id === 'string') {
      if (seen.has(step.id))
        error(`${path}.id`, 'duplicate-id', `Step id "${step.id}" must be unique.`)
      seen.add(step.id)
    }
    string(step.target, `${path}.target`, 2048)
    string(step.title, `${path}.title`, 300)
    string(step.content, `${path}.content`, 10000, true)
    if (step.placement !== undefined && !placements.includes(step.placement as string)) {
      error(`${path}.placement`, 'invalid-placement', `Expected one of: ${placements.join(', ')}.`)
    }
    if (step.route !== undefined && string(step.route, `${path}.route`, 2048)) {
      if (
        !(step.route as string).startsWith('/') ||
        (step.route as string).startsWith('//') ||
        [...(step.route as string)].some(
          (character) => character === '\\' || character.charCodeAt(0) <= 32,
        )
      ) {
        error(
          `${path}.route`,
          'invalid-route',
          'Use an app-relative path beginning with a single /, without whitespace or backslashes.',
        )
      }
    }
    for (const key of ['interactive', 'disableOverlayClose']) {
      if (step[key] !== undefined && typeof step[key] !== 'boolean')
        error(`${path}.${key}`, 'invalid-boolean', 'Expected a boolean.')
    }
    for (const [key, max] of [
      ['timeout', 120000],
      ['spotlightPadding', 200],
      ['spotlightRadius', 1000],
    ] as const) {
      if (
        step[key] !== undefined &&
        (typeof step[key] !== 'number' ||
          !Number.isFinite(step[key]) ||
          (step[key] as number) < 0 ||
          (step[key] as number) > max)
      ) {
        error(`${path}.${key}`, 'invalid-number', `Expected a finite number between 0 and ${max}.`)
      }
    }
    for (const key of [...hookKeys, 'condition']) {
      if (step[key] !== undefined) id(step[key], `${path}.${key}`)
    }
    if (step.action !== undefined) {
      if (!isObject(step.action))
        error(`${path}.action`, 'invalid-action', 'Expected { label, handler }.')
      else {
        keys(step.action, ['label', 'handler'], `${path}.action`)
        string(step.action.label, `${path}.action.label`, 100)
        id(step.action.handler, `${path}.action.handler`)
      }
    }
    if (step.advanceOn !== undefined) {
      if (!isObject(step.advanceOn))
        error(`${path}.advanceOn`, 'invalid-event', 'Expected { event, selector? }.')
      else {
        keys(step.advanceOn, ['event', 'selector'], `${path}.advanceOn`)
        string(step.advanceOn.event, `${path}.advanceOn.event`, 128)
        if (step.advanceOn.selector !== undefined)
          string(step.advanceOn.selector, `${path}.advanceOn.selector`, 2048)
      }
    }
    if (typeof step.target === 'string' && /:nth-(child|of-type)\(/.test(step.target)) {
      issues.push({
        path: `${path}.target`,
        code: 'fragile-target',
        message:
          'Position-based selectors can break when the interface changes. Prefer a unique data-tour attribute.',
        severity: 'warning',
      })
    }
  })
  if (!issues.some((issue) => issue.severity === 'error')) {
    // Measure the exported representation, including escaping and pretty-print whitespace.
    // Field character limits alone do not bound UTF-8 or JSON-escaped file sizes.
    if (documentBytes(`${JSON.stringify(input, null, 2)}\n`) > MAX_TOUR_DOCUMENT_BYTES) {
      error(
        '$',
        'document-too-large',
        'The formatted document exceeds the 4 MB UTF-8 limit. Shorten the content or split it into smaller guides.',
      )
    }
  }
  return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
}

/** Parses JSON or validates an object; throws errors with machine-readable paths. */
export function parseTourDocument(input: string | unknown): TourDocument {
  let value = input
  if (typeof input === 'string') {
    if (input.length > MAX_TOUR_DOCUMENT_BYTES || documentBytes(input) > MAX_TOUR_DOCUMENT_BYTES) {
      throw new TourDocumentError([
        {
          path: '$',
          code: 'document-too-large',
          message: 'Input exceeds the 4 MB UTF-8 document limit.',
          severity: 'error',
        },
      ])
    }
    try {
      value = JSON.parse(input)
    } catch {
      throw new TourDocumentError([
        {
          path: '$',
          code: 'invalid-json',
          message: 'Invalid JSON. Use double-quoted keys and remove trailing commas.',
          severity: 'error',
        },
      ])
    }
  }
  const result = validateTourDocument(value)
  if (!result.valid) throw new TourDocumentError(result.issues)
  // Return owned data: neither Studio edits nor the compiler mutate the caller's document.
  return JSON.parse(JSON.stringify(value)) as TourDocument
}

/** Resolves only explicitly registered handlers. Imported documents cannot execute code. */
export function compileTourDocument(
  input: TourDocument,
  registry: TourRegistry = {},
): SpotlightStep[] {
  const document = parseTourDocument(input)
  const issues: TourDocumentIssue[] = []
  function resolve<T>(
    map: Record<string, T> | undefined,
    name: string,
    path: string,
  ): T | undefined {
    if (!map || !Object.hasOwn(map, name) || typeof map[name] !== 'function') {
      issues.push({
        path,
        code: 'missing-handler',
        message: `Register "${name}" before running this tour.`,
        severity: 'error',
      })
      return undefined
    }
    return map[name]
  }
  const steps = document.steps.map((step, index) => {
    const {
      id: stepId,
      condition,
      beforeShow,
      beforeStep,
      afterShow,
      onHide,
      action,
      ...data
    } = step
    const path = `$.steps[${index}]`
    const result: SpotlightStep = { ...data, id: stepId }
    if (condition) result.when = resolve(registry.conditions, condition, `${path}.condition`)
    if (beforeShow)
      result.onBeforeShow = resolve(registry.actions, beforeShow, `${path}.beforeShow`)
    if (beforeStep)
      result.onBeforeStep = resolve(registry.actions, beforeStep, `${path}.beforeStep`)
    if (afterShow) result.onAfterShow = resolve(registry.actions, afterShow, `${path}.afterShow`)
    if (onHide) result.onHide = resolve(registry.actions, onHide, `${path}.onHide`)
    if (action) {
      const callback = resolve(registry.actions, action.handler, `${path}.action.handler`)
      if (callback) result.action = { label: action.label, onClick: callback }
    }
    return result
  })
  if (issues.length) throw new TourDocumentError(issues)
  return steps
}

/** A complete, valid starter that can be edited immediately. */
export function createTourDocument(options: { id?: string; name?: string } = {}): TourDocument {
  return parseTourDocument({
    schemaVersion: 1,
    id: options.id ?? 'welcome',
    name: options.name ?? 'Welcome tour',
    steps: [
      {
        id: 'welcome',
        target: '[data-tour="welcome"]',
        title: 'Welcome aboard',
        content: 'Let’s take a quick look around.',
        placement: 'bottom',
      },
    ],
  })
}

/** Canonical key order makes human and agent edits easy to review in Git. */
export function formatTourDocument(input: TourDocument): string {
  const document = parseTourDocument(input)
  const pick = (value: object, order: string[]) =>
    Object.fromEntries(
      order
        .filter(
          (key) =>
            Object.hasOwn(value, key) && (value as Record<string, unknown>)[key] !== undefined,
        )
        .map((key) => [key, (value as Record<string, unknown>)[key]]),
    )
  return `${JSON.stringify({ ...pick(document, documentKeys), steps: document.steps.map((step) => ({ ...pick(step, stepKeys), ...(step.advanceOn ? { advanceOn: pick(step.advanceOn, ['event', 'selector']) } : {}), ...(step.action ? { action: pick(step.action, ['label', 'handler']) } : {}) })) }, null, 2)}\n`
}

/** Static manifest for agents and review tools; does not inspect a running app. */
export function inspectTourDocument(input: TourDocument) {
  const document = parseTourDocument(input)
  return {
    id: document.id,
    name: document.name,
    stepCount: document.steps.length,
    routes: [...new Set(document.steps.flatMap((step) => (step.route ? [step.route] : [])))],
    actions: [
      ...new Set(
        document.steps.flatMap((step) =>
          [step.action?.handler, ...hookKeys.map((key) => step[key])].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      ),
    ],
    conditions: [
      ...new Set(document.steps.flatMap((step) => (step.condition ? [step.condition] : []))),
    ],
    targets: document.steps.map((step) => ({
      stepId: step.id,
      target: step.target,
      route: step.route ?? null,
    })),
    issues: validateTourDocument(document).issues,
  }
}

/** Generates runnable target smoke checks. Add your app's setup and full journey assertions. */
export function generateTourTest(input: TourDocument, baseUrl: string): string {
  const document = parseTourDocument(input)
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    throw new Error('baseUrl must be an absolute http:// or https:// URL.')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('baseUrl must use HTTP(S) without embedded credentials.')
  }
  const lines = [
    "import { test, expect } from '@playwright/test'",
    '',
    '// Generated target smoke checks. These do not prove tour navigation or task completion.',
    '// Add your authentication/storageState and app setup before running against a real app.',
    '// Conditional/setup-dependent steps are skipped until their prerequisites are implemented.',
    '',
  ]
  for (const step of document.steps) {
    const setupRequired = Boolean(
      step.condition ||
        step.beforeShow ||
        step.beforeStep ||
        (step.route && /[:*]/.test(step.route)),
    )
    const destination =
      step.route && !/[:*]/.test(step.route) ? new URL(step.route, url).href : url.href
    lines.push(
      `test(${JSON.stringify(`${document.name}: ${step.title} (${step.id})`)}, async ({ page }) => {`,
    )
    if (setupRequired)
      lines.push(
        "  test.skip(true, 'Supply the route parameters, conditions, and setup for this step first.')",
      )
    lines.push(`  await page.goto(${JSON.stringify(destination)})`)
    lines.push(`  const target = page.locator(${JSON.stringify(step.target)})`)
    lines.push('  await expect(target).toHaveCount(1)')
    // Playwright interprets zero as an unlimited wait, unlike a zero runtime wait.
    lines.push(
      `  await expect(target).toBeVisible({ timeout: ${Math.max(1, step.timeout ?? 5000)} })`,
    )
    lines.push('})', '')
  }
  return lines.join('\n')
}
