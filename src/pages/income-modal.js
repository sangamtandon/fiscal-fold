/**
 * Fiscal Fold — Add Income Modal (Sprint 10)
 *
 * 3-step modal for adding bonus/variable income:
 *   Step 1: Enter amount
 *   Step 2: Choose target bucket (or "boost total salary")
 *   Step 3: Confirm
 */

import './income-modal.css';
import {
  getBuckets,
  addIncome,
} from '../data/store.js';
import { formatCurrency, formatNumber, escapeHtml } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { rerender } from '../router.js';

let _overlay = null;
let _drawer = null;
let _amount = 0;
let _amountStr = '';
let _targetBucketId = null;
let _note = '';

/** @type {'amount'|'bucket'|'confirm'} */
let _step = 'amount';

export function openIncomeModal() {
  _amount = 0;
  _amountStr = '';
  _targetBucketId = null;
  _note = '';
  _step = 'amount';

  _overlay = document.createElement('div');
  _overlay.className = 'drawer-overlay is-open';
  _overlay.addEventListener('click', _close);

  _drawer = document.createElement('div');
  _drawer.className = 'drawer income-drawer is-open';
  _drawer.addEventListener('click', e => e.stopPropagation());

  document.body.appendChild(_overlay);
  document.body.appendChild(_drawer);

  _renderStep();
}

function _close() {
  _overlay?.remove();
  _drawer?.remove();
  _overlay = null;
  _drawer = null;
}

function _renderStep() {
  if (!_drawer) return;
  if (_step === 'amount') _renderAmount();
  else if (_step === 'bucket') _renderBucket();
  else if (_step === 'confirm') _renderConfirm();
}

// ---- Step 1: Amount ----

function _renderAmount() {
  _drawer.innerHTML = `
    <div class="income-drawer__header">
      <span style="font-size:24px;">💰</span>
      <h2 class="income-drawer__title">Add Income</h2>
      <button class="btn-icon income-drawer__close" id="ic-close" aria-label="Close">✕</button>
    </div>
    <p class="income-drawer__subtitle text-secondary">Bonus, freelance, refund, or any extra income.</p>

    <div class="income-amount-display" id="ic-amount-display">
      <span class="income-amount__symbol">₹</span>
      <span class="income-amount__value" id="ic-amount-val">${_amountStr || '0'}</span>
    </div>

    <div class="income-keypad">
      ${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k => `
        <button class="income-key${k === '⌫' ? ' income-key--action' : ''}" data-key="${k}">${k}</button>
      `).join('')}
    </div>

    <div class="income-drawer__footer">
      <button class="btn btn-ghost" id="ic-cancel">Cancel</button>
      <button class="btn btn-primary btn-lg" id="ic-next" ${!_amountStr || _amount <= 0 ? 'disabled' : ''}>
        Next →
      </button>
    </div>
  `;

  _drawer.querySelector('#ic-close').addEventListener('click', _close);
  _drawer.querySelector('#ic-cancel').addEventListener('click', _close);

  _drawer.querySelector('.income-keypad').addEventListener('click', e => {
    const key = e.target.closest('[data-key]')?.dataset.key;
    if (!key) return;

    if (key === '⌫') {
      _amountStr = _amountStr.slice(0, -1);
    } else if (key === '.') {
      if (!_amountStr.includes('.')) _amountStr += '.';
    } else {
      if (_amountStr === '0') _amountStr = key;
      else _amountStr += key;
    }

    _amount = parseFloat(_amountStr) || 0;
    const valEl = _drawer.querySelector('#ic-amount-val');
    if (valEl) valEl.textContent = _amountStr || '0';
    const nextBtn = _drawer.querySelector('#ic-next');
    if (nextBtn) nextBtn.disabled = _amount <= 0;
  });

  _drawer.querySelector('#ic-next').addEventListener('click', () => {
    if (_amount > 0) {
      _step = 'bucket';
      _renderStep();
    }
  });
}

// ---- Step 2: Bucket picker ----

