/**
 * Fiscal Fold — Settings Page (Sprint 10)
 *
 * Route: /settings
 * Features: edit profile, manage buckets (rename/pin/add/remove), export, navigation links.
 */

import './settings.css';
import {
  getUser,
  setUser,
  getBuckets,
  getBucketById,
  addBucket,
  updateBucket,
  removeBucket,
  resetState,
  getMacroSummary,
  getCurrentCycle,
  updateCycleAllocations,
} from '../data/store.js';
import { formatCurrency, formatNumber, ordinalSuffix, formatPayday, distributeProportionally, escapeHtml } from '../utils/helpers.js';
import { renderDayPicker, bindDayPicker } from '../utils/day-of-month-picker.js';
import { showToast } from '../utils/toast.js';
import { getTheme, setTheme } from '../utils/theme.js';
import { navigate } from '../router.js';
import { exportTransactionsCSV, exportAllDataJSON } from '../utils/export.js';
import { EMOJI_PALETTE, MAX_BUCKETS_PER_MACRO, PRESETS } from '../data/models.js';

/**
 * @param {HTMLElement} container
 */
export function renderSettingsPage(container) {
  _render(container);
}

// ---- Full page render ----

function _render(container) {
  const user = getUser();

  container.innerHTML = `
    <div class="settings-page">
      <h1 class="settings-page__title">Settings</h1>

      <!-- Profile -->
      <div class="card settings-section" id="section-profile">
        <h2 class="settings-section__heading">Profile</h2>
        <div class="settings-field" id="field-name">
          <span class="settings-field__label">Name</span>
          <div class="settings-field__right">
            <span class="settings-field__value" id="val-name">${escapeHtml(user?.name || 'Not set')}</span>
            <button class="btn-text settings-edit-btn" data-edit="name">Edit</button>
          </div>
        </div>
        <div class="settings-field" id="field-salary">
          <span class="settings-field__label">Monthly Salary</span>
          <div class="settings-field__right">
            <span class="settings-field__value" id="val-salary">${user ? formatCurrency(user.salary) : '—'}</span>
            <button class="btn-text settings-edit-btn" data-edit="salary">Edit</button>
          </div>
        </div>
        <div class="settings-field" id="field-salaryDate">
          <span class="settings-field__label">Salary Date</span>
          <div class="settings-field__right">
            <span class="settings-field__value" id="val-salaryDate">${user ? _formatSalaryDateDisplay(user.salaryDate) : '—'}</span>
            <button class="btn-text settings-edit-btn" data-edit="salaryDate">Edit</button>
          </div>
        </div>
        <div class="settings-field" id="field-ratios">
          <span class="settings-field__label">Budget Split</span>
          <div class="settings-field__right">
            <span class="settings-field__value" id="val-ratios">${user ? `${user.ratios.needs}% / ${user.ratios.wants}% / ${user.ratios.future}%` : '—'}</span>
            <button class="btn-text settings-edit-btn" data-edit="ratios">Edit</button>
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="card settings-section">
        <h2 class="settings-section__heading">Appearance</h2>
        <div class="settings-field">
          <span class="settings-field__label">☀️ Light mode</span>
          <label class="settings-toggle" aria-label="Toggle light mode">
            <input type="checkbox" id="toggle-theme" ${getTheme() === 'light' ? 'checked' : ''}>
            <span class="settings-toggle__track"></span>
          </label>
        </div>
      </div>

      <!-- Buckets -->
      <div class="card settings-section">
        <h2 class="settings-section__heading">Buckets</h2>
        <div id="buckets-panel">
          ${_renderBuckets()}
        </div>
      </div>

      <!-- Navigation links -->
      <div class="card settings-section">
        <button class="settings-nav-row" id="btn-nav-income">
          <span>💰</span>
          <span class="settings-nav-row__label">Add Income / Bonus</span>
          <span class="settings-nav-row__chevron">›</span>
        </button>
        <button class="settings-nav-row" id="btn-nav-commitments">
          <span>🔄</span>
          <span class="settings-nav-row__label">Manage Commitments</span>
          <span class="settings-nav-row__chevron">›</span>
        </button>
        <button class="settings-nav-row" id="btn-nav-history">
          <span>📋</span>
          <span class="settings-nav-row__label">Transaction History</span>
          <span class="settings-nav-row__chevron">›</span>
        </button>
      </div>

      <!-- Export -->
      <div class="card settings-section">
        <h2 class="settings-section__heading">Backup &amp; Export</h2>
        <button class="settings-nav-row" id="btn-export-csv">
          <span>📊</span>
          <span class="settings-nav-row__label">Download transactions (CSV)</span>
          <span class="text-accent" style="font-size:var(--text-base);">↓</span>
        </button>
        <button class="settings-nav-row" id="btn-export-json">
          <span>💾</span>
          <span class="settings-nav-row__label">Download full backup (JSON file)</span>
          <span class="text-accent" style="font-size:var(--text-base);">↓</span>
        </button>
      </div>

      <!-- Help -->
      <div class="card settings-section" data-testid="settings-help">
        <h2 class="settings-section__heading">How it works</h2>
        <div class="settings-help-list">
          <p><strong>Needs / Wants / Future</strong> — your salary splits into 3 jars: must-pays, fun money, and savings.</p>
          <p><strong>Buckets</strong> — each jar contains specific spending categories (Groceries, Dining, etc.) with their own budgets.</p>
          <p><strong>Cycle</strong> — the budget period between paydays. Unspent Wants &amp; Future roll into next month's Future.</p>
          <p><strong>Quick Buckets</strong> — pinned buckets appear on the dashboard for one-tap logging.</p>
          <p><strong>Commitments</strong> — recurring bills set aside before you spend, so the dashboard never lies.</p>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="settings-section settings-danger-zone" data-testid="settings-danger-zone">
        <h2 class="settings-section__heading settings-danger-zone__heading">Danger Zone</h2>
        <p class="settings-danger-zone__intro">Deleting your data is permanent. There is no cloud backup.</p>
        <div class="settings-reset-wrap">
          <button class="settings-reset-link" id="btn-reset-data">Reset all data</button>
          <div class="settings-danger-zone__confirm" id="reset-confirm" hidden>
            <p class="settings-danger-zone__warn">⚠️ This cannot be undone. All your financial data will be erased.</p>
            <div class="settings-danger-zone__actions">
              <button class="btn btn-ghost btn-sm" id="btn-reset-cancel">Cancel</button>
              <button class="btn settings-danger-zone__btn-confirm btn-sm" id="btn-reset-confirm">Yes, delete everything</button>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-ghost w-full" id="btn-back" style="margin-top: var(--space-2);">
        ← Back to Dashboard
      </button>
    </div>
  `;

  _wireEvents(container);
}

