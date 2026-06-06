/**
 * Fiscal Fold — Transaction Modal (Sprint 5)
 *
 * Multi-step bottom drawer for logging expenses:
 *   Step 1: amount keypad
 *   Step 2: bucket picker
 *   Step 3: note + confirm  (normal path)
 *   Step 4: borrow picker    (trade-off path — when bucket is short)
 */

import './transaction-modal.css';
import {
  getBuckets,
  getBucketById,
  getQuickBuckets,
  addTransaction,
  addTradeOffTransaction,
} from '../data/store.js';
import { formatCurrency, escapeHtml } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { rerender } from '../router.js';
import { enqueue as offlineEnqueue } from '../utils/offlineQueue.js';

// ---- Modal State ----

/** @type {'amount'|'bucket'|'note'|'tradeoff'|'tradeoff-confirm'} */
let _step = 'amount';
let _amountStr = '';
let _amount = 0;
/** @type {import('../data/models.js').MicroBucket|null} */
let _targetBucket = null;
/** @type {import('../data/models.js').MicroBucket|null} */
let _borrowBucket = null;
let _note = '';
let _preselectBucketId = null;

let _overlay = null;
let _drawer = null;

// ---- Public API ----

/**
 * Open the transaction modal.
 * @param {string} [preselectBucketId] - Optional bucket to pre-select (from Quick Bucket tap)
 */
export function openTransactionModal(preselectBucketId) {
  // Reset state
  _step = preselectBucketId ? 'bucket' : 'amount';
  _amountStr = '';
  _amount = 0;
  _targetBucket = null;
  _borrowBucket = null;
  _note = '';
  _preselectBucketId = preselectBucketId || null;

  _overlay = document.createElement('div');
  _overlay.className = 'drawer-overlay is-open';
  _overlay.setAttribute('aria-hidden', 'true');
  _overlay.addEventListener('click', _closeModal);

  _drawer = document.createElement('div');
  _drawer.className = 'drawer txn-drawer is-open';
  _drawer.setAttribute('role', 'dialog');
  _drawer.setAttribute('aria-modal', 'true');
  _drawer.setAttribute('aria-label', 'Log transaction');
  _drawer.addEventListener('click', e => e.stopPropagation());

  document.body.appendChild(_overlay);
  document.body.appendChild(_drawer);

  // If bucket pre-selected, skip to amount step but keep bucket
  if (preselectBucketId) {
    _targetBucket = getBucketById(preselectBucketId) || null;
    _step = 'amount';
  }

  _renderStep();
}

// ---- Internal ----

/** Format raw amount string for display (e.g. "1250" → "1,250") */
function _formatDisplay(str) {
  if (!str || str === '0') return '0';
  const [intPart, decPart] = str.split('.');
  const formatted = new Intl.NumberFormat('en-IN').format(parseInt(intPart) || 0);
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
}

function _closeModal() {
  _overlay?.remove();
  _drawer?.remove();
  _overlay = null;
  _drawer = null;
}

function _getContent() {
  if (!_drawer) return null;
  let content = _drawer.querySelector('.txn-drawer__content');
  if (!content) {
    _drawer.innerHTML = `
      <div class="drawer__handle"></div>
      <div class="txn-drawer__content"></div>
    `;
    content = _drawer.querySelector('.txn-drawer__content');
  }
  return content;
}

function _renderStep() {
  const content = _getContent();
  if (!content) return;
  content.innerHTML = '';

  if (_step === 'amount') _renderAmount(content);
  else if (_step === 'bucket') _renderBucket(content);
  else if (_step === 'note') _renderNote(content);
  else if (_step === 'tradeoff') _renderTradeOff(content);
  else if (_step === 'tradeoff-confirm') _renderTradeOffConfirm(content);
}

// ---- Step 1: Amount Keypad ----

