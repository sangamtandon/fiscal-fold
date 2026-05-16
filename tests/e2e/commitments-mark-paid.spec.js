import { test, expect } from '@playwright/test';
import { buildSeedState } from './helpers/seed.js';

test('marking a commitment paid logs a transaction to a chosen bucket', async ({ page }) => {
  const state = buildSeedState();
  state.commitments = [{
    id: 'cm-1',
    name: 'Netflix',
    emoji: '🎬',
    amount: 800,
    dueDate: 5,
    macroType: 'wants',
    isActive: true,
    isPaid: false,
    createdAt: '2026-05-01T00:00:00Z',
  }];
  await page.addInitScript(s => {
    localStorage.setItem('fiscal-fold-state', JSON.stringify(s));
  }, state);

  await page.goto('/#/commitments');
  // Click the mark-paid checkbox for Netflix
  await page.locator('[data-cm-paid="cm-1"]').click();

  // Bucket picker drawer opens
  const drawer = page.getByTestId('cm-mark-paid-drawer');
  await expect(drawer).toBeVisible();

  // Pick the Dining bucket (a Wants bucket from the seed)
  await drawer.locator('[data-mp-bucket]', { hasText: 'Dining' }).click();

  // After marking paid: commitment row shows the Paid badge
  await expect(page.locator('.cm-row', { hasText: 'Netflix' })).toContainText(/Paid/i);

  // And the transaction is recorded
  await page.goto('/#/transactions');
  const row = page.locator('.txn-row', { hasText: 'Dining' });
  // The seed has a pre-existing 4,000 Dining transaction + this 800 commitment one
  await expect(row).toHaveCount(2);
  await expect(page.locator('.txn-row', { hasText: 'Commitment: Netflix' })).toBeVisible();
});

test('commitments subtitle explains the mechanism, not just the concept', async ({ page }) => {
  await page.goto('/#/commitments');
  await expect(page.locator('.cm-subtitle')).toContainText(/set aside|reserved/i);
  await expect(page.locator('.cm-subtitle')).toContainText(/mark paid|record/i);
});
