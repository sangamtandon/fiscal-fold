import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test('fresh load lands on onboarding, "Skip to demo" reaches dashboard with safe-to-spend rendered', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');

  // App boots to #/onboarding when no state exists
  await expect(page).toHaveURL(/#\/onboarding$/);

  await page.getByTestId('btn-skip-demo').click();

  await expect(page).toHaveURL(/#\/dashboard$/);

  // Safe-to-spend is rendered as currency, not NaN/empty
  const sts = page.getByTestId('safe-to-spend');
  await expect(sts).toBeVisible();
  await expect(sts).not.toContainText('NaN');
  await expect(sts).toContainText('₹');
});