function _renderBucket() {
  const macroSections = [
    { key: 'needs', label: 'Needs', color: 'var(--needs)' },
    { key: 'wants', label: 'Wants', color: 'var(--wants)' },
    { key: 'future', label: 'Future', color: 'var(--future)' },
  ];

  _drawer.innerHTML = `
    <div class="income-drawer__header">
      <button class="btn-icon" id="ic-back" aria-label="Back">←</button>
      <h2 class="income-drawer__title">Where should ${formatCurrency(_amount)} go?</h2>
      <button class="btn-icon income-drawer__close" id="ic-close" aria-label="Close">✕</button>
    </div>

    <div class="income-bucket-list">
      <!-- Option: boost cycle salary, split across macros by ratio -->
      <button class="income-bucket-option${_targetBucketId === null ? ' is-selected' : ''}" data-bucket-id="">
        <span style="font-size:20px;">🏦</span>
        <div class="income-bucket-option__info">
          <span class="income-bucket-option__name">Add to overall budget</span>
          <span class="income-bucket-option__sub text-tertiary">Splits across Needs/Wants/Future by your budget ratio</span>
        </div>
        ${_targetBucketId === null ? '<span class="income-bucket-option__check">✓</span>' : ''}
      </button>

      ${macroSections.map(({ key, label, color }) => {
        const buckets = getBuckets(key);
        if (buckets.length === 0) return '';
        return `
          <div class="income-bucket-section-label" style="color:${color};">${label}</div>
          ${buckets.map(b => `
            <button class="income-bucket-option${_targetBucketId === b.id ? ' is-selected' : ''}" data-bucket-id="${escapeHtml(b.id)}">
              <span style="font-size:20px;">${escapeHtml(b.emoji)}</span>
              <div class="income-bucket-option__info">
                <span class="income-bucket-option__name">${escapeHtml(b.name)}</span>
                <span class="income-bucket-option__sub text-tertiary">${formatCurrency(Math.max(0, b.allocated - b.spent))} remaining</span>
              </div>
              ${_targetBucketId === b.id ? '<span class="income-bucket-option__check">✓</span>' : ''}
            </button>
          `).join('')}
        `;
      }).join('')}
    </div>

    <div class="income-drawer__footer">
      <button class="btn btn-ghost" id="ic-back-footer">← Back</button>
      <button class="btn btn-primary btn-lg" id="ic-next-confirm">Review →</button>
    </div>
  `;

  _drawer.querySelector('#ic-close').addEventListener('click', _close);
  _drawer.querySelector('#ic-back').addEventListener('click', () => { _step = 'amount'; _renderStep(); });
  _drawer.querySelector('#ic-back-footer').addEventListener('click', () => { _step = 'amount'; _renderStep(); });

  _drawer.querySelector('.income-bucket-list').addEventListener('click', e => {
    const opt = e.target.closest('[data-bucket-id]');
    if (!opt) return;
    _targetBucketId = opt.dataset.bucketId || null;
    // Re-render to show check
    _step = 'bucket';
    _renderStep();
  });

  _drawer.querySelector('#ic-next-confirm').addEventListener('click', () => {
    _step = 'confirm';
    _renderStep();
  });
}

// ---- Step 3: Confirm ----

function _renderConfirm() {
  const _confirmBucket = _targetBucketId ? getBuckets().find(bk => bk.id === _targetBucketId) : null;
  const targetLabel = _targetBucketId
    ? (_confirmBucket ? `${_confirmBucket.emoji} ${_confirmBucket.name}` : 'Unknown bucket')
    : '🏦 Overall budget';

  _drawer.innerHTML = `
    <div class="income-drawer__header">
      <button class="btn-icon" id="ic-back" aria-label="Back">←</button>
      <h2 class="income-drawer__title">Confirm Income</h2>
      <button class="btn-icon income-drawer__close" id="ic-close" aria-label="Close">✕</button>
    </div>

    <div class="income-confirm-card card card--glass">
      <div class="income-confirm-row">
        <span class="text-secondary" style="font-size:var(--text-sm);">Amount</span>
        <span class="text-mono font-bold" style="font-size:var(--text-xl); color:var(--accent-primary);">${formatCurrency(_amount)}</span>
      </div>
      <div class="income-confirm-row">
        <span class="text-secondary" style="font-size:var(--text-sm);">Adding to</span>
        <span class="font-semibold" style="font-size:var(--text-sm);">${escapeHtml(targetLabel)}</span>
      </div>
    </div>

    <div class="income-note-wrap">
      <input type="text" class="input-field" id="ic-note"
        placeholder="Note (optional)" value="${escapeHtml(_note)}" maxlength="60" />
    </div>

    <div class="income-drawer__footer">
      <button class="btn btn-ghost" id="ic-back-footer">← Back</button>
      <button class="btn btn-primary btn-lg" id="ic-confirm">
        Add Income ✓
      </button>
    </div>
  `;

  _drawer.querySelector('#ic-close').addEventListener('click', _close);
  _drawer.querySelector('#ic-back').addEventListener('click', () => { _step = 'bucket'; _renderStep(); });
  _drawer.querySelector('#ic-back-footer').addEventListener('click', () => { _step = 'bucket'; _renderStep(); });
  _drawer.querySelector('#ic-note').addEventListener('input', e => { _note = e.target.value; });

  _drawer.querySelector('#ic-confirm').addEventListener('click', () => {
    const confirmBtn = _drawer.querySelector('#ic-confirm');
    confirmBtn.disabled = true;
    addIncome(_amount, _targetBucketId || undefined, _note);
    showToast(`${formatCurrency(_amount)} added ✓`);
    _close();
    rerender();
  });
}
