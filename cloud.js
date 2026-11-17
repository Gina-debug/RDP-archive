// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — CLOUD REAL-TIME SYNCHRONIZATION ENGINE
// Sincronizza mockup aggiunti, capi rimossi e schede votazione/feedback
// su TUTTI i dispositivi nel mondo in tempo reale (PC, smartphone, tablet).
// Basato su Google Firebase Firestore con cache reattiva e riconciliazione bi-direzionale.
// ==========================================================================

const RDPCloud = (() => {
  "use strict";

  let db = null;
  let isInitialized = false;
  let isConnected = false;
  let cloudDbMissing = false;
  let cloudDbPermissionDenied = false;
  let initError = null;

  // Cache in memoria dei documenti Firestore per aggiornamenti istantanei senza ricaricamento
  let latestCloudGarments = null;
  let latestCloudDeletions = null;
  let lastGarmentsSig = null;
  let lastDeletionsSig = null;

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

  // Inizializza la connessione a Firebase
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
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch (_e) {}
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

          // Verifica se i capi sono effettivamente cambiati prima di inviare notifiche
          const garmentsSig = cloudGarments
            .map((g) => `${g.id}:${g.updatedAt || 0}`)
            .sort()
            .join("|");

          if (latestCloudGarments !== null && garmentsSig === lastGarmentsSig) {
            return;
          }

          lastGarmentsSig = garmentsSig;
          latestCloudGarments = cloudGarments;

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

          // Verifica se le eliminazioni sono effettivamente cambiate prima di notificare
          const deletionsSig = deletedIds.slice().sort().join("|");
          if (latestCloudDeletions !== null && deletionsSig === lastDeletionsSig) {
            return;
          }

          lastDeletionsSig = deletionsSig;
          latestCloudDeletions = deletedIds;

          // Sincronizza anche la memoria locale con le eliminazioni del cloud
          deletedIds.forEach((id) => {
            try {
              RDPStorage.addDeletedItemId(id);
            } catch (_e) {}
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

  // Carica tutti i capi caricati dal Creator (Cloud e Locale sincronizzati, sola lettura senza loop di scrittura)
  async function getAllCreatorGarments() {
    let localItems = [];
    try {
      const items = await RDPStorage.getAllUserItems();
      localItems = Array.isArray(items) ? items : [];
    } catch (_e) {
      localItems = [];
    }

    if (init() && db) {
      try {
        let cloudGarments = latestCloudGarments;
        if (!cloudGarments) {
          const snap = await db.collection("rdp_garments").get();
          cloudGarments = [];
          snap.forEach((doc) => {
            cloudGarments.push({ ...doc.data(), id: doc.id });
          });
          latestCloudGarments = cloudGarments;
          lastGarmentsSig = cloudGarments
            .map((g) => `${g.id}:${g.updatedAt || 0}`)
            .sort()
            .join("|");
        }

        isConnected = true;
        cloudDbMissing = false;
        notifyStatusChange();

        const cloudMap = new Map();
        cloudGarments.forEach((g) => {
          if (g && g.id) {
            cloudMap.set(g.id, g);
          }
        });

        // Unisci i capi locali in sola lettura: se un capo locale ha updatedAt più recente rispetto al cloud, usa quello
        localItems.forEach((local) => {
          if (!local || !local.id) return;
          if (!cloudMap.has(local.id)) {
            cloudMap.set(local.id, local);
          } else {
            const cloudItem = cloudMap.get(local.id);
            const localTime = Number(local.updatedAt || local.createdAt || 0);
            const cloudTime = Number(cloudItem.updatedAt || cloudItem.createdAt || 0);
            if (localTime > cloudTime) {
              cloudMap.set(local.id, local);
            }
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

  // Carica tutti gli ID eliminati (Cloud e Locale sincronizzati, sola lettura senza loop di scrittura)
  async function getAllDeletedIds() {
    let localIds = [];
    try {
      const ids = RDPStorage.getDeletedItemIds();
      localIds = Array.isArray(ids) ? ids : [];
    } catch (_e) {
      localIds = [];
    }

    if (init() && db) {
      try {
        let cloudDeletions = latestCloudDeletions;
        if (!cloudDeletions) {
          const snap = await db.collection("rdp_deletions").get();
          cloudDeletions = [];
          snap.forEach((doc) => {
            cloudDeletions.push(doc.id);
          });
          latestCloudDeletions = cloudDeletions;
          lastDeletionsSig = cloudDeletions.slice().sort().join("|");
        }

        isConnected = true;
        cloudDbMissing = false;
        notifyStatusChange();

        const set = new Set(localIds);
        cloudDeletions.forEach((id) => {
          set.add(id);
          try {
            RDPStorage.addDeletedItemId(id);
          } catch (_e) {}
        });

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

  // Sanitizza l'oggetto rimuovendo campi undefined per conformità Firestore
  function sanitizeForFirestore(val) {
    if (val === undefined || val === null) return null;
    if (typeof val !== "object") return val;
    if (Array.isArray(val)) {
      return val.map(sanitizeForFirestore).filter((v) => v !== undefined);
    }
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean;
  }

  // Comprime un DataURL immagine se necessario
  function shrinkDataUrl(dataUrl, maxDim = 1000, quality = 0.72) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return Promise.resolve(dataUrl);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // Verifica che il documento non superi gli 800KB di sicurezza per Firestore (limite hard 1MB)
  async function ensureDocumentFitsFirestore(item) {
    let jsonStr = JSON.stringify(item);
    if (jsonStr.length <= 800000) {
      return item;
    }

    const clone = JSON.parse(jsonStr);
    if (clone.showcaseImage) {
      clone.showcaseImage = await shrinkDataUrl(clone.showcaseImage, 900, 0.70);
    }
    if (clone.images && typeof clone.images === "object") {
      if (clone.images.front) {
        clone.images.front = await shrinkDataUrl(clone.images.front, 1000, 0.72);
      }
      if (clone.images.back) {
        clone.images.back = await shrinkDataUrl(clone.images.back, 1000, 0.72);
      }
      if (Array.isArray(clone.images.gallery)) {
        for (let i = 0; i < clone.images.gallery.length; i++) {
          clone.images.gallery[i] = await shrinkDataUrl(clone.images.gallery[i], 1000, 0.72);
        }
      }
      if (Array.isArray(clone.images.extra)) {
        for (let i = 0; i < clone.images.extra.length; i++) {
          clone.images.extra[i] = await shrinkDataUrl(clone.images.extra[i], 1000, 0.72);
        }
      }
    }
    return clone;
  }

  // Salva un nuovo capo o le sue modifiche (Cloud e Locale sincronizzati perennemente per tutti i dispositivi)
  async function saveGarment(item) {
    if (!item || !item.id) {
      return { success: false, syncedToCloud: false, error: "Dati capo mancanti" };
    }

    const now = Date.now();
    let prepared = {
      ...item,
      updatedAt: now
    };

    // Assicura che rispetti la dimensione massima di Firestore
    try {
      prepared = await ensureDocumentFitsFirestore(prepared);
    } catch (_e) {}

    const cleanItem = sanitizeForFirestore(prepared);

    // Salva sempre anche nel local storage di sicurezza
    await RDPStorage.saveUserItem(cleanItem);

    if (init() && db) {
      try {
        // Se era tra gli eliminati, rimuovilo da rdp_deletions
        await db.collection("rdp_deletions").doc(cleanItem.id).delete().catch(() => {});
        if (latestCloudDeletions) {
          latestCloudDeletions = latestCloudDeletions.filter((id) => id !== cleanItem.id);
        }

        // Salva su Firestore con merge: true per persistenza globale perenne
        await db.collection("rdp_garments").doc(cleanItem.id).set(cleanItem, { merge: true });

        // Aggiorna cache locale immediata
        if (!latestCloudGarments) latestCloudGarments = [];
        const existingIdx = latestCloudGarments.findIndex((g) => g.id === cleanItem.id);
        if (existingIdx >= 0) {
          latestCloudGarments[existingIdx] = cleanItem;
        } else {
          latestCloudGarments.unshift(cleanItem);
        }

        lastGarmentsSig = latestCloudGarments
          .map((g) => `${g.id}:${g.updatedAt || 0}`)
          .sort()
          .join("|");

        isConnected = true;
        cloudDbMissing = false;
        cloudDbPermissionDenied = false;
        initError = null;
        notifyStatusChange();
        return { success: true, syncedToCloud: true, item: cleanItem };
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
        return { success: true, syncedToCloud: false, error: errMsg, code: err ? err.code : null, item: cleanItem };
      }
    }

    return { success: true, syncedToCloud: false, error: initError || "Cloud non connesso", item: cleanItem };
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

        // Aggiorna cache locale in memoria
        if (latestCloudDeletions && !latestCloudDeletions.includes(id)) {
          latestCloudDeletions.push(id);
        }
        if (latestCloudGarments) {
          latestCloudGarments = latestCloudGarments.filter((g) => g.id !== id);
        }

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
    latestCloudDeletions = [];

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
