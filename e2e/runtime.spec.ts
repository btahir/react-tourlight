import { expect, type Page, test } from '@playwright/test'

const pageErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  pageErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/lab')
  await expect(page.getByRole('heading', { name: 'Reliability you can exercise.' })).toBeVisible()
})

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), 'browser runtime errors').toEqual([])
})

test('inline registrations survive StrictMode and background rerenders, with one visible event per step', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start basic tour' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Your workspace')
  const before = await page.getByTestId('rerender-count').textContent()
  await expect(page.getByTestId('rerender-count')).not.toHaveText(before ?? '')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(dialog).toContainText('Your editor')
  await dialog.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(dialog).toContainText('Ready to ship')
  await dialog.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByTestId('viewed-events')).toHaveText('basic:0|basic:1|basic:2')
  await expect(page.getByTestId('completed-count')).toHaveText('Completed: 1')
})

test('persists the current step through a real page reload and restarts completed tours at zero', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start basic tour' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Your editor')
  await page.reload()
  await expect(page.getByRole('dialog')).toContainText('Your editor')
  await page.getByRole('dialog').getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Start basic tour' }).click()
  await expect(page.getByRole('dialog')).toContainText('Your workspace')
})

test('keyboard users can edit the real input and activate the real target', async ({ page }) => {
  await page.getByRole('button', { name: 'Start interactive tour' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Name your project')
  await dialog.getByRole('button', { name: 'Next', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Project name')).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toContainText('Name your project')
  await page.getByLabel('Project name').fill('Keyboard project')
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await dialog.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(dialog).toContainText('Save it for real')
  await dialog.getByRole('button', { name: 'Next', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Save project', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toContainText('Saved')
})

test('cancelling asynchronous setup does not resurrect the overlay', async ({ page }) => {
  await page.getByRole('button', { name: 'Start delayed tour' }).click()
  await expect(page.locator('.spotlight-loading')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('runtime-state')).toContainText('idle:')
  await expect(page.getByRole('button', { name: 'Asynchronous target' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.spotlight-overlay')).toHaveCount(0)
  await expect(page.getByTestId('viewed-events')).toBeEmpty()
})

test('delayed targets resolve and partial theme tokens merge with defaults', async ({ page }) => {
  await page.getByRole('button', { name: 'Start delayed tour' }).click()
  await expect(page.getByRole('dialog')).toContainText('Delayed target ready')
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(248, 250, 252)')
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }),
  ).toBeVisible()
})

test('route steps wait for the destination instead of binding to an old matching selector', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start route tour' }).click()
  await expect(page.locator('.spotlight-loading')).toBeVisible()
  await expect(page.getByTestId('viewed-events')).toBeEmpty()
  await expect(page).toHaveURL(/\/lab\/destination$/)
  await expect(page.getByRole('dialog')).toContainText('Destination confirmed')
  await expect(page.locator('#lab-route-target')).toHaveText('Destination route loaded')
  await expect(page.getByTestId('viewed-events')).toHaveText('route:0')
})

test('missing targets recover without generating a false viewed event', async ({ page }) => {
  await page.getByRole('button', { name: 'Start missing target tour' }).click()
  await expect(page.getByRole('dialog')).toContainText('Recovered')
  await expect(page.getByTestId('viewed-events')).toHaveText('missing:1')
})

test('headless mode handles inline definitions and real target events', async ({ page }) => {
  await page.getByRole('button', { name: 'Start headless', exact: true }).click()
  await expect(page.getByTestId('headless-state')).toHaveText('active:0:headless-target')
  await page.getByRole('button', { name: 'Headless action', exact: true }).click()
  await expect(page.getByTestId('headless-state')).toHaveText('active:1:headless-result')
  await page.getByRole('button', { name: 'Stop headless', exact: true }).click()
  await expect(page.getByTestId('headless-state')).toHaveText('idle:1:waiting')
})

test('restores focus after dismissal and excludes background controls during a modal step', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Start basic tour' })
  // WebKit intentionally does not focus buttons on pointer click; exercise the
  // keyboard user's actual focused trigger rather than assume click focus.
  await trigger.focus()
  await trigger.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Next', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(trigger).toBeEnabled()
})

test('spotlight follows position-only shifts and reacquires replaced targets without duplicate views', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start tracking tour' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Track the live target')
  const overlay = page.locator('.spotlight-overlay')
  const before = await overlay.evaluate((element) => getComputedStyle(element).clipPath)
  await page.getByRole('button', { name: 'Move anchor', exact: true }).click()
  await expect
    .poll(() => overlay.evaluate((element) => getComputedStyle(element).clipPath))
    .not.toBe(before)
  const targetBox = await page.locator('#lab-moving').boundingBox()
  expect(targetBox).not.toBeNull()
  // Read the second move command: the inner cutout begins 8px left of the target.
  await expect
    .poll(() =>
      overlay.evaluate((element) => {
        const moves = getComputedStyle(element).clipPath.match(/M\s+[-\d.]+\s+[-\d.]+/g)
        return Number(moves?.[1]?.split(/\s+/)[1])
      }),
    )
    .toBeCloseTo((targetBox?.x ?? 0) - 8, 0)
  await page.getByRole('button', { name: 'Replace anchor', exact: true }).click()
  await expect(page.locator('.spotlight-loading')).toBeVisible()
  await expect(page.locator('#lab-moving')).toHaveAttribute('data-generation', '1')
  await expect(dialog).toContainText('Track the live target')
  await expect(page.getByTestId('viewed-events')).toHaveText('tracking:0')
  await page.getByRole('button', { name: 'Move anchor', exact: true }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(overlay).toHaveCount(0)
})
