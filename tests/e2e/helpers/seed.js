// Minimal e2e fixture state. We don't reuse src/data/seed.js because that
// module pulls in dev-toolbar code that depends on DOM and import.meta.env.
//
// This builds a state object that mirrors what `seedDemoData()` produces in
// shape, just enough to exercise dashboard / FAB / payday flows.

export function buildSeedState({ expired = false } = {}) {
  const today = new Date('2026-05-15T10:00:00Z');
  const start = expired
    ? new Date('2026-04-01T00:00:00Z')
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const end = expired
    ? '2026-04-30'
    : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const cycleId = 'cycle-1';
  const salary = 100000;

  return {
    user: {
      id: 'user-1',
      name: 'Test',
      salary,
      salaryDate: 1,
      preset: 'balanced',
      ratios: { needs: 50, wants: 30, future: 20 },
      createdAt: start.toISOString(),
      updatedAt: start.toISOString(),
    },
    cycles: [{
      id: cycleId,
      startDate: start.toISOString().slice(0, 10),
      endDate: end,
      salary,
      allocations: { needs: 50000, wants: 30000, future: 20000 },
      isActive: true,
      sweepAmount: null,
      createdAt: start.toISOString(),
    }],
    buckets: [
      { id: 'b-need-1', cycleId, macroType: 'needs', name: 'Groceries', emoji: '🛒', allocated: 30000, spent: 8000, isPinned: true, sortOrder: 0, createdAt: start.toISOString() },
      { id: 'b-want-1', cycleId, macroType: 'wants', name: 'Dining', emoji: '🍕', allocated: 15000, spent: 4000, isPinned: true, sortOrder: 0, createdAt: start.toISOString() },
      { id: 'b-want-2', cycleId, macroType: 'wants', name: 'Shopping', emoji: '🛍️', allocated: 10000, spent: 2000, isPinned: false, sortOrder: 1, createdAt: start.toISOString() },
      { id: 'b-fut-1', cycleId, macroType: 'future', name: 'Emergency', emoji: '🛡️', allocated: 20000, spent: 0, isPinned: false, sortOrder: 0, createdAt: start.toISOString() },
    ],
    transactions: [
      { id: 't-1', cycleId, bucketId: 'b-need-1', amount: 8000, type: 'expense', note: 'Groceries', borrowedFrom: null, borrowedAmount: 0, timestamp: start.toISOString() },
      { id: 't-2', cycleId, bucketId: 'b-want-1', amount: 4000, type: 'expense', note: 'Dining', borrowedFrom: null, borrowedAmount: 0, timestamp: start.toISOString() },
      { id: 't-3', cycleId, bucketId: 'b-want-2', amount: 2000, type: 'expense', note: 'Shopping', borrowedFrom: null, borrowedAmount: 0, timestamp: start.toISOString() },
    ],
    commitments: [],
    sweeps: [],
    onboardingComplete: true,
    currentCycleId: cycleId,
  };
}

export async function seedState(page, opts) {
  const state = buildSeedState(opts);
  await page.addInitScript(s => {
    localStorage.setItem('fiscal-fold-state', JSON.stringify(s));
  }, state);
}
