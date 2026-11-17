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

  // Carica tutti i capi salvati in locale (unione robusta di IndexedDB e LocalStorage)
  async function getAllUserItems() {
    const lsItems = getLSItems();
    const db = await openDB();
    if (!db) {
      return lsItems;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result || [];
          const mergedMap = new Map();
          // Prima carica da LocalStorage
          lsItems.forEach((item) => {
            if (item && item.id) mergedMap.set(item.id, item);
          });
          // Poi unisci con IndexedDB privilegiando il record con updatedAt più recente
          results.forEach((item) => {
            if (!item || !item.id) return;
            if (!mergedMap.has(item.id)) {
              mergedMap.set(item.id, item);
            } else {
              const existing = mergedMap.get(item.id);
              const existingTime = Number(existing.updatedAt || existing.createdAt || 0);
              const idbTime = Number(item.updatedAt || item.createdAt || 0);
              if (idbTime >= existingTime) {
                mergedMap.set(item.id, item);
              }
            }
          });
          resolve(Array.from(mergedMap.values()));
        };
        req.onerror = () => resolve(lsItems);
      } catch (_e) {
        resolve(lsItems);
      }
    });
  }

  // Salva un capo in locale in modo garantito e infallibile (LocalStorage + IndexedDB)
  async function saveUserItem(item) {
    if (!item || !item.id) return item;

    // 1. Salva sempre in LocalStorage (fallback rapido)
    try {
      const currentLS = getLSItems().filter((i) => i.id !== item.id);
      currentLS.push(item);
      setLSItems(currentLS);
    } catch (_e) {}

    // 2. Se era precedentemente nella lista eliminati, rimuovilo
    try {
      const deleted = getDeletedItemIds().filter((dId) => dId !== item.id);
      window.localStorage.setItem(LS_DELETED_KEY, JSON.stringify(deleted));
    } catch (_e) {}

    // 3. Salva in IndexedDB ad alta capacità
    try {
      const db = await openDB();
      if (db) {
        await new Promise((resolve) => {
          try {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(item);
            req.onsuccess = () => resolve(item);
            req.onerror = () => resolve(item);
          } catch (_err) {
            resolve(item);
          }
        });
      }
    } catch (_e) {}

    return item;
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