// ---- Bucket panel render ----

function _renderBuckets() {
  return ['needs', 'wants', 'future']
    .map(macro => {
      const label = { needs: 'Needs', wants: 'Wants', future: 'Future' }[macro];
      return _renderBucketGroup(macro, label);
    })
    .join('');
}

function _renderBucketGroup(macroType, label) {
  const buckets = getBuckets(macroType);
  const colors = { needs: 'var(--needs)', wants: 'var(--wants)', future: 'var(--future)' };
  const canAdd = buckets.length < MAX_BUCKETS_PER_MACRO;
  const summary = getMacroSummary(macroType);
  const unallocated = summary.unallocated ?? 0;

  return `
    <div class="settings-bucket-group" id="bucket-group-${macroType}">
      <div class="settings-bucket-group__header">
        <span class="settings-bucket-dot" style="background:${colors[macroType]};"></span>
        <span class="font-semibold" style="font-size:var(--text-sm);">${label}</span>
        <span class="text-tertiary" style="font-size:var(--text-xs); margin-left:auto;">${buckets.length} bucket${buckets.length !== 1 ? 's' : ''}</span>
      </div>
      ${unallocated !== 0 ? `
        <div class="settings-unallocated-banner" id="unallocated-${macroType}"
          style="display:flex; align-items:center; gap: var(--space-2); padding: var(--space-2) var(--space-3); margin: var(--space-2) 0; background: ${unallocated > 0 ? 'rgba(245, 158, 11, 0.10)' : 'rgba(239, 68, 68, 0.10)'}; border: 1px solid ${unallocated > 0 ? 'var(--warn)' : 'var(--danger, #ef4444)'}; border-radius: var(--radius-md);">
          <span style="font-size: 14px;">${unallocated > 0 ? '💡' : '⚠️'}</span>
          <span class="text-mono font-semibold" style="font-size: var(--text-xs); color: ${unallocated > 0 ? 'var(--warn)' : 'var(--danger, #ef4444)'};">${formatCurrency(Math.abs(unallocated))}</span>
          <span class="text-tertiary" style="font-size: var(--text-xs); flex:1;">${unallocated > 0 ? `left to assign in ${label} — edit a bucket to add it` : `over-allocated in ${label} — trim a bucket`}</span>
        </div>
      ` : ''}
      ${buckets.map(b => `
        <div class="settings-bucket-row" data-bucket-id="${escapeHtml(b.id)}">
          <span class="settings-bucket-row__emoji">${escapeHtml(b.emoji)}</span>
          <span class="settings-bucket-row__name">${escapeHtml(b.name)}</span>
          <span class="settings-bucket-row__alloc text-mono text-tertiary">${formatCurrency(b.allocated)}</span>
          <button class="btn-icon settings-bucket-btn${b.isPinned ? ' is-pinned' : ''}"
            data-action="toggle-pin" data-bucket-id="${escapeHtml(b.id)}"
            title="${b.isPinned ? 'Unpin Quick Bucket' : 'Pin as Quick Bucket'}"
            aria-label="${b.isPinned ? 'Unpin Quick Bucket' : 'Pin as Quick Bucket'}">📌</button>
          <button class="btn-icon settings-bucket-btn"
            data-action="edit-bucket" data-bucket-id="${escapeHtml(b.id)}" data-macro="${macroType}"
            title="Edit bucket" aria-label="Edit bucket">✏️</button>
          <button class="btn-icon settings-bucket-btn settings-bucket-btn--danger"
            data-action="remove-bucket" data-bucket-id="${escapeHtml(b.id)}"
            title="Remove" aria-label="Remove bucket">×</button>
        </div>
      `).join('')}
      ${canAdd ? `
        <button class="settings-add-bucket-btn" data-action="add-bucket" data-macro="${macroType}">
          + Add bucket
        </button>
      ` : ''}
    </div>
  `;
}

