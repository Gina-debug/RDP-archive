// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — RATING, VOTER IDENTITY & COMMUNITY VOTING SYSTEM
// Permette a chi entra nel sito di registrarsi (Nome e Cognome) 1 SOLA VOLTA
// e votare ogni singolo capo da 0 a 10 liberamente.
// Se l'utente è autenticato come Creator, l'identità è già attiva automaticamente.
// Tutti i voti iniziali sono azzerati (0.0 / 0 voti).
// ==========================================================================

// --------------------------------------------------------------------------
// 1. GESTIONE IDENTITÀ VOTANTE (Login / Registrazione 1 sola volta)
// --------------------------------------------------------------------------
const RDPVoter = (() => {
  "use strict";

  const STORAGE_KEY = "rdp_voter_profile_v3";

  function getProfile() {
    // 1. Se autenticato come Creator, usa automaticamente le credenziali Creator
    if (typeof RDPAuth !== "undefined" && RDPAuth.isAuthenticated()) {
      return {
        name: "RIKI SOLBIATI",
        email: "rikisolbiati@gmail.com",
        isCreator: true,
        registeredAt: Date.now()
      };
    }

    // 2. Altrimenti carica il profilo salvato da localStorage (memorizzato per sempre)
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.name && String(data.name).trim().length > 0) {
        return {
          name: String(data.name).trim().toUpperCase(),
          email: String(data.email || "").trim().toLowerCase(),
          isCreator: false,
          registeredAt: data.registeredAt || Date.now()
        };
      }
    } catch (_e) {}
    return null;
  }

  function setProfile(name, email = "") {
    const cleanName = String(name || "").trim().toUpperCase();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: "INSERIRE NOME E COGNOME VALIDO (MIN 2 CARATTERI)" };
    }

    const profile = {
      name: cleanName,
      email: cleanEmail,
      isCreator: false,
      registeredAt: Date.now()
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (_e) {}

    return { success: true, profile };
  }

  function isRegistered() {
    const profile = getProfile();
    return Boolean(profile && profile.name);
  }

  function clearProfile() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }

  return {
    getProfile,
    setProfile,
    isRegistered,
    clearProfile
  };
})();

// --------------------------------------------------------------------------
// 2. SISTEMA DI VOTAZIONE 0-10 & STATISTICHE
// --------------------------------------------------------------------------
const RDPRatings = (() => {
  "use strict";

  const STORAGE_KEY = "rdp_archive_user_ratings_v3";

  // Cache per aggregati cloud (se Firebase è connesso)
  let cloudAggregates = {};

  function setCloudAggregates(aggregates) {
    cloudAggregates = aggregates || {};
  }

  // Carica i voti espressi dal votante locale
  function getUserRatings() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_e) {
      return {};
    }
  }

  // Registra un voto da 0 a 10 per un dato capo
  function setRating(itemId, score) {
    const num = Math.max(0, Math.min(10, Math.round(Number(score))));
    const ratings = getUserRatings();
    ratings[itemId] = num;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch (_e) {}
    return num;
  }

  // Ritorna il voto espresso dal votante locale per un capo (o null)
  function getUserVote(itemId) {
    const ratings = getUserRatings();
    return typeof ratings[itemId] === "number" ? ratings[itemId] : null;
  }

  // Ritorna l'elenco di tutti i capi votati dal votante locale con i rispettivi voti
  function getAllUserVotes() {
    return getUserRatings();
  }

  // Calcola statistiche (media e conteggio) partendo da zero assoluto
  function getItemStats(item) {
    const userVote = getUserVote(item.id);

    // Se sono presenti dati aggregati dal cloud
    const cloudStat = cloudAggregates[item.id];
    let baseSum = 0;
    let baseVotes = 0;

    if (cloudStat && typeof cloudStat.totalVotes === "number") {
      baseVotes = cloudStat.totalVotes;
      baseSum = (cloudStat.sum || 0);
    } else {
      // Base da dataset locale (azzerata a 0.0 e 0 voti)
      const initRating = typeof item.initialRating === "number" ? item.initialRating : 0;
      const initVotes = typeof item.initialVotes === "number" ? item.initialVotes : 0;
      baseVotes = initVotes;
      baseSum = initRating * initVotes;
    }

    if (userVote === null) {
      if (baseVotes === 0) {
        return {
          average: "0.0",
          numericAverage: 0,
          totalVotes: 0,
          userVote: null,
          hasVoted: false
        };
      }
      const avg = baseSum / baseVotes;
      return {
        average: avg.toFixed(1),
        numericAverage: avg,
        totalVotes: baseVotes,
        userVote: null,
        hasVoted: false
      };
    }

    // Incorpora il voto utente locale se non già contato nel cloud
    const effectiveTotal = baseVotes === 0 ? 1 : baseVotes;
    const effectiveSum = baseVotes === 0 ? userVote : baseSum;
    const finalAvg = effectiveSum / effectiveTotal;

    return {
      average: finalAvg.toFixed(1),
      numericAverage: finalAvg,
      totalVotes: effectiveTotal,
      userVote,
      hasVoted: true
    };
  }

  // Statistiche globali dell'archivio
  function getGlobalStats(items) {
    let totalVotes = 0;
    let sumAvgs = 0;
    let itemsWithVotes = 0;

    (items || []).forEach((item) => {
      const s = getItemStats(item);
      totalVotes += s.totalVotes;
      if (s.totalVotes > 0) {
        sumAvgs += s.numericAverage;
        itemsWithVotes++;
      }
    });

    const globalAvg = itemsWithVotes > 0 ? (sumAvgs / itemsWithVotes).toFixed(1) : "0.0";
    return { totalVotes, globalAvg };
  }

  // Azzera tutti i voti salvati in locale
  function clearAllUserVotes() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }

  return {
    setRating,
    getUserVote,
    getAllUserVotes,
    getItemStats,
    getGlobalStats,
    setCloudAggregates,
    clearAllUserVotes
  };
})();
