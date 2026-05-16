import { test, expect } from '@playwright/test';
import { seedState } from './helpers/seed.js';

test('FAB → log an expense → spent + safe-to-spend update by the exact amount', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/dashboard');

  // Wait for the count-up animation to settle on the seeded value.
  // Seeded Wants: alloc 25000, spent 6000 → STS = 19000
  const sts = page.getByTestId('safe-to-spend');
  await expect(sts).toContainText('19,000');

  // Open transaction modal via FAB
  await page.getByTestId('fab-add').click();

  // Step 1: enter ₹500 via the quick-amount chip
  await page.locator('.txn-quick-btn', { hasText: '₹500' }).click();
  await page.locator('#txn-next').click();

  // Step 2: pick the Dining bucket (a wants bucket from the seed)
  await page.locator('.txn-bucket-row', { hasText: 'Dining' }).first().click();

  // Step 3: confirm
  await page.locator('#txn-confirm').click();

  // After modal closes & dashboard rerenders: STS should drop from 19000 → 18500
  await expect(sts).toContainText('18,500');
});
