/**
 * Fiscal Fold — Main Entry Point
 * App Shell: Header + Router + FAB
 * Integrated with Store (Sprint 2) + Onboarding (Sprint 3)
 */

import './style.css';
import './pages/onboarding.css';
import './pages/commitments.css';
import { route, navigate, initRouter, currentRoute } from './router.js';
import { renderOnboarding } from './pages/onboarding.js';
import { openTransactionModal } from './pages/transaction-modal.js';
import { renderCommitmentsPage, renderCommitmentDueRow, getDueSoonCommitments } from './pages/commitments.js';
import { flush as flushOfflineQueue } from './utils/offlineQueue.js';
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
  getMacroReserved,
  isCycleExpired,
} from './data/store.js';
import { seedDemoData, renderDevToolbar } from './data/seed.js';
import { formatCurrency, timeAgo, percent, daysRemaining, cycleDayCount } from './utils/helpers.js';
import { showToast } from './utils/toast.js';

// ---- PWA: Service Worker Registration ----

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

// ---- PWA: Install Prompt ----

let _deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  if (!localStorage.getItem('pwa-install-dismissed')) {
    _renderInstallBanner();
  }
});

window.addEventListener('appinstalled', () => {
  _deferredInstallPrompt = null;
  const banner = document.getElementById('pwa-install-banner');
  banner?.remove();
  showToast('Fiscal Fold installed! 🎉');
});

function _renderInstallBanner() {
  if (document.getElementById('pwa-install-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-install-banner__icon">
      <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
        <path d="M16 44 L32 16 L48 44 Z" fill="none" stroke="white" stroke-width="3" stroke-linejoin="round"/>
        <path d="M24 38 L32 24 L40 38 Z" fill="white" opacity="0.3"/>
      </svg>
    </div>
    <div class="pwa-install-banner__body">
      <span class="pwa-install-banner__title">Install Fiscal Fold</span>
      <span class="pwa-install-banner__sub">Works offline · Faster · Home screen icon</span>
    </div>
    <button class="btn btn-primary pwa-install-banner__cta" id="pwa-install-btn">Add to Home Screen</button>
    <button class="btn-icon pwa-install-banner__dismiss" id="pwa-dismiss-btn" aria-label="Dismiss">✕</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!_deferredInstallPrompt) return;
    _deferredInstallPrompt.prompt();
    const { outcome } = await _deferredInstallPrompt.userChoice;
    _deferredInstallPrompt = null;
    if (outcome === 'accepted') {
      banner.remove();
    }
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    banner.remove();
    _deferredInstallPrompt = null;
  });
}

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
        <span class="offline-badge" id="offline-badge" hidden>Offline</span>
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

  // Offline indicator
  const offlineBadge = document.getElementById('offline-badge');
  function _syncOfflineBadge() {
    if (offlineBadge) offlineBadge.hidden = navigator.onLine;
  }
  _syncOfflineBadge();
  window.addEventListener('offline', () => { _syncOfflineBadge(); });
  window.addEventListener('online', async () => {
    _syncOfflineBadge();
    const synced = await flushOfflineQueue();
    if (synced.length > 0) {
      showToast(`Back online — ${synced.length} transaction${synced.length > 1 ? 's' : ''} synced ✓`);
    } else {
      showToast('Back online ✓');
    }
  });

  // Flush any queued transactions if the app launches while already online
  if (navigator.onLine) {
    flushOfflineQueue().then(synced => {
      if (synced.length > 0) {
        showToast(`${synced.length} offline transaction${synced.length > 1 ? 's' : ''} synced ✓`);
      }
    });
  }

  // FAB click — open transaction modal
  document.getElementById('fab-add').addEventListener('click', () => {
    openTransactionModal();
  });
}

// ---- Toast System ----

