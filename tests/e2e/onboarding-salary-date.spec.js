import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('Step 2 shows the four preset date chips and a custom dropdown', async ({ page }) => {
  await page.goto('/#/onboarding/wizard');
  await page.fill('#input-name', 'Test');
  await page.locator('#btn-next').click();

  await expect(page.locator('.day-picker__chip[data-day="1"]')).toBeVisible();
  await expect(page.locator('.day-picker__chip[data-day="7"]')).toBeVisible();
  await expect(page.locator('.day-picker__chip[data-day="25"]')).toBeVisible();
  await expect(page.locator('.day-picker__chip[data-day="30"]')).toBeVisible();
  await expect(page.locator('#day-picker-select')).toBeVisible();
});

test('selecting "30th" chip updates the preview text', async ({ page }) => {
  await page.goto('/#/onboarding/wizard');
  await page.fill('#input-name', 'Test');
  await page.locator('#btn-next').click();
  await page.fill('#input-salary', '50000');

  await page.locator('.day-picker__chip[data-day="30"]').click();
  await expect(page.locator('#preview-date')).toContainText(/30th of every month/i);
});

test('picking a day from the custom dropdown updates the preview', async ({ page }) => {
  await page.goto('/#/onboarding/wizard');
  await page.fill('#input-name', 'Test');
  await page.locator('#btn-next').click();
  await page.fill('#input-salary', '50000');

  await page.locator('#day-picker-select').selectOption('15');
  await expect(page.locator('#preview-date')).toContainText(/15th of every month/i);
});
