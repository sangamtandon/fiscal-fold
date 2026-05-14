/**
 * Fiscal Fold — Transaction History Page (Sprint 10)
 *
 * Route: /transactions
 * Shows all transactions for the current cycle with search and macro filter.
 */

import './transactions.css';
import {
  getTransactions,
  getBucketById,
} from '../data/store.js';
import { formatCurrency, timeAgo } from '../utils/helpers.js';
import { navigate } from '../router.js';

const MACRO_FILTERS = ['all', 'needs', 'wants', 'future'];
const MACRO_LABELS = { all: 'All', needs: 'Needs', wants: 'Wants', future: 'Future' };

let _activeFilter = 'all';
let _searchQuery = '';

/**
 * @param {HTMLElement} container
 */
export function renderTransactionsPage(container) {
  _activeFilter = 'all';
  _searchQuery = '';
  _render(container);
}

function _render(container) {
  const allTxns = getTransactions();

  container.innerHTML = `
    <div class="txn-history-page">
      <div class="txn-history-page__header">
        <button class="btn-icon" id="txn-btn-back" title="Back" style="padding: var(--space-1);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="txn-history-page__title">Transaction History</h1>
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
        ${_renderList(allTxns)}
      </div>
    </div>
  `;

  _wireEvents(container, allTxns);
}

function _renderList(allTxns) {
  const filtered = _applyFilters(allTxns);

  if (filtered.length === 0) {
    return `
      <div class="txn-empty">
        <span style="font-size:32px;">📭</span>
        <p class="text-tertiary" style="font-size:var(--text-sm);">No transactions found</p>
      </div>
    `;
  }

  // Group by date
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

function _renderTxnRow(t) {
  const bucket = getBucketById(t.bucketId);
  const borrowedBucket = t.borrowedFrom ? getBucketById(t.borrowedFrom) : null;
  const isIncome = t.type === 'income' || t.type === 'refund';

  return `
    <div class="txn-row">
      <span class="txn-row__emoji">${bucket?.emoji || '📝'}</span>
      <div class="txn-row__meta">
        <div class="txn-row__top">
          <span class="txn-row__name">${bucket?.name || 'Unknown'}</span>
          ${borrowedBucket ? `<span class="badge badge--amber" style="font-size:10px;">from ${borrowedBucket.name}</span>` : ''}
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

function _wireEvents(container, allTxns) {
  container.querySelector('#txn-btn-back').addEventListener('click', () => navigate('/dashboard'));

  // Search
  const searchInput = container.querySelector('#txn-search');
  searchInput.addEventListener('input', e => {
    _searchQuery = e.target.value;
    container.querySelector('#txn-list-container').innerHTML = _renderList(allTxns);
  });

  // Macro filter tabs
  container.querySelector('#txn-filter-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-filter]');
    if (!tab) return;
    _activeFilter = tab.dataset.filter;
    container.querySelectorAll('.txn-filter-tab').forEach(t => t.classList.toggle('is-active', t.dataset.filter === _activeFilter));
    container.querySelector('#txn-list-container').innerHTML = _renderList(allTxns);
  });
}
