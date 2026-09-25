import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const route of ['/', '/studio', '/guidance']) {
  test(`${route} passes automated accessibility checks`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(route)
    await expect(page.locator('h1')).toBeVisible()
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.map((item) => ({ id: item.id, impact: item.impact, targets: item.nodes.map((node) => node.target) }))).toEqual([])
    expect(errors).toEqual([])
  })
}

test('checklist completion follows the real application outcome and launcher can replay', async ({ page }) => {
  await page.goto('/guidance')
  const checklist = page.locator('.tl-checklist')
  await expect(checklist.getByRole('progressbar')).toHaveAttribute('value', '0')
  await checklist.getByRole('button', { name: /Create your first project/ }).click()
  await page.getByRole('button', { name: 'Skip', exact: true }).click()
  await expect(checklist.getByRole('progressbar')).toHaveAttribute('value', '0')
  await checklist.getByRole('button', { name: /Create your first project/ }).click()
  await expect(page.getByRole('dialog', { name: 'Every project starts with a name' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Project name' }).fill('Shipped with confidence')
  await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Shipped with confidence')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.locator('[data-guide="create-project"]').click()
  await expect(page.getByRole('dialog', { name: 'A good beginning' })).toBeVisible()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(checklist.getByRole('progressbar')).toHaveAttribute('value', '1')
  await page.getByRole('searchbox', { name: 'Search guides' }).fill('weekly')
  const launcher = page.locator('.tl-launcher')
  await expect(launcher.getByRole('button', { name: /Create your first project/ })).toHaveCount(0)
  await launcher.getByRole('button', { name: /Set a weekly reminder/ }).click()
  await page.locator('[data-guide="reminder"] input').check()
  await expect(page.getByRole('dialog', { name: 'You’re all set' })).toBeVisible()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(checklist.getByRole('progressbar')).toHaveAttribute('value', '2')
})

test('agent discovery and document schema are readable over HTTP', async ({ request }) => {
  for (const path of ['/llms.txt', '/llms-full.txt', '/tourlight-skill.md', '/tour.schema.json']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    expect((await response.text()).length).toBeGreaterThan(300)
  }
  const schema = await (await request.get('/tour.schema.json')).json()
  expect(schema.properties.schemaVersion.const).toBe(1)
})