// ---- Event wiring ----

function _wireEvents(container) {
  container.querySelector('#btn-back').addEventListener('click', () => navigate('/dashboard'));

  container.querySelector('#toggle-theme').addEventListener('change', e => {
    setTheme(e.target.checked ? 'light' : 'dark');
  });

  container.querySelector('#btn-nav-commitments').addEventListener('click', () => navigate('/commitments'));
  container.querySelector('#btn-nav-history').addEventListener('click', () => navigate('/transactions'));
  container.querySelector('#btn-nav-income').addEventListener('click', () => {
    import('./income-modal.js').then(m => m.openIncomeModal());
  });

  container.querySelector('#btn-export-csv').addEventListener('click', () => {
    exportTransactionsCSV();
    showToast('Transactions downloaded ✓');
  });
  container.querySelector('#btn-export-json').addEventListener('click', () => {
    exportAllDataJSON();
    showToast('Backup downloaded ✓');
  });

  const btnReset = container.querySelector('#btn-reset-data');
  const resetConfirm = container.querySelector('#reset-confirm');
  const btnResetCancel = container.querySelector('#btn-reset-cancel');
  const btnResetConfirm = container.querySelector('#btn-reset-confirm');

  btnReset.addEventListener('click', () => {
    resetConfirm.hidden = false;
    btnReset.hidden = true;
  });

  btnResetCancel.addEventListener('click', () => {
    resetConfirm.hidden = true;
    btnReset.hidden = false;
  });

  btnResetConfirm.addEventListener('click', () => {
    resetState();
    window.location.reload();
  });

  // Profile field edit buttons
  container.querySelectorAll('.settings-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => _openProfileEdit(container, btn.dataset.edit));
  });

  // Bucket actions (delegated to buckets panel)
  const bucketsPanel = container.querySelector('#buckets-panel');
  bucketsPanel.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const bucketId = btn.dataset.bucketId;
    const macro = btn.dataset.macro;

    if (action === 'toggle-pin') _handleTogglePin(container, bucketId);
    else if (action === 'edit-bucket') _openBucketEditInline(container, bucketId, macro);
    else if (action === 'remove-bucket') _handleRemoveBucket(container, bucketId);
    else if (action === 'add-bucket') _openAddBucketInline(container, macro);
  });
}

