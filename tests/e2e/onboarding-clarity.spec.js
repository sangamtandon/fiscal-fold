import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function stepThroughToStep3(page) {
  await page.goto('/#/onboarding/wizard');
  await page.fill('#input-name', 'Test');
  await page.locator('#btn-next').click();
  await page.fill('#input-salary', '100000');
  await page.locator('#btn-next').click();
}

test('Step 3 defines Needs / Wants / Future before asking the user to allocate', async ({ page }) => {
  await stepThroughToStep3(page);

  const defs = page.getByTestId('macro-defs');
  await expect(defs).toBeVisible();
  await expect(defs).toContainText(/Needs/);
  await expect(defs).toContainText(/Wants/);
  await expect(defs).toContainText(/Future/);
  // The definitions should mention concrete examples, not just the labels
  await expect(defs).toContainText(/rent|groceries|bills/i);
  await expect(defs).toContainText(/dining|shopping|subscriptions|fun/i);
  await expect(defs).toContainText(/savings|investments|emergency/i);
});

test('Step 3 mentions the carry-forward behaviour up front', async ({ page }) => {
  await stepThroughToStep3(page);

  const carry = page.getByTestId('carry-note');
  await expect(carry).toBeVisible();
  await expect(carry).toContainText(/Unspent Wants/i);
  await expect(carry).toContainText(/Future/);
});

test('Step 4 uses "bucket" terminology and shows pin/recurring legend after selection', async ({ page }) => {
  await stepThroughToStep3(page);
  await page.locator('#btn-next').click();

  // Title should use the word "bucket"
  await expect(page.locator('.onboarding__title')).toContainText(/bucket/i);

  // Before any chip is selected, legend is hidden
  await expect(page.locator('.onboarding__bucket-legend').first()).not.toBeVisible();

  // Select a chip — legend should appear with dashboard and monthly hints
  await page.locator('.onboarding__template-chip').first().click();
  await expect(page.locator('.onboarding__bucket-legend').first()).toBeVisible();
  await expect(page.locator('.onboarding__bucket-legend').first()).toContainText(/dashboard/i);
  await expect(page.locator('.onboarding__bucket-legend').first()).toContainText(/monthly/i);
});
