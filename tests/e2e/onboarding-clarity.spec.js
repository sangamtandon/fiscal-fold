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

test('Step 4 explains what a bucket is and what pinning does', async ({ page }) => {
  await stepThroughToStep3(page);
  await page.locator('#btn-next').click();

  // The bucket subtitle should define the metaphor, not just instruct
  await expect(page.locator('.onboarding__subtitle')).toContainText(/envelope|category/i);

  const tip = page.getByTestId('bucket-tip');
  await expect(tip).toBeVisible();
  await expect(tip).toContainText(/Pin/i);
  await expect(tip).toContainText(/dashboard/i);
});
