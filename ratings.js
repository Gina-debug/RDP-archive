// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — RATING & COMMUNITY VOTING SYSTEM
// Permette a chi entra nel sito di votare ogni singolo capo da 0 a 10.
// Salva i voti in LocalStorage e calcola dinamicamente la media in tempo reale.
// ==========================================================================

const RDPRatings = (() => {
  const STORAGE_KEY = "rdp_archive_user_ratings_v2";

  // Carica i voti espressi dall'utente dal LocalStorage
  function getUserRatings() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_e) {
      return {};
    }
  }

  // Registra un voto da 0 a 10 per un capo
  function setRating(itemId, score) {
    const num = Math.max(0, Math.min(10, Math.round(Number(score))));
    const ratings = getUserRatings();
    ratings[itemId] = num;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch (_e) {
      // Ignora se quota storage superata
    }
    return num;
  }

  // Ritorna il voto espresso dall'utente per un dato capo (o null se non ancora votato)
  function getUserVote(itemId) {
    const ratings = getUserRatings();
    return typeof ratings[itemId] === "number" ? ratings[itemId] : null;
  }

  // Calcola statistiche aggregate (media voti e totale voti) combinando il voto utente
  function getItemStats(item) {
    const userVote = getUserVote(item.id);
    const baseRating = typeof item.initialRating === "number" ? item.initialRating : 9.0;
    const baseVotes = typeof item.initialVotes === "number" ? item.initialVotes : 40;

    if (userVote === null) {
      return {
        average: baseRating.toFixed(1),
        numericAverage: baseRating,
        totalVotes: baseVotes,
        userVote: null,
        hasVoted: false
      };
    }

    // Incorpora il voto utente nel calcolo medio
    const totalSum = baseRating * baseVotes + userVote;
    const newTotal = baseVotes + 1;
    const newAvg = totalSum / newTotal;

    return {
      average: newAvg.toFixed(1),
      numericAverage: newAvg,
      totalVotes: newTotal,
      userVote,
      hasVoted: true
    };
  }

  // Calcola il totale globale di voti registrati nell'archivio
  function getGlobalStats(items) {
    let totalVotes = 0;
    let sumAvgs = 0;
    items.forEach((item) => {
      const s = getItemStats(item);
      totalVotes += s.totalVotes;
      sumAvgs += s.numericAverage;
    });
    const globalAvg = items.length > 0 ? (sumAvgs / items.length).toFixed(1) : "0.0";
    return { totalVotes, globalAvg };
  }

  // Reset voti utente
  function clearAllUserVotes() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }

  return {
    setRating,
    getUserVote,
    getItemStats,
    getGlobalStats,
    clearAllUserVotes
  };
})();
