/**
 * Fiscal Fold — Payday Ritual Page (Sprint 9)
 *
 * Route: /payday
 * Shows last cycle scorecard, sweep preview, and starts a new cycle.
 */

import './payday.css';
import {
  getCurrentCycle,
  getUser,
  getMacroSummary,
  getBuckets,
  runSweep,
  createCycle,
  copyBucketsToNewCycle,
} from '../data/store.js';
import { formatCurrency, percent } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

const _macroColor = {
  needs: 'var(--needs)',
  wants: 'var(--wants)',
  future: 'var(--future)',
};

/**
 * @param {HTMLElement} container
 */
export function renderPaydayPage(container) {
  const cycle = getCurrentCycle();
  const user = getUser();

  if (!cycle || !user) {
    import('../router.js').then(({ navigate }) => navigate('/dashboard'));
    return;
  }

  const needsSummary = getMacroSummary('needs');
  const wantsSummary = getMacroSummary('wants');
  const futureSummary = getMacroSummary('future');

  const totalSpent = needsSummary.spent + wantsSummary.spent + futureSummary.spent;
  const totalAllocated = needsSummary.allocated + wantsSummary.allocated + futureSummary.allocated;

  // Compute sweep preview (what will carry forward)
  const sweepBuckets = [...getBuckets('wants'), ...getBuckets('future')]
    .map(b => ({ ...b, remaining: Math.max(0, b.allocated - b.spent) }))
    .filter(b => b.remaining > 0);
  const sweepTotal = sweepBuckets.reduce((s, b) => s + b.remaining, 0);

  // New cycle allocation preview
  const salary = user.salary;
  const ratios = user.ratios;
  const baseNeeds = Math.round(salary * ratios.needs / 100);
  const baseWants = Math.round(salary * ratios.wants / 100);
  const baseFuture = Math.round(salary * ratios.future / 100);

  container.innerHTML = `
    <div class="pd-page">
      <div class="pd-header">
        <button class="btn btn-ghost pd-back" id="pd-back">← Dashboard</button>
        <h1 class="pd-title">Payday! 💰</h1>
        <div style="width:80px"></div>
      </div>

      <p class="pd-subtitle">Close out last month and start fresh.</p>

      <!-- Last Month Scorecard -->
      <div class="pd-section">
        <p class="pd-section__title">Last Month's Summary</p>
        <div class="pd-scorecard">
          <div class="pd-stat">
            <span class="pd-stat__value text-mono">${formatCurrency(totalSpent)}</span>
            <span class="pd-stat__label">Total Spent</span>
          </div>
          <div class="pd-stat">
            <span class="pd-stat__value text-mono">${totalAllocated > 0 ? percent(totalSpent, totalAllocated) : 0}%</span>
            <span class="pd-stat__label">Budget Used</span>
          </div>
          <div class="pd-stat pd-stat--highlight">
            <span class="pd-stat__value text-mono">${formatCurrency(sweepTotal)}</span>
            <span class="pd-stat__label">Carrying Forward</span>
          </div>
        </div>

        <div class="pd-macro-rows">
          ${_macroRow('Needs', needsSummary, 'needs')}
          ${_macroRow('Wants', wantsSummary, 'wants')}
          ${_macroRow('Future', futureSummary, 'future')}
        </div>
      </div>

      <!-- Sweep Preview -->
      ${sweepBuckets.length > 0 ? `
        <div class="pd-section">
          <p class="pd-section__title">Carrying Forward → Future</p>
          <p class="pd-section__hint">Unspent Wants & Future roll into next month's Future allocation.</p>
          <div class="pd-sweep-list">
            ${sweepBuckets.map(b => `
              <div class="pd-sweep-row">
                <span class="pd-sweep-row__emoji">${b.emoji}</span>
                <span class="pd-sweep-row__name">${b.name}</span>
                <span class="pd-sweep-row__amount text-mono">+${formatCurrency(b.remaining)}</span>
              </div>
            `).join('')}
          </div>
          <div class="pd-sweep-total">
            <span>Total carry-forward</span>
            <span class="text-mono font-semibold">${formatCurrency(sweepTotal)}</span>
          </div>
        </div>
      ` : `
        <div class="pd-section">
          <p class="pd-section__title">Carrying Forward → Future</p>
          <p class="pd-section__hint text-tertiary">All budgets were fully spent this month — nothing to carry forward.</p>
        </div>
      `}

      <!-- New Cycle Preview -->
      <div class="pd-section">
        <p class="pd-section__title">Next Month's Budget</p>
        <div class="pd-alloc-rows">
          ${_allocRow('Needs', baseNeeds, 0, 'needs')}
          ${_allocRow('Wants', baseWants, 0, 'wants')}
          ${_allocRow('Future', baseFuture, sweepTotal, 'future')}
        </div>
      </div>

      <button class="btn btn-primary btn-full pd-cta" id="pd-confirm">
        Sweep & Start New Cycle →
      </button>
    </div>
  `;

  container.querySelector('#pd-back').addEventListener('click', () => {
    import('../router.js').then(({ navigate }) => navigate('/dashboard'));
  });

  container.querySelector('#pd-confirm').addEventListener('click', () => {
    _startNewCycle(container, cycle, user);
  });
}

