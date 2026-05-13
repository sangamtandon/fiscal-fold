/**
 * Fiscal Fold — Minimal Hash Router
 * Lightweight client-side routing for the PWA.
 */

const routes = {};
let currentCleanup = null;

/**
 * Register a route handler.
 * @param {string} path - Route path (e.g., '/dashboard')
 * @param {(container: HTMLElement) => (() => void)|void} handler - Render function that receives the mount container. Optionally returns a cleanup function.
 */
export function route(path, handler) {
  routes[path] = handler;
}

/**
 * Navigate to a specific route.
 * @param {string} path - The route path to navigate to.
 */
export function navigate(path) {
  window.location.hash = '#' + path;
}

/**
 * Get the current route path.
 * @returns {string}
 */
export function currentRoute() {
  return window.location.hash.slice(1) || '/onboarding';
}

/**
 * Force re-render of the current route without changing the URL.
 * Use after in-page mutations (e.g., logging a transaction while already on /dashboard).
 */
export function rerender() {
  window.dispatchEvent(new Event('hashchange'));
}

/**
 * Initialize the router — listens for hash changes and renders the first route.
 * @param {string} containerId - The ID of the mount container element.
 */
export function initRouter(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[Router] Container #${containerId} not found.`);
    return;
  }

  function render() {
    const path = currentRoute();
    const handler = routes[path];

    // Cleanup previous page
    if (typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }

    if (handler) {
      container.innerHTML = '';
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'page';
      pageWrapper.id = `page-${path.replace(/\//g, '') || 'home'}`;
      container.appendChild(pageWrapper);
      currentCleanup = handler(pageWrapper) || null;
    } else {
      // Fallback — redirect to onboarding
      navigate('/onboarding');
    }
  }

  window.addEventListener('hashchange', render);
  render();
}
