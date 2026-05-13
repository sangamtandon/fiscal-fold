/**
 * Fiscal Fold — Toast Notification Utility
 * Extracted to avoid circular imports between main.js and page modules.
 */

let _toastTimeout = null;

/**
 * Show a brief toast notification.
 * @param {string} message
 * @param {'default'|'success'} [type='default']
 * @param {number} [duration=2500]
 */
export function showToast(message, type = 'default', duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast is-visible ${type === 'success' ? 'toast--success' : ''}`;

  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, duration);
}
