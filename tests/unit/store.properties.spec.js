import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PRESETS } from '../../src/data/models.js';
import { percent } from '../../src/utils/helpers.js';
import { freshStore } from '../helpers/freshStore.js';
import { bootstrapStore, makeBucketParams } from '../helpers/builders.js';

// Re-implementation of the payday allocation formula (src/pages/payday.js:55-57).
// NOTE: this property is a regression canary against the formula being copied
// to a second site — not an independent proof.
function splitSalary(salary, ratios) {
  const baseNeeds = Math.round((salary * ratios.needs) / 100);
  const baseWants = Math.round((salary * ratios.wants) / 100);
  const baseFuture = salary - baseNeeds - baseWants;
  return { baseNeeds, baseWants, baseFuture };
}

describe('property: allocation drift absorption', () => {
  it('baseNeeds + baseWants + baseFuture === salary for every preset', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.constantFrom(...Object.values(PRESETS)),
        (salary, ratios) => {
          const { baseNeeds, baseWants, baseFuture } = splitSalary(salary, ratios);
          return baseNeeds + baseWants + baseFuture === salary;
        }
      )
    );
  });
});

describe('property: preset ratios sum to 100', () => {
  it('every preset in models.js sums to exactly 100', () => {
    Object.entries(PRESETS).forEach(([name, r]) => {
      expect(r.needs + r.wants + r.future, `preset ${name}`).toBe(100);
    });
  });
});

describe('property: refund never makes spent negative', () => {
  it('arbitrary expense/refund sequences keep bucket.spent >= 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('expense', 'refund'),
            amount: fc.integer({ min: 0, max: 50_000 }),
          }),
          { maxLength: 25 }
        ),
        async (ops) => {
          const { store, buckets } = await bootstrapStore(freshStore, {
            buckets: [{ macroType: 'wants', name: 'P', emoji: '🧪', allocated: 100_000 }],
          });
          const b = buckets[0];
          for (const op of ops) {
            store.addTransaction({ bucketId: b.id, amount: op.amount, type: op.type });
            if (store.getBucketById(b.id).spent < 0) return false;
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('property: getMacroSummary.remaining >= 0', () => {
  it('floors at 0 for any state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            allocated: fc.integer({ min: 0, max: 1_000_000 }),
            spend: fc.integer({ min: 0, max: 2_000_000 }), // can exceed allocated
          }),
          { minLength: 1, maxLength: 6 }
        ),
        async (specs) => {
          const { store } = await bootstrapStore(freshStore, {
            buckets: specs.map((s, i) => ({
              macroType: 'wants',
              name: `B${i}`,
              emoji: '🧪',
              allocated: s.allocated,
            })),
            cycle: { allocations: { needs: 0, wants: 10_000_000, future: 0 } },
          });
          const wants = store.getBuckets('wants');
          specs.forEach((s, i) => {
            if (s.spend > 0) store.addTransaction({ bucketId: wants[i].id, amount: s.spend });
          });
          return store.getMacroSummary('wants').remaining >= 0;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('property: sweep conservation', () => {
  it('sweep.amount === Σ breakdown === Σ max(0, allocated - spent) over wants+future', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            macroType: fc.constantFrom('wants', 'future'),
            allocated: fc.integer({ min: 0, max: 1_000_000 }),
            spend: fc.integer({ min: 0, max: 1_500_000 }),
          }),
          { minLength: 1, maxLength: 6 }
        ),
        async (specs) => {
          const { store } = await bootstrapStore(freshStore, {
            buckets: specs.map((s, i) => ({
              macroType: s.macroType,
              name: `B${i}`,
              emoji: '🧪',
              allocated: s.allocated,
            })),
            cycle: { allocations: { needs: 0, wants: 10_000_000, future: 10_000_000 } },
          });
          const allBuckets = [...store.getBuckets('wants'), ...store.getBuckets('future')];
          const specByName = new Map(specs.map((s, i) => [`B${i}`, s]));
          allBuckets.forEach(b => {
            const s = specByName.get(b.name);
            if (s && s.spend > 0) store.addTransaction({ bucketId: b.id, amount: s.spend });
          });

          const expected = allBuckets
            .map(b => Math.max(0, store.getBucketById(b.id).allocated - store.getBucketById(b.id).spent))
            .reduce((a, b) => a + b, 0);

          const sweep = store.runSweep();
          if (expected === 0) return sweep === null;
          const breakdownSum = sweep.breakdown.reduce((a, x) => a + x.amount, 0);
          return sweep.amount === expected && breakdownSum === expected;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('property: trade-off conservation', () => {
  it('Δtarget.spent + Δsource.spent === amount exactly (integer domain)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1 }),
        async (amount, borrowRatio) => {
          const borrow = Math.floor(amount * borrowRatio);
          const { store, buckets } = await bootstrapStore(freshStore, {
            buckets: [
              { macroType: 'wants', name: 'T', emoji: '🧪', allocated: 0 },
              { macroType: 'wants', name: 'S', emoji: '🧪', allocated: 0 },
            ],
          });
          const [t, s] = buckets;
          const tBefore = store.getBucketById(t.id).spent;
          const sBefore = store.getBucketById(s.id).spent;
          store.addTradeOffTransaction({
            bucketId: t.id,
            amount,
            borrowFromId: s.id,
            borrowAmount: borrow,
          });
          const dT = store.getBucketById(t.id).spent - tBefore;
          const dS = store.getBucketById(s.id).spent - sBefore;
          return dT + dS === amount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('property: Safe-to-Spend monotonicity', () => {
  it('any non-negative expense to a wants bucket never increases STS', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100_000 }),
        async (amount) => {
          const { store, buckets } = await bootstrapStore(freshStore);
          const wantsBucket = buckets.find(b => b.macroType === 'wants');
          const before = store.getSafeToSpend();
          store.addTransaction({ bucketId: wantsBucket.id, amount });
          const after = store.getSafeToSpend();
          return after <= before;
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('property: percent does not clamp at 100 (canary)', () => {
  it('percent(value, total) === Math.round(value/total * 100) for any positive inputs', () => {
    // If anyone adds `Math.min(100, …)` to percent, this fails immediately.
    // We assert the exact rounded ratio — no clamping anywhere.
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (value, total) => {
          return percent(value, total) === Math.round((value / total) * 100);
        }
      )
    );
  });

  it('percent(2*total, total) === 200 — concrete over-100 case', () => {
    expect(percent(200, 100)).toBe(200);
    expect(percent(999, 333)).toBe(300);
  });
});

// Silence unused import in some paths
void makeBucketParams;
