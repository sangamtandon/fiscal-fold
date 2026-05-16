import { test, expect } from '@playwright/test';
import { seedState } from './helpers/seed.js';

test('users can delete a transaction from history; the bucket budget is restored', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/dashboard');

  // Sanity: seeded Wants STS = 19,000 (alloc 25k − spent 6k)
  await expect(page.getByTestId('safe-to-spend')).toContainText('19,000');

  await page.goto('/#/transactions');
  await expect(page.locator('.txn-row')).toHaveCount(3);

  // Auto-accept the confirm() dialog
  page.once('dialog', async d => { await d.accept(); });

  // Delete the Dining transaction (₹4,000)
  await page.locator('.txn-row', { hasText: 'Dining' }).locator('[data-delete-txn]').click({ force: true });

  // Row gone
  await expect(page.locator('.txn-row', { hasText: 'Dining' })).toHaveCount(0);

  // Back on dashboard, Safe to Spend recovers by 4,000 → 23,000
  await page.goto('/#/dashboard');
  await expect(page.getByTestId('safe-to-spend')).toContainText('23,000');
});
