// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — CLOUD REAL-TIME SYNCHRONIZATION ENGINE
// Sincronizza mockup aggiunti, capi rimossi e schede votazione/feedback
// su TUTTI i dispositivi nel mondo in tempo reale (PC, smartphone, tablet).
// Basato su Google Firebase Firestore con fallback locale automatico.
// ==========================================================================

const RDPCloud = (() => {
  "use strict";

  let db = null;
  let isInitialized = false;
  let initError = null;

  // Callback registrate per aggiornamenti in tempo reale
  let onGarmentsChangeCallbacks = [];
  let onDeletionsChangeCallbacks = [];

  // Inizializza la connessione a Firebase se configurato
  function init() {
    if (isInitialized) return true;

    if (!window.firebase) {
      initError = "SDK Firebase non presente";
      return false;
    }

    if (!RDP_FIREBASE_CONFIG.isConfigured()) {
      initError = "Credenziali Firebase non ancora inserite";
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
        (_err) => {}
      );
    } catch (_e) {}

    // 2. Ascolta capi eliminati dal Creator
    try {
      db.collection("rdp_deletions").onSnapshot(
        (snapshot) => {
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
        (_err) => {}
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

  // Carica tutti i capi caricati dal Creator (Cloud o Locale)
  async function getAllCreatorGarments() {
    if (init() && db) {
      try {
        const snap = await db.collection("rdp_garments").get();
        const items = [];
        snap.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id });
        });
        return items;
      } catch (_e) {
        // fallback
      }
    }
    return RDPStorage.getAllUserItems();
  }

  // Carica tutti gli ID eliminati (Cloud o Locale)
  async function getAllDeletedIds() {
    if (init() && db) {
      try {
        const snap = await db.collection("rdp_deletions").get();
        const ids = [];
        snap.forEach((doc) => ids.push(doc.id));
        return ids;
      } catch (_e) {
        // fallback
      }
    }
    return RDPStorage.getDeletedItemIds();
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
        return { success: true, syncedToCloud: true };
      } catch (err) {
        return { success: true, syncedToCloud: false, error: err.message };
      }
    }

    return { success: true, syncedToCloud: false };
  }

  // Elimina un capo (aggiunge agli eliminati e rimuove dai caricati)
  async function deleteGarment(id) {
    if (!id) return false;

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
        return true;
      } catch (_err) {
        return false;
      }
    }

    return true;
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

  // Stato del cloud
  function getStatus() {
    const configured = RDP_FIREBASE_CONFIG.isConfigured();
    const ready = Boolean(isInitialized && db);
    return {
      configured,
      connected: ready,
      error: initError
    };
  }

  return {
    init,
    getStatus,
    onGarmentsUpdated,
    onDeletionsUpdated,
    getAllCreatorGarments,
    getAllDeletedIds,
    saveGarment,
    deleteGarment,
    restoreAllDeleted,
    recordBallot
  };
})();
