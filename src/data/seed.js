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
  const cycleId = uid();
  const salary = 168000;
  const ratios = { needs: 50, wants: 30, future: 20 };
  const allocations = {
    needs: Math.round(salary * ratios.needs / 100),
    wants: Math.round(salary * ratios.wants / 100),
    future: Math.round(salary * ratios.future / 100),
  };

  // --- Micro Buckets ---
  const buckets = [];

  // Needs buckets
  const needsBuckets = [
    { name: 'Groceries', emoji: '🛒', pct: 0.35, pinned: true },
    { name: 'Transport', emoji: '🚕', pct: 0.20, pinned: true },
    { name: 'Utilities', emoji: '💡', pct: 0.15, pinned: false },
    { name: 'Healthcare', emoji: '🏥', pct: 0.15, pinned: false },
    { name: 'Household', emoji: '🏠', pct: 0.15, pinned: false },
  ];

  needsBuckets.forEach((b, i) => {
    buckets.push({
      id: `needs-${i}`,
      cycleId,
      macroType: 'needs',
      name: b.name,
      emoji: b.emoji,
      allocated: Math.round(allocations.needs * b.pct),
      spent: 0,
      isPinned: b.pinned,
      sortOrder: i,
      createdAt: cycleStart.toISOString(),
    });
  });

  // Wants buckets
  const wantsBuckets = [
    { name: 'Dining Out', emoji: '🍕', pct: 0.25, pinned: true },
    { name: 'Entertainment', emoji: '🎬', pct: 0.20, pinned: true },
    { name: 'Chai & Snacks', emoji: '☕', pct: 0.10, pinned: false },
    { name: 'Shopping', emoji: '🛍️', pct: 0.20, pinned: false },
    { name: 'Self Care', emoji: '💆', pct: 0.15, pinned: false },
    { name: 'Subscriptions', emoji: '📱', pct: 0.10, pinned: false },
  ];

  wantsBuckets.forEach((b, i) => {
    buckets.push({
      id: `wants-${i}`,
      cycleId,
      macroType: 'wants',
      name: b.name,
      emoji: b.emoji,
      allocated: Math.round(allocations.wants * b.pct),
      spent: 0,
      isPinned: b.pinned,
      sortOrder: i,
      createdAt: cycleStart.toISOString(),
    });
  });

  // Future buckets
  const futureBuckets = [
    { name: 'Emergency Fund', emoji: '🛡️', pct: 0.40, pinned: false },
    { name: 'Japan Trip ✈️', emoji: '🌸', pct: 0.30, pinned: false },
    { name: 'Value Investing', emoji: '📈', pct: 0.30, pinned: false },
  ];

  futureBuckets.forEach((b, i) => {
    buckets.push({
      id: `future-${i}`,
      cycleId,
      macroType: 'future',
      name: b.name,
      emoji: b.emoji,
      allocated: Math.round(allocations.future * b.pct),
      spent: 0,
      isPinned: b.pinned,
      sortOrder: i,
      createdAt: cycleStart.toISOString(),
    });
  });

  // --- Transactions (simulate 12 days of spending) ---
  const transactions = [];

  const txnData = [
    // Day 1
    { bucket: 'needs-0', amount: 2450, note: 'Weekly groceries - BigBasket', daysAgo: 11 },
    { bucket: 'needs-1', amount: 350, note: 'Auto to office', daysAgo: 11 },
    // Day 2
    { bucket: 'wants-0', amount: 780, note: 'Dinner at Barbeque Nation', daysAgo: 10 },
    { bucket: 'wants-2', amount: 40, note: 'Cutting chai x2', daysAgo: 10 },
    // Day 3
    { bucket: 'needs-1', amount: 280, note: 'Uber to meeting', daysAgo: 9 },
    { bucket: 'wants-5', amount: 199, note: 'Spotify monthly', daysAgo: 9 },
    // Day 4
    { bucket: 'needs-2', amount: 3200, note: 'Electricity bill', daysAgo: 8 },
    { bucket: 'wants-2', amount: 80, note: 'Tea + samosa', daysAgo: 8 },
    // Day 5
    { bucket: 'wants-0', amount: 450, note: 'Lunch with team', daysAgo: 7 },
    { bucket: 'needs-0', amount: 890, note: 'Fruits & vegetables', daysAgo: 7 },
    // Day 6
    { bucket: 'wants-1', amount: 599, note: 'Movie - Pushpa 3', daysAgo: 6 },
    { bucket: 'wants-2', amount: 60, note: 'Popcorn + cold coffee', daysAgo: 6 },
    // Day 7
    { bucket: 'needs-0', amount: 1850, note: 'Weekly groceries', daysAgo: 5 },
    { bucket: 'wants-3', amount: 2499, note: 'Running shoes - Decathlon', daysAgo: 5 },
    // Day 8
    { bucket: 'needs-1', amount: 420, note: 'Metro + auto', daysAgo: 4 },
    { bucket: 'wants-0', amount: 320, note: 'Biryani - Swiggy', daysAgo: 4 },
    // Day 9
    { bucket: 'wants-4', amount: 1200, note: 'Haircut + grooming', daysAgo: 3 },
    { bucket: 'wants-2', amount: 30, note: 'Chai break', daysAgo: 3 },
    // Day 10
    { bucket: 'needs-3', amount: 850, note: 'Pharmacy - vitamins', daysAgo: 2 },
    { bucket: 'wants-0', amount: 650, note: 'Pizza party with friends', daysAgo: 2 },
    // Day 11
    { bucket: 'needs-0', amount: 1240, note: 'Groceries', daysAgo: 1 },
    { bucket: 'wants-2', amount: 80, note: 'Chai & snacks', daysAgo: 1 },
    // Day 12 (today)
    { bucket: 'wants-0', amount: 450, note: 'Lunch - South Indian', daysAgo: 0 },
    { bucket: 'needs-1', amount: 280, note: 'Auto ride', daysAgo: 0 },
  ];

  // One trade-off transaction
  const tradeOffTxn = {
    bucket: 'wants-1',
    amount: 1500,
    note: 'Concert tickets (borrowed from Shopping)',
    daysAgo: 4,
    borrowedFrom: 'wants-3',
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
  const commitments = [
    { id: uid(), name: 'Rent', emoji: '🏠', amount: 25000, dueDate: 5, macroType: 'needs', isActive: true, isPaid: true, createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'WiFi', emoji: '📶', amount: 999, dueDate: 10, macroType: 'needs', isActive: true, isPaid: true, createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'Netflix', emoji: '🎬', amount: 649, dueDate: 15, macroType: 'wants', isActive: true, isPaid: false, createdAt: cycleStart.toISOString() },
    { id: uid(), name: 'SIP - Mutual Fund', emoji: '📈', amount: 10000, dueDate: 5, macroType: 'future', isActive: true, isPaid: true, createdAt: cycleStart.toISOString() },
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
      startDate: cycleStart.toISOString(),
      endDate: cycleEnd.toISOString(),
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
