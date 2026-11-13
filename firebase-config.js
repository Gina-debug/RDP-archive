// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — FIREBASE CLOUD CONFIGURATION
// Inserisci qui le credenziali del tuo progetto Firebase per sincronizzare
// l'archivio, i mockup e i voti su TUTTI i dispositivi in tempo reale.
// ==========================================================================

const RDP_FIREBASE_CONFIG = (() => {
  "use strict";

  // Configurazione predefinita ufficiale del progetto Firebase (rdp--archive)
  const defaultConfig = {
    apiKey: "AIzaSyDic3Xu4l6KZcqC4498Zfkz1MaVikAD9Kc",
    authDomain: "rdp--archive.firebaseapp.com",
    projectId: "rdp--archive",
    storageBucket: "rdp--archive.firebasestorage.app",
    messagingSenderId: "611066064576",
    appId: "1:611066064576:web:e1bbe942d73edf7a478725",
    measurementId: "G-GT4HR39CKV"
  };

  // Permette al Creator di incollare la configurazione anche da interfaccia web
  function getConfig() {
    try {
      const stored = window.localStorage.getItem("rdp_firebase_custom_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (_e) {}
    return defaultConfig;
  }

  function setConfig(newConfig) {
    try {
      if (typeof newConfig === "object") {
        window.localStorage.setItem("rdp_firebase_custom_config", JSON.stringify(newConfig));
      }
    } catch (_e) {}
  }

  function isConfigured() {
    const cfg = getConfig();
    return Boolean(cfg.apiKey && cfg.projectId && cfg.apiKey.trim().length > 5);
  }

  return {
    getConfig,
    setConfig,
    isConfigured
  };
})();
