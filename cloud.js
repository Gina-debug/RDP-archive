// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — CLOUD REAL-TIME SYNCHRONIZATION ENGINE
// Sincronizza mockup aggiunti, capi rimossi e schede votazione/feedback
// su TUTTI i dispositivi nel mondo in tempo reale (PC, smartphone, tablet).
// Basato su Google Firebase Firestore con diagnostica attiva e fallback locale.
// ==========================================================================

const RDPCloud = (() => {
  "use strict";

  let db = null;
  let isInitialized = false;
  let isConnected = false;
  let cloudDbMissing = false;
  let cloudDbPermissionDenied = false;
  let initError = null;

  // Callback registrate per aggiornamenti in tempo reale
  let onGarmentsChangeCallbacks = [];
  let onDeletionsChangeCallbacks = [];
  let onStatusChangeCallbacks = [];

  function notifyStatusChange() {
    const status = getStatus();
    onStatusChangeCallbacks.forEach((cb) => {
      try {
        cb(status);
      } catch (_e) {}
    });
  }

  // Inizializza la connessione a Firebase se configurato
  function init() {
    if (isInitialized && db) return true;

    if (!window.firebase) {
      initError = "SDK Firebase non presente nella pagina";
      return false;
    }

    if (!RDP_FIREBASE_CONFIG.isConfigured()) {
      initError = "Credenziali Firebase non ancora configurate";
      return false;
    }

    try {
      const config = RDP_FIREBASE_CONFIG.getConfig();
      if (!window.firebase.apps || window.firebase.apps.length === 0) {
        window.firebase.initializeApp(config);
      }
      db = window.firebase.firestore();
      isInitialized = true;
      initError = null;

      // Avvia i listener in tempo reale
      startRealtimeListeners();
      return true;
    } catch (err) {
      initError = err.message || "Errore inizializzazione Firebase";
      return false;
    }
  }

  // Listener Firestore in tempo reale per capi aggiunti e rimossi
  function startRealtimeListeners() {
    if (!db) return;

    // 1. Ascolta capi aggiunti dal Creator
    try {
      db.collection("rdp_garments").onSnapshot(
        (snapshot) => {
          isConnected = true;
          cloudDbMissing = false;
          cloudDbPermissionDenied = false;
          initError = null;
          notifyStatusChange();

          const cloudGarments = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            cloudGarments.push({ ...data, id: doc.id });
          });
          onGarmentsChangeCallbacks.forEach((cb) => {
            try {
              cb(cloudGarments);
            } catch (_e) {}
          });
        },
        (err) => {
          console.warn("[RDP Cloud] Snapshot garments error:", err);
          const errMsg = err ? err.message || "" : "";
          if (err && (err.code === "not-found" || errMsg.includes("does not exist"))) {
            cloudDbMissing = true;
            initError = "DATABASE NON ANCORA CREATO SU FIREBASE CONSOLE";
          } else if (err && err.code === "permission-denied") {
            cloudDbPermissionDenied = true;
            initError = "REGOLE DI SICUREZZA BLOCCATE: ABILITA MODALITÀ TEST IN FIRESTORE";
          } else {
            initError = errMsg || "Errore connessione Firestore";
          }
          isConnected = false;
          notifyStatusChange();
        }
      );
    } catch (_e) {}

    // 2. Ascolta capi eliminati dal Creator
    try {
      db.collection("rdp_deletions").onSnapshot(
        (snapshot) => {
          isConnected = true;
          cloudDbMissing = false;
          cloudDbPermissionDenied = false;
          notifyStatusChange();

          const deletedIds = [];
          snapshot.forEach((doc) => {
            deletedIds.push(doc.id);
          });
          onDeletionsChangeCallbacks.forEach((cb) => {
            try {
              cb(deletedIds);
            } catch (_e) {}
          });
        },
        (err) => {
          console.warn("[RDP Cloud] Snapshot deletions error:", err);
          const errMsg = err ? err.message || "" : "";
          if (err && (err.code === "not-found" || errMsg.includes("does not exist"))) {
            cloudDbMissing = true;
            initError = "DATABASE NON ANCORA CREATO SU FIREBASE CONSOLE";
          }
          isConnected = false;
          notifyStatusChange();
        }
      );
    } catch (_e) {}
  }

  // Registra callback per modifiche ai capi
  function onGarmentsUpdated(callback) {
    if (typeof callback === "function") {
      onGarmentsChangeCallbacks.push(callback);
    }
  }

  // Registra callback per modifiche alle eliminazioni
  function onDeletionsUpdated(callback) {
    if (typeof callback === "function") {
      onDeletionsChangeCallbacks.push(callback);
    }
  }

  // Registra callback per modifiche di stato del cloud
  function onStatusChange(callback) {
    if (typeof callback === "function") {
      onStatusChangeCallbacks.push(callback);
    }
  }

  // Carica tutti i capi caricati dal Creator (Cloud e Locale)
  async function getAllCreatorGarments() {
    const localItems = RDPStorage.getAllUserItems();

    if (init() && db) {
      try {
        const snap = await db.collection("rdp_garments").get();
        isConnected = true;
        cloudDbMissing = false;
        notifyStatusChange();

        const cloudMap = new Map();
        snap.forEach((doc) => {
          cloudMap.set(doc.id, { ...doc.data(), id: doc.id });
        });

        // Unisci anche eventuali capi locali non ancora presenti sul cloud
        localItems.forEach((local) => {
          if (!cloudMap.has(local.id)) {
            cloudMap.set(local.id, local);
          }
        });

        return Array.from(cloudMap.values());
      } catch (err) {
        console.warn("[RDP Cloud] getAllCreatorGarments fallback:", err);
        if (err && (err.code === "not-found" || String(err.message).includes("does not exist"))) {
          cloudDbMissing = true;
          initError = "DATABASE NON ANCORA CREATO SU FIREBASE CONSOLE";
          notifyStatusChange();
        }
      }
    }
    return localItems;
  }

  // Carica tutti gli ID eliminati (Cloud e Locale)
  async function getAllDeletedIds() {
    const localIds = RDPStorage.getDeletedItemIds();

    if (init() && db) {
      try {
        const snap = await db.collection("rdp_deletions").get();
        isConnected = true;
        cloudDbMissing = false;
        notifyStatusChange();

        const set = new Set(localIds);
        snap.forEach((doc) => set.add(doc.id));
        return Array.from(set);
      } catch (err) {
        console.warn("[RDP Cloud] getAllDeletedIds fallback:", err);
        if (err && (err.code === "not-found" || String(err.message).includes("does not exist"))) {
          cloudDbMissing = true;
          initError = "DATABASE NON ANCORA CREATO SU FIREBASE CONSOLE";
          notifyStatusChange();
        }
      }
    }
    return localIds;
  }

  // Salva un nuovo capo (Cloud e Locale)
  async function saveGarment(item) {
    // Salva sempre anche nel local storage di sicurezza
    await RDPStorage.saveUserItem(item);

    if (init() && db) {
      try {
        // Se era tra gli eliminati, rimuovilo da rdp_deletions
        await db.collection("rdp_deletions").doc(item.id).delete().catch(() => {});

        // Salva su Firestore
        await db.collection("rdp_garments").doc(item.id).set({
          ...item,
          updatedAt: Date.now()
        });

        isConnected = true;
        cloudDbMissing = false;
        initError = null;
        notifyStatusChange();
        return { success: true, syncedToCloud: true };
      } catch (err) {
        console.error("[RDP Cloud] Errore salvataggio Firestore:", err);
        const errMsg = err ? err.message || "" : "";
        if (err && (err.code === "not-found" || errMsg.includes("does not exist"))) {
          cloudDbMissing = true;
          initError = "DATABASE NON ANCORA CREATO SU FIREBASE CONSOLE";
        } else if (err && err.code === "permission-denied") {
          cloudDbPermissionDenied = true;
          initError = "REGOLE DI SICUREZZA BLOCCATE: ABILITA MODALITÀ TEST";
        }
        isConnected = false;
        notifyStatusChange();
        return { success: true, syncedToCloud: false, error: errMsg, code: err ? err.code : null };
      }
    }

    return { success: true, syncedToCloud: false, error: initError || "Cloud non connesso" };
  }

  // Elimina un capo (aggiunge agli eliminati e rimuove dai caricati su Cloud e Locale)
  async function deleteGarment(id) {
    if (!id) return { success: false, syncedToCloud: false };

    // Salva in locale
    await RDPStorage.deleteItem(id);

    if (init() && db) {
      try {
        // Registra come eliminato nel cloud
        await db.collection("rdp_deletions").doc(id).set({
          id,
          deletedAt: Date.now()
        });

        // Se era un capo caricato dal creator, rimuovilo anche da rdp_garments
        await db.collection("rdp_garments").doc(id).delete().catch(() => {});

        isConnected = true;
        cloudDbMissing = false;
        notifyStatusChange();
        return { success: true, syncedToCloud: true };
      } catch (err) {
        console.error("[RDP Cloud] Errore eliminazione Firestore:", err);
        isConnected = false;
        notifyStatusChange();
        return { success: true, syncedToCloud: false, error: err.message };
      }
    }

    return { success: true, syncedToCloud: false };
  }

  // Ripristina tutti i capi eliminati
  async function restoreAllDeleted() {
    RDPStorage.restoreAllDeletedItems();

    if (init() && db) {
      try {
        const snap = await db.collection("rdp_deletions").get();
        const batch = db.batch();
        snap.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        isConnected = true;
        notifyStatusChange();
        return true;
      } catch (_err) {
        return false;
      }
    }

    return true;
  }

  // Salva una scheda voti e feedback nel cloud
  async function recordBallot({ voter, votesMap, feedbackText }) {
    if (init() && db) {
      try {
        await db.collection("rdp_ballots").add({
          voterName: voter.name,
          voterEmail: voter.email || "",
          votes: votesMap || {},
          feedbackText: feedbackText || "",
          createdAt: Date.now()
        });
        return true;
      } catch (_err) {
        return false;
      }
    }
    return false;
  }

  // Stato completo del cloud per telemetria e UI
  function getStatus() {
    const configured = RDP_FIREBASE_CONFIG.isConfigured();
    const ready = Boolean(isInitialized && db && isConnected && !cloudDbMissing && !cloudDbPermissionDenied);
    return {
      configured,
      connected: ready,
      error: initError,
      dbMissing: cloudDbMissing,
      permissionDenied: cloudDbPermissionDenied
    };
  }

  return {
    init,
    getStatus,
    onGarmentsUpdated,
    onDeletionsUpdated,
    onStatusChange,
    getAllCreatorGarments,
    getAllDeletedIds,
    saveGarment,
    deleteGarment,
    restoreAllDeleted,
    recordBallot
  };
})();
