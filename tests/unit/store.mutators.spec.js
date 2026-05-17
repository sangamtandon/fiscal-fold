import { describe, it, expect } from 'vitest';
import { freshStore } from '../helpers/freshStore.js';
import { bootstrapStore, makeCycleParams, makeBucketParams } from '../helpers/builders.js';

describe('setUser', () => {
  it('rejects NaN salary', async () => {
    const store = await freshStore();
    expect(() => store.setUser({ salary: NaN })).toThrow(/invalid salary/);
  });

  it('rejects negative salary', async () => {
    const store = await freshStore();
    expect(() => store.setUser({ salary: -1 })).toThrow(/invalid salary/);
  });

  it('does not validate salary when omitted (partial update)', async () => {
    const store = await freshStore();
    store.setUser({ name: 'Initial', salary: 1000 });
    expect(() => store.setUser({ name: 'Renamed' })).not.toThrow();
    expect(store.getUser().name).toBe('Renamed');
  });

  it('merges updates and bumps updatedAt', async () => {
    const store = await freshStore();
    store.setUser({ name: 'A', salary: 1000 });
    const first = store.getUser().updatedAt;
    await new Promise(r => setTimeout(r, 5));
    store.setUser({ name: 'B' });
    expect(store.getUser().name).toBe('B');
    expect(store.getUser().updatedAt).not.toBe(first);
  });
});

describe('createCycle', () => {
  it('rejects non-finite or negative salary', async () => {
    const store = await freshStore();
    expect(() => store.createCycle(makeCycleParams({ salary: NaN }))).toThrow(/invalid salary/);
    expect(() => store.createCycle(makeCycleParams({ salary: -1 }))).toThrow(/invalid salary/);
  });

  it('rejects invalid allocations per key', async () => {
    const store = await freshStore();
    expect(() =>
      store.createCycle(makeCycleParams({ allocations: { needs: -1, wants: 0, future: 0 } }))
    ).toThrow(/invalid allocation.needs/);
    expect(() =>
      store.createCycle(makeCycleParams({ allocations: { needs: 0, wants: NaN, future: 0 } }))
    ).toThrow(/invalid allocation.wants/);
  });

  it('deactivates prior cycles and sets the new one active', async () => {
    const store = await freshStore();
    const c1 = store.createCycle(makeCycleParams());
    const c2 = store.createCycle(makeCycleParams({ startDate: '2026-06-01', endDate: '2026-06-30' }));
    expect(store.getState().cycles.find(c => c.id === c1.id).isActive).toBe(false);
    expect(c2.isActive).toBe(true);
    expect(store.getCurrentCycle().id).toBe(c2.id);
  });

  it('resets all active commitments to unpaid', async () => {
    const store = await freshStore();
    const c = store.addCommitment({ name: 'X', emoji: '📌', amount: 100, dueDate: 1, macroType: 'wants' });
    store.updateCommitment(c.id, { isPaid: true });
    store.createCycle(makeCycleParams());
    expect(store.getState().commitments.find(x => x.id === c.id).isPaid).toBe(false);
  });
});

describe('addBucket', () => {
  it('rejects NaN/negative allocated', async () => {
    const { store } = await bootstrapStore(freshStore, { buckets: [] });
    expect(() => store.addBucket(makeBucketParams({ allocated: NaN }))).toThrow(/invalid allocated/);
    expect(() => store.addBucket(makeBucketParams({ allocated: -1 }))).toThrow(/invalid allocated/);
  });

  it('assigns sortOrder by macro position', async () => {
    const { store } = await bootstrapStore(freshStore, { buckets: [] });
    const a = store.addBucket(makeBucketParams({ macroType: 'wants', name: 'A' }));
    const b = store.addBucket(makeBucketParams({ macroType: 'wants', name: 'B' }));
    const c = store.addBucket(makeBucketParams({ macroType: 'needs', name: 'C' }));
    expect(a.sortOrder).toBe(0);
    expect(b.sortOrder).toBe(1);
    expect(c.sortOrder).toBe(0);
  });
});

