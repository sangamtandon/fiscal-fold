import { describe, it, expect } from 'vitest';
import {
  monthKeyOf,
  formatMonthLabel,
  computeMonthTotals,
  groupByMonth,
} from '../../src/utils/txn-grouping.js';

// Tiny fixture builders — keep tests local & readable.
const t = (overrides = {}) => ({
  id: `t-${Math.random()}`,
  cycleId: 'c-1',
  bucketId: 'b-want-1',
  amount: 100,
  type: 'expense',
  note: '',
  borrowedFrom: null,
  borrowedAmount: 0,
  timestamp: '2026-05-10T10:00:00Z',
  ...overrides,
});

const BUCKETS = {
  'b-need-1': { id: 'b-need-1', macroType: 'needs', name: 'Groceries' },
  'b-want-1': { id: 'b-want-1', macroType: 'wants', name: 'Dining' },
  'b-fut-1':  { id: 'b-fut-1',  macroType: 'future', name: 'Emergency' },
};
const getBucket = id => BUCKETS[id];

describe('monthKeyOf', () => {
  it('formats as YYYY-MM with zero-padded month', () => {
    expect(monthKeyOf('2026-05-10T10:00:00')).toBe('2026-05');
    expect(monthKeyOf('2026-01-01T00:00:00')).toBe('2026-01');
    expect(monthKeyOf('2026-12-31T23:00:00')).toBe('2026-12');
  });
});

describe('formatMonthLabel', () => {
  it('renders human-readable "Month Year" label', () => {
    expect(formatMonthLabel('2026-05')).toMatch(/May 2026/);
    expect(formatMonthLabel('2026-01')).toMatch(/January 2026/);
    expect(formatMonthLabel('2025-12')).toMatch(/December 2025/);
  });
});

describe('computeMonthTotals', () => {
  it('sums expenses by macro and computes netSpent', () => {
    const txns = [
      t({ bucketId: 'b-need-1', amount: 8000 }),
      t({ bucketId: 'b-want-1', amount: 4000 }),
      t({ bucketId: 'b-fut-1', amount: 1000 }),
    ];
    const totals = computeMonthTotals(txns, getBucket);

    expect(totals.spent).toBe(13000);
    expect(totals.income).toBe(0);
    expect(totals.netSpent).toBe(13000);
    expect(totals.macros).toEqual({ needs: 8000, wants: 4000, future: 1000 });
  });

  it('treats refunds and income as reductions to netSpent', () => {
    const txns = [
      t({ bucketId: 'b-want-1', amount: 5000 }),
      t({ bucketId: 'b-want-1', amount: 1000, type: 'refund' }),
      t({ bucketId: 'b-want-1', amount: 2000, type: 'income' }),
    ];
    const totals = computeMonthTotals(txns, getBucket);

    expect(totals.spent).toBe(5000);
    expect(totals.income).toBe(3000);
    expect(totals.netSpent).toBe(2000);
    // Macros only count expenses, not refunds/income
    expect(totals.macros.wants).toBe(5000);
  });

  it('clamps netSpent to 0 when refunds exceed expenses', () => {
    const txns = [
      t({ bucketId: 'b-want-1', amount: 100 }),
      t({ bucketId: 'b-want-1', amount: 500, type: 'refund' }),
    ];
    const totals = computeMonthTotals(txns, getBucket);
    expect(totals.netSpent).toBe(0);
  });

  it('ignores txns whose bucket no longer exists', () => {
    const txns = [
      t({ bucketId: 'deleted-bucket', amount: 500 }),
      t({ bucketId: 'b-want-1', amount: 200 }),
    ];
    const totals = computeMonthTotals(txns, getBucket);
    // The spend total still counts, but the macro breakdown skips orphans
    expect(totals.spent).toBe(700);
    expect(totals.macros).toEqual({ needs: 0, wants: 200, future: 0 });
  });
});

describe('groupByMonth', () => {
  it('returns groups newest-first', () => {
    const txns = [
      t({ id: 'a', timestamp: '2026-03-15T00:00:00' }),
      t({ id: 'b', timestamp: '2026-05-10T00:00:00' }),
      t({ id: 'c', timestamp: '2026-04-20T00:00:00' }),
    ];
    const groups = groupByMonth(txns, getBucket, new Date('2026-05-16T00:00:00'));

    expect(groups.map(g => g.monthKey)).toEqual(['2026-05', '2026-04', '2026-03']);
  });

  it('flags the current month as isCurrent', () => {
    const txns = [
      t({ timestamp: '2026-05-10T00:00:00' }),
      t({ timestamp: '2026-04-10T00:00:00' }),
    ];
    const groups = groupByMonth(txns, getBucket, new Date('2026-05-16T00:00:00'));

    expect(groups.find(g => g.monthKey === '2026-05').isCurrent).toBe(true);
    expect(groups.find(g => g.monthKey === '2026-04').isCurrent).toBe(false);
  });

  it('sorts transactions within each month newest-first', () => {
    const txns = [
      t({ id: 'early', timestamp: '2026-05-01T00:00:00' }),
      t({ id: 'late',  timestamp: '2026-05-20T00:00:00' }),
      t({ id: 'mid',   timestamp: '2026-05-10T00:00:00' }),
    ];
    const [may] = groupByMonth(txns, getBucket, new Date('2026-06-01T00:00:00'));
    expect(may.txns.map(x => x.id)).toEqual(['late', 'mid', 'early']);
  });

  it('places each txn in exactly one month — no double counting across cycles', () => {
    // A pay-period cycle that spans April → May. Each txn lands in its own
    // calendar month based on its own timestamp, regardless of cycleId.
    const txns = [
      t({ id: 'apr', cycleId: 'cycle-A', timestamp: '2026-04-28T00:00:00', amount: 500 }),
      t({ id: 'may', cycleId: 'cycle-A', timestamp: '2026-05-02T00:00:00', amount: 700 }),
    ];
    const groups = groupByMonth(txns, getBucket, new Date('2026-05-16T00:00:00'));

    expect(groups).toHaveLength(2);
    expect(groups.find(g => g.monthKey === '2026-04').txns).toHaveLength(1);
    expect(groups.find(g => g.monthKey === '2026-05').txns).toHaveLength(1);
    expect(groups.find(g => g.monthKey === '2026-04').totals.spent).toBe(500);
    expect(groups.find(g => g.monthKey === '2026-05').totals.spent).toBe(700);
  });

  it('returns an empty array for no transactions', () => {
    expect(groupByMonth([], getBucket)).toEqual([]);
  });
});
