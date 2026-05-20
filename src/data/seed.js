/**
 * Fiscal Fold — Seed Data & Dev Helpers
 * 
 * Populates a realistic demo state for development and testing.
 * Also provides a dev toolbar for quick state manipulation.
 */

import { uid } from '../utils/helpers.js';
import {
  replaceState,
  resetState,
  getState,
  subscribe,
} from './store.js';

/**
 * Generate a realistic demo state.
 * Simulates a user who is 12 days into their budget cycle with realistic transactions.
 * @returns {import('./models.js').AppState}
 */
function generateSeedState() {
  const now = new Date();
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  // Formats a Date as YYYY-MM-DD in local time (not UTC). toISOString() shifts
  // by UTC offset and produces a datetime string that breaks split('-')[2] date math.
  const fmtLocal = d =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cycleId = uid();
  // Pre-generated bucket IDs (UUIDs, not string counters) so seed data matches
  // production ID format. Transaction references below use these by index.
  const ids = {
    needs: Array.from({ length: 5 }, uid),
    wants: Array.from({ length: 6 }, uid),
    future: Array.from({ length: 3 }, uid),
  };
  const salary = 168000;
  const ratios = { needs: 50, wants: 30, future: 20 };
  const allocations = {
    needs: Math.round(salary * ratios.needs / 100),   // 84,000
    wants: Math.round(salary * ratios.wants / 100),   // 50,400
    future: Math.round(salary * ratios.future / 100), // 33,600
  };

  // --- Micro Buckets ---
  const buckets = [];

  // Needs buckets — absolute amounts that sum to 84,000.
  // Rent is deliberately allocated above the commitment (36k vs 28k paid)
  // so the bucket never hits 80% spent and avoids a false leak warning.
  const needsBuckets = [
    { name: 'Rent',        emoji: '🏠', amount: 36000, pinned: false },
    { name: 'Groceries',   emoji: '🛒', amount: 20000, pinned: true  },
    { name: 'Transport',   emoji: '🚕', amount: 12000, pinned: true  },
    { name: 'Electricity', emoji: '💡', amount: 12000, pinned: false },
    { name: 'Internet',    emoji: '📡', amount:  4000, pinned: false },
  ];

  needsBuckets.forEach((b, i) => {
    buckets.push({
      id: ids.needs[i],
      cycleId,
      macroType: 'needs',
      name: b.name,
      emoji: b.emoji,
      allocated: b.amount,
      spent: 0,
      isPinned: b.pinned,
      sortOrder: i,
      createdAt: cycleStart.toISOString(),
    });
  });

  // Wants buckets — absolute amounts that sum to 50,400.
  const wantsBuckets = [
    { name: 'Dining Out',    emoji: '🍽️', amount: 12600, pinned: true  },
    { name: 'Subscriptions', emoji: '📺', amount:  5040, pinned: true  },
    { name: 'Coffee',        emoji: '☕', amount:  5040, pinned: false },
    { name: 'Shopping',      emoji: '🛍️', amount: 12600, pinned: false },
    { name: 'Movies',        emoji: '🎬', amount:  7560, pinned: false },
    { name: 'Gym',           emoji: '🏋️', amount:  7560, pinned: false },
  ];

  wantsBuckets.forEach((b, i) => {
    buckets.push({
      id: ids.wants[i],
      cycleId,
      macroType: 'wants',
      name: b.name,
      emoji: b.emoji,
      allocated: b.amount,
      spent: 0,
      isPinned: b.pinned,
      sortOrder: i,
      createdAt: cycleStart.toISOString(),
    });
  });

  // Future buckets — clean round numbers that sum to 33,600.
  // These show as locked goals (₹X /mo) on the dashboard, not as a depleting bar.
  const futureBuckets = [
    { name: 'Emergency Fund', emoji: '🔐', amount: 10000, pinned: false },
    { name: 'Mutual Funds',   emoji: '📈', amount: 15000, pinned: false },
    { name: 'Stocks',         emoji: '📊', amount:  8600, pinned: false },
  ];

  futureBuckets.forEach((b, i) => {
    buckets.push({
      id: ids.future[i],
      cycleId,
      macroType: 'future',
      name: b.name,
      emoji: b.emoji,
      allocated: b.amount,
      spent: 0,
      isPinned: b.pinned,
      sortOrder: i,
      createdAt: cycleStart.toISOString(),
    });
  });

  // --- Transactions (simulate 12 days of spending) ---
  // ids.needs: [0]=Rent, [1]=Groceries, [2]=Transport, [3]=Electricity, [4]=Internet
  // ids.wants: [0]=Dining Out, [1]=Subscriptions, [2]=Coffee, [3]=Shopping, [4]=Movies, [5]=Gym
  const transactions = [];

  const txnData = [
    // Day 1 — rent hits on payday, groceries run, morning commute
    { bucket: ids.needs[0], amount: 28000, note: 'Monthly rent',                  daysAgo: 11 },
    { bucket: ids.needs[1], amount:  2450, note: 'Weekly groceries — BigBasket',  daysAgo: 11 },
    { bucket: ids.needs[2], amount:   350, note: 'Auto to office',                daysAgo: 11 },
    // Day 2
    { bucket: ids.wants[0], amount:   780, note: 'Dinner at Barbeque Nation',     daysAgo: 10 },
    { bucket: ids.wants[2], amount:    40, note: 'Cutting chai x2',               daysAgo: 10 },
    // Day 3
    { bucket: ids.needs[2], amount:   280, note: 'Uber to meeting',               daysAgo:  9 },
    { bucket: ids.wants[1], amount:   199, note: 'Netflix monthly',               daysAgo:  9 },
    // Day 4 — electricity bill arrives
    { bucket: ids.needs[3], amount:  3200, note: 'Electricity bill',              daysAgo:  8 },
    { bucket: ids.wants[2], amount:    80, note: 'Coffee + snack',                daysAgo:  8 },
    // Day 5
    { bucket: ids.wants[0], amount:   450, note: 'Lunch with team',               daysAgo:  7 },
    { bucket: ids.needs[1], amount:   890, note: 'Fruits & vegetables',           daysAgo:  7 },
    // Day 6
    { bucket: ids.wants[4], amount:   599, note: 'Movie — Pushpa 3',             daysAgo:  6 },
    { bucket: ids.wants[2], amount:    60, note: 'Cold coffee',                   daysAgo:  6 },
    // Day 7
    { bucket: ids.needs[1], amount:  1850, note: 'Weekly groceries',             daysAgo:  5 },
    { bucket: ids.wants[3], amount:  2499, note: 'Running shoes — Decathlon',    daysAgo:  5 },
    // Day 8
    { bucket: ids.needs[2], amount:   420, note: 'Metro + auto',                 daysAgo:  4 },
    { bucket: ids.wants[0], amount:   320, note: 'Biryani — Swiggy',            daysAgo:  4 },
    // Day 9
    { bucket: ids.wants[5], amount:  1200, note: 'Gym membership — monthly',     daysAgo:  3 },
    { bucket: ids.wants[2], amount:    30, note: 'Coffee break',                 daysAgo:  3 },
    // Day 10
    { bucket: ids.wants[0], amount:   650, note: 'Dinner with friends',          daysAgo:  2 },
    { bucket: ids.wants[2], amount:    80, note: 'Coffee break',                 daysAgo:  2 },
    // Day 11
    { bucket: ids.needs[1], amount:  1240, note: 'Groceries',                    daysAgo:  1 },
    { bucket: ids.wants[2], amount:    80, note: 'Morning coffee',               daysAgo:  1 },
    // Day 12 (today)
    { bucket: ids.wants[0], amount:   450, note: 'Lunch — South Indian',        daysAgo:  0 },
    { bucket: ids.needs[2], amount:   280, note: 'Auto ride',                    daysAgo:  0 },
  ];

  // One trade-off transaction
  const tradeOffTxn = {
    bucket: ids.wants[4],
    amount: 1500,
    note: 'Concert tickets (borrowed from Shopping)',
    daysAgo: 4,
    borrowedFrom: ids.wants[3],
    borrowedAmount: 500,
  };

  txnData.forEach(t => {
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - t.daysAgo);
    timestamp.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

    transactions.push({
      id: uid(),
      cycleId,
      bucketId: t.bucket,
      amount: t.amount,
      type: 'expense',
      note: t.note,
      borrowedFrom: null,
      borrowedAmount: 0,
      timestamp: timestamp.toISOString(),
    });

    // Update bucket spent
    const bucket = buckets.find(b => b.id === t.bucket);
    if (bucket) bucket.spent += t.amount;
  });

  // Add the trade-off transaction
  {
    const t = tradeOffTxn;
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - t.daysAgo);
    timestamp.setHours(19, 30);

    transactions.push({
      id: uid(),
      cycleId,
      bucketId: t.bucket,
      amount: t.amount,
      type: 'expense',
      note: t.note,
      borrowedFrom: t.borrowedFrom,
      borrowedAmount: t.borrowedAmount,
      timestamp: timestamp.toISOString(),
    });

    const target = buckets.find(b => b.id === t.bucket);
    if (target) target.spent += (t.amount - t.borrowedAmount);
    const source = buckets.find(b => b.id === t.borrowedFrom);
    if (source) source.spent += t.borrowedAmount;
  }

  // --- Commitments ---
  // Paid: Rent (due 1st), Electricity (due 5th), Mutual Funds SIP (due 5th).
  // Unpaid: Internet (due 15th), Mobile Bill (due 20th), Subscriptions (due 15th).
  // getMacroReserved('needs') = 999 + 649 = 1,648  → shows hint above Needs bar.
  // getMacroReserved('wants') = 649                → deducted from safe-to-spend.
  const commitments = [
    { id: uid(), name: 'Rent',        emoji: '🏠', amount: 28000, dueDate:  1, macroType: 'needs',  isActive: true, isPaid: true,  createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'Electricity', emoji: '💡', amount:  3200, dueDate:  5, macroType: 'needs',  isActive: true, isPaid: true,  createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'Internet',    emoji: '📡', amount:   999, dueDate: 15, macroType: 'needs',  isActive: true, isPaid: false, createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'Mobile Bill', emoji: '📱', amount:   649, dueDate: 20, macroType: 'needs',  isActive: true, isPaid: false, createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'Subscriptions', emoji: '📺', amount: 649, dueDate: 15, macroType: 'wants',  isActive: true, isPaid: false, createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'Mutual Funds', emoji: '📈', amount: 15000, dueDate: 5, macroType: 'future', isActive: true, isPaid: true,  createdAt: cycleStart.toISOString() },
  ];

  return {
    user: {
      id: uid(),
      name: 'Arjun',
      salary,
      salaryDate: 1,
      preset: 'balanced',
      ratios,
      createdAt: cycleStart.toISOString(),
      updatedAt: now.toISOString(),
    },
    cycles: [{
      id: cycleId,
      startDate: fmtLocal(cycleStart),
      endDate: fmtLocal(cycleEnd),
      salary,
      allocations,
      isActive: true,
      sweepAmount: null,
      createdAt: cycleStart.toISOString(),
    }],
    buckets,
    transactions,
    commitments,
    sweeps: [],
    onboardingComplete: true,
    currentCycleId: cycleId,
  };
}

