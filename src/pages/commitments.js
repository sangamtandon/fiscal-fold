/**
 * Fiscal Fold — Commitments Management Page (Sprint 7)
 *
 * Route: /commitments
 * Accessible from Settings → Commitments row.
 *
 * Features:
 *   - List all commitments (active / inactive)
 *   - Per-row: mark paid, toggle active, delete
 *   - Add / edit via bottom drawer form
 */

import './commitments.css';
import {
  getCommitments,
  addCommitment,
  updateCommitment,
  removeCommitment,
  addTransaction,
  getBuckets,
  getState,
} from '../data/store.js';
import { formatCurrency } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { EMOJI_PALETTE } from '../data/models.js';

// ---- Due-date helpers ----

const MS_DAY = 1000 * 60 * 60 * 24;

/**
 * Compute whole-day diff from now to the next occurrence of dueDate (day-of-month).
 * If dueDate <= today, the next occurrence is in the following month.
 * @param {number} dueDate  1–31
 * @returns {number}  negative = overdue
 */
function _dueDiffDays(dueDate) {
  const now = new Date();
  const today = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Try this month first
  let target = new Date(year, month, dueDate);
  // If the day doesn't exist in this month (e.g. dueDate=31 in April) or it has already passed, use next month
  if (target.getDate() !== dueDate || dueDate < today) {
    target = new Date(year, month + 1, dueDate);
    // Clamp to last day of next month if needed
    if (target.getDate() !== dueDate) target = new Date(year, month + 2, 0);
  }
  const startOfToday = new Date(year, month, today);
  return Math.round((target - startOfToday) / MS_DAY);
}

/**
 * @param {import('../data/models.js').Commitment} c
 * @returns {'paid'|'overdue'|'due-today'|'due-soon'|'upcoming'}
 */
function _dueStatus(c) {
  if (c.isPaid) return 'paid';
  const diff = _dueDiffDays(c.dueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due-today';
  if (diff <= 3) return 'due-soon';
  return 'upcoming';
}

const _statusLabel = {
  paid: { text: 'Paid', cls: 'badge--green' },
  overdue: { text: 'Overdue', cls: 'badge--amber' },
  'due-today': { text: 'Due Today', cls: 'badge--amber' },
  'due-soon': { text: `Due soon`, cls: 'badge--amber' },
  upcoming: { text: '', cls: '' },
};

const _macroColor = {
  needs: 'var(--needs)',
  wants: 'var(--wants)',
  future: 'var(--future)',
};

const _macroLabel = { needs: 'Needs', wants: 'Wants', future: 'Future' };

// ---- Page renderer ----

/**
 * Render the commitments management page.
 * @param {HTMLElement} container
 */
export function renderCommitmentsPage(container) {
  _render(container);
}

function _render(container) {
  const all = getState().commitments;
  const sorted = [...all].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.dueDate - b.dueDate;
  });

  container.innerHTML = `
    <div class="cm-page">
      <div class="cm-header">
        <button class="btn btn-ghost cm-back" id="cm-back">← Settings</button>
        <h1 class="cm-title">Commitments</h1>
        <div style="width:80px"></div>
      </div>

      <p class="cm-subtitle">Recurring bills set aside from your macro budgets before you start spending — so the dashboard never lies. Mark paid to record the expense to a bucket.</p>

      ${sorted.length === 0 ? `
        <div class="cm-empty">
          <span style="font-size:40px">🔄</span>
          <p>No commitments yet.</p>
          <p class="text-tertiary" style="font-size:var(--text-sm)">Add rent, EMIs, subscriptions—anything that recurs monthly.</p>
        </div>
      ` : `
        <div class="cm-list" id="cm-list">
          ${sorted.map(c => _renderRow(c)).join('')}
        </div>
      `}

      <button class="btn btn-primary btn-full cm-add-btn" id="cm-add">
        + Add Commitment
      </button>
    </div>
  `;

  container.querySelector('#cm-back').addEventListener('click', () => {
    import('../router.js').then(({ navigate }) => navigate('/settings'));
  });

  container.querySelector('#cm-add').addEventListener('click', () => {
    _openForm(container, null);
  });

  // Wire up row actions
  container.querySelectorAll('[data-cm-paid]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.cmPaid;
      const c = getState().commitments.find(x => x.id === id);
      if (!c) return;
      if (c.isPaid) {
        updateCommitment(id, { isPaid: false });
        _render(container);
        showToast(`${c.name} marked unpaid`, 'success');
        return;
      }
      // Marking paid: prompt for the bucket to record the expense against
      // so paying a commitment actually debits the budget — otherwise the
      // dashboard silently disagreed with reality.
      _openMarkPaid(container, c);
    });
  });

  container.querySelectorAll('[data-cm-delete]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.cmDelete;
      const c = getState().commitments.find(x => x.id === id);
      removeCommitment(id);
      _render(container);
      showToast(`${c?.name || 'Commitment'} removed`);
    });
  });

  container.querySelectorAll('[data-cm-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.cmToggle;
      const c = getState().commitments.find(x => x.id === id);
      if (!c) return;
      updateCommitment(id, { isActive: !c.isActive });
      _render(container);
      showToast(c.isActive ? `${c.name} paused` : `${c.name} resumed`, 'success');
    });
  });

  container.querySelectorAll('[data-cm-edit]').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.cmEdit;
      const c = getState().commitments.find(x => x.id === id);
      if (c) _openForm(container, c);
    });
  });
}