function _renderAmount(container) {
  const bucketLabel = _targetBucket
    ? `${_targetBucket.emoji} ${_targetBucket.name}`
    : 'all buckets';

  container.innerHTML = `
    <div class="txn-step">
      <div class="txn-header">
        <button class="btn btn-ghost txn-close-btn" id="txn-close" title="Close" aria-label="Close">✕</button>
        <span class="txn-header__title">${_targetBucket ? escapeHtml(bucketLabel) : 'Log Expense'}</span>
        <button class="btn btn-ghost txn-income-link" id="txn-income-link" data-testid="txn-income-link">Income →</button>
      </div>

      <div class="txn-amount-display">
        <span class="txn-amount-symbol">₹</span>
        <span class="txn-amount-value ${_amount > 0 ? 'txn-amount-value--active' : ''}" id="txn-amount-value">${_formatDisplay(_amountStr)}</span>
      </div>

      <div class="txn-quick-amounts">
        ${[50, 100, 200, 500].map(v => `
          <button class="txn-quick-btn" data-v="${v}">₹${v}</button>
        `).join('')}
      </div>

      <div class="txn-keypad">
        ${[1,2,3,4,5,6,7,8,9,'.',0,'⌫'].map(k => `
          <button class="txn-key${k === '⌫' ? ' txn-key--back' : ''}${k === '.' ? ' txn-key--dot' : ''}" data-key="${k}">${k}</button>
        `).join('')}
      </div>

      <button
        class="btn btn-primary btn-full txn-next-btn"
        id="txn-next"
        ${_amount <= 0 ? 'disabled' : ''}
      >
        Next — Choose Bucket
      </button>
    </div>
  `;

  container.querySelector('#txn-close').addEventListener('click', _closeModal);

  // Income shortcut — keeps income logging accessible from the same FAB.
  container.querySelector('#txn-income-link')?.addEventListener('click', () => {
    _closeModal();
    import('./income-modal.js').then(m => m.openIncomeModal());
  });

  container.querySelectorAll('.txn-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _amountStr = btn.dataset.v;
      _amount = Number(_amountStr);
      _renderStep();
    });
  });

  container.querySelectorAll('.txn-key').forEach(btn => {
    btn.addEventListener('click', () => _handleKey(btn.dataset.key));
  });

  container.querySelector('#txn-next')?.addEventListener('click', () => {
    if (_amount > 0) {
      if (_targetBucket) {
        // Bucket already chosen via quick-bucket tap — jump to note/tradeoff check
        _decideAfterBucket();
      } else {
        _step = 'bucket';
        _renderStep();
      }
    }
  });
}

function _handleKey(key) {
  if (key === '⌫') {
    _amountStr = _amountStr.slice(0, -1);
  } else if (key === '.') {
    // Single decimal point only; ignore taps once one is already present.
    if (_amountStr.includes('.')) return;
    _amountStr = (_amountStr || '0') + '.';
  } else {
    if (_amountStr === '0') {
      _amountStr = key;
    } else {
      if (_amountStr.length >= 8) return;
      _amountStr += key;
    }
  }

  _amount = parseFloat(_amountStr) || 0;

  // Update display live without full re-render
  const val = document.getElementById('txn-amount-value');
  const btn = document.getElementById('txn-next');
  if (val) {
    val.textContent = _formatDisplay(_amountStr);
    val.classList.toggle('txn-amount-value--active', _amount > 0);
  }
  if (btn) btn.disabled = _amount <= 0;
}

// ---- Step 2: Bucket Picker ----

