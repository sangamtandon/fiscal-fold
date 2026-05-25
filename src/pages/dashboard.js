/**
 * Fiscal Fold — Dashboard Page (extracted from main.js in DEBT-015)
 *
 * Route: /dashboard
 *
 * Responsible for the entire "home screen" experience: Safe-to-Spend hero,
 * Quick Buckets row, three macro health bars (Needs/Wants/Future), commitments
 * due-soon widget, recent transactions, leak warnings, and the cycle-expired
 * payday banner. All of these were previously inlined into main.js — see
 * DEBT-015 for the rationale.
 */

import {
  getUser,
  getCurrentCycle,
  getBuckets,
  getBucketById,
  getQuickBuckets,
  getTransactions,
  getSafeToSpend,
  getMacroSummary,
  getMacroReserved,
  isCycleExpired,
  getCommitments,
} from '../data/store.js';
import {
  formatCurrency,
  timeAgo,
  percent,
  daysRemaining,
  cycleDayCount,
  escapeHtml,
  ordinalSuffix,
} from '../utils/helpers.js';
import { navigate } from '../router.js';
import { openTransactionModal } from './transaction-modal.js';
import { renderCommitmentDueRow, getDueSoonCommitments } from './commitments.js';

/**
 * Render the dashboard route into `container`.
 * Returns a cleanup function the router calls when leaving the route —
 * here it clears the Safe-To-Spend count-up interval so it doesn't keep
 * mutating a detached node after navigation.
 *
 * @param {HTMLElement} container
 * @param {{
 *   onRenderComplete?: () => void
 * }} [hooks]
 * @returns {() => void}
 */