function _renderRow(c) {
  const status = _dueStatus(c);
  const { text: statusText, cls: statusCls } = _statusLabel[status];

  return `
    <div class="cm-row${c.isActive ? '' : ' cm-row--inactive'}" data-cm-edit="${c.id}">
      <div class="cm-row__emoji">${c.emoji}</div>

      <div class="cm-row__body">
        <div class="cm-row__top">
          <span class="cm-row__name">${c.name}</span>
          ${!c.isActive ? `<span class="badge cm-row__status" style="opacity:.6" title="Paused commitments don't reserve budget until you resume them.">Paused</span>` : statusText ? `<span class="badge ${statusCls} cm-row__status">${statusText}</span>` : ''}
        </div>
        <div class="cm-row__meta">
          <span class="text-mono" style="color:${_macroColor[c.macroType]};font-size:var(--text-xs);font-weight:600">${_macroLabel[c.macroType]}</span>
          <span class="text-tertiary" style="font-size:var(--text-xs)">· ${c.dueDate}${_ord(c.dueDate)} of month</span>
        </div>
      </div>

      <div class="cm-row__right">
        <span class="cm-row__amount text-mono">${formatCurrency(c.amount)}</span>
        <div class="cm-row__actions">
          ${c.isActive ? `
            <button
              class="cm-action-btn cm-action-btn--paid ${c.isPaid ? 'is-paid' : ''}"
              data-cm-paid="${c.id}"
              title="${c.isPaid ? 'Mark unpaid' : 'Mark paid'}"
              aria-label="${c.isPaid ? 'Mark unpaid' : 'Mark paid'}"
            >✓</button>
          ` : ''}
          <button
            class="cm-action-btn cm-action-btn--toggle"
            data-cm-toggle="${c.id}"
            title="${c.isActive ? 'Pause' : 'Resume'}"
            aria-label="${c.isActive ? 'Pause commitment' : 'Resume commitment'}"
          >${c.isActive ? '⏸' : '▶'}</button>
          <button
            class="cm-action-btn cm-action-btn--delete"
            data-cm-delete="${c.id}"
            title="Delete"
            aria-label="Delete commitment"
          >✕</button>
        </div>
      </div>
    </div>
  `;
}

// ---- Mark-paid drawer (records a transaction so the budget actually moves) ----

