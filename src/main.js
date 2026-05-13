/**
 * Fiscal Fold — Main Entry Point
 * App Shell: Header + Router + FAB
 */

import './style.css';
import { route, navigate, initRouter, currentRoute } from './router.js';

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
 * Update the header greeting (called after onboarding or login).
 * @param {string} name
 */
export function updateHeaderGreeting(name) {
  const el = document.getElementById('header-greeting');
  const sub = document.getElementById('header-subtitle');
  if (el && name) {
    el.textContent = `Hey, ${name} 👋`;
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
  // Onboarding (placeholder — Sprint 3)
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
      showToast('Onboarding flow coming in Sprint 3 ✨');
    });

    document.getElementById('btn-skip-to-demo').addEventListener('click', () => {
      navigate('/dashboard');
    });
  });

  // Dashboard (placeholder — Sprint 4)
  route('/dashboard', (container) => {
    updateShellVisibility();
    updateHeaderGreeting('User');

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Safe to Spend Hero -->
        <div class="card card--accent text-center" style="padding: var(--space-8) var(--space-5);">
          <p class="text-secondary" style="font-size: var(--text-sm); margin-bottom: var(--space-2); text-transform: uppercase; letter-spacing: 0.1em;">Safe to Spend</p>
          <p class="text-mono" style="font-size: var(--text-hero); font-weight: var(--weight-black); background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1;" id="hero-amount">₹42,800</p>
          <p class="text-tertiary mt-2" style="font-size: var(--text-sm);">18 days left in cycle</p>
        </div>

        <!-- Macro Health Bars -->
        <div class="flex flex-col gap-4">
          ${renderMacroBar('Needs', '₹52,400', '₹31,600', 60, 'needs')}
          ${renderMacroBar('Wants', '₹42,800', '₹7,600', 15, 'wants')}
          ${renderMacroBar('Future', '₹33,600', '₹0', 0, 'future')}
        </div>

        <!-- Recent Transactions -->
        <div>
          <div class="section-header">
            <span class="section-header__title">Recent Transactions</span>
            <button class="btn btn-ghost" style="font-size: var(--text-xs);">See all</button>
          </div>
          <div class="flex flex-col gap-2">
            ${renderTransaction('🍕', 'Dining Out', 450, '2h ago')}
            ${renderTransaction('🚕', 'Transport', 280, '5h ago')}
            ${renderTransaction('🛒', 'Groceries', 1240, 'Yesterday')}
            ${renderTransaction('☕', 'Chai & Snacks', 80, 'Yesterday')}
            ${renderTransaction('🎬', 'Entertainment', 599, '2 days ago')}
          </div>
        </div>

        <!-- Leak Warning -->
        <div class="card" style="border-color: var(--warn); border-left-width: 3px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), transparent);">
          <div class="flex items-center gap-3">
            <span style="font-size: 24px;">⚡</span>
            <div>
              <p class="font-semibold" style="font-size: var(--text-sm); color: var(--warn);">Dining is running hot</p>
              <p class="text-tertiary" style="font-size: var(--text-xs);">80% spent with 18 days left. Want to re-balance?</p>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  // Settings (placeholder — Sprint 10)
  route('/settings', (container) => {
    updateShellVisibility();

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <h1 style="font-size: var(--text-xl); font-weight: var(--weight-bold);">Settings</h1>

        <div class="card flex flex-col gap-4">
          ${renderSettingsRow('👤', 'Profile Name', 'User')}
          ${renderSettingsRow('💰', 'Monthly Salary', '₹1,68,000')}
          ${renderSettingsRow('📅', 'Salary Date', '1st of month')}
          ${renderSettingsRow('📦', 'Manage Buckets', '12 active')}
          ${renderSettingsRow('🔄', 'Commitments', '4 recurring')}
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

function renderMacroBar(label, remaining, spent, spentPercent, type) {
  const fillClass = `health-bar__fill--${type}`;
  return `
    <div class="card" style="padding: var(--space-4);">
      <div class="flex items-center justify-between mb-2">
        <span class="font-semibold" style="font-size: var(--text-sm);">${label}</span>
        <span class="text-mono text-secondary" style="font-size: var(--text-sm);">${remaining}</span>
      </div>
      <div class="health-bar health-bar--lg">
        <div class="${fillClass} health-bar__fill" style="width: ${100 - spentPercent}%;"></div>
      </div>
      <div class="flex justify-between mt-2">
        <span class="text-tertiary" style="font-size: var(--text-xs);">Spent ${spent}</span>
        <span class="text-tertiary" style="font-size: var(--text-xs);">${100 - spentPercent}% remaining</span>
      </div>
    </div>
  `;
}

function renderTransaction(emoji, name, amount, time) {
  return `
    <div class="card" style="padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
      <span style="font-size: 22px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border-radius: var(--radius-md);">${emoji}</span>
      <div style="flex: 1; min-width: 0;">
        <p class="font-medium" style="font-size: var(--text-sm);">${name}</p>
        <p class="text-tertiary" style="font-size: var(--text-xs);">${time}</p>
      </div>
      <span class="text-mono font-semibold" style="font-size: var(--text-sm);">−₹${amount.toLocaleString('en-IN')}</span>
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

// ---- Boot ----

renderAppShell();
registerRoutes();
initRouter('router-mount');
