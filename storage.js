// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — LOCAL PERSISTENCE STORAGE
// Supporta IndexedDB con fallback trasparente su LocalStorage per
// memorizzare i nuovi capi caricati dall'account creatore e la lista dei
// capi eliminati dall'archivio (sia capi originali che caricati).
// ==========================================================================

const RDPStorage = (() => {
  "use strict";

  const DB_NAME = "rdp_archive_db_v3";
  const STORE_NAME = "creator_garments";
  const DB_VERSION = 1;
  const LS_FALLBACK_KEY = "rdp_user_garments_v3";
  const LS_DELETED_KEY = "rdp_deleted_item_ids_v3";

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    if (!window.indexedDB) {
      dbPromise = Promise.resolve(null);
      return dbPromise;
    }

    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (_e) {
        resolve(null);
      }
    });

    return dbPromise;
  }

  // Fallback LocalStorage Helpers per Capi Creati
  function getLSItems() {
    try {
      const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_e) {
      return [];
    }
  }

  function setLSItems(items) {
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(items));
    } catch (_e) {
      // quota exceeded
    }
  }

  // Capi Eliminati (Blacklist persistente di capi rimossi)
  function getDeletedItemIds() {
    try {
      const raw = window.localStorage.getItem(LS_DELETED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_e) {
      return [];
    }
  }

  function addDeletedItemId(id) {
    if (!id) return;
    const current = getDeletedItemIds();
    if (!current.includes(id)) {
      current.push(id);
      try {
        window.localStorage.setItem(LS_DELETED_KEY, JSON.stringify(current));
      } catch (_e) {}
    }
  }

  function clearDeletedItemIds() {
    try {
      window.localStorage.removeItem(LS_DELETED_KEY);
    } catch (_e) {}
  }

  // Carica tutti i capi caricati dal creatore
  async function getAllUserItems() {
    const db = await openDB();
    if (!db) {
      return getLSItems();
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result || [];
          const lsItems = getLSItems();
          if (results.length === 0 && lsItems.length > 0) {
            resolve(lsItems);
          } else {
            resolve(results);
          }
        };
        req.onerror = () => resolve(getLSItems());
      } catch (_e) {
        resolve(getLSItems());
      }
    });
  }

  // Salva un nuovo capo
  async function saveUserItem(item) {
    const currentLS = getLSItems().filter((i) => i.id !== item.id);
    currentLS.push(item);
    setLSItems(currentLS);

    // Se era precedentemente nella lista eliminati, rimuovilo
    const deleted = getDeletedItemIds().filter((dId) => dId !== item.id);
    try {
      window.localStorage.setItem(LS_DELETED_KEY, JSON.stringify(deleted));
    } catch (_e) {}

    const db = await openDB();
    if (!db) return item;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Elimina un capo qualsiasi dall'archivio (originale o caricato)
  async function deleteItem(id) {
    if (!id) return false;

    // Registra come eliminato
    addDeletedItemId(id);

    // Rimuovi anche da IndexedDB / fallback se era un upload
    const currentLS = getLSItems().filter((i) => i.id !== id);
    setLSItems(currentLS);

    const db = await openDB();
    if (db) {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
      } catch (_e) {}
    }

    return true;
  }

  // Ripristina tutti i capi eliminati
  function restoreAllDeletedItems() {
    clearDeletedItemIds();
  }

  // Cancella tutti i capi caricati dal creatore
  async function clearAllUserItems() {
    setLSItems([]);
    const db = await openDB();
    if (!db) return;

    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
    } catch (_e) {}
  }

  return {
    getAllUserItems,
    saveUserItem,
    deleteItem,
    deleteUserItem: deleteItem, // alias retrocompatibile
    getDeletedItemIds,
    restoreAllDeletedItems,
    clearAllUserItems
  };
})();
