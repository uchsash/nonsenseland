import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('homepage loads in Bangla', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/ননসেন্সল্যান্ড/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('reader settings are remembered', async ({ page }) => {
    await page.goto('http://localhost:3000/books/sample-book/read/1')
    await page.getByRole('button', { name: 'পড়ার সেটিংস' }).click()
    await page.getByRole('button', { name: 'সেপিয়া' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-reader', 'sepia')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-reader', 'sepia')
  })
})
