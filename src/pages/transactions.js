/**
 * Fiscal Fold — Transaction History Page (Sprint 10)
 *
 * Route: /transactions
 * Two view modes:
 *   - Current: transactions in the active pay period (cycle-scoped)
 *   - History: every transaction grouped by calendar month (cross-cycle)
 */

import './transactions.css';
import {
  getTransactions,
  getAllTransactions,
  getBucketById,
  removeTransaction,
} from '../data/store.js';
import { formatCurrency, timeAgo, debounce } from '../utils/helpers.js';
import { groupByMonth } from '../utils/txn-grouping.js';
import { showToast } from '../utils/toast.js';
import { navigate } from '../router.js';

const MACRO_FILTERS = ['all', 'needs', 'wants', 'future'];
const MACRO_LABELS = { all: 'All', needs: 'Needs', wants: 'Wants', future: 'Future' };

const VIEW_MODES = ['current', 'history'];
const VIEW_LABELS = { current: 'Current', history: 'History' };

let _activeFilter = 'all';
let _searchQuery = '';
let _viewMode = 'current';

/**
 * @param {HTMLElement} container
 */
export function renderTransactionsPage(container) {
  _activeFilter = 'all';
  _searchQuery = '';
  _viewMode = 'current';
  _render(container);
}

function _render(container) {
  const sourceTxns = _viewMode === 'history' ? getAllTransactions() : getTransactions();

  container.innerHTML = `
    <div class="txn-history-page">
      <div class="txn-history-page__header">
        <button class="btn-icon" id="txn-btn-back" title="Back" style="padding: var(--space-1);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="txn-history-page__title">Transactions</h1>
      </div>

      <!-- View mode tabs: Current pay period vs full History -->
      <div class="txn-view-tabs" id="txn-view-tabs" role="tablist">
        ${VIEW_MODES.map(m => `
          <button class="txn-view-tab${m === _viewMode ? ' is-active' : ''}" data-view="${m}" data-testid="txn-view-tab-${m}" role="tab" aria-selected="${m === _viewMode}">
            ${VIEW_LABELS[m]}
          </button>
        `).join('')}
      </div>

      <!-- Search -->
      <div class="txn-search-wrap">
        <span class="txn-search-icon">🔍</span>
        <input
          type="text"
          class="input-field txn-search-input"
          id="txn-search"
          placeholder="Search by bucket or note…"
          value="${_searchQuery}"
        />
      </div>

      <!-- Macro filter tabs -->
      <div class="txn-filter-tabs" id="txn-filter-tabs">
        ${MACRO_FILTERS.map(f => `
          <button class="txn-filter-tab${f === _activeFilter ? ' is-active' : ''}" data-filter="${f}">
            ${MACRO_LABELS[f]}
          </button>
        `).join('')}
      </div>

      <!-- Transaction list -->
      <div id="txn-list-container">
        ${_renderBody(sourceTxns)}
      </div>
    </div>
  `;

  _wireEvents(container);
}

function _renderBody(sourceTxns) {
  const filtered = _applyFilters(sourceTxns);

  if (filtered.length === 0) {
    return `
      <div class="txn-empty">
        <span style="font-size:32px;">📭</span>
        <p class="text-tertiary" style="font-size:var(--text-sm);">No transactions found</p>
      </div>
    `;
  }

  return _viewMode === 'history' ? _renderMonthGroups(filtered) : _renderDayGroups(filtered);
}

