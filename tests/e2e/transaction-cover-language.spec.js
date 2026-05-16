import { test, expect } from '@playwright/test';
import { seedState } from './helpers/seed.js';

test('trade-off flow uses "cover" language, not "borrow"', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/dashboard');

  await page.getByTestId('fab-add').click();

  // Enter an amount larger than any single bucket — Dining is 15k allocated / 4k spent → 11k remaining.
  // Typing 12000 forces the trade-off step.
  for (const digit of '12000') {
    await page.locator(`.txn-key[data-key="${digit}"]`).click();
  }
  await page.locator('#txn-next').click();

  // Pick Dining as the target — it's short
  await page.locator('.txn-bucket-row', { hasText: 'Dining' }).first().click();

  // We should now be on the Over Budget step
  await expect(page.locator('.txn-tradeoff-alert')).toBeVisible();
  // "Cover" replaces the misleading "Borrow" language
  await expect(page.locator('.txn-tradeoff-alert')).toContainText(/Cover/i);
  await expect(page.locator('.txn-tradeoff-alert')).not.toContainText(/Borrow/i);
  // The alert should also flag that this isn't a loan
  await expect(page.locator('.txn-tradeoff-alert')).toContainText(/no payback|moves money permanently/i);

  await expect(page.locator('.txn-subtitle')).toContainText(/Cover/i);
});

test('FAB modal exposes a shortcut to log income', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/dashboard');
  await page.getByTestId('fab-add').click();

  const incomeLink = page.getByTestId('txn-income-link');
  await expect(incomeLink).toBeVisible();
  await incomeLink.click();

  // The income drawer should open
  await expect(page.locator('.income-drawer__title')).toContainText(/Add Income/i);
});

test('empty buckets are still tappable and route into the trade-off flow', async ({ page }) => {
  // Spend the Dining bucket dry so it has 0 remaining
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('fiscal-fold-state') || 'null');
  });
  await seedState(page);
  // Seed already has Dining at 15000/4000, drain it to 0
  await page.goto('/#/dashboard');
  await page.getByTestId('fab-add').click();
  for (const digit of '11000') {
    await page.locator(`.txn-key[data-key="${digit}"]`).click();
  }
  await page.locator('#txn-next').click();
  await page.locator('.txn-bucket-row', { hasText: 'Dining' }).first().click();
  await page.locator('#txn-confirm').click();

  // Dining now has 0 remaining. Open the modal again and try to spend on it.
  await page.getByTestId('fab-add').click();
  for (const digit of '100') {
    await page.locator(`.txn-key[data-key="${digit}"]`).click();
  }
  await page.locator('#txn-next').click();

  const diningRow = page.locator('.txn-bucket-row', { hasText: 'Dining' }).first();
  // No longer disabled — should still be tappable and route to trade-off
  await expect(diningRow).not.toHaveAttribute('disabled', '');
  await diningRow.click();
  await expect(page.locator('.txn-tradeoff-alert')).toBeVisible();
});