// ---- Helpers ----

function _macroRow(label, summary, type) {
  const spentPct = summary.allocated > 0 ? percent(summary.spent, summary.allocated) : 0;
  return `
    <div class="pd-macro-row">
      <span class="pd-macro-row__dot" style="background:${_macroColor[type]}"></span>
      <span class="pd-macro-row__label">${label}</span>
      <span class="pd-macro-row__bar">
        <div class="pd-macro-row__fill" style="width:${Math.min(100, spentPct)}%; background:${_macroColor[type]}"></div>
      </span>
      <span class="pd-macro-row__spent text-mono">${formatCurrency(summary.spent)}</span>
    </div>
  `;
}

function _allocRow(label, base, bonus, type) {
  return `
    <div class="pd-alloc-row">
      <span class="pd-alloc-row__dot" style="background:${_macroColor[type]}"></span>
      <span class="pd-alloc-row__label">${label}</span>
      <span class="pd-alloc-row__amount text-mono">${formatCurrency(base + bonus)}</span>
      ${bonus > 0 ? `<span class="pd-alloc-row__bonus">+${formatCurrency(bonus)} swept</span>` : ''}
    </div>
  `;
}

function _startNewCycle(container, cycle, user) {
  // Disable button to prevent double-tap
  const btn = container.querySelector('#pd-confirm');
  if (btn) btn.disabled = true;

  const oldCycleId = cycle.id;

  // Run sweep — zeros out unspent Wants+Future and records the amount
  const sweep = runSweep();
  const sweepAmount = sweep?.amount || 0;

  // Build new cycle allocations
  const salary = user.salary;
  const ratios = user.ratios;
  const newAllocations = {
    needs: Math.round(salary * ratios.needs / 100),
    wants: Math.round(salary * ratios.wants / 100),
    future: Math.round(salary * ratios.future / 100) + sweepAmount,
  };

  // Compute next cycle date range (same duration as old cycle)
  const oldStart = new Date(cycle.startDate);
  const oldEnd = new Date(cycle.endDate);
  const durationDays = Math.ceil((oldEnd - oldStart) / (1000 * 60 * 60 * 24));

  const newStart = new Date(oldEnd);
  newStart.setDate(newStart.getDate() + 1);
  const newEnd = new Date(newStart);
  newEnd.setDate(newEnd.getDate() + durationDays);

  const fmt = d => d.toISOString().split('T')[0];

  const newCycle = createCycle({
    startDate: fmt(newStart),
    endDate: fmt(newEnd),
    salary,
    allocations: newAllocations,
  });

  // Copy bucket structure from old cycle with proportional re-allocation
  copyBucketsToNewCycle(oldCycleId, newCycle.id, newAllocations);

  import('../router.js').then(({ navigate }) => {
    navigate('/dashboard');
    showToast('New cycle started! 🎉', 'success');
  });
}