function _renderDayGroups(filtered) {
  const groups = new Map();
  filtered.forEach(t => {
    const dateKey = new Date(t.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(t);
  });

  let html = `<div class="txn-list-summary text-tertiary" style="font-size:var(--text-xs); margin-bottom:var(--space-2);">${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}</div>`;

  groups.forEach((txns, dateKey) => {
    html += `
      <div class="txn-date-group">
        <div class="txn-date-label">${dateKey}</div>
        ${txns.map(t => _renderTxnRow(t)).join('')}
      </div>
    `;
  });

  return html;
}

function _renderMonthGroups(filtered) {
  const groups = groupByMonth(filtered, getBucketById);

  let html = `<div class="txn-list-summary text-tertiary" style="font-size:var(--text-xs); margin-bottom:var(--space-2);">${filtered.length} transaction${filtered.length !== 1 ? 's' : ''} across ${groups.length} month${groups.length !== 1 ? 's' : ''}</div>`;

  groups.forEach(({ label, isCurrent, txns, totals }) => {
    const dayGroups = new Map();
    txns.forEach(t => {
      const dateKey = new Date(t.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      if (!dayGroups.has(dateKey)) dayGroups.set(dateKey, []);
      dayGroups.get(dateKey).push(t);
    });

    const macroPills = _renderMacroPills(totals.macros);

    html += `
      <section class="txn-month-section" data-testid="txn-month-section" data-month-key="${label}">
        <header class="txn-month-header">
          <div class="txn-month-header__top">
            <div class="txn-month-label-wrap">
              <span class="txn-month-label">${label}</span>
              ${isCurrent ? `<span class="txn-month-badge">in progress</span>` : ''}
            </div>
            <span class="txn-month-total text-mono">${formatCurrency(totals.netSpent)}</span>
          </div>
          ${macroPills ? `<div class="txn-month-macros">${macroPills}</div>` : ''}
        </header>
        <div class="txn-month-body">
          ${[...dayGroups.entries()].map(([dateKey, dayTxns]) => `
            <div class="txn-date-group">
              <div class="txn-date-label">${dateKey}</div>
              ${dayTxns.map(t => _renderTxnRow(t)).join('')}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  });

  return html;
}

function _renderMacroPills(macros) {
  const parts = [];
  if (macros.needs > 0) parts.push(`<span class="txn-month-macro txn-month-macro--needs">Needs ${formatCurrency(macros.needs)}</span>`);
  if (macros.wants > 0) parts.push(`<span class="txn-month-macro txn-month-macro--wants">Wants ${formatCurrency(macros.wants)}</span>`);
  if (macros.future > 0) parts.push(`<span class="txn-month-macro txn-month-macro--future">Future ${formatCurrency(macros.future)}</span>`);
  return parts.join('');
}

function _renderTxnRow(t) {
  const bucket = getBucketById(t.bucketId);
  const borrowedBucket = t.borrowedFrom ? getBucketById(t.borrowedFrom) : null;
  const isIncome = t.type === 'income' || t.type === 'refund';

  return `
    <div class="txn-row" data-txn-id="${t.id}">
      <span class="txn-row__emoji">${bucket?.emoji || '📝'}</span>
      <div class="txn-row__meta">
        <div class="txn-row__top">
          <span class="txn-row__name">${bucket?.name || 'Unknown'}</span>
          ${borrowedBucket ? `<span class="badge badge--amber" style="font-size:10px;">covered by ${borrowedBucket.name}</span>` : ''}
          ${t.type === 'income' ? `<span class="badge badge--green" style="font-size:10px;">income</span>` : ''}
          ${t.type === 'refund' ? `<span class="badge badge--green" style="font-size:10px;">refund</span>` : ''}
        </div>
        <span class="txn-row__sub text-tertiary">
          ${timeAgo(t.timestamp)}${t.note ? ` · ${t.note}` : ''}
        </span>
      </div>
      <span class="txn-row__amount${isIncome ? ' txn-row__amount--income' : ''}">
        ${isIncome ? '+' : '−'}${formatCurrency(t.amount)}
      </span>
      <button
        class="txn-row__delete btn-icon"
        data-delete-txn="${t.id}"
        aria-label="Delete transaction"
        title="Delete this transaction"
      >×</button>
    </div>
  `;
}

function _applyFilters(txns) {
  let result = txns;

  if (_activeFilter !== 'all') {
    result = result.filter(t => {
      const bucket = getBucketById(t.bucketId);
      return bucket?.macroType === _activeFilter;
    });
  }

  if (_searchQuery) {
    const q = _searchQuery.toLowerCase();
    result = result.filter(t => {
      const bucket = getBucketById(t.bucketId);
      return (
        bucket?.name?.toLowerCase().includes(q) ||
        t.note?.toLowerCase().includes(q)
      );
    });
  }

  return result;
}

function _refreshList(container) {
  const sourceTxns = _viewMode === 'history' ? getAllTransactions() : getTransactions();
  container.querySelector('#txn-list-container').innerHTML = _renderBody(sourceTxns);
}


function _wireEvents(container) {
  container.querySelector('#txn-btn-back').addEventListener('click', () => navigate('/dashboard'));

  // View mode tabs (Current / History)
  container.querySelector('#txn-view-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-view]');
    if (!tab) return;
    const next = tab.dataset.view;
    if (next === _viewMode) return;
    _viewMode = next;
    container.querySelectorAll('.txn-view-tab').forEach(t => {
      const isActive = t.dataset.view === _viewMode;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });
    _refreshList(container);
  });

  // Search — debounced to avoid a full DOM re-render on every keystroke
  container.querySelector('#txn-search').addEventListener('input', debounce(e => {
    _searchQuery = e.target.value;
    _refreshList(container);
  }, 200));

  // Macro filter tabs
  container.querySelector('#txn-filter-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-filter]');
    if (!tab) return;
    _activeFilter = tab.dataset.filter;
    container.querySelectorAll('.txn-filter-tab').forEach(t => t.classList.toggle('is-active', t.dataset.filter === _activeFilter));
    _refreshList(container);
  });

  // Delete transaction (event-delegated so it survives re-renders inside #txn-list-container)
  container.querySelector('#txn-list-container').addEventListener('click', e => {
    const btn = e.target.closest('[data-delete-txn]');
    if (!btn) return;
    e.stopPropagation();
    const id = btn.dataset.deleteTxn;
    const txn = getAllTransactions().find(t => t.id === id);
    if (!txn) return;
    if (!confirm('Delete this transaction? The bucket budget will be restored.')) return;
    removeTransaction(id);
    showToast('Transaction deleted');
    _refreshList(container);
  });
}
