/**
 * Pure helpers for grouping transactions by calendar month.
 *
 * Extracted from the Transactions page so the logic can be unit-tested
 * without rendering the DOM. The page module is the only caller.
 */

/**
 * @typedef {Object} MonthGroup
 * @property {string} monthKey - "YYYY-MM"
 * @property {string} label - "May 2026"
 * @property {boolean} isCurrent - true if monthKey matches `now`'s month
 * @property {import('../data/models.js').Transaction[]} txns - newest-first within month
 * @property {{ netSpent: number, spent: number, income: number, macros: { needs: number, wants: number, future: number } }} totals
 */

/**
 * Convert a transaction timestamp into a "YYYY-MM" key in local time.
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function monthKeyOf(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Human-readable label for a YYYY-MM key, e.g. "May 2026".
 * @param {string} monthKey
 * @returns {string}
 */
export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Compute per-month aggregate totals. Income & refunds reduce net spend.
 * Macro totals only count expenses (not income/refunds) so they sum to `spent`.
 *
 * @param {import('../data/models.js').Transaction[]} txns
 * @param {(id: string) => import('../data/models.js').MicroBucket | undefined} getBucket
 * @returns {{ netSpent: number, spent: number, income: number, macros: { needs: number, wants: number, future: number } }}
 */
export function computeMonthTotals(txns, getBucket) {
  const macros = { needs: 0, wants: 0, future: 0 };
  let spent = 0;
  let income = 0;

  txns.forEach(t => {
    if (t.type === 'income' || t.type === 'refund') {
      income += t.amount;
      return;
    }
    spent += t.amount;
    const bucket = getBucket(t.bucketId);
    if (bucket && macros[bucket.macroType] !== undefined) {
      macros[bucket.macroType] += t.amount;
    }
  });

  return { netSpent: Math.max(0, spent - income), spent, income, macros };
}

/**
 * Bucket transactions by calendar month and return groups newest-first.
 * Each transaction lands in exactly one month based on its own timestamp,
 * independent of which pay-period cycle it belongs to.
 *
 * @param {import('../data/models.js').Transaction[]} txns
 * @param {(id: string) => import('../data/models.js').MicroBucket | undefined} getBucket
 * @param {Date} [now=new Date()] - injectable for tests
 * @returns {MonthGroup[]}
 */
export function groupByMonth(txns, getBucket, now = new Date()) {
  const byKey = new Map();
  txns.forEach(t => {
    const key = monthKeyOf(t.timestamp);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(t);
  });

  const currentKey = monthKeyOf(now);
  const sortedKeys = [...byKey.keys()].sort().reverse();

  return sortedKeys.map(monthKey => {
    const monthTxns = byKey.get(monthKey).slice().sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      isCurrent: monthKey === currentKey,
      txns: monthTxns,
      totals: computeMonthTotals(monthTxns, getBucket),
    };
  });
}