function _renderBucket(container) {
  const pinned = getQuickBuckets();
  const groups = {
    needs: getBuckets('needs'),
    wants: getBuckets('wants'),
    future: getBuckets('future'),
  };
  const labels = { needs: 'Needs', wants: 'Wants', future: 'Future' };
  const colors = { needs: 'var(--needs)', wants: 'var(--wants)', future: 'var(--future)' };

  const bucketRow = (b) => {
    const rem = Math.max(0, b.allocated - b.spent);
    const isEmpty = rem === 0;
    const isLow = !isEmpty && rem < _amount;
    const shortBy = isLow ? _amount - rem : 0;
    return `
      <button
        class="txn-bucket-row${isEmpty ? ' txn-bucket-row--empty' : ''}${isLow ? ' txn-bucket-row--low' : ''}"
        data-id="${escapeHtml(b.id)}"
        title="${isEmpty ? 'No budget left — tap another bucket and we’ll offer to cover from this one.' : ''}"
      >
        <span class="txn-bucket-row__emoji">${escapeHtml(b.emoji)}</span>
        <div class="txn-bucket-row__text">
          <span class="txn-bucket-row__name">${escapeHtml(b.name)}</span>
          ${isEmpty ? '<span class="txn-bucket-row__hint">No budget left this cycle</span>' : ''}
        </div>
        <div class="txn-bucket-row__right">
          <span class="txn-bucket-row__amount${isLow ? ' txn-bucket-row__amount--low' : ''}">${formatCurrency(rem)}</span>
          ${isLow ? `<span class="badge badge--amber" style="font-size:9px;padding:1px 5px;">Short ${formatCurrency(shortBy)}</span>` : ''}
        </div>
      </button>
    `;
  };

  container.innerHTML = `
    <div class="txn-step">
      <div class="txn-header">
        <button class="btn btn-ghost txn-back-btn" id="txn-back" title="Back" aria-label="Back">← Back</button>
        <span class="txn-header__title">${formatCurrency(_amount)}</span>
        <button class="btn btn-ghost txn-close-btn" id="txn-close" title="Close" aria-label="Close">✕</button>
      </div>

      <p class="txn-subtitle">Charge this to which bucket?</p>

      <div class="txn-bucket-list">
        ${pinned.length > 0 ? `
          <div class="txn-bucket-group">
            <p class="txn-bucket-group__label" style="color:var(--accent-primary)">Quick Buckets</p>
            ${pinned.map(bucketRow).join('')}
          </div>
        ` : ''}

        ${Object.entries(groups).map(([type, buckets]) => {
          if (!buckets.length) return '';
          return `
            <div class="txn-bucket-group">
              <p class="txn-bucket-group__label" style="color:${colors[type]}">${labels[type]}</p>
              ${buckets.map(bucketRow).join('')}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelector('#txn-back').addEventListener('click', () => {
    _step = 'amount';
    _renderStep();
  });
  container.querySelector('#txn-close').addEventListener('click', _closeModal);

  // Allow tapping an empty bucket too — the trade-off flow can cover the
  // whole amount from another bucket. Disabling silently was confusing.
  container.querySelectorAll('.txn-bucket-row').forEach(row => {
    row.addEventListener('click', () => {
      _targetBucket = getBucketById(row.dataset.id) || null;
      if (_targetBucket) _decideAfterBucket();
    });
  });
}

function _decideAfterBucket() {
  if (!_targetBucket) return;
  const rem = Math.max(0, _targetBucket.allocated - _targetBucket.spent);
  _step = _amount > rem ? 'tradeoff' : 'note';
  _renderStep();
}

// ---- Step 3: Note + Confirm ----

function _renderNote(container) {
  const rem = Math.max(0, _targetBucket.allocated - _targetBucket.spent);
  const newRem = rem - _amount;

  container.innerHTML = `
    <div class="txn-step">
      <div class="txn-header">
        <button class="btn btn-ghost txn-back-btn" id="txn-back" title="Back" aria-label="Back">← Back</button>
        <span class="txn-header__title">Confirm</span>
        <button class="btn btn-ghost txn-close-btn" id="txn-close" title="Close" aria-label="Close">✕</button>
      </div>

      <div class="txn-confirm-card">
        <div class="txn-confirm-row">
          <span class="txn-confirm-label">Amount</span>
          <span class="txn-confirm-value text-mono">${formatCurrency(_amount)}</span>
        </div>
        <div class="txn-confirm-row">
          <span class="txn-confirm-label">Bucket</span>
          <span class="txn-confirm-value">${escapeHtml(_targetBucket.emoji)} ${escapeHtml(_targetBucket.name)}</span>
        </div>
        <div class="txn-confirm-row">
          <span class="txn-confirm-label">Remaining after</span>
          <span class="txn-confirm-value text-mono ${newRem <= 0 ? 'text-warn' : 'text-accent'}">${formatCurrency(newRem)}</span>
        </div>
      </div>

      <button class="txn-note-toggle" id="txn-note-toggle">
        <span class="txn-note-toggle__icon">＋</span>
        <span id="txn-note-toggle-label">${_note ? `Note: ${_note}` : 'Add a note'}</span>
      </button>
      <div class="txn-note-field${_note ? '' : ' hidden'}" id="txn-note-field">
        <input
          type="text"
          class="input-field"
          id="txn-note"
          placeholder="Coffee with Rahul, groceries run…"
          maxlength="60"
          value="${escapeHtml(_note)}"
        />
      </div>

      <button class="btn btn-primary btn-full txn-confirm-btn" id="txn-confirm" style="margin-top:var(--space-6)">
        <span class="txn-confirm-btn__text">Log ${formatCurrency(_amount)} → ${escapeHtml(_targetBucket.name)}</span>
        <span class="txn-confirm-btn__check" aria-hidden="true">✓</span>
      </button>
    </div>
  `;

  container.querySelector('#txn-back').addEventListener('click', () => {
    _step = _preselectBucketId ? 'amount' : 'bucket';
    _renderStep();
  });
  container.querySelector('#txn-close').addEventListener('click', _closeModal);

  // Note toggle
  container.querySelector('#txn-note-toggle').addEventListener('click', () => {
    const field = container.querySelector('#txn-note-field');
    const isHidden = field.classList.toggle('hidden');
    if (!isHidden) container.querySelector('#txn-note')?.focus();
  });
  container.querySelector('#txn-note')?.addEventListener('input', e => {
    _note = e.target.value;
    const label = container.querySelector('#txn-note-toggle-label');
    if (label) label.textContent = _note || 'Add a note';
  });

  container.querySelector('#txn-confirm').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    btn.classList.add('txn-confirm-btn--done');
    btn.disabled = true;
    setTimeout(() => {
      addTransaction({ bucketId: _targetBucket.id, amount: _amount, note: _note, type: 'expense' });
      if (!navigator.onLine) {
        offlineEnqueue({ bucketId: _targetBucket.id, amount: _amount, note: _note });
        showToast('Saved locally — will record when you’re back online');
      } else {
        showToast(`Logged ${formatCurrency(_amount)} to ${_targetBucket.name}`, 'success');
      }
      _closeModal();
      rerender();
    }, 400);
  });
}

