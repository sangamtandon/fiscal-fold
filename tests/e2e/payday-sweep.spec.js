import { test, expect } from '@playwright/test';
import { seedState } from './helpers/seed.js';

test('expired cycle → payday banner → sweep flow runs', async ({ page }) => {
  await seedState(page, { expired: true });
  await page.goto('/#/dashboard');

  // Payday banner appears when the current cycle is expired
  const banner = page.getByTestId('payday-banner');
  await expect(banner).toBeVisible();

  await banner.click();
  await expect(page).toHaveURL(/#\/payday$/);

  // The CTA button exists on the payday page
  await expect(page.getByTestId('pd-confirm')).toBeVisible();
});
