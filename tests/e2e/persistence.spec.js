import { test, expect } from '@playwright/test';
import { seedState } from './helpers/seed.js';

test('seeded state survives a reload', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/dashboard');
  await expect(page.getByTestId('safe-to-spend')).toContainText('₹');

  await page.reload();
  await expect(page).toHaveURL(/#\/dashboard$/);
  await expect(page.getByTestId('safe-to-spend')).toContainText('19,000');
});

test('no state in storage routes to onboarding', async ({ page }) => {
  // No addInitScript — start fully fresh
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await expect(page).toHaveURL(/#\/onboarding$/);
});