// ---- Inline profile editing ----

function _openProfileEdit(container, field) {
  const user = getUser();
  const fieldEl = container.querySelector(`#field-${field}`);
  if (!fieldEl) return;

  const rightEl = fieldEl.querySelector('.settings-field__right');

  if (field === 'name') {
    rightEl.innerHTML = `
      <input type="text" class="input-field settings-inline-input" id="edit-input-name"
        value="${escapeHtml(user?.name || '')}" placeholder="Your name" maxlength="20" />
      <button class="btn btn-primary btn-sm" data-save="name">Save</button>
      <button class="btn btn-ghost btn-sm" data-cancel="name">✕</button>
    `;
    container.querySelector('[data-save="name"]').addEventListener('click', () => {
      const val = container.querySelector('#edit-input-name').value.trim();
      if (!val) { showToast('Name cannot be empty'); return; }
      setUser({ name: val });
      _restoreProfileField(container, field, val);
      showToast('Name updated ✓');
    });
    container.querySelector('[data-cancel="name"]').addEventListener('click', () => {
      _restoreProfileField(container, field, user?.name || 'Not set');
    });
    requestAnimationFrame(() => container.querySelector('#edit-input-name')?.focus());

  } else if (field === 'salary') {
    rightEl.innerHTML = `
      <span class="settings-currency-symbol">₹</span>
      <input type="text" class="input-field settings-inline-input" id="edit-input-salary"
        inputmode="numeric" value="${user?.salary ? formatNumber(user.salary) : ''}" placeholder="0" style="max-width:120px;" />
      <button class="btn btn-primary btn-sm" data-save="salary">Save</button>
      <button class="btn btn-ghost btn-sm" data-cancel="salary">✕</button>
    `;
    container.querySelector('[data-save="salary"]').addEventListener('click', () => {
      const raw = container.querySelector('#edit-input-salary').value.replace(/[^0-9]/g, '');
      const num = parseInt(raw, 10);
      if (!num || num <= 0) { showToast('Enter a valid salary'); return; }
      setUser({ salary: num });
      _restoreProfileField(container, field, formatCurrency(num));
      showToast('Salary updated ✓');
      _showSalaryRecalcPrompt(container, num);
    });
    container.querySelector('[data-cancel="salary"]').addEventListener('click', () => {
      _restoreProfileField(container, field, user ? formatCurrency(user.salary) : '—');
    });
    // Format input on change
    const salInput = container.querySelector('#edit-input-salary');
    salInput.addEventListener('input', e => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      const num = parseInt(raw, 10) || 0;
      e.target.value = num > 0 ? formatNumber(num) : '';
    });
    requestAnimationFrame(() => salInput?.focus());

  } else if (field === 'ratios') {
    const current = user?.ratios || { ...PRESETS.balanced };
    rightEl.innerHTML = `
      <div class="settings-ratios-edit" style="display:flex; flex-direction:column; gap: var(--space-2); align-items:flex-end;">
        <div style="display:flex; gap: var(--space-2); align-items:center;">
          <label style="font-size: var(--text-xs); color: var(--text-tertiary);">Needs</label>
          <input type="number" class="input-field settings-inline-input" id="edit-ratio-needs"
            min="0" max="100" inputmode="numeric" value="${current.needs}" style="max-width:64px;" />%
          <label style="font-size: var(--text-xs); color: var(--text-tertiary);">Wants</label>
          <input type="number" class="input-field settings-inline-input" id="edit-ratio-wants"
            min="0" max="100" inputmode="numeric" value="${current.wants}" style="max-width:64px;" />%
          <label style="font-size: var(--text-xs); color: var(--text-tertiary);">Future</label>
          <input type="number" class="input-field settings-inline-input" id="edit-ratio-future"
            min="0" max="100" inputmode="numeric" value="${current.future}" style="max-width:64px;" />%
        </div>
        <div style="display:flex; gap: var(--space-2); align-items:center;">
          <span class="text-tertiary" style="font-size: var(--text-xs);" id="edit-ratio-sum">Total: ${current.needs + current.wants + current.future}%</span>
          <button class="btn btn-primary btn-sm" data-save="ratios">Save</button>
          <button class="btn btn-ghost btn-sm" data-cancel="ratios">✕</button>
        </div>
      </div>
    `;
    const inputs = {
      needs: container.querySelector('#edit-ratio-needs'),
      wants: container.querySelector('#edit-ratio-wants'),
      future: container.querySelector('#edit-ratio-future'),
    };
    const sumEl = container.querySelector('#edit-ratio-sum');
    const updateSum = () => {
      const sum = Object.values(inputs).reduce((s, el) => s + (parseInt(el.value, 10) || 0), 0);
      sumEl.textContent = `Total: ${sum}%`;
      sumEl.style.color = sum === 100 ? 'var(--accent-primary)' : 'var(--warn)';
    };
    Object.values(inputs).forEach(el => el.addEventListener('input', updateSum));
    updateSum();
    container.querySelector('[data-save="ratios"]').addEventListener('click', () => {
      const ratios = {
        needs: parseInt(inputs.needs.value, 10) || 0,
        wants: parseInt(inputs.wants.value, 10) || 0,
        future: parseInt(inputs.future.value, 10) || 0,
      };
      const sum = ratios.needs + ratios.wants + ratios.future;
      if (sum !== 100) { showToast(`Splits must total 100% (currently ${sum}%)`); return; }
      setUser({ ratios, preset: 'custom' });
      _restoreProfileField(container, field, `${ratios.needs}% / ${ratios.wants}% / ${ratios.future}%`);
      showToast('Budget split updated ✓');
      _showRatiosRecalcPrompt(container);
    });
    container.querySelector('[data-cancel="ratios"]').addEventListener('click', () => {
      _restoreProfileField(container, field, `${current.needs}% / ${current.wants}% / ${current.future}%`);
    });
    requestAnimationFrame(() => inputs.needs?.focus());

  } else if (field === 'salaryDate') {
    const current = user?.salaryDate || 1;
    rightEl.innerHTML = `
      ${renderDayPicker({ value: current > 31 ? 1 : current })}
      <button class="btn btn-primary btn-sm" id="save-salary-date">Save</button>
      <button class="btn btn-ghost btn-sm" id="cancel-salary-date">✕</button>
    `;
    let selectedDate = current;
    bindDayPicker(rightEl, {}, v => {
      selectedDate = v;
    });
    container.querySelector('#save-salary-date').addEventListener('click', () => {
      setUser({ salaryDate: selectedDate });
      _restoreProfileField(container, field, _formatSalaryDateDisplay(selectedDate));
      showToast('Salary date updated ✓');
    });
    container.querySelector('#cancel-salary-date').addEventListener('click', () => {
      _restoreProfileField(container, field, _formatSalaryDateDisplay(current));
    });
  }
}

