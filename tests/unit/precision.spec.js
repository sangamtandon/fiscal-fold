// These tests PIN current float-rounding behavior.
// If you refactor money math (e.g. to integer paise), expect these to fail —
// update them deliberately. Every Math.round site in src/ should leave a
// fingerprint here so the drift is visible at review time.

import { describe, it, expect } from 'vitest';
import { PRESETS } from '../../src/data/models.js';
import { percent, formatCurrency } from '../../src/utils/helpers.js';
import { freshStore } from '../helpers/freshStore.js';
import { bootstrapStore } from '../helpers/builders.js';

// Mirrors src/pages/payday.js:55-57
function splitSalary(salary, ratios) {
  const baseNeeds = Math.round((salary * ratios.needs) / 100);
  const baseWants = Math.round((salary * ratios.wants) / 100);
  const baseFuture = salary - baseNeeds - baseWants;
  return { baseNeeds, baseWants, baseFuture };
}

describe('allocation rounding — drift lands in Future', () => {
  it('salary=33333, balanced (50/30/20)', () => {
    const out = splitSalary(33333, PRESETS.balanced);
    // round(16666.5) → 16667, round(9999.9) → 10000, remainder → 6666
    expect(out.baseNeeds).toBe(16667);
    expect(out.baseWants).toBe(10000);
    expect(out.baseFuture).toBe(6666);
    expect(out.baseNeeds + out.baseWants + out.baseFuture).toBe(33333);
  });

  it('salary=100001, aggressive (40/20/40) absorbs +1 into Future', () => {
    const out = splitSalary(100001, PRESETS.aggressive);
    expect(out.baseNeeds).toBe(40000);
    expect(out.baseWants).toBe(20000);
    expect(out.baseFuture).toBe(40001);
  });

  it('salary=99999, conservative (60/25/15)', () => {
    const out = splitSalary(99999, PRESETS.conservative);
    // round(59999.4) → 59999, round(24999.75) → 25000, remainder → 15000
    expect(out.baseNeeds).toBe(59999);
    expect(out.baseWants).toBe(25000);
    expect(out.baseFuture).toBe(15000);
  });
});

describe('cumulative refund float drift', () => {
  it('1000 expense minus three 333.33 refunds does NOT land on 0', async () => {
    const { store, buckets } = await bootstrapStore(freshStore, {
      buckets: [{ macroType: 'wants', name: 'X', emoji: '🧪', allocated: 5000 }],
    });
    const b = buckets[0];
    store.addTransaction({ bucketId: b.id, amount: 1000 });
    store.addTransaction({ bucketId: b.id, amount: 333.33, type: 'refund' });
    store.addTransaction({ bucketId: b.id, amount: 333.33, type: 'refund' });
    store.addTransaction({ bucketId: b.id, amount: 333.33, type: 'refund' });
    // Float drift: 1000 → 666.67 → 333.34 → 0.0100000000000016
    const spent = store.getBucketById(b.id).spent;
    expect(spent).not.toBe(0);
    expect(spent).toBeCloseTo(0.01, 10);
  });
});

describe('percent lossy rounding', () => {
  it('percent(1, 3) === 33 (drops 0.333...)', () => {
    expect(percent(1, 3)).toBe(33);
  });

  it('percent(2, 3) === 67 (rounds up 0.666...)', () => {
    expect(percent(2, 3)).toBe(67);
  });
});

describe('formatCurrency Intl behavior pin', () => {
  it('rounds half-up at half-rupee on Node 20+ ICU', () => {
    // Node 20 ICU produces "₹1,235" for 1234.5. If this changes, investigate ICU upgrade.
    expect(formatCurrency(1234.5)).toBe('₹1,235');
  });
});

describe('bucket copy proportional rounding (copyBucketsToNewCycle)', () => {
  it('largest-remainder correction makes sums match newTotal exactly', async () => {
    const { store, cycle } = await bootstrapStore(freshStore, {
      buckets: [
        { macroType: 'wants', name: 'A', emoji: '🧪', allocated: 333 },
        { macroType: 'wants', name: 'B', emoji: '🧪', allocated: 333 },
        { macroType: 'wants', name: 'C', emoji: '🧪', allocated: 334 },
      ],
    });
    // Old wants total = 1000. New total = 1001 — proportional shares round, last bucket absorbs.
    const newCycle = store.createCycle({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      salary: 1001,
      allocations: { needs: 0, wants: 1001, future: 0 },
    });
    store.copyBucketsToNewCycle(cycle.id, newCycle.id, { needs: 0, wants: 1001, future: 0 });
    const wants = store.getBuckets('wants');
    expect(wants.reduce((s, b) => s + b.allocated, 0)).toBe(1001);
  });
});
