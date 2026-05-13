/**
 * Fiscal Fold — Main Entry Point
 * App Shell: Header + Router + FAB
 * Integrated with Store (Sprint 2) + Onboarding (Sprint 3)
 */

import './style.css';
import './pages/onboarding.css';
import { route, navigate, initRouter, currentRoute } from './router.js';
import { renderOnboarding } from './pages/onboarding.js';
import {
  getUser,
  isOnboardingComplete,
  getCurrentCycle,
  getBuckets,
  getBucketById,
  getQuickBuckets,
  getTransactions,
  getSafeToSpend,
  getMacroSummary,
  getCommitments,
} from './data/store.js';
import { seedDemoData, renderDevToolbar } from './data/seed.js';
import { formatCurrency, timeAgo, percent, daysRemaining } from './utils/helpers.js';

// ---- App Shell ----

function renderAppShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <!-- Header -->
    <header class="app-header" id="app-header">
      <div class="app-header__greeting">
        <span class="app-header__name" id="header-greeting">Fiscal Fold</span>
        <span class="app-header__subtitle" id="header-subtitle">Smart Envelope Budgeting</span>
      </div>
      <div class="app-header__actions">
        <button class="btn-icon btn-ghost" id="btn-settings" aria-label="Settings" title="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Content (Router Mount) -->
    <main class="app-main" id="router-mount"></main>

    <!-- Floating Action Button -->
    <button class="fab fab--pulse" id="fab-add" aria-label="Log transaction" title="Log a transaction">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <!-- Toast Container -->
    <div class="toast" id="toast" role="alert" aria-live="polite"></div>
  `;

  // Wire up header events
  document.getElementById('btn-settings').addEventListener('click', () => {
    navigate('/settings');
  });

  // FAB click (will be wired to logging flow in Sprint 5)
  document.getElementById('fab-add').addEventListener('click', () => {
    showToast('Transaction logging coming in Sprint 5 ✨');
  });
}

// ---- Toast System ----

let toastTimeout = null;

/**
 * Show a brief toast notification.
 * @param {string} message
 * @param {'default'|'success'} [type='default']
 * @param {number} [duration=2500]
 */
export function showToast(message, type = 'default', duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast is-visible ${type === 'success' ? 'toast--success' : ''}`;

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, duration);
}

// ---- Update Header ----

/**
 * Update the header greeting from store data.
 */
export function updateHeaderGreeting() {
  const user = getUser();
  const el = document.getElementById('header-greeting');
  const sub = document.getElementById('header-subtitle');
  if (el && user?.name) {
    el.textContent = `Hey, ${user.name} 👋`;
    sub.textContent = 'Your finances, your rules.';
  }
}

/**
 * Show/hide shell elements based on current route.
 */
function updateShellVisibility() {
  const path = currentRoute();
  const isOnboarding = path.startsWith('/onboarding');
  const header = document.getElementById('app-header');
  const fab = document.getElementById('fab-add');

  if (header) header.style.display = isOnboarding ? 'none' : '';
  if (fab) fab.style.display = isOnboarding ? 'none' : '';
}

// ---- Register Pages ----