export { showToast };

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

    // Build leak warnings
    const leaks = [];
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

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Payday Banner — shown when cycle has expired -->
        ${cycleExpired ? `
          <div class="card payday-banner" id="payday-banner" style="border-color: var(--accent-primary); border-left-width: 3px; background: linear-gradient(135deg, rgba(52, 211, 153, 0.08), transparent); cursor: pointer;">
            <div class="flex items-center gap-3">
              <span style="font-size: 28px;">🎉</span>
              <div style="flex: 1; min-width: 0;">
                <p class="font-semibold" style="font-size: var(--text-sm); color: var(--accent-primary);">Payday! Your cycle has ended.</p>
                <p class="text-tertiary" style="font-size: var(--text-xs);">Sweep your savings and start a fresh cycle.</p>
              </div>
              <span style="color: var(--accent-primary); font-size: var(--text-base);">→</span>
            </div>
          </div>
        ` : ''}

        <!-- Safe to Spend Hero -->
        <div class="card card--accent text-center" style="padding: var(--space-8) var(--space-5);">
          <p class="text-secondary" style="font-size: var(--text-sm); margin-bottom: var(--space-2); text-transform: uppercase; letter-spacing: 0.1em;">Safe to Spend</p>
          <div class="hero-amount-wrap" id="hero-amount-wrap">
            <p class="text-mono" style="font-size: var(--text-hero); font-weight: var(--weight-black); background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1;" id="hero-amount">₹0</p>
          </div>
          <p class="text-tertiary mt-2" style="font-size: var(--text-sm);">${daysLeft} days left in cycle</p>
        </div>

        <!-- Quick Buckets Row -->
        ${quickBuckets.length > 0 ? `
          <div>
            <div class="section-header" style="margin-bottom: var(--space-2);">
              <span class="section-header__title">Quick Buckets</span>
            </div>
            <div class="quick-buckets">
              ${quickBuckets.map(b => `
                <div class="quick-bucket" data-bucket-id="${b.id}">
                  <div class="quick-bucket__emoji">${b.emoji}</div>
                  <span class="quick-bucket__name">${b.name}</span>
                </div>
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
                    t.note
                  );
                }).join('')
              : '<p class="text-tertiary text-center" style="padding: var(--space-6); font-size: var(--text-sm);">No transactions yet. Tap + to log your first!</p>'
            }
          </div>
        </div>

        <!-- Leak Warnings -->
        ${leaks.length > 0 ? leaks.map(b => `
          <div class="card leak-warning-card" data-leak-bucket-id="${b.id}" style="border-color: var(--warn); border-left-width: 3px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), transparent); cursor: pointer;">
            <div class="flex items-center gap-3">
              <span style="font-size: 24px;">⚡</span>
              <div style="flex: 1; min-width: 0;">
                <p class="font-semibold" style="font-size: var(--text-sm); color: var(--warn);">${b.name} is running hot</p>
                <p class="text-tertiary" style="font-size: var(--text-xs);">${percent(b.spent, b.allocated)}% spent with ${daysLeft} days left. Tap to re-balance →</p>
              </div>
            </div>
          </div>
        `).join('') : `
          <div class="card insight-all-clear" style="border-color: var(--accent-primary); border-left-width: 3px; background: linear-gradient(135deg, rgba(52, 211, 153, 0.06), transparent);">
            <div class="flex items-center gap-3">
              <span style="font-size: 24px;">✅</span>
              <div>
                <p class="font-semibold" style="font-size: var(--text-sm); color: var(--accent-primary);">All clear</p>
                <p class="text-tertiary" style="font-size: var(--text-xs);">All buckets are on pace this cycle. Keep it up!</p>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    // Wire "See all" → transaction history
    container.querySelector('#btn-see-all-txns')?.addEventListener('click', () => navigate('/transactions'));

    // Animate health bars from 0 → target width (transition fires because style changes after paint)
    requestAnimationFrame(() => {
      container.querySelectorAll('[data-width]').forEach(el => {
        el.style.width = `${el.dataset.width}%`;
      });
    });

    // Show install banner if prompt is available
    if (_deferredInstallPrompt && !localStorage.getItem('pwa-install-dismissed')) {
      _renderInstallBanner();
    }

    // Wire quick-bucket chips → open modal pre-targeted
    container.querySelectorAll('.quick-bucket[data-bucket-id]').forEach(chip => {
      chip.addEventListener('click', () => {
        openTransactionModal(chip.dataset.bucketId);
      });
    });

    // Wire payday banner → navigate to payday ritual
    if (cycleExpired) {
      container.querySelector('#payday-banner')?.addEventListener('click', () => {
        navigate('/payday');
      });
    }

    // Wire leak warning cards → open modal pre-targeted to the hot bucket
    container.querySelectorAll('.leak-warning-card[data-leak-bucket-id]').forEach(card => {
      card.addEventListener('click', () => {
        openTransactionModal(card.dataset.leakBucketId);
      });
    });

    // Safe To Spend count-up animation
    const heroAmount = document.getElementById('hero-amount');
    const heroWrap = document.getElementById('hero-amount-wrap');
    let timer;

    if (heroAmount && heroWrap) {
      // Quick count up effect
      const duration = 600; // ms
      const frames = 30;
      const interval = duration / frames;
      let currentFrame = 0;

      heroWrap.classList.add('is-animating');
      timer = setInterval(() => {
        currentFrame++;
        const progress = currentFrame / frames;
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        const currentAmount = Math.round(safeToSpend * ease);
        heroAmount.textContent = formatCurrency(currentAmount);

        if (currentFrame >= frames) {
          clearInterval(timer);
          heroAmount.textContent = formatCurrency(safeToSpend);
          setTimeout(() => heroWrap.classList.remove('is-animating'), 200);
        }
      }, interval);
    }

    // Attach expand/collapse listeners for Macro Bars
    const macroBarsContainer = document.getElementById('macro-bars-container');
    if (macroBarsContainer) {
      macroBarsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.macro-card');
        if (card) {
          card.classList.toggle('is-expanded');
        }
      });
    }

    return () => { if (timer) clearInterval(timer); };
  });

  // Settings
  route('/settings', async (container) => {
    updateShellVisibility();
    const { renderSettingsPage } = await import('./pages/settings.js');
    renderSettingsPage(container);
  });

  // Transaction History
  route('/transactions', async (container) => {
    updateShellVisibility();
    const { renderTransactionsPage } = await import('./pages/transactions.js');
    renderTransactionsPage(container);
  });

  // Commitments management page
  route('/commitments', (container) => {
    updateShellVisibility();
    renderCommitmentsPage(container);
  });

  // Payday ritual page
  route('/payday', async (container) => {
    updateShellVisibility();
    const { renderPaydayPage } = await import('./pages/payday.js');
    renderPaydayPage(container);
  });
}

// ---- Helper Renderers ----

/**
 * @param {string} label
 * @param {{ allocated: number, spent: number, remaining: number, percent: number }} summary
 * @param {string} type
 * @param {number} [reserved=0]
 */
function renderMacroBar(label, summary, type, reserved = 0) {
  const remainingPct = 100 - summary.percent;
  const isOverspent = summary.percent > 100;
  let fillClass = `health-bar__fill--${type}`;

  if (remainingPct <= 0) {
    fillClass = 'health-bar__fill--depleted';
  } else if (remainingPct <= 20 && type === 'wants') {
    fillClass = 'health-bar__fill--warn';
  }

  const buckets = getBuckets(type);

  return `
    <div class="card macro-card" style="padding: var(--space-4);">
      <div class="macro-card__header">
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
        <span class="text-tertiary" style="font-size: var(--text-xs);">${Math.max(0, remainingPct)}% remaining</span>
      </div>
      ${reserved > 0 ? `
        <div class="cm-reserved-hint">
          <span>🔒</span>
          <span class="cm-reserved-hint__amount">${formatCurrency(reserved)}</span>
          <span>reserved (unpaid commitments)</span>
        </div>
      ` : ''}

      <div class="macro-card__buckets">
        <div class="macro-card__buckets-inner">
          ${buckets.length > 0 ? buckets.map(b => {
            const bRemainingPct = b.allocated > 0 ? Math.max(0, 100 - (b.spent / b.allocated) * 100) : 0;
            return `
              <div class="micro-bucket-row">
                <div class="micro-bucket-row__emoji">${b.emoji}</div>
                <div class="micro-bucket-row__name">${b.name}</div>
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

function renderTransaction(emoji, name, amount, time, borrowedFromName, note) {
  return `
    <div class="card" style="padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
      <span style="font-size: 22px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border-radius: var(--radius-md); flex-shrink: 0;">${emoji}</span>
      <div style="flex: 1; min-width: 0;">
        <div class="flex items-center gap-2">
          <p class="font-medium" style="font-size: var(--text-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</p>
          ${note ? `<span class="text-tertiary" style="font-size: var(--text-xs); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">• ${note}</span>` : ''}
        </div>
        <p class="text-tertiary" style="font-size: var(--text-xs);">${time}${borrowedFromName ? ` · <span class="badge badge--amber" style="font-size: 10px; padding: 1px 6px;">from ${borrowedFromName}</span>` : ''}</p>
      </div>
      <span class="text-mono font-semibold" style="font-size: var(--text-sm); flex-shrink: 0;">−${formatCurrency(amount)}</span>
    </div>
  `;
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
