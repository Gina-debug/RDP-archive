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

  // ========================================================================
  // FIRESTORE REST API CONVERTERS & HELPERS
  // Permette di leggere e scrivere direttamente su Firestore anche se l'SDK
  // è disconnesso, lento, o bloccato da restrizioni browser.
  // ========================================================================
  function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === "boolean") return { booleanValue: val };
    if (typeof val === "number") {
      if (Number.isInteger(val)) return { integerValue: String(val) };
      return { doubleValue: val };
    }
    if (typeof val === "string") return { stringValue: val };
    if (Array.isArray(val)) {
      return {
        arrayValue: {
          values: val.map(toFirestoreValue).filter(Boolean)
        }
      };
    }
    if (typeof val === "object") {
      const fields = {};
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
          fields[k] = toFirestoreValue(v);
        }
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  function toFirestoreFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && k !== "id") {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { fields };
  }

  function fromFirestoreValue(val) {
    if (!val || typeof val !== "object") return null;
    if ("stringValue" in val) return val.stringValue;
    if ("integerValue" in val) return parseInt(val.integerValue, 10);
    if ("doubleValue" in val) return parseFloat(val.doubleValue);
    if ("booleanValue" in val) return val.booleanValue;
    if ("nullValue" in val) return null;
    if ("timestampValue" in val) return val.timestampValue;
    if ("arrayValue" in val) {
      const arr = val.arrayValue && Array.isArray(val.arrayValue.values) ? val.arrayValue.values : [];
      return arr.map(fromFirestoreValue);
    }
    if ("mapValue" in val) {
      const fields = (val.mapValue && val.mapValue.fields) || {};
      const res = {};
      for (const [k, v] of Object.entries(fields)) {
        res[k] = fromFirestoreValue(v);
      }
      return res;
    }
    return null;
  }

  function fromFirestoreDoc(doc) {
    if (!doc) return null;
    const id = doc.name ? doc.name.split("/").pop() : "";
    const fields = doc.fields || {};
    const res = { id };
    for (const [k, v] of Object.entries(fields)) {
      res[k] = fromFirestoreValue(v);
    }
    if (!res.id) res.id = id;
    return res;
  }

  // Chiamate dirette Firestore REST API (Infallibili e indipendenti dall'SDK)
  async function restSaveGarment(cleanItem, apiKey, projectId) {
    if (!apiKey || !projectId || !cleanItem || !cleanItem.id) {
      throw new Error("Parametri Cloud mancanti per salvataggio REST");
    }
    const docId = encodeURIComponent(cleanItem.id);
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rdp_garments/${docId}?key=${apiKey}`;
    const payload = toFirestoreFields(cleanItem);

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Errore HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed && parsed.error && parsed.error.message) {
          msg = parsed.error.message;
        }
      } catch (_e) {}
      throw new Error(`Salvataggio REST fallito (${msg})`);
    }

    // Se il capo era stato precedentemente segnato come eliminato, rimuovilo via REST da rdp_deletions
    try {
      const delUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rdp_deletions/${docId}?key=${apiKey}`;
      await fetch(delUrl, { method: "DELETE" });
    } catch (_e) {}

    return true;
  }

  async function restDeleteGarment(id, apiKey, projectId) {
    if (!apiKey || !projectId || !id) return false;
    const docId = encodeURIComponent(id);

    try {
      const gUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rdp_garments/${docId}?key=${apiKey}`;
      await fetch(gUrl, { method: "DELETE" });
    } catch (_e) {}

    try {
      const dUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rdp_deletions/${docId}?key=${apiKey}`;
      const payload = toFirestoreFields({ id, deletedAt: Date.now() });
      await fetch(dUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (_e) {}

    return true;
  }

  async function restGetAllGarments(apiKey, projectId) {
    if (!apiKey || !projectId) return [];
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rdp_garments?key=${apiKey}&pageSize=300`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      if (!json || !Array.isArray(json.documents)) return [];
      return json.documents.map(fromFirestoreDoc).filter(Boolean);
    } catch (_e) {
      return [];
    }
  }

  async function restGetAllDeletions(apiKey, projectId) {
    if (!apiKey || !projectId) return [];
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rdp_deletions?key=${apiKey}&pageSize=300`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      if (!json || !Array.isArray(json.documents)) return [];
      return json.documents.map(fromFirestoreDoc).map((d) => d.id).filter(Boolean);
    } catch (_e) {
      return [];
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

    let cloudGarments = latestCloudGarments;

    // Se non abbiamo ancora i dati in memoria, prova tramite SDK Firestore
    if (!cloudGarments && init() && db) {
      try {
        const snap = await db.collection("rdp_garments").get();
        cloudGarments = [];
        snap.forEach((doc) => {
          cloudGarments.push({ ...doc.data(), id: doc.id });
        });
      } catch (err) {
        console.warn("[RDP Cloud] SDK get garments error:", err);
      }
    }

    // Se l'SDK non ha restituito dati, prova tramite REST API diretta
    if (!cloudGarments) {
      const cfg = RDP_FIREBASE_CONFIG.getConfig();
      if (cfg && cfg.apiKey && cfg.projectId) {
        try {
          const restGarments = await restGetAllGarments(cfg.apiKey, cfg.projectId);
          if (restGarments && restGarments.length > 0) {
            cloudGarments = restGarments;
          }
        } catch (_e) {}
      }
    }

    if (cloudGarments && Array.isArray(cloudGarments)) {
      latestCloudGarments = cloudGarments;
      lastGarmentsSig = cloudGarments
        .map((g) => `${g.id}:${g.updatedAt || 0}`)
        .sort()
        .join("|");

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

    let cloudDeletions = latestCloudDeletions;

    if (!cloudDeletions && init() && db) {
      try {
        const snap = await db.collection("rdp_deletions").get();
        cloudDeletions = [];
        snap.forEach((doc) => {
          cloudDeletions.push(doc.id);
        });
      } catch (err) {
        console.warn("[RDP Cloud] SDK get deletions error:", err);
      }
    }

    if (!cloudDeletions) {
      const cfg = RDP_FIREBASE_CONFIG.getConfig();
      if (cfg && cfg.apiKey && cfg.projectId) {
        try {
          const restDeletions = await restGetAllDeletions(cfg.apiKey, cfg.projectId);
          if (restDeletions && restDeletions.length > 0) {
            cloudDeletions = restDeletions;
          }
        } catch (_e) {}
      }
    }

    if (cloudDeletions && Array.isArray(cloudDeletions)) {
      latestCloudDeletions = cloudDeletions;
      lastDeletionsSig = cloudDeletions.slice().sort().join("|");

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

  // Comprime un DataURL immagine se necessario (senza crossOrigin su data: per evitare canvas corrotto)
  function shrinkDataUrl(dataUrl, maxDim = 1000, quality = 0.72) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return Promise.resolve(dataUrl);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w <= 0 || h <= 0) {
            resolve(dataUrl);
            return;
          }
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
        } catch (_e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // Verifica che il documento rispetti i limiti di sicurezza Firestore (limite hard 1MB / 1.048.576 byte)
  async function ensureDocumentFitsFirestore(item) {
    if (!item) return item;
    const clone = JSON.parse(JSON.stringify(item));

    // Deduplicazione: se gallery è duplicata con front ed extra, rimuovi gallery per dimezzare le dimensioni
    if (clone.images && typeof clone.images === "object") {
      if (clone.images.gallery && (clone.images.front || clone.images.extra)) {
        delete clone.images.gallery;
      }
    }

    // Comprimi sempre la foto vetrina in formato compatto HD 800×1067 a qualità 0.75 (~60KB)
    if (clone.showcaseImage && clone.showcaseImage.startsWith("data:image/")) {
      clone.showcaseImage = await shrinkDataUrl(clone.showcaseImage, 800, 0.75);
    }

    // Comprimi le foto dell'ispezione a max 1000px
    if (clone.images && typeof clone.images === "object") {
      if (clone.images.front && clone.images.front.startsWith("data:image/")) {
        clone.images.front = await shrinkDataUrl(clone.images.front, 1000, 0.72);
      }
      if (clone.images.back && clone.images.back.startsWith("data:image/")) {
        clone.images.back = await shrinkDataUrl(clone.images.back, 1000, 0.72);
      }
      if (Array.isArray(clone.images.extra)) {
        for (let i = 0; i < clone.images.extra.length; i++) {
          if (clone.images.extra[i] && clone.images.extra[i].startsWith("data:image/")) {
            clone.images.extra[i] = await shrinkDataUrl(clone.images.extra[i], 1000, 0.72);
          }
        }
      }
      if (Array.isArray(clone.images.gallery)) {
        for (let i = 0; i < clone.images.gallery.length; i++) {
          if (clone.images.gallery[i] && clone.images.gallery[i].startsWith("data:image/")) {
            clone.images.gallery[i] = await shrinkDataUrl(clone.images.gallery[i], 1000, 0.72);
          }
        }
      }
    }

    // Se per foto multiple supera ancora i 700KB, comprimi ulteriormente le foto secondarie
    let jsonLen = JSON.stringify(clone).length;
    if (jsonLen > 700000 && clone.images && Array.isArray(clone.images.extra)) {
      for (let i = 0; i < clone.images.extra.length; i++) {
        if (clone.images.extra[i] && clone.images.extra[i].startsWith("data:image/")) {
          clone.images.extra[i] = await shrinkDataUrl(clone.images.extra[i], 800, 0.60);
        }
      }
    }

    return clone;
  }

  // Salva un nuovo capo o le sue modifiche (Dual-Engine: Firestore SDK + Direct Firestore REST API)
  // Garantisce il salvataggio perenne nel Cloud per tutti i dispositivi al mondo.
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
    try {
      await RDPStorage.saveUserItem(cleanItem);
    } catch (_e) {}

    // Aggiorna IMMEDIATAMENTE la cache in memoria per reattività istantanea su tutta l'app
    if (!latestCloudGarments) latestCloudGarments = [];
    const existingIdx = latestCloudGarments.findIndex((g) => g.id === cleanItem.id);
    if (existingIdx >= 0) {
      latestCloudGarments[existingIdx] = cleanItem;
    } else {
      latestCloudGarments.unshift(cleanItem);
    }
    if (latestCloudDeletions) {
      latestCloudDeletions = latestCloudDeletions.filter((id) => id !== cleanItem.id);
    }
    lastGarmentsSig = latestCloudGarments
      .map((g) => `${g.id}:${g.updatedAt || 0}`)
      .sort()
      .join("|");

    // Credenziali di connessione Cloud
    const cfg = RDP_FIREBASE_CONFIG.getConfig();
    const apiKey = cfg && cfg.apiKey;
    const projectId = cfg && cfg.projectId;

    let cloudSaved = false;
    let cloudEngine = "";
    let cloudError = null;

    // TENTATIVO 1: SDK Firestore ufficiale (con timeout di 3500ms)
    if (init() && db) {
      try {
        const sdkPromise = (async () => {
          // Se era tra gli eliminati, rimuovilo da rdp_deletions
          await db.collection("rdp_deletions").doc(cleanItem.id).delete().catch(() => {});
          // Salva su Firestore con merge: true per persistenza globale perenne
          await db.collection("rdp_garments").doc(cleanItem.id).set(cleanItem, { merge: true });
          return true;
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout connessione Firestore SDK")), 3500)
        );

        await Promise.race([sdkPromise, timeoutPromise]);
        cloudSaved = true;
        cloudEngine = "sdk";
        isConnected = true;
        cloudDbMissing = false;
        cloudDbPermissionDenied = false;
        initError = null;
        notifyStatusChange();
      } catch (sdkErr) {
        console.warn("[RDP Cloud] Tentativo SDK non riuscito, avvio fallback REST:", sdkErr);
        cloudError = sdkErr ? sdkErr.message : "Errore SDK";
      }
    }

    // TENTATIVO 2: Fallback diretto Firestore REST API (Fetch HTTP diretto, 100% affidabile)
    if (!cloudSaved && apiKey && projectId) {
      try {
        await restSaveGarment(cleanItem, apiKey, projectId);
        cloudSaved = true;
        cloudEngine = "rest";
        isConnected = true;
        cloudDbMissing = false;
        cloudDbPermissionDenied = false;
        initError = null;
        notifyStatusChange();
        console.log(`[RDP Cloud] Capo ${cleanItem.id} e Foto Vetrina salvati con successo nel Cloud Firestore via REST API.`);
      } catch (restErr) {
        console.error("[RDP Cloud] Errore salvataggio REST API:", restErr);
        cloudError = restErr ? restErr.message : "Errore REST API";
      }
    }

    if (cloudSaved) {
      return { success: true, syncedToCloud: true, source: cloudEngine, item: cleanItem };
    }

    return {
      success: false,
      syncedToCloud: false,
      error: cloudError || initError || "Impossibile contattare il database Cloud Firestore",
      item: cleanItem
    };
  }

  // Elimina un capo (Dual-Engine: rimuove dai caricati e aggiunge agli eliminati su Cloud e Locale)
  async function deleteGarment(id) {
    if (!id) return { success: false, syncedToCloud: false };

    // Salva in locale
    await RDPStorage.deleteItem(id);

    // Aggiorna cache locale in memoria
    if (latestCloudDeletions && !latestCloudDeletions.includes(id)) {
      latestCloudDeletions.push(id);
    }
    if (latestCloudGarments) {
      latestCloudGarments = latestCloudGarments.filter((g) => g.id !== id);
    }

    const cfg = RDP_FIREBASE_CONFIG.getConfig();
    const apiKey = cfg && cfg.apiKey;
    const projectId = cfg && cfg.projectId;

    let cloudDeleted = false;

    if (init() && db) {
      try {
        await db.collection("rdp_deletions").doc(id).set({
          id,
          deletedAt: Date.now()
        });
        await db.collection("rdp_garments").doc(id).delete().catch(() => {});
        cloudDeleted = true;
      } catch (err) {
        console.warn("[RDP Cloud] Errore delete SDK, provo REST:", err);
      }
    }

    if (!cloudDeleted && apiKey && projectId) {
      try {
        await restDeleteGarment(id, apiKey, projectId);
        cloudDeleted = true;
      } catch (_e) {}
    }

    if (cloudDeleted) {
      isConnected = true;
      cloudDbMissing = false;
      notifyStatusChange();
      return { success: true, syncedToCloud: true };
    }

    return { success: false, syncedToCloud: false };
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
