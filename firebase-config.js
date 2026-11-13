// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — FIREBASE CLOUD CONFIGURATION
// Inserisci qui le credenziali del tuo progetto Firebase per sincronizzare
// l'archivio, i mockup e i voti su TUTTI i dispositivi in tempo reale.
// ==========================================================================

const RDP_FIREBASE_CONFIG = (() => {
  "use strict";

  // Configurazione predefinita (sostituisci i campi con quelli del tuo progetto Firebase)
  const defaultConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
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