function _formatSalaryDateDisplay(n) {
  if (n === 99) return 'Last day of month';
  return `${n}${ordinalSuffix(n)} of month`;
}

function _restoreProfileField(container, field, displayValue) {
  const fieldEl = container.querySelector(`#field-${field}`);
  if (!fieldEl) return;
  const rightEl = fieldEl.querySelector('.settings-field__right');
  const fieldName = { name: 'name', salary: 'salary', salaryDate: 'salaryDate', ratios: 'ratios' }[field] || field;
  // displayValue is rendered as text — name is user-controlled, other fields
  // are computed strings (currency, percent). Always escape.
  rightEl.innerHTML = `
    <span class="settings-field__value" id="val-${fieldName}">${escapeHtml(displayValue)}</span>
    <button class="btn-text settings-edit-btn" data-edit="${fieldName}">Edit</button>
  `;
  rightEl.querySelector('.settings-edit-btn').addEventListener('click', () => {
    _openProfileEdit(container, field);
  });
}

function _showRatiosRecalcPrompt(container) {
  container.querySelector('#ratios-recalc-prompt')?.remove();
  const fieldEl = container.querySelector('#field-ratios');
  if (!fieldEl) return;

  const el = document.createElement('div');
  el.id = 'ratios-recalc-prompt';
  el.className = 'settings-recalc-prompt';
  el.innerHTML = `
    <span class="settings-recalc-prompt__note">New split applies from your next payday. Recalculating now resizes this pay period's bucket budgets — your transactions are kept.</span>
    <button class="btn btn-ghost btn-sm" id="btn-recalc-ratios-now">Recalculate current pay period →</button>
  `;
  fieldEl.after(el);

  el.querySelector('#btn-recalc-ratios-now').addEventListener('click', () => {
    _recalculateAllocationsFromRatios();
    el.remove();
    _refreshBucketsPanel(container);
    showToast('Current pay period recalculated ✓');
  });
}

