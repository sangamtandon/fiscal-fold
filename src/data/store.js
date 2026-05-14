/**
 * Fiscal Fold — Reactive State Manager (Local-First)
 * 
 * A lightweight pub/sub store that persists to localStorage.
 * All reads/writes go through this module — no direct localStorage access elsewhere.
 * Designed to be swapped to a BaaS backend in later sprints without refactoring consumers.
 */

import { uid } from '../utils/helpers.js';
import { PRESETS } from './models.js';

// ---- Storage Key ----
const STORAGE_KEY = 'fiscal-fold-state';

// ---- Default State ----
/** @returns {import('./models.js').AppState} */
function createDefaultState() {
  return {
    user: null,
    cycles: [],
    buckets: [],
    transactions: [],
    commitments: [],
    sweeps: [],
    onboardingComplete: false,
    currentCycleId: null,
  };
}

// ---- Internal State ----
let _state = createDefaultState();
/** @type {Map<string, Set<Function>>} */
const _listeners = new Map();

// ---- Persistence ----

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (e) {
    console.warn('[Store] Failed to save state:', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      _state = { ...createDefaultState(), ...parsed };
    }
  } catch (e) {
    console.warn('[Store] Failed to load state, starting fresh:', e);
    _state = createDefaultState();
  }
}

// ---- Pub/Sub ----

/**
 * Subscribe to state changes on a specific key.
 * @param {string} key - State key or '*' for all changes
 * @param {Function} callback - Called with (newValue, key)
 * @returns {() => void} Unsubscribe function
 */
export function subscribe(key, callback) {
  if (!_listeners.has(key)) {
    _listeners.set(key, new Set());
  }
  _listeners.get(key).add(callback);
  return () => _listeners.get(key)?.delete(callback);
}

/**
 * Notify listeners of a change.
 * @param {string} key
 */
function notify(key) {
  const value = _state[key];
  _listeners.get(key)?.forEach(fn => fn(value, key));
  _listeners.get('*')?.forEach(fn => fn(value, key));
}

// ---- Getters ----

/** @returns {import('./models.js').AppState} */
export function getState() {
  return _state;
}

/** @returns {import('./models.js').User|null} */
export function getUser() {
  return _state.user;
}

/** @returns {boolean} */
export function isOnboardingComplete() {
  return _state.onboardingComplete;
}

/** @returns {import('./models.js').BudgetCycle|null} */
export function getCurrentCycle() {
  return _state.cycles.find(c => c.id === _state.currentCycleId) || null;
}

/**
 * Returns true if the current cycle's end date is in the past.
 * @returns {boolean}
 */
export function isCycleExpired() {
  const cycle = getCurrentCycle();
  if (!cycle) return false;
  // Parse YYYY-MM-DD as local end-of-day to avoid UTC-midnight early expiry in positive-offset timezones
  const [y, m, d] = cycle.endDate.split('-').map(Number);
  return new Date() > new Date(y, m - 1, d, 23, 59, 59);
}

/**
 * Get all micro-buckets for the current cycle.
 * @param {import('./models.js').MacroType} [macroType] - Optional filter
 * @returns {import('./models.js').MicroBucket[]}
 */
