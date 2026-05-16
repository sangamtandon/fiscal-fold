import { describe, it, expect } from 'vitest';
import { freshStore } from '../helpers/freshStore.js';
import { bootstrapStore } from '../helpers/builders.js';

describe('getMacroSummary', () => {
  it('returns zeros when no buckets exist for the macro', async () => {
    const { store } = await bootstrapStore(freshStore, { buckets: [] });
    const summary = store.getMacroSummary('wants');
    expect(summary.allocated).toBe(0);
    expect(summary.spent).toBe(0);
    expect(summary.remaining).toBe(0);
    expect(summary.percent).toBe(0);
    expect(summary.cycleAllocation).toBe(30000);
    expect(summary.unallocated).toBe(30000);
  });

  it('reports allocated/spent across buckets in the macro', async () => {
    const { store } = await bootstrapStore(freshStore);
    const wants = store.getBuckets('wants');
    store.addTransaction({ bucketId: wants[0].id, amount: 500 });
    store.addTransaction({ bucketId: wants[1].id, amount: 300 });
    const summary = store.getMacroSummary('wants');
    expect(summary.allocated).toBe(25000);
    expect(summary.spent).toBe(800);
    expect(summary.remaining).toBe(24200);
    expect(summary.percent).toBe(3);
  });

  it('floors remaining at 0 when over-spent', async () => {
    const { store, buckets } = await bootstrapStore(freshStore, {
      buckets: [{ macroType: 'wants', name: 'X', emoji: '🧪', allocated: 1000 }],
    });
    store.addTransaction({ bucketId: buckets[0].id, amount: 1000 });
    store.addTransaction({ bucketId: buckets[0].id, amount: 500 });
    const summary = store.getMacroSummary('wants');
    expect(summary.remaining).toBe(0);
  });

  it('percent is NOT clamped above 100 (canary)', async () => {
    const { store, buckets } = await bootstrapStore(freshStore, {
      buckets: [{ macroType: 'wants', name: 'X', emoji: '🧪', allocated: 100 }],
    });
    store.addTransaction({ bucketId: buckets[0].id, amount: 250 });
    expect(store.getMacroSummary('wants').percent).toBe(250);
  });

  it('reports negative unallocated when buckets sum > cycle allocation', async () => {
    const { store } = await bootstrapStore(freshStore, {
      buckets: [
        { macroType: 'wants', name: 'A', emoji: '🧪', allocated: 20000 },
        { macroType: 'wants', name: 'B', emoji: '🧪', allocated: 15000 },
      ],
    });
    expect(store.getMacroSummary('wants').unallocated).toBe(-5000);
  });

  it('returns percent=0 when allocated is 0 even if spent (guard at line 210)', async () => {
    const { store } = await bootstrapStore(freshStore, {
      buckets: [{ macroType: 'wants', name: 'X', emoji: '🧪', allocated: 0 }],
    });
    expect(store.getMacroSummary('wants').percent).toBe(0);
  });
});

describe('getSafeToSpend', () => {
  it('returns sum of wants remaining minus reserved', async () => {
    const { store } = await bootstrapStore(freshStore);
    // Wants buckets total 25000 allocated, 0 spent → remaining 25000
    expect(store.getSafeToSpend()).toBe(25000);

    store.addCommitment({ name: 'Netflix', emoji: '🎬', amount: 649, dueDate: 15, macroType: 'wants' });
    expect(store.getSafeToSpend()).toBe(25000 - 649);
  });

  it('floors at 0 when reserved exceeds remaining', async () => {
    const { store } = await bootstrapStore(freshStore, {
      buckets: [{ macroType: 'wants', name: 'X', emoji: '🧪', allocated: 100 }],
    });
    store.addCommitment({ name: 'Big', emoji: '💸', amount: 9999, dueDate: 1, macroType: 'wants' });
    expect(store.getSafeToSpend()).toBe(0);
  });

  it('ignores Needs and Future bucket remainders', async () => {
    const { store } = await bootstrapStore(freshStore, {
      buckets: [
        { macroType: 'needs', name: 'N', emoji: '🧪', allocated: 9999 },
        { macroType: 'future', name: 'F', emoji: '🧪', allocated: 9999 },
        { macroType: 'wants', name: 'W', emoji: '🧪', allocated: 1000 },
      ],
    });
    expect(store.getSafeToSpend()).toBe(1000);
  });

  it('ignores paid and inactive commitments', async () => {
    const { store } = await bootstrapStore(freshStore);
    const paid = store.addCommitment({ name: 'Paid', emoji: '✅', amount: 500, dueDate: 1, macroType: 'wants' });
    const inactive = store.addCommitment({ name: 'Off', emoji: '🛑', amount: 700, dueDate: 1, macroType: 'wants' });
    store.updateCommitment(paid.id, { isPaid: true });
    store.updateCommitment(inactive.id, { isActive: false });
    // Neither paid nor inactive should reduce STS
    expect(store.getSafeToSpend()).toBe(25000);
  });
});

describe('getMacroReserved', () => {
  it('sums only active unpaid commitments in the macro', async () => {
    const { store } = await bootstrapStore(freshStore);
    store.addCommitment({ name: 'A', emoji: '📌', amount: 1000, dueDate: 1, macroType: 'wants' });
    const paid = store.addCommitment({ name: 'B', emoji: '📌', amount: 500, dueDate: 1, macroType: 'wants' });
    const inactive = store.addCommitment({ name: 'C', emoji: '📌', amount: 300, dueDate: 1, macroType: 'wants' });
    const needs = store.addCommitment({ name: 'D', emoji: '📌', amount: 2000, dueDate: 1, macroType: 'needs' });
    store.updateCommitment(paid.id, { isPaid: true });
    store.updateCommitment(inactive.id, { isActive: false });

    expect(store.getMacroReserved('wants')).toBe(1000);
    expect(store.getMacroReserved('needs')).toBe(2000);
    void needs;
  });
});

describe('getCurrentCycle / isCycleExpired / getBuckets', () => {
  it('getCurrentCycle returns null when no cycle is set', async () => {
    const store = await freshStore();
    expect(store.getCurrentCycle()).toBeNull();
  });

  it('isCycleExpired returns false when there is no cycle', async () => {
    const store = await freshStore();
    expect(store.isCycleExpired()).toBe(false);
  });

  it('isCycleExpired is true when endDate is in the past', async () => {
    const store = await freshStore();
    store.setUser({ salary: 1000 });
    store.createCycle({
      startDate: '2020-01-01',
      endDate: '2020-01-31',
      salary: 1000,
      allocations: { needs: 500, wants: 300, future: 200 },
    });
    expect(store.isCycleExpired()).toBe(true);
  });

  it('getBuckets filters by current cycle and macroType', async () => {
    const { store } = await bootstrapStore(freshStore);
    expect(store.getBuckets().length).toBe(4);
    expect(store.getBuckets('wants').length).toBe(2);
    expect(store.getBuckets('future').length).toBe(1);
  });

  it('getQuickBuckets returns only pinned buckets', async () => {
    const { store } = await bootstrapStore(freshStore, {
      buckets: [
        { macroType: 'wants', name: 'Pinned', emoji: '⭐', allocated: 100, isPinned: true },
        { macroType: 'wants', name: 'Unpinned', emoji: '🧪', allocated: 100, isPinned: false },
      ],
    });
    const quick = store.getQuickBuckets();
    expect(quick.length).toBe(1);
    expect(quick[0].name).toBe('Pinned');
  });
});