describe('addTransaction', () => {
  it('throws on NaN amount', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    expect(() => store.addTransaction({ bucketId: buckets[0].id, amount: NaN })).toThrow(/invalid amount/);
  });

  it('throws on negative amount', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    expect(() => store.addTransaction({ bucketId: buckets[0].id, amount: -1 })).toThrow(/invalid amount/);
  });

  it('expense increments bucket.spent', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    store.addTransaction({ bucketId: buckets[1].id, amount: 300 });
    store.addTransaction({ bucketId: buckets[1].id, amount: 200 });
    expect(store.getBucketById(buckets[1].id).spent).toBe(500);
  });

  it('refund decrements bucket.spent and floors at 0 (store.js:404)', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    const b = buckets[1];
    store.addTransaction({ bucketId: b.id, amount: 500 });
    store.addTransaction({ bucketId: b.id, amount: 200, type: 'refund' });
    expect(store.getBucketById(b.id).spent).toBe(300);
    store.addTransaction({ bucketId: b.id, amount: 9999, type: 'refund' });
    expect(store.getBucketById(b.id).spent).toBe(0);
  });

  it('records a transaction even when bucketId does not match any bucket (pinned current behavior)', async () => {
    const { store } = await bootstrapStore(freshStore);
    const txn = store.addTransaction({ bucketId: 'nonexistent', amount: 100 });
    expect(txn).toBeDefined();
    expect(store.getAllTransactions().some(t => t.id === txn.id)).toBe(true);
  });
});

describe('addTradeOffTransaction', () => {
  it('throws when borrowAmount > amount', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    expect(() =>
      store.addTradeOffTransaction({
        bucketId: buckets[1].id,
        amount: 100,
        borrowFromId: buckets[2].id,
        borrowAmount: 200,
      })
    ).toThrow(/borrowAmount must be 0..amount/);
  });

  it('throws when borrowAmount is negative', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    expect(() =>
      store.addTradeOffTransaction({
        bucketId: buckets[1].id,
        amount: 100,
        borrowFromId: buckets[2].id,
        borrowAmount: -5,
      })
    ).toThrow();
  });

  it('splits spent between target and source by (amount - borrow, borrow)', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    const target = buckets[1];
    const source = buckets[2];
    store.addTradeOffTransaction({
      bucketId: target.id,
      amount: 500,
      borrowFromId: source.id,
      borrowAmount: 200,
    });
    expect(store.getBucketById(target.id).spent).toBe(300);
    expect(store.getBucketById(source.id).spent).toBe(200);
  });
});

describe('addIncome', () => {
  it('throws on invalid amount', async () => {
    const { store } = await bootstrapStore(freshStore);
    expect(() => store.addIncome(NaN)).toThrow(/invalid amount/);
    expect(() => store.addIncome(-1)).toThrow(/invalid amount/);
  });

  it('returns silently with no current cycle', async () => {
    const store = await freshStore();
    expect(() => store.addIncome(1000)).not.toThrow();
  });

  it('with target bucket: increases allocated and cycle allocation, records income txn', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    const target = buckets[1]; // wants
    const allocBefore = store.getBucketById(target.id).allocated;
    // Snapshot the value (not a reference) — cycle.allocations mutates in place.
    const wantsBefore = store.getCurrentCycle().allocations.wants;

    store.addIncome(5000, target.id, 'bonus');

    expect(store.getBucketById(target.id).allocated).toBe(allocBefore + 5000);
    expect(store.getCurrentCycle().allocations.wants).toBe(wantsBefore + 5000);
    const incomeTxns = store.getAllTransactions().filter(t => t.type === 'income');
    expect(incomeTxns.length).toBe(1);
    expect(incomeTxns[0].amount).toBe(5000);
  });

  it('without target bucket: adds to cycle.salary and splits across macros by user ratios', async () => {
    const { store } = await bootstrapStore(freshStore);
    const cycleBefore = {
      salary: store.getCurrentCycle().salary,
      allocations: { ...store.getCurrentCycle().allocations },
    };
    // balanced 50/30/20, amount=10000 → 5000/3000/2000
    store.addIncome(10000);
    const updated = store.getCurrentCycle();
    expect(updated.salary).toBe(cycleBefore.salary + 10000);
    expect(updated.allocations.needs).toBe(cycleBefore.allocations.needs + 5000);
    expect(updated.allocations.wants).toBe(cycleBefore.allocations.wants + 3000);
    expect(updated.allocations.future).toBe(cycleBefore.allocations.future + 2000);
  });

  it('without target bucket: records an income transaction with bucketId=null (DEBT-007)', async () => {
    const { store } = await bootstrapStore(freshStore);
    store.addIncome(5000, undefined, 'Freelance');
    const incomeTxns = store.getAllTransactions().filter(t => t.type === 'income');
    expect(incomeTxns.length).toBe(1);
    expect(incomeTxns[0].bucketId).toBeNull();
    expect(incomeTxns[0].amount).toBe(5000);
    expect(incomeTxns[0].note).toBe('Freelance');
  });

  it('without target bucket: default note is "Added to overall budget"', async () => {
    const { store } = await bootstrapStore(freshStore);
    store.addIncome(5000);
    const incomeTxns = store.getAllTransactions().filter(t => t.type === 'income');
    expect(incomeTxns[0].note).toBe('Added to overall budget');
  });
});

