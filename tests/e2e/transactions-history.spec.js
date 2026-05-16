import { test, expect } from '@playwright/test';
import { buildSeedState } from './helpers/seed.js';

/**
 * Seed state with three cycles (Mar, Apr, May) — the May one active —
 * and one transaction per cycle. This mirrors how a real user accumulates
 * cross-month history: each past transaction sits in its own past cycle.
 */
async function seedMultiMonth(page) {
  const base = buildSeedState();
  const activeCycle = base.cycles[0]; // May 2026, active
  const wantsBucketId = 'b-want-1';

  const marchCycleId = 'cycle-march';
  const aprilCycleId = 'cycle-april';

  base.cycles = [
    {
      id: marchCycleId,
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      salary: 100000,
      allocations: { needs: 50000, wants: 30000, future: 20000 },
      isActive: false,
      sweepAmount: 0,
      createdAt: '2026-03-01T00:00:00Z',
    },
    {
      id: aprilCycleId,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      salary: 100000,
      allocations: { needs: 50000, wants: 30000, future: 20000 },
      isActive: false,
      sweepAmount: 0,
      createdAt: '2026-04-01T00:00:00Z',
    },
    activeCycle,
  ];

  // Buckets stay in the active (May) cycle — past-cycle buckets aren't needed
  // because the History view only renders transactions; bucket lookup is by id.

  base.transactions = [
    { id: 'tm-1', cycleId: marchCycleId, bucketId: wantsBucketId, amount: 1200, type: 'expense', note: 'March coffee', borrowedFrom: null, borrowedAmount: 0, timestamp: '2026-03-12T10:00:00Z' },
    { id: 'tm-2', cycleId: aprilCycleId, bucketId: wantsBucketId, amount: 800,  type: 'expense', note: 'April lunch',  borrowedFrom: null, borrowedAmount: 0, timestamp: '2026-04-08T10:00:00Z' },
    { id: 'tm-3', cycleId: activeCycle.id, bucketId: wantsBucketId, amount: 500, type: 'expense', note: 'May coffee', borrowedFrom: null, borrowedAmount: 0, timestamp: '2026-05-04T10:00:00Z' },
  ];

  await page.addInitScript(s => {
    localStorage.setItem('fiscal-fold-state', JSON.stringify(s));
  }, base);
}

test('dashboard hero shows "days to payday" copy (not "cycle")', async ({ page }) => {
  const base = buildSeedState();
  await page.addInitScript(s => {
    localStorage.setItem('fiscal-fold-state', JSON.stringify(s));
  }, base);

  await page.goto('/#/dashboard');
  const hero = page.getByTestId('safe-to-spend').locator('xpath=ancestor::div[contains(@class,"card")]');
  await expect(hero).toContainText(/days? to payday/);
  await expect(hero).not.toContainText(/days? left in cycle/);
});

test('Transactions page: Current tab is default and shows only this pay period', async ({ page }) => {
  await seedMultiMonth(page);
  await page.goto('/#/transactions');

  // Current tab is active by default
  const currentTab = page.getByTestId('txn-view-tab-current');
  await expect(currentTab).toHaveAttribute('aria-selected', 'true');

  // The active cycle covers May; only the May transaction is in scope
  await expect(page.locator('.txn-row')).toHaveCount(1);
  await expect(page.locator('.txn-row')).toContainText('Dining');
});

test('Transactions page: History tab groups all transactions by calendar month', async ({ page }) => {
  await seedMultiMonth(page);
  await page.goto('/#/transactions');

  await page.getByTestId('txn-view-tab-history').click();
  await expect(page.getByTestId('txn-view-tab-history')).toHaveAttribute('aria-selected', 'true');

  // Three months should render, newest first
  const monthSections = page.getByTestId('txn-month-section');
  await expect(monthSections).toHaveCount(3);
  await expect(monthSections.nth(0)).toContainText('May 2026');
  await expect(monthSections.nth(1)).toContainText('April 2026');
  await expect(monthSections.nth(2)).toContainText('March 2026');

  // All three transactions show up across the month sections
  await expect(page.locator('.txn-row')).toHaveCount(3);
});

test('Transactions page: macro filter narrows the History view', async ({ page }) => {
  await seedMultiMonth(page);
  await page.goto('/#/transactions');

  await page.getByTestId('txn-view-tab-history').click();
  await expect(page.locator('.txn-row')).toHaveCount(3);

  // Filter by Needs — the seeded multi-month txns are all wants, so list empties
  await page.locator('.txn-filter-tab', { hasText: 'Needs' }).click();
  await expect(page.locator('.txn-row')).toHaveCount(0);

  // Switch to Wants — all three reappear
  await page.locator('.txn-filter-tab', { hasText: 'Wants' }).click();
  await expect(page.locator('.txn-row')).toHaveCount(3);
});

test('Transactions page: search in History matches across all months', async ({ page }) => {
  await seedMultiMonth(page);
  await page.goto('/#/transactions');

  await page.getByTestId('txn-view-tab-history').click();

  await page.locator('#txn-search').fill('coffee');
  // Two txns mention "coffee" (March and May) — April lunch is filtered out
  await expect(page.locator('.txn-row')).toHaveCount(2);
});
