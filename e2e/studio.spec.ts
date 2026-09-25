import { expect, test } from '@playwright/test'

// These exercise built package exports in a real Next.js consumer, not source mocks.
test.beforeEach(async ({ page }) => {
  await page.goto('/studio')
  await expect(page.getByRole('textbox', { name: 'Guide name', exact: true })).toHaveValue('A good place to start')
})

test('edits, reorders, exports, and reimports the same artifact without losing fields', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('A clearer first step')
  await page.getByRole('button', { name: 'Move step down', exact: true }).click()
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  const source = page.getByRole('textbox', { name: 'Tour JSON', exact: true })
  const document = JSON.parse(await source.inputValue())
  expect(document.steps[1].id).toBe('welcome')
  expect(document.steps[1].title).toBe('A clearer first step')
  expect(document.steps[0].advanceOn).toEqual({ event: 'click' })
  document.steps[1].beforeStep = 'prepare'
  document.steps[1].condition = 'eligible'
  await source.fill(JSON.stringify(document))
  await page.getByRole('button', { name: 'Apply JSON', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('fieldnotes-welcome.tour.json')
  const path = await download.path()
  expect(path).toBeTruthy()
  await page.getByLabel('Import tour JSON').setInputFiles(path!)
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  expect(JSON.parse(await source.inputValue())).toEqual(document)
  expect(errors).toEqual([])
})

test('uses real target picking, undo, redo, and refresh recovery', async ({ page }) => {
  const target = page.getByRole('textbox', { name: 'Target selector', exact: true })
  await page.getByRole('button', { name: 'Pick element' }).click()
  await page.locator('[data-tour="new-project"]').click()
  await expect(target).toHaveValue('[data-tour="new-project"]')
  await expect(page.getByRole('dialog', { name: 'A new beginning.' })).not.toBeVisible()
  await page.getByRole('button', { name: 'Undo change' }).click()
  await expect(target).toHaveValue('[data-tour="workspace-overview"]')
  await page.getByRole('button', { name: 'Redo change' }).click()
  await expect(target).toHaveValue('[data-tour="new-project"]')
  await expect(page.getByText('Saved on this browser', { exact: true })).toBeVisible()
  await page.reload()
  await expect(target).toHaveValue('[data-tour="new-project"]')
  await expect(page.getByRole('status').filter({ hasText: 'Restored your local draft.' })).toBeVisible()
})

test('previews a real interactive task through an input and app state change', async ({ page }) => {
  await page.getByRole('button', { name: '▶ Preview', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Room for your next idea', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Make something happen', exact: true })).toBeVisible()
  await page.locator('[data-tour="new-project"]').click()
  await expect(page.getByRole('dialog', { name: 'Start with a name', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('A real browser project')
  await page.getByRole('textbox', { name: 'Project name', exact: true }).press('ArrowLeft')
  await expect(page.getByRole('dialog', { name: 'Start with a name', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Your idea has a home', exact: true })).toBeVisible()
  await page.locator('[data-tour="create-project"]').click()
  await expect(page.getByRole('button', { name: '▶ Preview', exact: true })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Created A real browser project.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /A real browser project A space/ })).toBeVisible()
})

test('rejects bad JSON and duplicate IDs without corrupting the document', async ({ page }) => {
  await page.getByText('Routes & developer hooks', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Step ID', exact: true }).fill('create-project')
  await expect(page.locator('.tls-error[role=alert]')).toContainText('Step IDs must be unique')
  await expect(page.getByRole('textbox', { name: 'Step ID', exact: true })).toHaveValue('welcome')
  await page.getByRole('button', { name: 'Dismiss error' }).click()
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  await page.getByRole('textbox', { name: 'Tour JSON', exact: true }).fill('{"broken":true}')
  await page.getByRole('button', { name: 'Apply JSON', exact: true }).click()
  await expect(page.locator('.tls-error[role=alert]')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Guide name', exact: true })).toHaveValue('A good place to start')
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Tour JSON', exact: true })).toHaveValue('{"broken":true}')
})

test('distinguishes current target health and does not treat editor controls as app targets', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Target selector', exact: true }).fill('.tls-primary')
  await page.getByRole('button', { name: '◎ Inspect targets', exact: true }).click()
  await expect(page.locator('.tls-check-card').filter({ hasText: 'Room for your next idea' })).toContainText('missing')
  await expect(page.locator('.tls-check-card').filter({ hasText: 'Make something happen' })).toContainText('ready')
  await expect(page.locator('.tls-check-card').filter({ hasText: 'Start with a name' })).toContainText('missing')
})

test('is usable at a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: '▶ Preview', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Mobile edits work')
  await expect(page.getByRole('button', { name: '01 Mobile edits work Spotlight' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('preserves an unsupported saved draft and labels invalid unsaved edits honestly', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tourlight-studio-demo-v1', '{"schemaVersion":999,"important":"recover me"}'))
  await page.reload()
  await expect(page.locator('.tls-error')).toContainText('has been preserved')
  await page.waitForTimeout(500) // Exceed the autosave debounce to detect accidental overwrite.
  expect(await page.evaluate(() => localStorage.getItem('tourlight-studio-demo-v1'))).toBe('{"schemaVersion":999,"important":"recover me"}')
  await page.getByRole('textbox', { name: 'Guide name', exact: true }).fill('A replacement draft')
  await expect(page.getByText('Saved on this browser', { exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Guide name', exact: true }).fill('')
  await expect(page.getByText('Unsaved · invalid draft', { exact: true })).toBeVisible()
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('tourlight-studio-demo-v1')) ?? '{}').name).toBe('A replacement draft')
})