function _recalculateAllocationsFromRatios() {
  const user = getUser();
  if (!user) return;
  // Push new macro totals into the current cycle so getMacroSummary.unallocated
  // is computed against the new ratio, then proportionally rescale buckets.
  const cycle = getCurrentCycle();
  if (cycle) {
    const needs = Math.round(cycle.salary * user.ratios.needs / 100);
    const wants = Math.round(cycle.salary * user.ratios.wants / 100);
    updateCycleAllocations({ needs, wants, future: cycle.salary - needs - wants });
  }
  _recalculateBucketAllocations(user.salary);
}

function _showSalaryRecalcPrompt(container, newSalary) {
  container.querySelector('#salary-recalc-prompt')?.remove();
  const fieldEl = container.querySelector('#field-salary');
  if (!fieldEl) return;

  const el = document.createElement('div');
  el.id = 'salary-recalc-prompt';
  el.className = 'settings-recalc-prompt';
  el.innerHTML = `
    <span class="settings-recalc-prompt__note">Changes apply from your next payday. Recalculating now resizes this pay period's bucket budgets — your transactions are kept.</span>
    <button class="btn btn-ghost btn-sm" id="btn-recalc-now">Recalculate current pay period →</button>
  `;
  fieldEl.after(el);

  el.querySelector('#btn-recalc-now').addEventListener('click', () => {
    _recalculateBucketAllocations(newSalary);
    el.remove();
    showToast('Current pay period recalculated ✓');
  });
}

function _recalculateBucketAllocations(newSalary) {
  const { ratios } = getUser();
  const newNeeds = Math.round(newSalary * ratios.needs / 100);
  const newWants = Math.round(newSalary * ratios.wants / 100);
  const newFuture = newSalary - newNeeds - newWants;

  for (const [macro, newTotal] of [['needs', newNeeds], ['wants', newWants], ['future', newFuture]]) {
    const buckets = getBuckets(macro);
    if (!buckets.length) continue;
    const allocations = distributeProportionally(
      buckets.map(b => b.allocated),
      newTotal,
    );
    buckets.forEach((b, i) => updateBucket(b.id, { allocated: allocations[i] }));
  }
}

// ---- Bucket inline actions ----

function _handleTogglePin(container, bucketId) {
  const bucket = getBucketById(bucketId);
  if (!bucket) return;
  updateBucket(bucketId, { isPinned: !bucket.isPinned });
  _refreshBucketsPanel(container);
  showToast(bucket.isPinned ? 'Removed from Quick Buckets' : 'Added to Quick Buckets ✓');
}

