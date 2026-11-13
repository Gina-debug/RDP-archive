// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — MAILER & FEEDBACK DISPATCH ENGINE
// Invia la scheda di votazione (Nome, Cognome, voti assegnati ai singoli capi)
// e il feedback/consiglio su nuovi capi all'indirizzo rikisolbiati@gmail.com.
// Supporta Web3Forms API, salvataggio su Cloud Firestore e fallback mailto:
// ==========================================================================

const RDPMailer = (() => {
  "use strict";

  const CREATOR_EMAIL = "rikisolbiati@gmail.com";
  // Web3Forms public access key (o configurabile da storage)
  const LS_WEB3FORMS_KEY = "rdp_web3forms_key";
  const DEFAULT_ACCESS_KEY = "43c0ddf3-1382-45e3-952b-23c2da9f55e4"; // Starter public key

  function getAccessKey() {
    try {
      const stored = window.localStorage.getItem(LS_WEB3FORMS_KEY);
      return stored && stored.trim().length > 0 ? stored.trim() : DEFAULT_ACCESS_KEY;
    } catch (_e) {
      return DEFAULT_ACCESS_KEY;
    }
  }

  function setAccessKey(key) {
    try {
      if (key) window.localStorage.setItem(LS_WEB3FORMS_KEY, key.trim());
    } catch (_e) {}
  }

  // Costruisce il testo dettagliato della scheda di voto e feedback
  function buildMessageBody(voter, votesMap, allItems, feedbackText) {
    const timestampStr = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      dateStyle: "full",
      timeStyle: "medium"
    });

    const votedItems = [];
    Object.keys(votesMap || {}).forEach((itemId) => {
      const item = (allItems || []).find((i) => i.id === itemId);
      const score = votesMap[itemId];
      if (item && typeof score === "number") {
        votedItems.push({
          code: item.code,
          title: item.title,
          category: item.category,
          score
        });
      }
    });

    // Ordina per codice capo
    votedItems.sort((a, b) => a.code.localeCompare(b.code));

    let body = `====================================================================\n`;
    body += `RDP // RAGAZZI DI PROVINCIA — SCHEDA VOTAZIONE & FEEDBACK COMMUNITY\n`;
    body += `====================================================================\n\n`;
    body += `IDENTITÀ VOTANTE: ${voter.name}\n`;
    body += `EMAIL VOTANTE:    ${voter.email || "Non specificata"}\n`;
    body += `DATA & ORA:       ${timestampStr}\n`;
    body += `TOTALE CAPI VOTATI: ${votedItems.length}\n\n`;

    body += `--------------------------------------------------------------------\n`;
    body += `DETTAGLIO VOTI ASSEGNATI (SCALA 0 - 10):\n`;
    body += `--------------------------------------------------------------------\n`;

    if (votedItems.length === 0) {
      body += `(Nessun capo ancora votato dal visitatore)\n`;
    } else {
      votedItems.forEach((v, index) => {
        const num = String(index + 1).padStart(2, "0");
        body += `[${num}] ${v.code} — ${v.title} [${v.category}]\n`;
        body += `     VOTO ASSEGNATO: ★ ${v.score} / 10\n\n`;
      });
    }

    body += `--------------------------------------------------------------------\n`;
    body += `CONSIGLIO, FEEDBACK O CAPO RICHIESTO NELLA COLLEZIONE:\n`;
    body += `--------------------------------------------------------------------\n`;
    body += feedbackText && feedbackText.trim().length > 0
      ? `${feedbackText.trim()}\n\n`
      : `(Nessun commento testuale inserito)\n\n`;

    body += `====================================================================\n`;
    body += `Trasmesso dal portale ufficiale RDP // Ragazzi di Provincia Showcase\n`;
    body += `====================================================================\n`;

    return { body, votedItems };
  }

  // Genera un link mailto diretto di riserva
  function generateMailtoLink(voter, votesMap, allItems, feedbackText) {
    const { body } = buildMessageBody(voter, votesMap, allItems, feedbackText);
    const subject = encodeURIComponent(`[RDP ARCHIVE] Voti & Proposte da ${voter.name}`);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${CREATOR_EMAIL}?subject=${subject}&body=${encodedBody}`;
  }

  // Invia la scheda voti e feedback via Web3Forms API
  async function sendBallotAndFeedback({ voter, votesMap, allItems, feedbackText }) {
    if (!voter || !voter.name) {
      return { success: false, message: "REGISTRAZIONE VOTANTE OBBLIGATORIA (NOME E COGNOME)" };
    }

    const { body, votedItems } = buildMessageBody(voter, votesMap, allItems, feedbackText);
    const subject = `[RDP ARCHIVE] Nuova Votazione & Feedback da ${voter.name} (${votedItems.length} capi)`;

    // Tentativo invio Web3Forms
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          access_key: getAccessKey(),
          to: CREATOR_EMAIL,
          subject: subject,
          from_name: `RDP Community [${voter.name}]`,
          name: voter.name,
          email: voter.email || "community@rdp-archive.com",
          message: body
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          mode: "api",
          message: `SCHEDA TRASMESSA CON SUCCESSO A ${CREATOR_EMAIL}!`,
          votedCount: votedItems.length
        };
      } else {
        // Fallback su mailto
        return {
          success: false,
          mode: "fallback",
          fallbackUrl: generateMailtoLink(voter, votesMap, allItems, feedbackText),
          message: data.message || "ERRORE DISPATCH API"
        };
      }
    } catch (_err) {
      return {
        success: false,
        mode: "fallback",
        fallbackUrl: generateMailtoLink(voter, votesMap, allItems, feedbackText),
        message: "CONNESSIONE NON DISPONIBILE // USA INVIO DIRETTO EMAIL"
      };
    }
  }

  return {
    CREATOR_EMAIL,
    sendBallotAndFeedback,
    generateMailtoLink,
    buildMessageBody,
    getAccessKey,
    setAccessKey
  };
})();
