import { test, expect } from '@playwright/test';
import { seedState } from './helpers/seed.js';

test('Settings shows a How-it-works section with definitions', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/settings');

  const help = page.getByTestId('settings-help');
  await expect(help).toBeVisible();
  await expect(help).toContainText(/Needs/);
  await expect(help).toContainText(/Wants/);
  await expect(help).toContainText(/Future/);
  await expect(help).toContainText(/Buckets/i);
  await expect(help).toContainText(/Cycle/i);
  await expect(help).toContainText(/Quick Buckets/i);
  await expect(help).toContainText(/Commitments/i);
});

test('Danger Zone is visibly labeled, not hidden tertiary text', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/settings');

  const danger = page.getByTestId('settings-danger-zone');
  await expect(danger).toBeVisible();
  await expect(danger).toContainText(/Danger Zone/i);
  await expect(danger).toContainText(/permanent|cannot be undone/i);
});

test('Backup section uses non-jargon labels', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/settings');

  // No raw "JSON" in the button label — say "backup" instead
  await expect(page.locator('#btn-export-json')).toContainText(/backup/i);
  await expect(page.locator('#btn-export-csv')).toContainText(/Download transactions/i);
});

test('Settings exposes the new salary-date chips (Last day)', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/settings');

  await page.locator('[data-edit="salaryDate"]').click();
  await expect(page.getByTestId('payday-last-settings')).toBeVisible();
  await expect(page.locator('.day-picker__chip[data-day="30"]')).toBeVisible();
  await expect(page.locator('.day-picker__chip[data-day="31"]')).toBeVisible();
});