describe('runSweep', () => {
  it('returns null when no cycle exists', async () => {
    const store = await freshStore();
    expect(store.runSweep()).toBeNull();
  });

  it('returns null when nothing to sweep', async () => {
    const { store, buckets } = await bootstrapStore(freshStore, {
      buckets: [{ macroType: 'wants', name: 'X', emoji: '🧪', allocated: 100 }],
    });
    store.addTransaction({ bucketId: buckets[0].id, amount: 100 });
    expect(store.runSweep()).toBeNull();
  });

  it('sums Wants+Future remainders; breakdown sums to totalSwept; idempotent', async () => {
    const { store } = await bootstrapStore(freshStore);
    const sweep = store.runSweep();
    expect(sweep).not.toBeNull();
    // 2 wants buckets (15000 + 10000) + 1 future bucket (20000) = 45000
    expect(sweep.amount).toBe(45000);
    expect(sweep.breakdown.reduce((s, x) => s + x.amount, 0)).toBe(45000);

    // Second call sweeps nothing (b.swept absorbs the remainder)
    expect(store.runSweep()).toBeNull();
  });

  it('intentionally excludes Needs buckets (store.js:524 — surplus is forfeited)', async () => {
    const { store } = await bootstrapStore(freshStore, {
      buckets: [
        { macroType: 'needs', name: 'N', emoji: '🧪', allocated: 5000 },
        { macroType: 'wants', name: 'W', emoji: '🧪', allocated: 1000 },
      ],
    });
    const sweep = store.runSweep();
    expect(sweep.amount).toBe(1000);
    expect(sweep.breakdown.every(b => b.bucketName !== 'N')).toBe(true);
  });

  it('writes sweepAmount onto the cycle', async () => {
    const { store } = await bootstrapStore(freshStore);
    store.runSweep();
    expect(store.getCurrentCycle().sweepAmount).toBe(45000);
  });
});