function _openMarkPaid(pageContainer, commitment) {
  const buckets = getBuckets(commitment.macroType);

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay is-open';

  const drawer = document.createElement('div');
  drawer.className = 'drawer cm-mark-paid-drawer is-open';
  drawer.setAttribute('data-testid', 'cm-mark-paid-drawer');
  drawer.addEventListener('click', e => e.stopPropagation());

  const close = () => { overlay.remove(); drawer.remove(); };
  overlay.addEventListener('click', close);

  drawer.innerHTML = `
    <div class="drawer__handle"></div>
    <div class="cm-form">
      <div class="cm-form__header">
        <span class="cm-form__title">Mark "${commitment.name}" paid</span>
        <button class="btn btn-ghost" data-close-mp>✕</button>
      </div>
      <p class="cm-mp-amount text-mono">${formatCurrency(commitment.amount)}</p>
      ${buckets.length === 0 ? `
        <p class="text-tertiary" style="font-size: var(--text-sm); text-align:center; padding: var(--space-4);">
          No ${_macroLabel[commitment.macroType]} buckets exist yet. Mark paid without logging?
        </p>
        <button class="btn btn-primary btn-full" data-mp-skip data-testid="cm-mp-skip">Mark paid (no transaction)</button>
      ` : `
        <p class="cm-form__label">Which bucket should this come out of?</p>
        <div class="cm-mp-bucket-list" data-testid="cm-mp-buckets">
          ${buckets.map(b => {
            const rem = Math.max(0, b.allocated - b.spent);
            return `
              <button class="cm-mp-bucket" data-mp-bucket="${b.id}">
                <span class="cm-mp-bucket__emoji">${b.emoji}</span>
                <span class="cm-mp-bucket__name">${b.name}</span>
                <span class="cm-mp-bucket__rem text-mono">${formatCurrency(rem)}</span>
              </button>
            `;
          }).join('')}
        </div>
        <button class="btn btn-ghost btn-full cm-mp-skip-btn" data-mp-skip data-testid="cm-mp-skip">
          Mark paid without logging
        </button>
      `}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  drawer.querySelector('[data-close-mp]').addEventListener('click', close);

  drawer.querySelectorAll('[data-mp-bucket]').forEach(btn => {
    btn.addEventListener('click', () => {
      const bucketId = btn.dataset.mpBucket;
      addTransaction({
        bucketId,
        amount: commitment.amount,
        type: 'expense',
        note: `Commitment: ${commitment.name}`,
      });
      updateCommitment(commitment.id, { isPaid: true });
      close();
      _render(pageContainer);
      showToast(`${commitment.name} paid — logged to bucket ✓`, 'success');
    });
  });

  drawer.querySelector('[data-mp-skip]')?.addEventListener('click', () => {
    updateCommitment(commitment.id, { isPaid: true });
    close();
    _render(pageContainer);
    showToast(`${commitment.name} marked paid`, 'success');
  });
}

// ---- Add / Edit Form ----

let _formOverlay = null;
let _formDrawer = null;

function _openForm(pageContainer, existing) {
  _formOverlay = document.createElement('div');
  _formOverlay.className = 'drawer-overlay is-open';
  _formOverlay.addEventListener('click', _closeForm);

  _formDrawer = document.createElement('div');
  _formDrawer.className = 'drawer cm-form-drawer is-open';
  _formDrawer.addEventListener('click', e => e.stopPropagation());

  document.body.appendChild(_formOverlay);
  document.body.appendChild(_formDrawer);

  _renderForm(existing, pageContainer);
}

function _closeForm() {
  _formOverlay?.remove();
  _formDrawer?.remove();
  _formOverlay = null;
  _formDrawer = null;
}

function _renderForm(existing, pageContainer) {
  const isEdit = !!existing;
  const state = {
    emoji: existing?.emoji || '🔄',
    name: existing?.name || '',
    amount: existing?.amount ? String(existing.amount) : '',
    dueDate: existing?.dueDate || 1,
    macroType: existing?.macroType || 'needs',
  };

  _formDrawer.innerHTML = `
    <div class="drawer__handle"></div>
    <div class="cm-form">
      <div class="cm-form__header">
        <span class="cm-form__title">${isEdit ? 'Edit' : 'Add'} Commitment</span>
        <button class="btn btn-ghost" id="cf-close">✕</button>
      </div>

      <!-- Emoji picker -->
      <div class="cm-form__section">
        <p class="cm-form__label">Emoji</p>
        <div class="cm-emoji-grid" id="cf-emoji-grid">
          ${EMOJI_PALETTE.slice(0, 24).map(e => `
            <button class="cm-emoji-btn${state.emoji === e ? ' is-selected' : ''}" data-emoji="${e}">${e}</button>
          `).join('')}
        </div>
      </div>

      <!-- Name -->
      <div class="cm-form__section">
        <p class="cm-form__label">Name</p>
        <input
          type="text"
          class="input-field"
          id="cf-name"
          placeholder="Rent, Netflix, EMI…"
          maxlength="30"
          value="${state.name}"
        />
      </div>

      <!-- Amount -->
      <div class="cm-form__section">
        <p class="cm-form__label">Monthly Amount</p>
        <div class="cm-amount-wrap">
          <span class="cm-amount-symbol">₹</span>
          <input
            type="number"
            class="input-field cm-amount-input"
            id="cf-amount"
            placeholder="0"
            min="1"
            value="${state.amount}"
          />
        </div>
      </div>

      <!-- Macro -->
      <div class="cm-form__section">
        <p class="cm-form__label">Category</p>
        <div class="cm-chip-group" id="cf-macro">
          ${['needs', 'wants', 'future'].map(m => `
            <button
              class="cm-chip${state.macroType === m ? ' is-selected' : ''}"
              data-macro="${m}"
              style="--chip-color:${_macroColor[m]}"
            >${_macroLabel[m]}</button>
          `).join('')}
        </div>
      </div>

      <!-- Due date -->
      <div class="cm-form__section">
        <p class="cm-form__label">Due Date (day of month)</p>
        <div class="cm-chip-group" id="cf-due">
          ${[1, 5, 7, 10, 15, 20, 25, 28].map(d => `
            <button
              class="cm-chip${state.dueDate === d ? ' is-selected' : ''}"
              data-due="${d}"
            >${d}${_ord(d)}</button>
          `).join('')}
        </div>
        <div class="cm-custom-due" style="margin-top:var(--space-2)">
          <input
            type="number"
            class="input-field"
            id="cf-due-custom"
            placeholder="Custom day (1–31)"
            min="1"
            max="31"
            style="font-size:var(--text-sm)"
            value="${[1,5,7,10,15,20,25,28].includes(state.dueDate) ? '' : state.dueDate}"
          />
        </div>
      </div>

      <button class="btn btn-primary btn-full" id="cf-save" style="margin-top:var(--space-2)">
        ${isEdit ? 'Save Changes' : 'Add Commitment'}
      </button>
    </div>
  `;

  _formDrawer.querySelector('#cf-close').addEventListener('click', _closeForm);

  // Emoji selection
  _formDrawer.querySelectorAll('.cm-emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _formDrawer.querySelectorAll('.cm-emoji-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.emoji = btn.dataset.emoji;
    });
  });

  // Name
  _formDrawer.querySelector('#cf-name').addEventListener('input', e => { state.name = e.target.value; });

  // Amount
  _formDrawer.querySelector('#cf-amount').addEventListener('input', e => { state.amount = e.target.value; });

  // Macro chips
  _formDrawer.querySelectorAll('[data-macro]').forEach(btn => {
    btn.addEventListener('click', () => {
      _formDrawer.querySelectorAll('[data-macro]').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.macroType = btn.dataset.macro;
    });
  });

  // Due date chips
  _formDrawer.querySelectorAll('[data-due]').forEach(btn => {
    btn.addEventListener('click', () => {
      _formDrawer.querySelectorAll('[data-due]').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.dueDate = parseInt(btn.dataset.due);
      _formDrawer.querySelector('#cf-due-custom').value = '';
    });
  });

  // Custom due date
  _formDrawer.querySelector('#cf-due-custom').addEventListener('input', e => {
    const v = parseInt(e.target.value);
    if (v >= 1 && v <= 31) {
      _formDrawer.querySelectorAll('[data-due]').forEach(b => b.classList.remove('is-selected'));
      state.dueDate = v;
    }
  });

  // Save
  _formDrawer.querySelector('#cf-save').addEventListener('click', () => {
    const name = state.name.trim();
    const amount = parseFloat(state.amount);
    if (!name) { showToast('Please enter a name'); return; }
    if (!amount || amount <= 0) { showToast('Please enter an amount'); return; }

    if (isEdit) {
      updateCommitment(existing.id, {
        emoji: state.emoji,
        name,
        amount,
        dueDate: state.dueDate,
        macroType: state.macroType,
      });
      showToast(`${name} updated`, 'success');
    } else {
      addCommitment({
        emoji: state.emoji,
        name,
        amount,
        dueDate: state.dueDate,
        macroType: state.macroType,
      });
      showToast(`${name} added`, 'success');
    }

    _closeForm();
    _render(pageContainer);
  });
}

// ---- Ordinal suffix helper ----
function _ord(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ---- Dashboard helpers (used by main.js) ----

/**
 * Returns commitments that are due soon or overdue (for dashboard widget).
 * @returns {import('../data/models.js').Commitment[]}
 */
export function getDueSoonCommitments() {
  return getCommitments().filter(c => {
    const s = _dueStatus(c);
    return s === 'overdue' || s === 'due-today' || s === 'due-soon';
  });
}

/**
 * Render a compact due-soon row for the dashboard.
 * @param {import('../data/models.js').Commitment} c
 * @returns {string}
 */
export function renderCommitmentDueRow(c) {
  const status = _dueStatus(c);
  const diff = _dueDiffDays(c.dueDate);
  let timeLabel = '';
  if (status === 'overdue') timeLabel = `${Math.abs(diff)}d overdue`;
  else if (status === 'due-today') timeLabel = 'Due today';
  else timeLabel = `Due in ${diff}d`;

  return `
    <div class="cm-due-row">
      <span class="cm-due-row__emoji">${c.emoji}</span>
      <div class="cm-due-row__body">
        <span class="cm-due-row__name">${c.name}</span>
        <span class="cm-due-row__time ${status === 'overdue' ? 'text-warn' : ''}">${timeLabel}</span>
      </div>
      <span class="cm-due-row__amount text-mono">${formatCurrency(c.amount)}</span>
    </div>
  `;
}