function _handleRemoveBucket(container, bucketId) {
  const bucket = getBucketById(bucketId);
  if (!bucket) return;

  const rowEl = container.querySelector(`[data-bucket-id="${bucketId}"].settings-bucket-row`);
  if (!rowEl) return;

  // Don't fire a second confirm strip if one is already up for this row.
  if (rowEl.dataset.confirming === '1') return;
  rowEl.dataset.confirming = '1';

  const originalHtml = rowEl.innerHTML;
  rowEl.innerHTML = `
    <span class="settings-bucket-row__emoji">${bucket.emoji}</span>
    <span class="settings-bucket-row__name">Remove "${bucket.name}"? Past transactions are kept.</span>
    <button class="btn btn-ghost btn-sm" data-confirm-cancel>Cancel</button>
    <button class="btn settings-danger-zone__btn-confirm btn-sm" data-confirm-remove>Remove</button>
  `;

  rowEl.querySelector('[data-confirm-cancel]').addEventListener('click', () => {
    rowEl.innerHTML = originalHtml;
    delete rowEl.dataset.confirming;
  });

  rowEl.querySelector('[data-confirm-remove]').addEventListener('click', () => {
    removeBucket(bucketId);
    _refreshBucketsPanel(container);
    showToast(`"${bucket.name}" removed`);
  });
}

function _openBucketEditInline(container, bucketId, macro) {
  const bucket = getBucketById(bucketId);
  if (!bucket) return;

  const rowEl = container.querySelector(`[data-bucket-id="${bucketId}"].settings-bucket-row`);
  if (!rowEl) return;

  rowEl.innerHTML = `
    <span class="settings-bucket-row__emoji" style="cursor:pointer;" data-action="pick-emoji" data-bucket-id="${escapeHtml(bucketId)}" id="emoji-picker-target-${escapeHtml(bucketId)}">${escapeHtml(bucket.emoji)}</span>
    <input type="text" class="input-field settings-inline-input" id="edit-bucket-name-${escapeHtml(bucketId)}"
      value="${escapeHtml(bucket.name)}" placeholder="Bucket name" maxlength="25" style="flex:1;" />
    <input type="text" class="input-field settings-inline-input" id="edit-bucket-alloc-${bucketId}"
      inputmode="numeric" value="${bucket.allocated > 0 ? formatNumber(bucket.allocated) : ''}" placeholder="₹0" style="max-width:90px;" />
    <button class="btn btn-primary btn-sm" data-save-bucket="${bucketId}">Save</button>
    <button class="btn btn-ghost btn-sm" data-cancel-bucket>✕</button>
  `;

  let selectedEmoji = bucket.emoji;
  const emojiTarget = rowEl.querySelector(`#emoji-picker-target-${bucketId}`);
  emojiTarget.addEventListener('click', () => {
    _openEmojiPicker(emojiTarget, selectedEmoji, picked => {
      selectedEmoji = picked;
      emojiTarget.textContent = picked;
    });
  });

  // Format alloc input live
  const allocInput = rowEl.querySelector(`#edit-bucket-alloc-${bucketId}`);
  allocInput.addEventListener('input', e => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    e.target.value = num > 0 ? formatNumber(num) : '';
  });

  rowEl.querySelector(`[data-save-bucket="${bucketId}"]`).addEventListener('click', () => {
    const newName = rowEl.querySelector(`#edit-bucket-name-${bucketId}`).value.trim();
    if (!newName) { showToast('Bucket name cannot be empty'); return; }
    const rawAlloc = allocInput.value.replace(/[^0-9]/g, '');
    const newAlloc = parseInt(rawAlloc, 10) || 0;
    if (newAlloc < bucket.spent) {
      showToast(`Allocation can't be below already-spent (${formatCurrency(bucket.spent)})`);
      return;
    }
    updateBucket(bucketId, { name: newName, emoji: selectedEmoji, allocated: newAlloc });
    _refreshBucketsPanel(container);
    showToast('Bucket updated ✓');
  });

  rowEl.querySelector('[data-cancel-bucket]').addEventListener('click', () => {
    _refreshBucketsPanel(container);
  });

  requestAnimationFrame(() => rowEl.querySelector(`#edit-bucket-name-${bucketId}`)?.focus());
}

