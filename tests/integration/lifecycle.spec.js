import { describe, it, expect, vi } from 'vitest';
import { freshStore } from '../helpers/freshStore.js';
import { bootstrapStore, makeCycleParams } from '../helpers/builders.js';

describe('integration: full cycle lifecycle', () => {
  it('onboarding → first cycle → spend → payday → next cycle rollover', async () => {
    const store = await freshStore();

    // Onboarding
    store.setUser({ name: 'Arjun', salary: 100000 });
    store.completeOnboarding();
    expect(store.isOnboardingComplete()).toBe(true);

    // First cycle
    const cycle1 = store.createCycle(makeCycleParams());
    expect(cycle1.isActive).toBe(true);

    // Buckets
    const groceries = store.addBucket({ macroType: 'needs', name: 'Groceries', emoji: '🛒', allocated: 30000 });
    const dining = store.addBucket({ macroType: 'wants', name: 'Dining', emoji: '🍕', allocated: 15000 });
    const shopping = store.addBucket({ macroType: 'wants', name: 'Shopping', emoji: '🛍️', allocated: 10000 });
    const emergency = store.addBucket({ macroType: 'future', name: 'Emergency', emoji: '🛡️', allocated: 15000 });

    // Spending including a refund and a trade-off
    store.addTransaction({ bucketId: groceries.id, amount: 8000 });
    store.addTransaction({ bucketId: dining.id, amount: 5000 });
    store.addTransaction({ bucketId: dining.id, amount: 1000, type: 'refund' });
    store.addTradeOffTransaction({
      bucketId: dining.id,
      amount: 14000,
      borrowFromId: shopping.id,
      borrowAmount: 3000,
    });
    void emergency;

    // dining.spent = 5000 - 1000 + (14000 - 3000) = 15000
    // shopping.spent = 0 + 3000 = 3000
    expect(store.getBucketById(dining.id).spent).toBe(15000);
    expect(store.getBucketById(shopping.id).spent).toBe(3000);

    // Sweep — wants remainder: dining 0, shopping 7000; future remainder: 15000
    const sweep = store.runSweep();
    expect(sweep.amount).toBe(7000 + 15000);

    // Next cycle, future absorbs sweep
    const cycle2 = store.createCycle(makeCycleParams({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      allocations: { needs: 50000, wants: 30000, future: 20000 + sweep.amount },
    }));
    expect(cycle2.isActive).toBe(true);
    expect(store.getState().cycles.find(c => c.id === cycle1.id).isActive).toBe(false);
    expect(store.getCurrentCycle().allocations.future).toBe(20000 + 22000);
  });

  it('commitments: reserved tracks active+unpaid; safe-to-spend rises when paid', async () => {
    const { store } = await bootstrapStore(freshStore);
    const stsStart = store.getSafeToSpend();

    const a = store.addCommitment({ name: 'Netflix', emoji: '🎬', amount: 649, dueDate: 15, macroType: 'wants' });
    const b = store.addCommitment({ name: 'Gym', emoji: '🏋️', amount: 1500, dueDate: 5, macroType: 'wants' });
    expect(store.getMacroReserved('wants')).toBe(649 + 1500);
    expect(store.getSafeToSpend()).toBe(stsStart - 649 - 1500);

    store.updateCommitment(a.id, { isPaid: true });
    expect(store.getMacroReserved('wants')).toBe(1500);
    expect(store.getSafeToSpend()).toBe(stsStart - 1500);
    void b;
  });

  it('createCycle resets commitments to unpaid (cycle rollover)', async () => {
    const { store } = await bootstrapStore(freshStore);
    const c = store.addCommitment({ name: 'Rent', emoji: '🏠', amount: 25000, dueDate: 5, macroType: 'needs' });
    store.updateCommitment(c.id, { isPaid: true });
    expect(store.getCommitments().find(x => x.id === c.id).isPaid).toBe(true);

    store.createCycle(makeCycleParams({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    }));
    expect(store.getCommitments().find(x => x.id === c.id).isPaid).toBe(false);
  });

  it('persistence round-trip: reload store from localStorage and match snapshot', async () => {
    const { store } = await bootstrapStore(freshStore);
    const wants = store.getBuckets('wants');
    store.addTransaction({ bucketId: wants[0].id, amount: 1234 });
    store.addCommitment({ name: 'X', emoji: '📌', amount: 500, dueDate: 1, macroType: 'wants' });

    // Deep clone to detach from the live _state reference
    const snapshot = structuredClone(store.getState());

    // Force the module cache to drop the existing store instance so the
    // next import re-runs `initStore()` and rehydrates from localStorage.
    vi.resetModules();
    const reloaded = await freshStore();
    expect(reloaded.getState()).toEqual(snapshot);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// KNOWN BUGS — marked .fails so the test "passes" while the bug exists.
// When the production code is fixed, vitest reports these as failing and
// the .fails marker should be removed.
// ──────────────────────────────────────────────────────────────────────────

describe('integration: post-sweep overdraft', () => {
  it('rejects expenses against a bucket whose surplus has been swept', async () => {
    const { store, buckets } = await bootstrapStore(freshStore, {
      buckets: [{ macroType: 'wants', name: 'Dining', emoji: '🍕', allocated: 1000 }],
    });
    const b = buckets[0];

    store.runSweep();
    // Sanity: sweep moved the surplus
    expect(store.getBucketById(b.id).swept).toBe(1000);

    // BUG: this should throw / be rejected, but currently silently succeeds.
    expect(() =>
      store.addTransaction({ bucketId: b.id, amount: 200 })
    ).toThrow();
  });
});