describe('removeTransaction', () => {
  it('is a no-op for an unknown id', async () => {
    const { store } = await bootstrapStore(freshStore);
    expect(() => store.removeTransaction('does-not-exist')).not.toThrow();
  });

  it('reverses an expense — bucket.spent restored, transaction gone', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    const wants = buckets.find(b => b.macroType === 'wants');
    const txn = store.addTransaction({ bucketId: wants.id, amount: 1500 });
    expect(store.getBucketById(wants.id).spent).toBe(1500);

    store.removeTransaction(txn.id);
    expect(store.getBucketById(wants.id).spent).toBe(0);
    expect(store.getTransactions().find(t => t.id === txn.id)).toBeUndefined();
  });

  it('reverses a trade-off — both target and source spent restored', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    const target = buckets.find(b => b.name === 'Dining'); // 15000 alloc
    const source = buckets.find(b => b.name === 'Shopping'); // 10000 alloc

    store.addTransaction({ bucketId: target.id, amount: 14000 });
    const txn = store.addTradeOffTransaction({
      bucketId: target.id,
      amount: 3000,
      borrowFromId: source.id,
      borrowAmount: 2000,
    });
    expect(store.getBucketById(target.id).spent).toBe(14000 + 1000);
    expect(store.getBucketById(source.id).spent).toBe(2000);

    store.removeTransaction(txn.id);
    expect(store.getBucketById(target.id).spent).toBe(14000);
    expect(store.getBucketById(source.id).spent).toBe(0);
  });

  it('reverses a refund — adding back to spent', async () => {
    const { store, buckets } = await bootstrapStore(freshStore);
    const wants = buckets.find(b => b.macroType === 'wants');
    store.addTransaction({ bucketId: wants.id, amount: 1000 });
    const refund = store.addTransaction({ bucketId: wants.id, amount: 400, type: 'refund' });
    expect(store.getBucketById(wants.id).spent).toBe(600);

    store.removeTransaction(refund.id);
    expect(store.getBucketById(wants.id).spent).toBe(1000);
  });

  it('reverses untargeted income — cycle.salary and macro allocations restored (DEBT-007)', async () => {
    const { store } = await bootstrapStore(freshStore);
    const before = {
      salary: store.getCurrentCycle().salary,
      allocations: { ...store.getCurrentCycle().allocations },
    };
    store.addIncome(10000);
    const incomeTxn = store.getAllTransactions().find(t => t.type === 'income');
    expect(incomeTxn.bucketId).toBeNull();

    store.removeTransaction(incomeTxn.id);
    const after = store.getCurrentCycle();
    expect(after.salary).toBe(before.salary);
    expect(after.allocations.needs).toBe(before.allocations.needs);
    expect(after.allocations.wants).toBe(before.allocations.wants);
    expect(after.allocations.future).toBe(before.allocations.future);
  });

  it('reverses income — bucket.allocated drops back, cycle.allocations follows', async () => {
    const { store, buckets, cycle } = await bootstrapStore(freshStore);
    const wants = buckets.find(b => b.macroType === 'wants');
    const allocBefore = store.getBucketById(wants.id).allocated;
    const cycleWantsBefore = store.getCurrentCycle().allocations.wants;

    store.addIncome(2000, wants.id, 'Bonus');
    const incomeTxn = store.getTransactions().find(t => t.type === 'income');
    expect(store.getBucketById(wants.id).allocated).toBe(allocBefore + 2000);
    expect(store.getCurrentCycle().allocations.wants).toBe(cycleWantsBefore + 2000);

    store.removeTransaction(incomeTxn.id);
    expect(store.getBucketById(wants.id).allocated).toBe(allocBefore);
    expect(store.getCurrentCycle().allocations.wants).toBe(cycleWantsBefore);
  });
});

describe('commitments lifecycle', () => {
  it('addCommitment creates an active, unpaid commitment', async () => {
    const { store } = await bootstrapStore(freshStore);
    const c = store.addCommitment({ name: 'X', emoji: '📌', amount: 100, dueDate: 5, macroType: 'wants' });
    expect(c.isActive).toBe(true);
    expect(c.isPaid).toBe(false);
  });

  it('updateCommitment patches fields', async () => {
    const { store } = await bootstrapStore(freshStore);
    const c = store.addCommitment({ name: 'X', emoji: '📌', amount: 100, dueDate: 5, macroType: 'wants' });
    store.updateCommitment(c.id, { amount: 250 });
    expect(store.getCommitments().find(x => x.id === c.id).amount).toBe(250);
  });

  it('removeCommitment deletes', async () => {
    const { store } = await bootstrapStore(freshStore);
    const c = store.addCommitment({ name: 'X', emoji: '📌', amount: 100, dueDate: 5, macroType: 'wants' });
    store.removeCommitment(c.id);
    expect(store.getCommitments().find(x => x.id === c.id)).toBeUndefined();
  });
});