/**
 * Seed the app with demo data.
 */
export function seedDemoData() {
  const demoState = generateSeedState();
  replaceState(demoState);
  console.log('[Seed] Demo data loaded ✅', demoState);
}

// ---- Dev Toolbar ----

/**
 * Render a dev-only floating toolbar for state inspection and manipulation.
 * Only visible in development mode.
 */
export function renderDevToolbar() {
  // Only in dev mode
  if (import.meta.env.PROD) return;

  // Avoid duplicate toolbars
  if (document.getElementById('dev-toolbar')) return;

  const toolbar = document.createElement('div');
  toolbar.id = 'dev-toolbar';
  toolbar.innerHTML = `
    <style>
      #dev-toolbar {
        position: fixed;
        top: 8px;
        right: 8px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
      }
      #dev-toolbar.collapsed .dev-toolbar__panel { display: none; }
      .dev-toolbar__toggle {
        align-self: flex-end;
        padding: 4px 8px;
        background: #1e1e2e;
        color: #f59e0b;
        border: 1px solid #333;
        border-radius: 6px;
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
      }
      .dev-toolbar__panel {
        background: #1e1e2e;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 160px;
      }
      .dev-toolbar__panel button {
        padding: 5px 8px;
        background: #2a2a3e;
        color: #e2e8f0;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        text-align: left;
        transition: background 0.15s;
      }
      .dev-toolbar__panel button:hover {
        background: #3a3a5e;
      }
      .dev-toolbar__status {
        color: #64748b;
        padding: 2px 4px;
        font-size: 10px;
      }
    </style>
    <button class="dev-toolbar__toggle" id="dev-toggle">🛠 DEV</button>
    <div class="dev-toolbar__panel">
      <button id="dev-seed">🌱 Seed Demo Data</button>
      <button id="dev-reset">🗑️ Reset All Data</button>
      <button id="dev-log">📋 Log State</button>
      <button id="dev-payday">💰 Simulate Payday</button>
      <div class="dev-toolbar__status" id="dev-status">Ready</div>
    </div>
  `;

  document.body.appendChild(toolbar);

  // Toggle collapse
  document.getElementById('dev-toggle').addEventListener('click', () => {
    toolbar.classList.toggle('collapsed');
  });

  // Seed
  document.getElementById('dev-seed').addEventListener('click', () => {
    seedDemoData();
    document.getElementById('dev-status').textContent = '✅ Seeded!';
    setTimeout(() => window.location.reload(), 300);
  });

  // Reset
  document.getElementById('dev-reset').addEventListener('click', () => {
    resetState();
    document.getElementById('dev-status').textContent = '🗑️ Reset!';
    setTimeout(() => window.location.reload(), 300);
  });

  // Log state
  document.getElementById('dev-log').addEventListener('click', () => {
    const state = getState();
    console.group('[Dev] Current State');
    console.log('User:', state.user);
    console.log('Active Cycle:', state.cycles.find(c => c.isActive));
    console.log('Buckets:', state.buckets.filter(b => b.cycleId === state.currentCycleId));
    console.log('Transactions:', state.transactions.length);
    console.log('Commitments:', state.commitments);
    console.log('Sweeps:', state.sweeps);
    console.groupEnd();
    document.getElementById('dev-status').textContent = '📋 Logged to console';
  });

  // Simulate payday
  document.getElementById('dev-payday').addEventListener('click', () => {
    document.getElementById('dev-status').textContent = '💰 Payday (Sprint 9)';
  });

  // Start collapsed
  toolbar.classList.add('collapsed');
}