function registerRoutes() {
  // Landing page (entry point for new users)
  route('/onboarding', (container) => {
    updateShellVisibility();
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-6" style="min-height: 80dvh; text-align: center; padding: var(--space-8);">
        <div style="width: 80px; height: 80px; border-radius: var(--radius-xl); background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 40px; box-shadow: var(--shadow-glow-green);">
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <path d="M16 44 L32 16 L48 44 Z" fill="none" stroke="white" stroke-width="3" stroke-linejoin="round"/>
            <path d="M24 38 L32 24 L40 38 Z" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <div>
          <h1 style="font-size: var(--text-2xl); font-weight: var(--weight-bold); margin-bottom: var(--space-2);">Fiscal Fold</h1>
          <p class="text-secondary" style="font-size: var(--text-base); max-width: 280px; margin: 0 auto;">Smart envelope budgeting.<br/>Know exactly what's safe to spend.</p>
        </div>
        <div class="flex flex-col gap-3 w-full" style="max-width: 300px;">
          <button class="btn btn-primary btn-lg btn-full" id="btn-start-onboarding">
            Get Started
          </button>
          <button class="btn btn-ghost" id="btn-skip-to-demo">
            Skip to demo dashboard →
          </button>
        </div>
        <p class="text-tertiary" style="font-size: var(--text-xs); margin-top: var(--space-4);">No account needed. Your data stays on your device.</p>
      </div>
    `;

    document.getElementById('btn-start-onboarding').addEventListener('click', () => {
      navigate('/onboarding/wizard');
    });

    document.getElementById('btn-skip-to-demo').addEventListener('click', () => {
      seedDemoData();
      navigate('/dashboard');
    });
  });

  // Onboarding wizard (4-step flow)
  route('/onboarding/wizard', (container) => {
    updateShellVisibility();
    renderOnboarding(container);
  });

  // Dashboard — now reads from the store
  route('/dashboard', (container) => {
    updateShellVisibility();
    updateHeaderGreeting();

    const cycle = getCurrentCycle();
    const user = getUser();

    // If no data, redirect to onboarding
    if (!cycle || !user) {
      navigate('/onboarding');
      return;
    }

    const safeToSpend = getSafeToSpend();
    const daysLeft = daysRemaining(cycle.endDate);
    const needsSummary = getMacroSummary('needs');
    const wantsSummary = getMacroSummary('wants');
    const futureSummary = getMacroSummary('future');
    const recentTxns = getTransactions({ limit: 5 });

    // Build leak warnings
    const leaks = [];
    const buckets = getBuckets('wants');
    const totalCycleDays = Math.ceil((new Date(cycle.endDate) - new Date(cycle.startDate)) / (1000 * 60 * 60 * 24));
    const elapsed = totalCycleDays - daysLeft;
    const timePercent = totalCycleDays > 0 ? (elapsed / totalCycleDays) * 100 : 0;

    buckets.forEach(b => {
      if (b.allocated > 0) {
        const spentPct = (b.spent / b.allocated) * 100;
        if (spentPct >= 80 && timePercent < 50) {
          leaks.push(b);
        }
      }
    });

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Safe to Spend Hero -->
        <div class="card card--accent text-center" style="padding: var(--space-8) var(--space-5);">
          <p class="text-secondary" style="font-size: var(--text-sm); margin-bottom: var(--space-2); text-transform: uppercase; letter-spacing: 0.1em;">Safe to Spend</p>
          <p class="text-mono" style="font-size: var(--text-hero); font-weight: var(--weight-black); background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1;" id="hero-amount">${formatCurrency(safeToSpend)}</p>
          <p class="text-tertiary mt-2" style="font-size: var(--text-sm);">${daysLeft} days left in cycle</p>
        </div>

        <!-- Macro Health Bars -->
        <div class="flex flex-col gap-4">
          ${renderMacroBar('Needs', needsSummary, 'needs')}
          ${renderMacroBar('Wants', wantsSummary, 'wants')}
          ${renderMacroBar('Future', futureSummary, 'future')}
        </div>

        <!-- Recent Transactions -->
        <div>
          <div class="section-header">
            <span class="section-header__title">Recent Transactions</span>
            <button class="btn btn-ghost" style="font-size: var(--text-xs);">See all</button>
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
                    t.borrowedFrom ? getBucketById(t.borrowedFrom)?.name : null
                  );
                }).join('')
              : '<p class="text-tertiary text-center" style="padding: var(--space-6); font-size: var(--text-sm);">No transactions yet. Tap + to log your first!</p>'
            }
          </div>
        </div>

        <!-- Leak Warnings -->
        ${leaks.length > 0 ? leaks.map(b => `
          <div class="card" style="border-color: var(--warn); border-left-width: 3px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), transparent);">
            <div class="flex items-center gap-3">
              <span style="font-size: 24px;">⚡</span>
              <div>
                <p class="font-semibold" style="font-size: var(--text-sm); color: var(--warn);">${b.name} is running hot</p>
                <p class="text-tertiary" style="font-size: var(--text-xs);">${percent(b.spent, b.allocated)}% spent with ${daysLeft} days left. Want to re-balance?</p>
              </div>
            </div>
          </div>
        `).join('') : `
          <div class="card" style="border-color: var(--accent-primary); border-left-width: 3px; background: linear-gradient(135deg, rgba(52, 211, 153, 0.06), transparent);">
            <div class="flex items-center gap-3">
              <span style="font-size: 24px;">✅</span>
              <div>
                <p class="font-semibold" style="font-size: var(--text-sm); color: var(--accent-primary);">All clear</p>
                <p class="text-tertiary" style="font-size: var(--text-xs);">You're on pace this cycle. Keep it up!</p>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  });

  // Settings — now reads from the store
  route('/settings', (container) => {
    updateShellVisibility();

    const user = getUser();
    const allBuckets = [...getBuckets('needs'), ...getBuckets('wants'), ...getBuckets('future')];
    const commitments = getCommitments();

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <h1 style="font-size: var(--text-xl); font-weight: var(--weight-bold);">Settings</h1>

        <div class="card flex flex-col gap-4">
          ${renderSettingsRow('👤', 'Profile Name', user?.name || 'Not set')}
          ${renderSettingsRow('💰', 'Monthly Salary', user ? formatCurrency(user.salary) : '—')}
          ${renderSettingsRow('📅', 'Salary Date', user ? `${user.salaryDate}${ordinalSuffix(user.salaryDate)} of month` : '—')}
          ${renderSettingsRow('📦', 'Manage Buckets', `${allBuckets.length} active`)}
          ${renderSettingsRow('🔄', 'Commitments', `${commitments.length} recurring`)}
        </div>

        <div class="card flex flex-col gap-4">
          ${renderSettingsRow('📊', 'Export CSV', '')}
          ${renderSettingsRow('📄', 'Export PDF Summary', '')}
          ${renderSettingsRow('💾', 'Export All Data (JSON)', '')}
        </div>

        <button class="btn btn-ghost text-center w-full mt-4" id="btn-back-dashboard" style="color: var(--accent-primary);">
          ← Back to Dashboard
        </button>
      </div>
    `;

    document.getElementById('btn-back-dashboard').addEventListener('click', () => {
      navigate('/dashboard');
    });
  });
}

// ---- Helper Renderers ----

/**
 * @param {string} label
 * @param {{ allocated: number, spent: number, remaining: number, percent: number }} summary
 * @param {string} type
 */
function renderMacroBar(label, summary, type) {
  const fillClass = `health-bar__fill--${type}`;
  const remainingPct = 100 - summary.percent;
  return `
    <div class="card" style="padding: var(--space-4);">
      <div class="flex items-center justify-between mb-2">
        <span class="font-semibold" style="font-size: var(--text-sm);">${label}</span>
        <span class="text-mono text-secondary" style="font-size: var(--text-sm);">${formatCurrency(summary.remaining)}</span>
      </div>
      <div class="health-bar health-bar--lg">
        <div class="${fillClass} health-bar__fill" style="width: ${remainingPct}%;"></div>
      </div>
      <div class="flex justify-between mt-2">
        <span class="text-tertiary" style="font-size: var(--text-xs);">Spent ${formatCurrency(summary.spent)}</span>
        <span class="text-tertiary" style="font-size: var(--text-xs);">${remainingPct}% remaining</span>
      </div>
    </div>
  `;
}

function renderTransaction(emoji, name, amount, time, borrowedFromName) {
  return `
    <div class="card" style="padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
      <span style="font-size: 22px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border-radius: var(--radius-md);">${emoji}</span>
      <div style="flex: 1; min-width: 0;">
        <p class="font-medium" style="font-size: var(--text-sm);">${name}</p>
        <p class="text-tertiary" style="font-size: var(--text-xs);">${time}${borrowedFromName ? ` · <span class="badge badge--amber" style="font-size: 10px; padding: 1px 6px;">from ${borrowedFromName}</span>` : ''}</p>
      </div>
      <span class="text-mono font-semibold" style="font-size: var(--text-sm);">−${formatCurrency(amount)}</span>
    </div>
  `;
}

function renderSettingsRow(emoji, label, value) {
  return `
    <div class="flex items-center gap-3" style="padding: var(--space-2) 0; cursor: pointer;">
      <span style="font-size: 18px;">${emoji}</span>
      <span class="font-medium" style="flex: 1; font-size: var(--text-sm);">${label}</span>
      <span class="text-tertiary" style="font-size: var(--text-sm);">${value}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  `;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {number} n
 * @returns {string}
 */
function ordinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---- Boot ----

function boot() {
  renderAppShell();
  registerRoutes();

  // Determine starting route
  const hasData = isOnboardingComplete();
  if (!window.location.hash) {
    window.location.hash = hasData ? '#/dashboard' : '#/onboarding';
  }

  initRouter('router-mount');
  renderDevToolbar();
}

boot();
