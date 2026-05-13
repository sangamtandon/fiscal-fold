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
  getState,
} from '../data/store.js';
import { formatCurrency } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';
import { EMOJI_PALETTE } from '../data/models.js';

// ---- Due-date helpers ----

/**
 * @param {import('../data/models.js').Commitment} c
 * @returns {'paid'|'overdue'|'due-today'|'due-soon'|'upcoming'}
 */
function _dueStatus(c) {
  if (c.isPaid) return 'paid';
  const today = new Date().getDate();
  const diff = c.dueDate - today;
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

      <p class="cm-subtitle">Recurring expenses reserved before you spend.</p>

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
      updateCommitment(id, { isPaid: !c.isPaid });
      _render(container);
      showToast(c.isPaid ? `${c.name} marked unpaid` : `${c.name} marked paid ✓`, 'success');
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
          ${!c.isActive ? `<span class="badge cm-row__status" style="opacity:.6">Paused</span>` : statusText ? `<span class="badge ${statusCls} cm-row__status">${statusText}</span>` : ''}
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
  const today = new Date().getDate();
  const diff = c.dueDate - today;
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
