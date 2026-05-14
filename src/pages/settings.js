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
} from '../data/store.js';
import { formatCurrency, formatNumber } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { navigate } from '../router.js';
import { exportTransactionsCSV, exportAllDataJSON } from '../utils/export.js';
import { EMOJI_PALETTE, MAX_BUCKETS_PER_MACRO } from '../data/models.js';

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
            <span class="settings-field__value" id="val-name">${user?.name || 'Not set'}</span>
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
            <span class="settings-field__value" id="val-salaryDate">${user ? `${user.salaryDate}${_ordinal(user.salaryDate)} of month` : '—'}</span>
            <button class="btn-text settings-edit-btn" data-edit="salaryDate">Edit</button>
          </div>
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
        <h2 class="settings-section__heading">Export Data</h2>
        <button class="settings-nav-row" id="btn-export-csv">
          <span>📊</span>
          <span class="settings-nav-row__label">Export Transactions (CSV)</span>
          <span class="text-accent" style="font-size:var(--text-base);">↓</span>
        </button>
        <button class="settings-nav-row" id="btn-export-json">
          <span>💾</span>
          <span class="settings-nav-row__label">Export All Data (JSON)</span>
          <span class="text-accent" style="font-size:var(--text-base);">↓</span>
        </button>
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

  return `
    <div class="settings-bucket-group" id="bucket-group-${macroType}">
      <div class="settings-bucket-group__header">
        <span class="settings-bucket-dot" style="background:${colors[macroType]};"></span>
        <span class="font-semibold" style="font-size:var(--text-sm);">${label}</span>
        <span class="text-tertiary" style="font-size:var(--text-xs); margin-left:auto;">${buckets.length} bucket${buckets.length !== 1 ? 's' : ''}</span>
      </div>
      ${buckets.map(b => `
        <div class="settings-bucket-row" data-bucket-id="${b.id}">
          <span class="settings-bucket-row__emoji">${b.emoji}</span>
          <span class="settings-bucket-row__name">${b.name}</span>
          <span class="settings-bucket-row__alloc text-mono text-tertiary">${formatCurrency(b.allocated)}</span>
          <button class="btn-icon settings-bucket-btn${b.isPinned ? ' is-pinned' : ''}"
            data-action="toggle-pin" data-bucket-id="${b.id}"
            title="${b.isPinned ? 'Unpin Quick Bucket' : 'Pin as Quick Bucket'}">📌</button>
          <button class="btn-icon settings-bucket-btn"
            data-action="edit-bucket" data-bucket-id="${b.id}" data-macro="${macroType}"
            title="Rename">✏️</button>
          <button class="btn-icon settings-bucket-btn settings-bucket-btn--danger"
            data-action="remove-bucket" data-bucket-id="${b.id}"
            title="Remove">×</button>
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
  container.querySelector('#btn-nav-commitments').addEventListener('click', () => navigate('/commitments'));
  container.querySelector('#btn-nav-history').addEventListener('click', () => navigate('/transactions'));
  container.querySelector('#btn-nav-income').addEventListener('click', () => {
    import('./income-modal.js').then(m => m.openIncomeModal());
  });

  container.querySelector('#btn-export-csv').addEventListener('click', () => {
    exportTransactionsCSV();
    showToast('Transactions exported as CSV ✓');
  });
  container.querySelector('#btn-export-json').addEventListener('click', () => {
    exportAllDataJSON();
    showToast('All data exported as JSON ✓');
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
        value="${user?.name || ''}" placeholder="Your name" maxlength="20" />
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

  } else if (field === 'salaryDate') {
    const current = user?.salaryDate || 1;
    rightEl.innerHTML = `
      <div class="settings-date-chips" id="edit-date-chips">
        ${[1, 5, 7, 10, 15, 20, 25, 28].map(d => `
          <button class="onboarding__date-chip${d === current ? ' is-active' : ''}" data-date="${d}">${d}${_ordinal(d)}</button>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-sm" id="save-salary-date">Save</button>
      <button class="btn btn-ghost btn-sm" id="cancel-salary-date">✕</button>
    `;
    let selectedDate = current;
    rightEl.querySelectorAll('.onboarding__date-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        rightEl.querySelectorAll('.onboarding__date-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        selectedDate = parseInt(chip.dataset.date, 10);
      });
    });
    container.querySelector('#save-salary-date').addEventListener('click', () => {
      setUser({ salaryDate: selectedDate });
      _restoreProfileField(container, field, `${selectedDate}${_ordinal(selectedDate)} of month`);
      showToast('Salary date updated ✓');
    });
    container.querySelector('#cancel-salary-date').addEventListener('click', () => {
      _restoreProfileField(container, field, `${current}${_ordinal(current)} of month`);
    });
  }
}

function _restoreProfileField(container, field, displayValue) {
  const fieldEl = container.querySelector(`#field-${field}`);
  if (!fieldEl) return;
  const rightEl = fieldEl.querySelector('.settings-field__right');
  const fieldName = { name: 'name', salary: 'salary', salaryDate: 'salaryDate' }[field];
  rightEl.innerHTML = `
    <span class="settings-field__value" id="val-${fieldName}">${displayValue}</span>
    <button class="btn-text settings-edit-btn" data-edit="${fieldName}">Edit</button>
  `;
  rightEl.querySelector('.settings-edit-btn').addEventListener('click', () => {
    _openProfileEdit(container, field);
  });
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
  if (!confirm(`Remove "${bucket.name}"? This won't delete past transactions.`)) return;
  removeBucket(bucketId);
  _refreshBucketsPanel(container);
  showToast(`"${bucket.name}" removed`);
}

function _openBucketEditInline(container, bucketId, macro) {
  const bucket = getBucketById(bucketId);
  if (!bucket) return;

  const rowEl = container.querySelector(`[data-bucket-id="${bucketId}"].settings-bucket-row`);
  if (!rowEl) return;

  rowEl.innerHTML = `
    <span class="settings-bucket-row__emoji" style="cursor:pointer;" data-action="pick-emoji" data-bucket-id="${bucketId}" id="emoji-picker-target-${bucketId}">${bucket.emoji}</span>
    <input type="text" class="input-field settings-inline-input" id="edit-bucket-name-${bucketId}"
      value="${bucket.name}" placeholder="Bucket name" maxlength="25" style="flex:1;" />
    <button class="btn btn-primary btn-sm" data-save-bucket="${bucketId}">Save</button>
    <button class="btn btn-ghost btn-sm" data-cancel-bucket>✕</button>
  `;

  let selectedEmoji = bucket.emoji;
  rowEl.querySelector(`#emoji-picker-target-${bucketId}`).addEventListener('click', () => {
    selectedEmoji = _pickEmojiPrompt(selectedEmoji);
    rowEl.querySelector(`#emoji-picker-target-${bucketId}`).textContent = selectedEmoji;
  });

  rowEl.querySelector(`[data-save-bucket="${bucketId}"]`).addEventListener('click', () => {
    const newName = rowEl.querySelector(`#edit-bucket-name-${bucketId}`).value.trim();
    if (!newName) { showToast('Bucket name cannot be empty'); return; }
    updateBucket(bucketId, { name: newName, emoji: selectedEmoji });
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

  form.querySelector(`#add-emoji-${macro}`).addEventListener('click', () => {
    chosenEmoji = _pickEmojiPrompt(chosenEmoji);
    form.querySelector(`#add-emoji-${macro}`).textContent = chosenEmoji;
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

function _pickEmojiPrompt(current) {
  const idx = EMOJI_PALETTE.indexOf(current);
  const next = (idx + 1) % EMOJI_PALETTE.length;
  return EMOJI_PALETTE[next];
}

function _ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
