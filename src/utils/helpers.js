/**
 * Fiscal Fold — Utility Helpers
 */

/**
 * Format a number as Indian currency (₹).
 * @param {number} amount
 * @param {boolean} [showDecimal=false]
 * @returns {string}
 */
export function formatCurrency(amount, showDecimal = false) {
  const options = {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimal ? 2 : 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  };
  return new Intl.NumberFormat('en-IN', options).format(amount);
}

/**
 * Format a number with Indian comma grouping (no currency symbol).
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Get a relative time string (e.g., "2 hours ago").
 * @param {Date|string|number} date
 * @returns {string}
 */
export function timeAgo(date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Calculate the percentage of a value relative to a total.
 * @param {number} value
 * @param {number} total
 * @returns {number} 0–100
 */
export function percent(value, total) {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

/**
 * Generate a short unique ID.
 * @returns {string}
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Calculate days remaining from today to a target date.
 * @param {Date|string} endDate
 * @returns {number}
 */
export function daysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate days elapsed since a start date.
 * @param {Date|string} startDate
 * @returns {number}
 */
export function daysElapsed(startDate) {
  const now = new Date();
  const start = new Date(startDate);
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Simple debounce function.
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
