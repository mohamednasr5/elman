/**
 * idb-cache.service.js
 * High-Performance IndexedDB Storage & Sync Engine for Dalil El-Manzala
 * Provides 0ms local reads, version checking, and background delta sync.
 */

const DB_NAME = 'dalil_manzala_idb';
const DB_VERSION = 2;

const STORES = {
  PLACES: 'places',
  CATEGORIES: 'categories',
  METADATA: 'metadata',
  SEARCH_DOCS: 'search_docs'
};

let _dbPromise = null;

function openIDB() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      if (!db.objectStoreNames.contains(STORES.PLACES)) {
        const placeStore = db.createObjectStore(STORES.PLACES, { keyPath: 'id' });
        placeStore.createIndex('categoryId', 'categoryId', { unique: false });
        placeStore.createIndex('slug', 'slug', { unique: false });
        placeStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.SEARCH_DOCS)) {
        db.createObjectStore(STORES.SEARCH_DOCS, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn('[IDB] Failed to open IndexedDB:', req.error);
      resolve(null);
    };
  });

  return _dbPromise;
}

/**
 * Get all items from a store
 */
export async function idbGetAll(storeName) {
  const db = await openIDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (_) {
      resolve([]);
    }
  });
}

/**
 * Put multiple items into a store in a single transaction
 */
export async function idbPutBulk(storeName, items) {
  if (!items || !items.length) return;
  const db = await openIDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach(item => {
        if (item && item.id) {
          store.put(item);
        }
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

/**
 * Put a single item into a store
 */
export async function idbPut(storeName, item) {
  if (!item) return;
  const db = await openIDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

/**
 * Get a single item by key
 */
export async function idbGet(storeName, key) {
  const db = await openIDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

/**
 * Delete a single item by key
 */
export async function idbDelete(storeName, key) {
  const db = await openIDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

/**
 * Clear an entire store
 */
export async function idbClear(storeName) {
  const db = await openIDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

/**
 * Metadata Helpers (version & lastSync)
 */
export async function idbGetMeta(key, defaultVal = null) {
  const res = await idbGet(STORES.METADATA, key);
  return res ? res.value : defaultVal;
}

export async function idbSetMeta(key, value) {
  return idbPut(STORES.METADATA, { key, value, ts: Date.now() });
}

export { STORES };
