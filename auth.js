// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — STRICT CREATOR AUTHENTICATION MANAGER
// Accesso rigorosamente riservato all'account Creator con credenziali esclusive:
// Email / Nome: rikisolbiati@gmail.com
// Password:     11settembre1965
// ==========================================================================

const RDPAuth = (() => {
  "use strict";

  const STORAGE_KEY = "rdp_creator_session_v2";

  // Credenziali univoche ed esclusive autorizzate
  const AUTHORIZED_EMAIL = "rikisolbiati@gmail.com";
  const AUTHORIZED_PASS = "11settembre1965";

  // Invalida vecchie sessioni v1 se presenti
  try {
    window.localStorage.removeItem("rdp_creator_session_v1");
  } catch (_e) {}

  // Recupera la sessione attiva da localStorage
  function getSession() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (
        data &&
        data.isLoggedIn &&
        String(data.email || "").toLowerCase() === AUTHORIZED_EMAIL
      ) {
        return data;
      }
    } catch (_e) {
      // ignore
    }
    return null;
  }

  // Verifica se l'utente corrente è autenticato come Admin / Creator autorizzato
  function isAuthenticated() {
    const session = getSession();
    return Boolean(session && session.isLoggedIn);
  }

  // Restituisce l'identificativo o nome dell'utente autenticato
  function getCurrentUser() {
    const session = getSession();
    return session ? session.username || session.email : null;
  }

  // Esegue il login con verifica rigorosa di email e password
  function login(usernameOrEmail, password) {
    const cleanEmail = String(usernameOrEmail || "").trim().toLowerCase();
    const cleanPass = String(password || "").trim();

    if (cleanEmail !== AUTHORIZED_EMAIL || cleanPass !== AUTHORIZED_PASS) {
      return {
        success: false,
        message: "ACCESSO NEGATO: CREDENZIALI NON CORRETTE."
      };
    }

    const sessionData = {
      isLoggedIn: true,
      email: AUTHORIZED_EMAIL,
      username: "RIKI SOLBIATI",
      role: "CREATOR_OWNER",
      loginTime: Date.now()
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (_e) {
      // ignore
    }

    return {
      success: true,
      user: sessionData.username,
      email: sessionData.email
    };
  }

  // Esegue il logout
  function logout() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {
      // ignore
    }
  }

  return {
    isAuthenticated,
    getCurrentUser,
    login,
    logout
  };
})();