export function renderDashboardPage(container, hooks = {}) {
  const cycle = getCurrentCycle();
  const user = getUser();

  // If no data, kick back to onboarding. The route handler in main.js
  // already gated on this, but keep the guard local for safety.
  if (!cycle || !user) {
    navigate('/onboarding');
    return () => {};
  }

  const safeToSpend = getSafeToSpend();
  const daysLeft = daysRemaining(cycle.endDate);
  const cycleExpired = isCycleExpired();
  const needsSummary = getMacroSummary('needs');
  const wantsSummary = getMacroSummary('wants');
  const futureSummary = getMacroSummary('future');
  const needsReserved = getMacroReserved('needs');
  const wantsReserved = getMacroReserved('wants');
  const futureReserved = getMacroReserved('future');
  const recentTxns = getTransactions({ limit: 5 });
  const quickBuckets = getQuickBuckets();
  const dueSoon = getDueSoonCommitments();
  // Build leak warnings — suppressed on an expired cycle, where bucket
  // pace is irrelevant and the payday banner is already shown above.
  const leaks = [];
  if (!cycleExpired) {
    const buckets = [...getBuckets('needs'), ...getBuckets('wants'), ...getBuckets('future')];
    const totalCycleDays = cycleDayCount(cycle.startDate, cycle.endDate);
    const elapsed = totalCycleDays - daysLeft;
    const timePercent = totalCycleDays > 0 ? (elapsed / totalCycleDays) * 100 : 0;

    buckets.forEach(b => {
      if (b.allocated > 0) {
        const spentPct = (b.spent / b.allocated) * 100;
        if (spentPct >= 80 && timePercent < 50) {
          leaks.push(b);
        }
      } else if (b.spent > 0) {
        leaks.push(b);
      }
    });
  }

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <!-- Payday Banner — shown when cycle has expired -->
      ${cycleExpired ? `
        <div class="card payday-banner" id="payday-banner" data-testid="payday-banner" role="button" tabindex="0" aria-label="Start payday ritual" style="border-color: var(--accent-primary); border-left-width: 3px; background: linear-gradient(135deg, rgba(52, 211, 153, 0.08), transparent); cursor: pointer;">
          <div class="flex items-center gap-3">
            <span style="font-size: 28px;" aria-hidden="true">🎉</span>
            <div style="flex: 1; min-width: 0;">
              <p class="font-semibold" style="font-size: var(--text-sm); color: var(--accent-primary);">It's payday!</p>
              <p class="text-tertiary" style="font-size: var(--text-xs);">Roll over your savings to start fresh.</p>
            </div>
            <span style="color: var(--accent-primary); font-size: var(--text-base);">→</span>
          </div>
        </div>
      ` : ''}

      <!-- Safe to Spend Hero -->
      <div class="card card--accent text-center safe-to-spend-card" style="padding: var(--space-7) var(--space-5);">
        <p class="text-secondary safe-to-spend-card__label" style="font-size: var(--text-sm); margin-bottom: var(--space-2); text-transform: uppercase; letter-spacing: 0.1em;">Wants budget — safe to spend</p>
        <div class="hero-amount-wrap" id="hero-amount-wrap">
          <p class="text-mono" style="font-size: var(--text-hero); font-weight: var(--weight-black); background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1;" id="hero-amount" data-testid="safe-to-spend">₹0</p>
        </div>
        <p class="text-tertiary mt-2 safe-to-spend-card__hint" style="font-size: var(--text-xs); line-height: 1.4; max-width: 280px; margin-left: auto; margin-right: auto;" data-testid="safe-to-spend-hint">Needs &amp; Future are set aside — this is your guilt-free Wants money for the next ${daysLeft} day${daysLeft === 1 ? '' : 's'} to payday.</p>
      </div>

      <!-- Quick Buckets Row -->
      ${quickBuckets.length > 0 ? `
        <div>
          <div class="section-header" style="margin-bottom: var(--space-2);">
            <span class="section-header__title">Quick Buckets</span>
            <span class="text-tertiary" style="font-size: var(--text-xs); margin-left: var(--space-2);">— tap to log a spend</span>
          </div>
          <div class="quick-buckets">
            ${quickBuckets.map(b => `
              <button type="button" class="quick-bucket" data-bucket-id="${escapeHtml(b.id)}" aria-label="Log spend for ${escapeHtml(b.name)}">
                <div class="quick-bucket__emoji" aria-hidden="true">${escapeHtml(b.emoji)}</div>
                <span class="quick-bucket__name">${escapeHtml(b.name)}</span>
                <span class="text-mono" style="font-size:var(--text-xs); font-weight:var(--weight-semibold); color:var(--accent-primary);">${formatCurrency(Math.max(0, b.allocated - b.spent))}</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Macro Health Bars -->
      <div class="flex flex-col gap-4" id="macro-bars-container">
        ${renderMacroBar('Needs', needsSummary, 'needs', needsReserved)}
        ${renderMacroBar('Wants', wantsSummary, 'wants', wantsReserved)}
        ${renderMacroBar('Future', futureSummary, 'future', futureReserved)}
      </div>

      <!-- Commitments Due Soon -->
      ${dueSoon.length > 0 ? `
        <div class="card" style="padding: var(--space-4);">
          <div class="section-header" style="margin-bottom: var(--space-3);">
            <span class="section-header__title">Due Soon</span>
            <button class="btn btn-ghost" style="font-size: var(--text-xs);" onclick="window.location.hash='#/commitments'">Manage →</button>
          </div>
          ${dueSoon.map(c => renderCommitmentDueRow(c)).join('')}
        </div>
      ` : ''}

      <!-- Recent Transactions -->
      <div>
        <div class="section-header">
          <span class="section-header__title">Recent Transactions</span>
          <button class="btn btn-ghost" style="font-size: var(--text-xs);" id="btn-see-all-txns">See all</button>
        </div>
        <div class="flex flex-col gap-2">
          ${recentTxns.length > 0
            ? recentTxns.map(t => {
                const bucket = getBucketById(t.bucketId);
                return renderTransaction(
                  bucket?.emoji || '📝',
                  bucket?.name || 'Unknown',
                  t.amount,
                  timeAgo(t.timestamp),
                  t.borrowedFrom ? getBucketById(t.borrowedFrom)?.name : null,
                  t.note,
                  t.type,
                );
              }).join('')
            : '<p class="text-tertiary text-center" data-testid="txn-empty-state" style="padding: var(--space-6); font-size: var(--text-sm);">No transactions yet. Tap the green ＋ button below to log your first.</p>'
          }
        </div>
      </div>

      <!-- Leak Warnings (hidden on expired cycle — see leak gate above) -->
      ${cycleExpired ? '' : (leaks.length > 0 ? leaks.map(b => `
        <div class="card leak-warning-card" role="button" tabindex="0" aria-label="Log spend or adjust budget for ${escapeHtml(b.name)}" data-leak-bucket-id="${escapeHtml(b.id)}" style="border-color: var(--warn); border-left-width: 3px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), transparent); cursor: pointer;">
          <div class="flex items-center gap-3">
            <span style="font-size: 24px;" aria-hidden="true">⚡</span>
            <div style="flex: 1; min-width: 0;">
              <p class="font-semibold" style="font-size: var(--text-sm); color: var(--warn);">${escapeHtml(b.name)} — ${percent(b.spent, b.allocated)}% spent with ${daysLeft} day${daysLeft === 1 ? '' : 's'} left</p>
              <p class="text-tertiary" style="font-size: var(--text-xs);">Tap to log a spend here or adjust the budget.</p>
            </div>
          </div>
        </div>
      `).join('') : `
        <div class="card insight-all-clear" style="border-color: var(--accent-primary); border-left-width: 3px; background: linear-gradient(135deg, rgba(52, 211, 153, 0.06), transparent);">
          <div class="flex items-center gap-3">
            <span style="font-size: 24px;">✅</span>
            <div>
              <p class="font-semibold" style="font-size: var(--text-sm); color: var(--accent-primary);">All clear</p>
              <p class="text-tertiary" style="font-size: var(--text-xs);">All buckets are on pace this pay period. Keep it up!</p>
            </div>
          </div>
        </div>
      `)}
    </div>
  `;

  // ---- Wiring ----

  container.querySelector('#btn-see-all-txns')?.addEventListener('click', () => navigate('/transactions'));

  // Animate health bars from 0 → target width
  requestAnimationFrame(() => {
    container.querySelectorAll('[data-width]').forEach(el => {
      el.style.width = `${el.dataset.width}%`;
    });
  });

  // Quick-bucket chips → open modal pre-targeted
  container.querySelectorAll('.quick-bucket[data-bucket-id]').forEach(chip => {
    chip.addEventListener('click', () => {
      openTransactionModal(chip.dataset.bucketId);
    });
  });

  // Payday banner → navigate to payday ritual
  if (cycleExpired) {
    container.querySelector('#payday-banner')?.addEventListener('click', () => {
      navigate('/payday');
    });
  }

  // Leak warning cards → open modal pre-targeted to the hot bucket
  container.querySelectorAll('.leak-warning-card[data-leak-bucket-id]').forEach(card => {
    card.addEventListener('click', () => {
      openTransactionModal(card.dataset.leakBucketId);
    });
  });

  // Safe To Spend count-up animation
  const heroAmount = container.querySelector('#hero-amount');
  const heroWrap = container.querySelector('#hero-amount-wrap');
  let timer;

  if (heroAmount && heroWrap) {
    const duration = 600;
    const frames = 30;
    const interval = duration / frames;
    let currentFrame = 0;

    heroWrap.classList.add('is-animating');
    timer = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / frames;
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const currentAmount = Math.round(safeToSpend * ease);
      heroAmount.textContent = formatCurrency(currentAmount);

      if (currentFrame >= frames) {
        clearInterval(timer);
        heroAmount.textContent = formatCurrency(safeToSpend);
        setTimeout(() => heroWrap.classList.remove('is-animating'), 200);
      }
    }, interval);
  }

  // Expand/collapse macro bars
  const macroBarsContainer = container.querySelector('#macro-bars-container');
  if (macroBarsContainer) {
    macroBarsContainer.addEventListener('click', (e) => {
      const unallocBanner = e.target.closest('.macro-card__unallocated');
      if (unallocBanner) {
        e.stopPropagation();
        navigate('/settings');
        return;
      }
      const card = e.target.closest('.macro-card');
      if (card) {
        const isExpanded = card.classList.toggle('is-expanded');
        card.setAttribute('aria-expanded', isExpanded.toString());
      }
    });
  }

  // Keyboard accessibility for div/card buttons
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const roleBtn = e.target.closest('[role="button"]');
      if (roleBtn) {
        e.preventDefault();
        roleBtn.click();
      }
    }
  });

  hooks.onRenderComplete?.();

  return () => { if (timer) clearInterval(timer); };
}

// ---- Private renderers ----

/**
 * @param {string} label
 * @param {{ allocated: number, spent: number, remaining: number, percent: number, cycleAllocation: number, unallocated: number }} summary
 * @param {string} type
 * @param {number} [reserved=0]
 */
function renderMacroBar(label, summary, type, reserved = 0) {
  const unallocated = summary.unallocated ?? 0;
  const buckets = getBuckets(type);
  const activeCommitments = getCommitments().filter(c => c.macroType === type);
  const commitmentMap = {};
  activeCommitments.forEach(c => { commitmentMap[c.name.toLowerCase()] = c; });

  const unallocatedBanner = unallocated !== 0 ? `
    <div class="macro-card__unallocated"
      role="button"
      tabindex="0"
      aria-label="${unallocated > 0 ? 'Assign unallocated budget in settings' : 'Fix over-allocated budget in settings'}"
      data-macro-jump-settings="1"
      style="margin-top: var(--space-2); display:flex; align-items:center; gap: var(--space-2); width:100%; padding: var(--space-2) var(--space-3); background: ${unallocated > 0 ? 'rgba(245, 158, 11, 0.10)' : 'rgba(239, 68, 68, 0.10)'}; border: 1px solid ${unallocated > 0 ? 'var(--warn)' : 'var(--danger, #ef4444)'}; border-radius: var(--radius-md); cursor: pointer;">
      <span style="font-size: 14px;">${unallocated > 0 ? '💡' : '⚠️'}</span>
      <span class="text-mono font-semibold" style="font-size: var(--text-xs); color: ${unallocated > 0 ? 'var(--warn)' : 'var(--danger, #ef4444)'};">${formatCurrency(Math.abs(unallocated))}</span>
      <span class="text-tertiary" style="font-size: var(--text-xs); flex:1;">${unallocated > 0 ? 'left to assign — tap Settings to add it to a bucket' : 'over-allocated — tap Settings to trim a bucket'}</span>
    </div>
  ` : '';

  // Future: locked goals list — no depleting bar (savings are reserved upfront, not spent down)
  if (type === 'future') {
    const totalLocked = summary.allocated;
    return `
      <div class="card macro-card" style="padding: var(--space-4);">
        <div class="macro-card__header" role="button" tabindex="0" aria-expanded="false" aria-label="Toggle Future buckets">
          <span class="font-semibold" style="font-size: var(--text-sm);">Future</span>
          <div class="flex items-center gap-2">
            <span class="text-mono text-secondary" style="font-size: var(--text-sm);">${formatCurrency(totalLocked)} locked</span>
            <svg class="macro-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        ${unallocatedBanner}
        <div class="macro-card__buckets">
          <div class="macro-card__buckets-inner">
            ${buckets.length > 0 ? buckets.map(b => `
              <div class="micro-bucket-row">
                <div class="micro-bucket-row__emoji">${escapeHtml(b.emoji)}</div>
                <div class="micro-bucket-row__name">${escapeHtml(b.name)}</div>
                <div class="micro-bucket-row__amount" style="color: var(--text-secondary);">${formatCurrency(b.allocated)}<span style="font-size: var(--text-xs); font-weight: normal; color: var(--text-tertiary);">/mo</span></div>
                <div class="micro-bucket-row__progress" style="visibility: hidden;"></div>
              </div>
            `).join('') : `<p class="text-tertiary text-center" style="font-size: var(--text-xs); padding: var(--space-2);">No buckets configured.</p>`}
            ${buckets.length > 0 ? `
              <div style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-1); margin-top: var(--space-1); border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06));">
                <span style="font-size: 13px;">🔒</span>
                <span class="text-tertiary" style="font-size: var(--text-xs);">Transfers out at payday</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Needs + Wants: depleting health bar
  const remainingPct = 100 - summary.percent;
  const isOverspent = summary.percent > 100;
  const isFresh = summary.spent === 0 && summary.allocated > 0;
  let fillClass = `health-bar__fill--${type}`;

  if (remainingPct <= 0) {
    fillClass = 'health-bar__fill--depleted';
  } else if (remainingPct <= 20 && type === 'wants') {
    fillClass = 'health-bar__fill--warn';
  }

  const variableBuckets = buckets.filter(b => !commitmentMap[b.name.toLowerCase()]);
  const variableRemaining = variableBuckets.reduce((acc, b) => acc + Math.max(0, b.allocated - b.spent), 0);
  const available = variableRemaining;
  const belowBarRight = isFresh
    ? `<span class="text-tertiary" style="font-size: var(--text-xs);">Nothing tracked yet</span>`
    : `<span class="text-tertiary" style="font-size: var(--text-xs);">${formatCurrency(available)} available</span>`;

  return `
    <div class="card macro-card" style="padding: var(--space-4);">
      <div class="macro-card__header" role="button" tabindex="0" aria-expanded="false" aria-label="Toggle ${label} buckets">
        <span class="font-semibold" style="font-size: var(--text-sm);">${label}</span>
        <div class="flex items-center gap-2">
          ${isOverspent ? `<span class="badge badge--amber" style="font-size: var(--text-xs);">Overspent by ${summary.percent - 100}%</span>` : ''}
          <span class="text-mono text-secondary" style="font-size: var(--text-sm);">${formatCurrency(summary.remaining)}</span>
          <svg class="macro-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="health-bar health-bar--lg" role="progressbar" aria-valuenow="${Math.max(0, remainingPct)}" aria-valuemin="0" aria-valuemax="100" aria-label="${label} budget: ${Math.max(0, remainingPct)}% remaining">
        <div class="${fillClass} health-bar__fill" style="width:0" data-width="${Math.max(0, remainingPct)}"></div>
      </div>
      <div class="flex justify-between mt-2">
        <span class="text-tertiary" style="font-size: var(--text-xs);">Spent ${formatCurrency(summary.spent)}</span>
        ${belowBarRight}
      </div>
      ${unallocatedBanner}
      <div class="macro-card__buckets">
        <div class="macro-card__buckets-inner">
          ${buckets.length > 0 ? buckets.map(b => {
            const commitment = commitmentMap[b.name.toLowerCase()];
            if (commitment) {
              if (commitment.isPaid) {
                return `
                  <div class="micro-bucket-row" style="opacity: 0.45;">
                    <div class="micro-bucket-row__emoji">${escapeHtml(b.emoji)}</div>
                    <div class="micro-bucket-row__name">${escapeHtml(b.name)}</div>
                    <div class="micro-bucket-row__amount" style="color: var(--accent-primary); font-size: var(--text-xs);">Paid ✓</div>
                    <div class="micro-bucket-row__progress" style="visibility: hidden;"></div>
                  </div>
                `;
              } else {
                return `
                  <div class="micro-bucket-row">
                    <div class="micro-bucket-row__emoji" style="opacity: 0.6;">${escapeHtml(b.emoji)}</div>
                    <div class="micro-bucket-row__name" style="color: var(--text-tertiary);">${escapeHtml(b.name)}</div>
                    <div class="micro-bucket-row__amount" style="color: var(--warn); font-size: var(--text-xs);">Due ${commitment.dueDate}${ordinalSuffix(commitment.dueDate)}</div>
                    <div class="micro-bucket-row__progress" style="visibility: hidden;"></div>
                  </div>
                `;
              }
            }
            const bRemainingPct = b.allocated > 0 ? Math.max(0, 100 - (b.spent / b.allocated) * 100) : 0;
            return `
              <div class="micro-bucket-row">
                <div class="micro-bucket-row__emoji">${escapeHtml(b.emoji)}</div>
                <div class="micro-bucket-row__name">${escapeHtml(b.name)}</div>
                <div class="micro-bucket-row__amount">${formatCurrency(Math.max(0, b.allocated - b.spent))}</div>
                <div class="micro-bucket-row__progress">
                  <div class="micro-bucket-row__fill ${fillClass}" style="width:0" data-width="${bRemainingPct}"></div>
                </div>
              </div>
            `;
          }).join('') : `<p class="text-tertiary text-center" style="font-size: var(--text-xs); padding: var(--space-2);">No buckets configured.</p>`}
        </div>
      </div>
    </div>
  `;
}

function renderTransaction(emoji, name, amount, time, borrowedFromName, note, type = 'expense') {
  const isIncome = type === 'income' || type === 'refund';
  return `
    <div class="card" style="padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
      <span style="font-size: 22px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border-radius: var(--radius-md); flex-shrink: 0;">${escapeHtml(emoji)}</span>
      <div style="flex: 1; min-width: 0;">
        <div class="flex items-center gap-2">
          <p class="font-medium" style="font-size: var(--text-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(name)}</p>
          ${note ? `<span class="text-tertiary" style="font-size: var(--text-xs); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">• ${escapeHtml(note)}</span>` : ''}
        </div>
        <p class="text-tertiary" style="font-size: var(--text-xs);">${escapeHtml(time)}${borrowedFromName ? ` · <span class="badge badge--amber" style="font-size: 10px; padding: 1px 6px;">from ${escapeHtml(borrowedFromName)}</span>` : ''}</p>
      </div>
      <span class="text-mono font-semibold" style="font-size: var(--text-sm); flex-shrink: 0; ${isIncome ? 'color: var(--accent-primary);' : ''}">${isIncome ? '+' : '−'}${formatCurrency(amount)}</span>
    </div>
  `;
}