// ---- Step 4a: Borrow Picker ----

function _renderTradeOff(container) {
  const rem = Math.max(0, _targetBucket.allocated - _targetBucket.spent);
  const deficit = _amount - rem;

  const donors = [
    ...getBuckets('needs'),
    ...getBuckets('wants'),
    ...getBuckets('future'),
  ].filter(b => b.id !== _targetBucket.id && (b.allocated - b.spent) > 0);

  container.innerHTML = `
    <div class="txn-step">
      <div class="txn-header">
        <button class="btn btn-ghost txn-back-btn" id="txn-back" title="Back" aria-label="Back">← Back</button>
        <span class="txn-header__title">Over Budget</span>
        <button class="btn btn-ghost txn-close-btn" id="txn-close" title="Close" aria-label="Close">✕</button>
      </div>

      <div class="txn-tradeoff-alert">
        <span style="font-size:28px">⚡</span>
        <div>
          <p class="txn-tradeoff-alert__title">${escapeHtml(_targetBucket.name)} is short</p>
          <p class="txn-tradeoff-alert__desc">
            Has ${formatCurrency(rem)}, needs ${formatCurrency(_amount)}.
            Cover the missing ${formatCurrency(deficit)} from another bucket?
            <span class="txn-tradeoff-alert__note">This moves money permanently — there's no payback.</span>
          </p>
        </div>
      </div>

      ${donors.length > 0 ? `
        <p class="txn-subtitle">Cover the shortfall from:</p>
        <div class="txn-bucket-list">
          ${donors.map(b => {
            const bRem = Math.max(0, b.allocated - b.spent);
            const canCover = bRem >= deficit;
            const coverableLabel = canCover
              ? `Can cover ${formatCurrency(deficit)}`
              : `Only ${formatCurrency(bRem)} available`;
            return `
              <button class="txn-bucket-row${!canCover ? ' txn-bucket-row--low' : ''}" data-donor="${escapeHtml(b.id)}">
                <span class="txn-bucket-row__emoji">${escapeHtml(b.emoji)}</span>
                <div class="txn-bucket-row__text">
                  <span class="txn-bucket-row__name">${escapeHtml(b.name)}</span>
                  <span class="txn-bucket-row__hint">${coverableLabel}</span>
                </div>
                <div class="txn-bucket-row__right">
                  <span class="txn-bucket-row__amount${!canCover ? ' txn-bucket-row__amount--low' : ''}">${formatCurrency(bRem)}</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="card" style="text-align:center;padding:var(--space-6)">
          <p class="text-tertiary" style="font-size:var(--text-sm)">No other buckets have available funds.</p>
          <button class="btn btn-ghost" id="txn-log-anyway" style="margin-top:var(--space-3);color:var(--warn)">
            Log anyway (go over budget)
          </button>
        </div>
      `}
    </div>
  `;

  container.querySelector('#txn-back').addEventListener('click', () => {
    _step = 'bucket';
    _renderStep();
  });
  container.querySelector('#txn-close').addEventListener('click', _closeModal);

  container.querySelector('#txn-log-anyway')?.addEventListener('click', () => {
    addTransaction({ bucketId: _targetBucket.id, amount: _amount, note: _note, type: 'expense' });
    if (!navigator.onLine) {
      offlineEnqueue({ bucketId: _targetBucket.id, amount: _amount, note: _note });
      showToast('Saved locally — will sync when online');
    } else {
      showToast(`Logged ${formatCurrency(_amount)} — over budget`, 'default');
    }
    _closeModal();
    rerender();
  });

  container.querySelectorAll('[data-donor]').forEach(row => {
    row.addEventListener('click', () => {
      _borrowBucket = getBucketById(row.dataset.donor) || null;
      if (_borrowBucket) {
        _step = 'tradeoff-confirm';
        _renderStep();
      }
    });
  });
}

// ---- Step 4b: Trade-Off Confirm ----

function _renderTradeOffConfirm(container) {
  const targetRem = Math.max(0, _targetBucket.allocated - _targetBucket.spent);
  const borrowRem = Math.max(0, _borrowBucket.allocated - _borrowBucket.spent);
  const deficit = _amount - targetRem;
  const borrowAmount = Math.min(deficit, borrowRem);

  container.innerHTML = `
    <div class="txn-step">
      <div class="txn-header">
        <button class="btn btn-ghost txn-back-btn" id="txn-back" title="Back" aria-label="Back">← Back</button>
        <span class="txn-header__title">Review Split</span>
        <button class="btn btn-ghost txn-close-btn" id="txn-close" title="Close" aria-label="Close">✕</button>
      </div>

      <div class="txn-split-card">
        <div class="txn-split-row">
          <span>${escapeHtml(_targetBucket.emoji)} ${escapeHtml(_targetBucket.name)}</span>
          <span class="text-mono">pays ${formatCurrency(targetRem)}</span>
        </div>
        <div class="txn-split-plus">+</div>
        <div class="txn-split-row txn-split-row--borrow">
          <span>${escapeHtml(_borrowBucket.emoji)} ${escapeHtml(_borrowBucket.name)}</span>
          <span class="text-mono text-warn">covers ${formatCurrency(borrowAmount)}</span>
        </div>
        <div class="txn-split-total">
          <span>Total</span>
          <span class="text-mono font-bold">${formatCurrency(_amount)}</span>
        </div>
      </div>
      <p class="txn-split-note">${escapeHtml(_borrowBucket.name)}'s budget drops by ${formatCurrency(borrowAmount)}. No payback.</p>

      <button class="txn-note-toggle" id="txn-note-toggle">
        <span class="txn-note-toggle__icon">＋</span>
        <span id="txn-note-toggle-label">${_note ? `Note: ${_note}` : 'Add a note'}</span>
      </button>
      <div class="txn-note-field${_note ? '' : ' hidden'}" id="txn-note-field">
        <input
          type="text"
          class="input-field"
          id="txn-note"
          placeholder="Weekend trip supplies…"
          maxlength="60"
          value="${escapeHtml(_note)}"
        />
      </div>

      <button class="btn btn-primary btn-full txn-confirm-btn" id="txn-confirm" style="margin-top:var(--space-6)">
        <span class="txn-confirm-btn__text">Confirm Split</span>
        <span class="txn-confirm-btn__check" aria-hidden="true">✓</span>
      </button>
    </div>
  `;

  container.querySelector('#txn-back').addEventListener('click', () => {
    _step = 'tradeoff';
    _renderStep();
  });
  container.querySelector('#txn-close').addEventListener('click', _closeModal);

  container.querySelector('#txn-note-toggle').addEventListener('click', () => {
    const field = container.querySelector('#txn-note-field');
    const isHidden = field.classList.toggle('hidden');
    if (!isHidden) container.querySelector('#txn-note')?.focus();
  });
  container.querySelector('#txn-note')?.addEventListener('input', e => {
    _note = e.target.value;
    const label = container.querySelector('#txn-note-toggle-label');
    if (label) label.textContent = _note || 'Add a note';
  });

  container.querySelector('#txn-confirm').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    btn.classList.add('txn-confirm-btn--done');
    btn.disabled = true;
    setTimeout(() => {
      addTradeOffTransaction({
        bucketId: _targetBucket.id,
        amount: _amount,
        borrowFromId: _borrowBucket.id,
        borrowAmount,
        note: _note,
      });
      if (!navigator.onLine) {
        offlineEnqueue({ bucketId: _targetBucket.id, amount: _amount, borrowFromId: _borrowBucket.id, note: _note });
        showToast('Saved locally — will record when you’re back online');
      } else {
        showToast(`Logged — ${_borrowBucket.name} covered ${formatCurrency(borrowAmount)}`, 'success');
      }
      _closeModal();
      rerender();
    }, 400);
  });
}
