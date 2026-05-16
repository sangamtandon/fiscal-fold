import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('landing page leads with the outcome and is unambiguous about local-only storage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/#\/onboarding$/);

  const tagline = page.getByTestId('landing-tagline');
  await expect(tagline).toBeVisible();
  // The previous version led with the jargon "Smart envelope budgeting"
  await expect(tagline).not.toContainText(/envelope budgeting/i);
  await expect(tagline).toContainText(/safe to spend/i);

  const privacy = page.getByTestId('landing-privacy');
  await expect(privacy).toBeVisible();
  // The privacy line should not promise sync (which contradicts "data stays on device").
  // The phrase "no cloud sync" is fine — it explicitly denies sync.
  await expect(privacy).not.toContainText(/will sync|cloud backup|cloud storage/i);
  await expect(privacy).toContainText(/no account/i);
  await expect(privacy).toContainText(/no cloud sync/i);
});

test('primary CTA is clear about setup, not a generic "Get Started"', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /set up my budget/i })).toBeVisible();
});