function _openAddBucketInline(container, macro) {
  const group = container.querySelector(`#bucket-group-${macro}`);
  if (!group) return;

  const addBtn = group.querySelector('[data-action="add-bucket"]');
  if (!addBtn) return;

  const randomEmoji = EMOJI_PALETTE[Math.floor(Math.random() * EMOJI_PALETTE.length)];
  let chosenEmoji = randomEmoji;

  addBtn.replaceWith((() => {
    const form = document.createElement('div');
    form.className = 'settings-add-bucket-form';
    form.innerHTML = `
      <span class="settings-bucket-row__emoji" style="cursor:pointer;" id="add-emoji-${macro}">${randomEmoji}</span>
      <input type="text" class="input-field settings-inline-input" id="add-bucket-name-${macro}"
        placeholder="Bucket name" maxlength="25" style="flex:1;" />
      <input type="text" class="input-field settings-inline-input" id="add-bucket-alloc-${macro}"
        inputmode="numeric" placeholder="₹0" style="max-width:80px;" />
      <button class="btn btn-primary btn-sm" id="save-add-bucket-${macro}">Add</button>
      <button class="btn btn-ghost btn-sm" id="cancel-add-bucket-${macro}">✕</button>
    `;
    return form;
  })());

  const form = group.querySelector('.settings-add-bucket-form');

  const addEmojiEl = form.querySelector(`#add-emoji-${macro}`);
  addEmojiEl.addEventListener('click', () => {
    _openEmojiPicker(addEmojiEl, chosenEmoji, picked => {
      chosenEmoji = picked;
      addEmojiEl.textContent = picked;
    });
  });

  // Format alloc input
  form.querySelector(`#add-bucket-alloc-${macro}`).addEventListener('input', e => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    e.target.value = num > 0 ? formatNumber(num) : '';
  });

  form.querySelector(`#save-add-bucket-${macro}`).addEventListener('click', () => {
    const name = form.querySelector(`#add-bucket-name-${macro}`).value.trim();
    if (!name) { showToast('Enter a bucket name'); return; }
    const rawAlloc = form.querySelector(`#add-bucket-alloc-${macro}`).value.replace(/[^0-9]/g, '');
    const allocated = parseInt(rawAlloc, 10) || 0;
    addBucket({ macroType: macro, name, emoji: chosenEmoji, allocated });
    _refreshBucketsPanel(container);
    showToast(`"${name}" added ✓`);
  });

  form.querySelector(`#cancel-add-bucket-${macro}`).addEventListener('click', () => {
    _refreshBucketsPanel(container);
  });

  requestAnimationFrame(() => form.querySelector(`#add-bucket-name-${macro}`)?.focus());
}

function _refreshBucketsPanel(container) {
  const panel = container.querySelector('#buckets-panel');
  if (panel) panel.innerHTML = _renderBuckets();
}

// ---- Helpers ----

/**
 * Open an inline emoji-grid popup anchored to `anchor`. The popup closes on
 * selection, outside click, or Escape. Replaces the old "cycle to next palette
 * emoji on click" behaviour so users can pick a specific emoji in one tap.
 * @param {HTMLElement} anchor
 * @param {string} current
 * @param {(picked: string) => void} onSelect
 */
function _openEmojiPicker(anchor, current, onSelect) {
  document.querySelector('.settings-emoji-popup')?.remove();

  const popup = document.createElement('div');
  popup.className = 'settings-emoji-popup';
  popup.innerHTML = EMOJI_PALETTE.map(e =>
    `<button class="settings-emoji-popup__btn${e === current ? ' is-selected' : ''}" data-emoji="${e}" type="button">${e}</button>`
  ).join('');

  document.body.appendChild(popup);

  const rect = anchor.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 4;
  const left = Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 240));
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  const close = () => {
    popup.remove();
    document.removeEventListener('click', onOutside, true);
    document.removeEventListener('keydown', onEsc);
  };
  const onOutside = e => {
    if (popup.contains(e.target) || e.target === anchor) return;
    close();
  };
  const onEsc = e => { if (e.key === 'Escape') close(); };

  popup.addEventListener('click', e => {
    const btn = e.target.closest('[data-emoji]');
    if (!btn) return;
    onSelect(btn.dataset.emoji);
    close();
  });

  // Defer wiring outside-click so the originating click that opened the popup
  // doesn't immediately close it.
  setTimeout(() => {
    document.addEventListener('click', onOutside, true);
    document.addEventListener('keydown', onEsc);
  }, 0);
}

