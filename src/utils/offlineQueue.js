/**
 * Offline Transaction Queue — IndexedDB-backed
 * Tracks transactions logged while offline so they can be synced to BaaS on reconnect.
 * The transactions are already saved to localStorage by the store; this queue is
 * purely a sync-marker until a cloud backend is wired in.
 */

const DB_NAME = 'fiscal-fold-offline';
const STORE_NAME = 'queue';
const DB_VERSION = 1;

function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE_NAME, { autoIncrement: true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

/**
 * Add a transaction record to the offline queue.
 * @param {{ id?: string, bucketId: string, amount: number, note?: string }} txn
 */
export async function enqueue(txn) {
  try {
    const db = await _openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add({ ...txn, _queuedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = e => reject(e.target.error);
    });
  } catch (e) {
    console.warn('[OfflineQueue] enqueue failed:', e);
  }
}

/**
 * Return all queued records and clear the queue.
 * @returns {Promise<Array>}
 */
export async function flush() {
  try {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const items = [];
      store.openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(items);
      tx.onerror = e => reject(e.target.error);
    });
  } catch (e) {
    console.warn('[OfflineQueue] flush failed:', e);
    return [];
  }
}

/**
 * Return the number of queued records without clearing.
 * @returns {Promise<number>}
 */
export async function count() {
  try {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = e => reject(e.target.error);
    });
  } catch (e) {
    console.warn('[OfflineQueue] count failed:', e);
    return 0;
  }
}
