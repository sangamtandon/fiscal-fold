/**
 * Fiscal Fold — Data Export Utilities
 */

import { getState, getBucketById, getTransactions } from '../data/store.js';

/**
 * Export current cycle transactions as CSV and trigger a browser download.
 */
export function exportTransactionsCSV() {
  const transactions = getTransactions();

  const header = ['Date', 'Bucket', 'Macro', 'Amount (₹)', 'Type', 'Note', 'Borrowed From'];
  const rows = transactions.map(t => {
    const bucket = getBucketById(t.bucketId);
    const borrowedBucket = t.borrowedFrom ? getBucketById(t.borrowedFrom) : null;
    return [
      new Date(t.timestamp).toLocaleDateString('en-IN'),
      bucket?.name || 'Unknown',
      bucket?.macroType || '',
      t.amount,
      t.type,
      t.note || '',
      borrowedBucket?.name || '',
    ];
  });

  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  _download(csv, 'fiscal-fold-transactions.csv', 'text/csv;charset=utf-8;');
}

/**
 * Export the full app state as a JSON file and trigger a browser download.
 */
export function exportAllDataJSON() {
  const state = getState();
  const json = JSON.stringify(state, null, 2);
  _download(json, 'fiscal-fold-data.json', 'application/json');
}

function _download(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
