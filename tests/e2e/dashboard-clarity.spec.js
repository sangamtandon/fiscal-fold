import { test, expect } from '@playwright/test';
import { seedState } from './helpers/seed.js';

test('Safe to Spend hero clarifies the Wants-only scope inline, not as a footnote', async ({ page }) => {
  await seedState(page);
  await page.goto('/#/dashboard');

  // The Wants framing is part of the visible label, not a tiny aside
  await expect(page.locator('.safe-to-spend-card__label')).toContainText(/Wants budget/i);

  const hint = page.getByTestId('safe-to-spend-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(/Needs/i);
  await expect(hint).toContainText(/Future/i);
});

test('payday CTA uses plain "roll over" language, not "Sweep" jargon', async ({ page }) => {
  await seedState(page, { expired: true });
  await page.goto('/#/payday');

  const cta = page.getByTestId('pd-confirm');
  await expect(cta).toBeVisible();
  await expect(cta).toContainText(/roll over/i);
  await expect(cta).not.toContainText(/Sweep & Start/i);
});

test('payday page explicitly states what happens to unspent Needs', async ({ page }) => {
  await seedState(page, { expired: true });
  await page.goto('/#/payday');

  // The carry-forward block should mention Needs explicitly so users don't wonder
  const hint = page.locator('.pd-section__hint').first();
  await expect(hint).toContainText(/Needs/i);
});
