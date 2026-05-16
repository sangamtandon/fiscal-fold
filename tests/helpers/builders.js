import { PRESETS } from '../../src/data/models.js';

export function makeUser(overrides = {}) {
  return {
    name: 'Test User',
    salary: 100000,
    salaryDate: 1,
    preset: 'balanced',
    ratios: { ...PRESETS.balanced },
    ...overrides,
  };
}

export function makeCycleParams(overrides = {}) {
  return {
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    salary: 100000,
    allocations: { needs: 50000, wants: 30000, future: 20000 },
    ...overrides,
  };
}

export function makeBucketParams(overrides = {}) {
  return {
    macroType: 'wants',
    name: 'Test Bucket',
    emoji: '🧪',
    allocated: 1000,
    isPinned: false,
    ...overrides,
  };
}

export function makeCommitmentParams(overrides = {}) {
  return {
    name: 'Test Commitment',
    emoji: '📌',
    amount: 500,
    dueDate: 5,
    macroType: 'wants',
    ...overrides,
  };
}

// Convenience: bootstrap a store into a usable mid-cycle state.
// Returns the store namespace plus the created cycle & buckets.
export async function bootstrapStore(freshStoreFn, opts = {}) {
  const store = await freshStoreFn();
  store.setUser(makeUser(opts.user));
  store.completeOnboarding();
  const cycle = store.createCycle(makeCycleParams(opts.cycle));

  const buckets = [];
  const bucketSpecs = opts.buckets ?? [
    { macroType: 'needs', name: 'Groceries', emoji: '🛒', allocated: 30000 },
    { macroType: 'wants', name: 'Dining', emoji: '🍕', allocated: 15000 },
    { macroType: 'wants', name: 'Shopping', emoji: '🛍️', allocated: 10000 },
    { macroType: 'future', name: 'Emergency', emoji: '🛡️', allocated: 20000 },
  ];
  bucketSpecs.forEach(spec => buckets.push(store.addBucket(makeBucketParams(spec))));

  return { store, cycle, buckets };
}
