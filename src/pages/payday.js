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
import { formatCurrency, percent, cycleDayCount } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { navigate } from '../router.js';

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
    navigate('/dashboard');
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

  // New cycle allocation preview (B6: use user.salary for next month, B1: derive future as remainder)
  const nextSalary = user.salary;
  const ratios = user.ratios;
  const baseNeeds = Math.round(nextSalary * ratios.needs / 100);
  const baseWants = Math.round(nextSalary * ratios.wants / 100);
  const baseFuture = nextSalary - baseNeeds - baseWants;

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

      <!-- Carry-Forward Preview -->
      ${sweepBuckets.length > 0 ? `
        <div class="pd-section">
          <p class="pd-section__title">Carrying Forward → Future</p>
          <p class="pd-section__hint">Unspent Wants &amp; Future roll into next month's Future allocation. Unspent Needs resets — Needs budgets are fresh each cycle.</p>
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
          <p class="pd-section__hint text-tertiary">All Wants &amp; Future were spent this cycle — nothing rolls over. (Needs resets every cycle regardless.)</p>
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

      <button class="btn btn-primary btn-full pd-cta" id="pd-confirm" data-testid="pd-confirm">
        Roll over savings &amp; start fresh →
      </button>
    </div>
  `;

  container.querySelector('#pd-back').addEventListener('click', () => {
    navigate('/dashboard');
  });

  container.querySelector('#pd-confirm').addEventListener('click', () => {
    const sweepRows = container.querySelectorAll('.pd-sweep-row');
    const sweepTotalEl = container.querySelector('.pd-sweep-total');

    if (sweepRows.length > 0) {
      sweepRows.forEach((row, i) => {
        setTimeout(() => row.classList.add('pd-sweep-row--flying'), i * 80);
      });
      if (sweepTotalEl) {
        setTimeout(() => sweepTotalEl.classList.add('pd-sweep-total--flash'), sweepRows.length * 80);
      }
      setTimeout(() => _startNewCycle(container, cycle, user), sweepRows.length * 80 + 500);
    } else {
      _startNewCycle(container, cycle, user);
    }
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

  try {
    const oldCycleId = cycle.id;

    // Run sweep — zeros out unspent Wants+Future and records the amount
    const sweep = runSweep();
    const sweepAmount = sweep?.amount || 0;

    // Build new cycle allocations (B6: use user.salary, B1: derive future as remainder)
    const salary = user.salary;
    const ratios = user.ratios;
    const newNeeds = Math.round(salary * ratios.needs / 100);
    const newWants = Math.round(salary * ratios.wants / 100);
    const newAllocations = {
      needs: newNeeds,
      wants: newWants,
      future: salary - newNeeds - newWants + sweepAmount,
    };

    // Compute next cycle date range in UTC string math (A4: avoid local-tz shift)
    const durationDays = cycleDayCount(cycle.startDate, cycle.endDate);
    const [ey, em, ed] = cycle.endDate.split('-').map(Number);
    const newStartMs = Date.UTC(ey, em - 1, ed + 1);
    const newEndMs   = Date.UTC(ey, em - 1, ed + durationDays);
    const fmtUtc = ms => new Date(ms).toISOString().split('T')[0];

    const newCycle = createCycle({
      startDate: fmtUtc(newStartMs),
      endDate: fmtUtc(newEndMs),
      salary,
      allocations: newAllocations,
    });

    // Copy bucket structure from old cycle with proportional re-allocation
    copyBucketsToNewCycle(oldCycleId, newCycle.id, newAllocations);

    navigate('/dashboard');
    showToast('New pay period started! 🎉', 'success');
  } catch (e) {
    if (btn) btn.disabled = false;
    showToast('Failed to start new pay period — please try again');
    console.error('_startNewCycle failed:', e);
  }
}
