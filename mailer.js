// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — MAILER & FEEDBACK DISPATCH ENGINE
// Invia la scheda di votazione (Nome, Cognome, voti assegnati ai singoli capi)
// e il feedback/consiglio su nuovi capi all'indirizzo rikisolbiati@gmail.com.
// Supporta FormSubmit AJAX API, Cloud Firestore, Web3Forms, Gmail Web & mailto
// ==========================================================================

const RDPMailer = (() => {
  "use strict";

  const CREATOR_EMAIL = "rikisolbiati@gmail.com";
  const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/rikisolbiati@gmail.com";

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
      body += `(Nessun voto espresso sui capi dell'archivio)\n\n`;
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

    return { body, votedItems, timestampStr };
  }

  // Genera un link mailto diretto per l'app email (Apple Mail, Outlook, app predefinita)
  function generateMailtoLink(voter, votesMap, allItems, feedbackText) {
    const { body } = buildMessageBody(voter, votesMap, allItems, feedbackText);
    const subject = encodeURIComponent(`[RDP ARCHIVE] Voti & Proposte da ${voter.name}`);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${CREATOR_EMAIL}?subject=${subject}&body=${encodedBody}`;
  }

  // Genera un link diretto per comporre in Gmail Web su browser smartphone e desktop
  function generateGmailWebLink(voter, votesMap, allItems, feedbackText) {
    const { body } = buildMessageBody(voter, votesMap, allItems, feedbackText);
    const subject = encodeURIComponent(`[RDP ARCHIVE] Voti & Proposte da ${voter.name}`);
    const encodedBody = encodeURIComponent(body);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CREATOR_EMAIL)}&su=${subject}&body=${encodedBody}`;
  }

  // Invia la scheda voti e feedback via FormSubmit AJAX API con fallback automatici
  async function sendBallotAndFeedback({ voter, votesMap, allItems, feedbackText }) {
    if (!voter || !voter.name) {
      return { success: false, message: "REGISTRAZIONE VOTANTE OBBLIGATORIA (NOME E COGNOME)" };
    }

    const { body, votedItems, timestampStr } = buildMessageBody(voter, votesMap, allItems, feedbackText);
    const subject = `[RDP ARCHIVE] Nuova Votazione & Feedback da ${voter.name} (${votedItems.length} capi)`;
    const mailtoUrl = generateMailtoLink(voter, votesMap, allItems, feedbackText);
    const gmailUrl = generateGmailWebLink(voter, votesMap, allItems, feedbackText);

    const votedSummary = votedItems.length > 0
      ? votedItems.map((v) => `${v.code} (${v.title}): ★ ${v.score}/10`).join(" | ")
      : "Nessun voto espresso";

    // 1. Tentativo primario: FormSubmit.co AJAX
    try {
      const response = await fetch(FORMSUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          _subject: subject,
          _template: "table",
          _captcha: "false",
          name: voter.name,
          email: voter.email || "community@rdp-archive.com",
          scheda_votante: voter.name,
          email_votante: voter.email || "Non indicata",
          data_e_ora: timestampStr,
          totale_capi_votati: String(votedItems.length),
          voti_assegnati: votedSummary,
          consiglio_o_capo_richiesto: feedbackText || "(Nessun commento)",
          scheda_completa: body
        })
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({ success: "true" }));
        const isActivation = data && data.message && String(data.message).includes("Activation");
        return {
          success: true,
          mode: isActivation ? "activation_sent" : "api",
          message: isActivation
            ? `SCHEDA TRASMESSA CON SUCCESSO A ${CREATOR_EMAIL}! (Nota: clicca 'Activate Form' nella prima email ricevuta da FormSubmit per confermare la ricezione).`
            : `SCHEDA TRASMESSA CON SUCCESSO A ${CREATOR_EMAIL}!`,
          votedCount: votedItems.length,
          fallbackUrl: mailtoUrl,
          gmailUrl
        };
      }
    } catch (err) {
      console.warn("[RDPMailer] FormSubmit primary dispatch error:", err);
    }

    // 2. Fallback secondario: Web3Forms
    try {
      const wResponse = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          access_key: "43c0ddf3-1382-45e3-952b-23c2da9f55e4",
          to: CREATOR_EMAIL,
          subject: subject,
          from_name: `RDP Community [${voter.name}]`,
          name: voter.name,
          email: voter.email || "community@rdp-archive.com",
          message: body
        })
      });

      const wData = await wResponse.json().catch(() => null);
      if (wResponse.ok && wData && wData.success) {
        return {
          success: true,
          mode: "web3forms",
          message: `SCHEDA TRASMESSA CON SUCCESSO A ${CREATOR_EMAIL}!`,
          votedCount: votedItems.length,
          fallbackUrl: mailtoUrl,
          gmailUrl
        };
      }
    } catch (_err) {}

    // 3. Fallback con link diretti Gmail e Mailto
    return {
      success: false,
      mode: "fallback",
      fallbackUrl: mailtoUrl,
      gmailUrl,
      message: "INVIO AUTOMATICO NON COMPLETATO // CLICCA UNO DEI PULSANTI SOTTO PER INVIARE VIA EMAIL O GMAIL"
    };
  }

  return {
    CREATOR_EMAIL,
    sendBallotAndFeedback,
    generateMailtoLink,
    generateGmailWebLink,
    buildMessageBody
  };
})();
