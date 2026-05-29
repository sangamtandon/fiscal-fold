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
import { renderCommitmentsPage } from './pages/commitments.js';
import { renderDashboardPage } from './pages/dashboard.js';
import { flush as flushOfflineQueue } from './utils/offlineQueue.js';
import {
  getUser,
  isOnboardingComplete,
  getTransactions,
} from './data/store.js';
import { seedDemoData, renderDevToolbar } from './data/seed.js';
import { showToast } from './utils/toast.js';

// ---- Theme ----

const _savedTheme = localStorage.getItem('theme');
if (_savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');

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
  // Defer install prompt until the user has actually used the app —
  // onboarding done AND at least one real transaction logged. Showing
  // it on first load buries the user before they've seen any value.
  if (
    !localStorage.getItem('pwa-install-dismissed') &&
    isOnboardingComplete() &&
    getTransactions({ limit: 1 }).length > 0
  ) {
    _renderInstallBanner();
  }
});

/**
 * Re-evaluate whether the install banner should appear. Called after
 * onboarding completion and after the first transaction so the deferred
 * prompt actually surfaces once the user is invested.
 */
function _maybeShowInstallBanner() {
  if (!_deferredInstallPrompt) return;
  if (localStorage.getItem('pwa-install-dismissed')) return;
  if (!isOnboardingComplete()) return;
  if (getTransactions({ limit: 1 }).length === 0) return;
  _renderInstallBanner();
}

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
    <button class="btn-icon pwa-install-banner__dismiss" id="pwa-dismiss-btn" aria-label="Dismiss" title="Dismiss">✕</button>
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
        <span class="app-header__subtitle" id="header-subtitle">Your finances, your rules.</span>
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
    <button class="fab fab--pulse" id="fab-add" data-testid="fab-add" aria-label="Log transaction" title="Log a transaction">
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
    // textContent already escapes — no need for escapeHtml here.
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
          <p class="text-secondary" style="font-size: var(--text-base); max-width: 280px; margin: 0 auto;" data-testid="landing-tagline">Know exactly what's safe to spend — without a spreadsheet.</p>
        </div>
        <div class="flex flex-col gap-3 w-full" style="max-width: 300px;">
          <button class="btn btn-primary btn-lg btn-full" id="btn-start-onboarding">
            Set up my budget
          </button>
          <button class="btn btn-ghost" id="btn-skip-to-demo" data-testid="btn-skip-demo">
            Try a sample dashboard first →
          </button>
        </div>
        <p class="text-tertiary" style="font-size: var(--text-xs); margin-top: var(--space-4);" data-testid="landing-privacy">No account, no cloud sync. Your data lives only on this device.</p>
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

  // Dashboard — delegates to src/pages/dashboard.js
  route('/dashboard', (container) => {
    updateShellVisibility();
    updateHeaderGreeting();
    return renderDashboardPage(container, {
      // Show install banner only once the user has earned the prompt —
      // gated on onboarding + ≥1 transaction inside _maybeShowInstallBanner.
      onRenderComplete: _maybeShowInstallBanner,
    });
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