export function getBuckets(macroType) {
  const cycleId = _state.currentCycleId;
  let buckets = _state.buckets.filter(b => b.cycleId === cycleId);
  if (macroType) buckets = buckets.filter(b => b.macroType === macroType);
  return buckets.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get a single bucket by ID.
 * @param {string} id
 * @returns {import('./models.js').MicroBucket|undefined}
 */
export function getBucketById(id) {
  return _state.buckets.find(b => b.id === id);
}

/**
 * Get pinned "Quick Buckets" for current cycle.
 * @returns {import('./models.js').MicroBucket[]}
 */
export function getQuickBuckets() {
  const cycleId = _state.currentCycleId;
  return _state.buckets
    .filter(b => b.cycleId === cycleId && b.isPinned)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get transactions for the current cycle.
 * @param {object} [opts]
 * @param {number} [opts.limit]
 * @param {string} [opts.bucketId]
 * @returns {import('./models.js').Transaction[]}
 */
export function getTransactions({ limit, bucketId } = {}) {
  const cycleId = _state.currentCycleId;
  let txns = _state.transactions.filter(t => t.cycleId === cycleId);
  if (bucketId) txns = txns.filter(t => t.bucketId === bucketId);
  txns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (limit) txns = txns.slice(0, limit);
  return txns;
}

/** @returns {import('./models.js').Commitment[]} */
export function getCommitments() {
  return _state.commitments.filter(c => c.isActive);
}

/**
 * Get total reserved (unpaid active commitments) for a macro type.
 * Reserved = committed but not yet paid — subtracted from available balance.
 * @param {import('./models.js').MacroType} macroType
 * @returns {number}
 */
export function getMacroReserved(macroType) {
  return _state.commitments
    .filter(c => c.isActive && !c.isPaid && c.macroType === macroType)
    .reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Calculate the "Safe to Spend" amount — total remaining in Wants buckets minus unpaid commitments.
 * @returns {number}
 */
export function getSafeToSpend() {
  const wantsBuckets = getBuckets('wants');
  const remaining = wantsBuckets.reduce((sum, b) => sum + Math.max(0, b.allocated - b.spent - (b.swept ?? 0)), 0);
  const reserved = getMacroReserved('wants');
  return Math.max(0, remaining - reserved);
}

/**
 * Get macro-level summary for the current cycle.
 *
 * `allocated` is the sum of micro-bucket allocations. `cycleAllocation` is the
 * macro's share of the cycle salary (the pool the user split into buckets).
 * `unallocated` is the leftover that wasn't assigned to any bucket — can be
 * negative if the user over-allocated.
 *
 * @param {import('./models.js').MacroType} macroType
 * @returns {{ allocated: number, spent: number, remaining: number, percent: number, cycleAllocation: number, unallocated: number }}
 */
export function getMacroSummary(macroType) {
  const buckets = getBuckets(macroType);
  const allocated = buckets.reduce((s, b) => s + b.allocated, 0);
  const spent = buckets.reduce((s, b) => s + b.spent, 0);
  const remaining = Math.max(0, allocated - spent - buckets.reduce((s, b) => s + (b.swept ?? 0), 0));
  const percent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  const cycle = getCurrentCycle();
  const cycleAllocation = cycle?.allocations?.[macroType] ?? 0;
  const unallocated = cycleAllocation - allocated;
  return { allocated, spent, remaining, percent, cycleAllocation, unallocated };
}

/**
 * Get total commitments amount for a macro type.
 * @param {import('./models.js').MacroType} macroType
 * @returns {number}
 */
export function getCommitmentsTotal(macroType) {
  return _state.commitments
    .filter(c => c.isActive && c.macroType === macroType)
    .reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Get sweeps for a specific cycle or all.
 * @param {string} [cycleId]
 * @returns {import('./models.js').Sweep[]}
 */
export function getSweeps(cycleId) {
  if (cycleId) return _state.sweeps.filter(s => s.cycleId === cycleId);
  return [..._state.sweeps];
}

// ---- Mutators ----

/**
 * Set or update the user profile.
 * @param {Partial<import('./models.js').User>} userData
 */
export function setUser(userData) {
  if (userData.salary !== undefined && (!Number.isFinite(userData.salary) || userData.salary < 0)) {
    throw new Error('setUser: invalid salary');
  }
  const now = new Date().toISOString();
  if (_state.user) {
    _state.user = { ..._state.user, ...userData, updatedAt: now };
  } else {
    _state.user = {
      id: uid(),
      name: '',
      salary: 0,
      salaryDate: 1,
      preset: 'balanced',
      ratios: { ...PRESETS.balanced },
      createdAt: now,
      updatedAt: now,
      ...userData,
    };
  }
  save();
  notify('user');
}

/**
 * Mark onboarding as complete.
 */
export function completeOnboarding() {
  _state.onboardingComplete = true;
  save();
  notify('onboardingComplete');
}

/**
 * Create a new budget cycle and set it as active.
 * @param {object} params
 * @param {string} params.startDate - ISO date
 * @param {string} params.endDate - ISO date
 * @param {number} params.salary
 * @param {{ needs: number, wants: number, future: number }} params.allocations - ₹ amounts
 * @returns {import('./models.js').BudgetCycle}
 */
export function createCycle({ startDate, endDate, salary, allocations }) {
  if (!Number.isFinite(salary) || salary < 0) throw new Error('createCycle: invalid salary');
  ['needs', 'wants', 'future'].forEach(k => {
    if (!Number.isFinite(allocations[k]) || allocations[k] < 0) throw new Error(`createCycle: invalid allocation.${k}`);
  });
  _state.cycles.forEach(c => { c.isActive = false; });

  const cycle = {
    id: uid(),
    startDate,
    endDate,
    salary,
    allocations,
    isActive: true,
    sweepAmount: null,
    createdAt: new Date().toISOString(),
  };

  _state.cycles.push(cycle);
  _state.currentCycleId = cycle.id;

  // Reset all active commitments to unpaid for the new cycle
  _state.commitments.forEach(c => { if (c.isActive) c.isPaid = false; });

  save();
  notify('cycles');
  return cycle;
}

/**
 * Add a micro-bucket to the current cycle.
 * @param {object} params
 * @param {import('./models.js').MacroType} params.macroType
 * @param {string} params.name
 * @param {string} params.emoji
 * @param {number} params.allocated
 * @param {boolean} [params.isPinned=false]
 * @returns {import('./models.js').MicroBucket}
 */
export function addBucket({ macroType, name, emoji, allocated, isPinned = false }) {
  if (!Number.isFinite(allocated) || allocated < 0) throw new Error('addBucket: invalid allocated');
  const cycleId = _state.currentCycleId;
  const existing = getBuckets(macroType);
  
  const bucket = {
    id: uid(),
    cycleId,
    macroType,
    name,
    emoji,
    allocated,
    spent: 0,
    isPinned,
    sortOrder: existing.length,
    createdAt: new Date().toISOString(),
  };

  _state.buckets.push(bucket);
  save();
  notify('buckets');
  return bucket;
}

/**
 * Update a micro-bucket.
 * @param {string} id
 * @param {Partial<import('./models.js').MicroBucket>} updates
 */
export function updateBucket(id, updates) {
  const idx = _state.buckets.findIndex(b => b.id === id);
  if (idx === -1) return;
  _state.buckets[idx] = { ..._state.buckets[idx], ...updates };
  save();
  notify('buckets');
}

/**
 * Remove a micro-bucket.
 * @param {string} id
 */
export function removeBucket(id) {
  _state.buckets = _state.buckets.filter(b => b.id !== id);
  save();
  notify('buckets');
}

/**
 * Add a transaction (expense).
 * @param {object} params
 * @param {string} params.bucketId
 * @param {number} params.amount
 * @param {string} [params.note]
 * @param {'expense'|'income'|'refund'} [params.type='expense']
 * @returns {import('./models.js').Transaction}
 */
export function addTransaction({ bucketId, amount, note, type = 'expense' }) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('addTransaction: invalid amount');
  const cycleId = _state.currentCycleId;
  const txn = {
    id: uid(),
    cycleId,
    bucketId,
    amount,
    type,
    note: note || '',
    borrowedFrom: null,
    borrowedAmount: 0,
    timestamp: new Date().toISOString(),
  };

  _state.transactions.push(txn);

  // Update bucket spent
  const bucket = _state.buckets.find(b => b.id === bucketId);
  if (bucket) {
    if (type === 'expense') {
      bucket.spent += amount;
    } else if (type === 'refund') {
      bucket.spent = Math.max(0, bucket.spent - amount);
    }
  }

  save();
  notify('transactions');
  notify('buckets');
  return txn;
}

/**
 * Add a transaction with trade-off (borrowing from another bucket).
 * @param {object} params
 * @param {string} params.bucketId - Target bucket
 * @param {number} params.amount - Total transaction amount
 * @param {string} params.borrowFromId - Source bucket to borrow from
 * @param {number} params.borrowAmount - Amount to borrow
 * @param {string} [params.note]
 * @returns {import('./models.js').Transaction}
 */
export function addTradeOffTransaction({ bucketId, amount, borrowFromId, borrowAmount, note }) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('addTradeOffTransaction: invalid amount');
  if (!Number.isFinite(borrowAmount) || borrowAmount < 0 || borrowAmount > amount) throw new Error('addTradeOffTransaction: borrowAmount must be 0..amount');
  const cycleId = _state.currentCycleId;
  const txn = {
    id: uid(),
    cycleId,
    bucketId,
    amount,
    type: 'expense',
    note: note || '',
    borrowedFrom: borrowFromId,
    borrowedAmount: borrowAmount,
    timestamp: new Date().toISOString(),
  };

  _state.transactions.push(txn);

  // Deduct from target bucket (what it can cover)
  const targetBucket = _state.buckets.find(b => b.id === bucketId);
  if (targetBucket) {
    targetBucket.spent += (amount - borrowAmount);
  }

  // Deduct borrowed amount from source bucket
  const sourceBucket = _state.buckets.find(b => b.id === borrowFromId);
  if (sourceBucket) {
    sourceBucket.spent += borrowAmount;
  }

  save();
  notify('transactions');
  notify('buckets');
  return txn;
}

/**
 * Add a recurring commitment.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.emoji
 * @param {number} params.amount
 * @param {number} params.dueDate
 * @param {import('./models.js').MacroType} params.macroType
 * @returns {import('./models.js').Commitment}
 */
export function addCommitment({ name, emoji, amount, dueDate, macroType }) {
  const commitment = {
    id: uid(),
    name,
    emoji,
    amount,
    dueDate,
    macroType,
    isActive: true,
    isPaid: false,
    createdAt: new Date().toISOString(),
  };

  _state.commitments.push(commitment);
  save();
  notify('commitments');
  return commitment;
}

/**
 * Update a commitment.
 * @param {string} id
 * @param {Partial<import('./models.js').Commitment>} updates
 */
export function updateCommitment(id, updates) {
  const idx = _state.commitments.findIndex(c => c.id === id);
  if (idx === -1) return;
  _state.commitments[idx] = { ..._state.commitments[idx], ...updates };
  save();
  notify('commitments');
}

/**
 * Remove a commitment.
 * @param {string} id
 */
export function removeCommitment(id) {
  _state.commitments = _state.commitments.filter(c => c.id !== id);
  save();
  notify('commitments');
}

/**
 * Execute the end-of-cycle sweep.
 * Moves all remaining Wants and Future funds forward (recorded in the sweep).
 * The sweep amount should be added to the next cycle's Future allocation by the caller.
 * @returns {import('./models.js').Sweep|null}
 */
export function runSweep() {
  const cycle = getCurrentCycle();
  if (!cycle) return null;

  const wantsBuckets = getBuckets('wants');
  const futureBuckets = getBuckets('future');
  // Needs surplus is intentionally forfeited at cycle end (D3). To include Needs in the sweep, add getBuckets('needs') here.
  const breakdown = [];
  let totalSwept = 0;

  [...wantsBuckets, ...futureBuckets].forEach(b => {
    const remaining = Math.max(0, b.allocated - b.spent - (b.swept ?? 0));
    if (remaining > 0) {
      breakdown.push({
        bucketId: b.id,
        bucketName: b.name,
        amount: remaining,
      });
      totalSwept += remaining;
      b.swept = (b.swept ?? 0) + remaining;
    }
  });

  if (totalSwept === 0) return null;

  const sweep = {
    id: uid(),
    cycleId: cycle.id,
    amount: totalSwept,
    sweptTo: 'future',
    breakdown,
    timestamp: new Date().toISOString(),
  };

  _state.sweeps.push(sweep);
  cycle.sweepAmount = totalSwept;

  save();
  notify('sweeps');
  notify('buckets');
  notify('cycles');
  return sweep;
}

/**
 * Copy buckets from one cycle to a new cycle, proportionally re-allocating
 * based on each bucket's share within its macro type.
 * @param {string} oldCycleId
 * @param {string} newCycleId
 * @param {{ needs: number, wants: number, future: number }} newAllocations
 */
export function copyBucketsToNewCycle(oldCycleId, newCycleId, newAllocations) {
  const oldBuckets = _state.buckets
    .filter(b => b.cycleId === oldCycleId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  ['needs', 'wants', 'future'].forEach(macroType => {
    const macroBuckets = oldBuckets.filter(b => b.macroType === macroType);
    const newTotal = newAllocations[macroType];

    if (macroBuckets.length === 0) {
      if (newTotal > 0) {
        _state.buckets.push({
          id: uid(),
          cycleId: newCycleId,
          macroType,
          name: 'General',
          emoji: '📦',
          allocated: newTotal,
          spent: 0,
          isPinned: false,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
        });
      }
      return;
    }

    const oldTotal = macroBuckets.reduce((s, b) => s + b.allocated, 0);
    const newBuckets = macroBuckets.map((b, i) => {
      const proportion = oldTotal > 0 ? b.allocated / oldTotal : 1 / macroBuckets.length;
      return {
        id: uid(),
        cycleId: newCycleId,
        macroType,
        name: b.name,
        emoji: b.emoji,
        allocated: Math.round(newTotal * proportion),
        spent: 0,
        isPinned: b.isPinned,
        sortOrder: b.sortOrder,
        createdAt: new Date().toISOString(),
      };
    });

    // Largest-remainder correction: distribute any rounding shortfall to the last bucket
    const roundedSum = newBuckets.reduce((s, b) => s + b.allocated, 0);
    if (newBuckets.length > 0) newBuckets[newBuckets.length - 1].allocated += newTotal - roundedSum;

    newBuckets.forEach(b => _state.buckets.push(b));
  });

  save();
  notify('buckets');
}

/**
 * Replace the current cycle's macro allocations. Used when the user changes
 * their ratio split mid-cycle — the macro totals must move so unallocated
 * remainders are computed against the new split.
 * @param {{ needs: number, wants: number, future: number }} allocations
 */
export function updateCycleAllocations(allocations) {
  const cycle = getCurrentCycle();
  if (!cycle) return;
  ['needs', 'wants', 'future'].forEach(k => {
    if (!Number.isFinite(allocations[k]) || allocations[k] < 0) {
      throw new Error(`updateCycleAllocations: invalid allocation.${k}`);
    }
  });
  cycle.allocations = { ...allocations };
  save();
  notify('cycles');
}

/**
 * Add bonus or variable income.
 * @param {number} amount
 * @param {string} [targetBucketId] - If provided, allocates to this bucket. Otherwise adds to cycle salary.
 * @param {string} [note]
 */
export function addIncome(amount, targetBucketId, note = '') {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('addIncome: invalid amount');
  const cycle = getCurrentCycle();
  if (!cycle) return;

  if (targetBucketId) {
    const bucket = _state.buckets.find(b => b.id === targetBucketId);
    if (bucket) {
      bucket.allocated += amount;
      cycle.allocations[bucket.macroType] = (cycle.allocations[bucket.macroType] ?? 0) + amount;
      // Record income transaction for history — does NOT modify spent
      _state.transactions.push({
        id: uid(),
        cycleId: _state.currentCycleId,
        bucketId: targetBucketId,
        amount,
        type: 'income',
        note: note || '',
        borrowedFrom: null,
        borrowedAmount: 0,
        timestamp: new Date().toISOString(),
      });
      notify('transactions');
    }
  } else {
    // Untargeted income: split across macros using the user's ratio so the
    // new money flows into each macro's unallocated pool — not silently lost
    // against an unchanged cycle.allocations.
    cycle.salary += amount;
    const ratios = _state.user?.ratios;
    if (ratios) {
      const addNeeds = Math.round(amount * ratios.needs / 100);
      const addWants = Math.round(amount * ratios.wants / 100);
      const addFuture = amount - addNeeds - addWants;
      cycle.allocations.needs = (cycle.allocations.needs ?? 0) + addNeeds;
      cycle.allocations.wants = (cycle.allocations.wants ?? 0) + addWants;
      cycle.allocations.future = (cycle.allocations.future ?? 0) + addFuture;
    }
  }

  save();
  notify('cycles');
  notify('buckets');
}

/**
 * Get all transactions across all cycles, newest first.
 * @returns {import('./models.js').Transaction[]}
 */
export function getAllTransactions() {
  return [..._state.transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ---- Lifecycle ----

/**
 * Reset all state (for testing / dev).
 */
export function resetState() {
  _state = createDefaultState();
  save();
  // Notify all keys
  ['user', 'cycles', 'buckets', 'transactions', 'commitments', 'sweeps', 'onboardingComplete'].forEach(notify);
}

/**
 * Replace entire state (for seeding / import).
 * @param {import('./models.js').AppState} newState
 */
export function replaceState(newState) {
  _state = { ...createDefaultState(), ...newState };
  save();
  Object.keys(_state).forEach(notify);
}

/**
 * Initialize the store — load from localStorage.
 */
export function initStore() {
  load();
}

// Auto-initialize on import
initStore();
