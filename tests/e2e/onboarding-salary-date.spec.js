import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('Step 2 offers 29/30/31 and "Last day" chips beyond the original 1-28 set', async ({ page }) => {
  await page.goto('/#/onboarding/wizard');
  await page.fill('#input-name', 'Test');
  await page.locator('#btn-next').click();

  // 30th and 31st chips render
  await expect(page.locator('.day-picker__chip[data-day="30"]')).toBeVisible();
  await expect(page.locator('.day-picker__chip[data-day="31"]')).toBeVisible();

  // "Last day" sentinel chip exists with the dedicated testid
  const lastDay = page.getByTestId('payday-last');
  await expect(lastDay).toBeVisible();
  await expect(lastDay).toContainText(/Last day/i);
});

test('selecting "Last day" updates the preview text', async ({ page }) => {
  await page.goto('/#/onboarding/wizard');
  await page.fill('#input-name', 'Test');
  await page.locator('#btn-next').click();
  await page.fill('#input-salary', '50000');

  await page.getByTestId('payday-last').click();
  await expect(page.locator('#preview-date')).toContainText(/Last day of every month/i);
});
