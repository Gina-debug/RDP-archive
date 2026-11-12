# RDP // RAGAZZI DI PROVINCIA
### OFFICIAL DIGITAL SHOWCASE & COMMUNITY ARCHIVE // DROP 04

> **ESTETICA**: Brutalista, archivio di sistema/cartelle digitali ispirato a [PDF Channel](https://pdfchannel.com/).  
> **PALETTE**: Bianco puro (`#FFFFFF`), Nero tecnico (`#111111`), Divisori (`#E5E5E5`), Woodland Camo militare (`#4B5320`, `#5C4033`, `#C2B280`, `#1C1C1C`).  
> **TIPOGRAFIA**: Monospace tabellare industriale ('JetBrains Mono' / 'Space Mono').

---

## ⚡ FUNZIONALITÀ PRINCIPALI

### 1. Vetrina Mockup ad Alta Risoluzione (1400×1400px HD)
- Tutti i capi del catalogo sono stati standardizzati in alta definizione **1400×1400px**.
- **Riempimento ottimizzato (~94%)**: zero margini vuoti sacrificati, massima visibilità dei dettagli di tessuto, cuciture e grafiche con ottimizzazione contrasto (`-webkit-optimize-contrast`).
- **Due Pagine per Capo**: ogni articolo presenta **Pagina 01 (Davanti)** e **Pagina 02 (Retro)** con schede tecniche e note di produzione dedicate.
- **Modalità di Visualizzazione Griglia**:
  - `[FLIP // SINGOLA]`: Switch rapido P.01 / P.02 direttamente su ogni card.
  - `[P.01 DAVANTI]`: Vista esclusiva frontale per tutti i capi.
  - `[P.02 RETRO]`: Vista esclusiva dorsale per tutti i capi.
  - `[DOPPIA PAGINA // AFFIANCATE]`: Affiancamento consecutivo di fronte e retro.

### 2. Community Rating System (Scala 0 — 10 ★)
- Qualsiasi visitatore può votare ogni singolo capo da 0 a 10:
  - Striscia rapida `[0]..[10]` sul fondo di ogni card.
  - Terminale di votazione dedicato nel Lightbox con indicatore di progresso percentuale in Woodland Camo.
  - Calcolo dinamico in tempo reale della media e dei voti complessivi.
  - Salvataggio persistente nel browser (`localStorage`).
  - Ordinamento flessibile per: **`[CODICE]`**, **`[TOP VOTO ★]`**, **`[PIÙ VOTATI]`**.

### 3. Protezione di Sicurezza & Accesso Riservato Creator
- **Visitatori esterni (Pubblico)**:
  - Possono solo guardare, zoomare, sfogliare e votare.
  - **Download bloccato**: pulsanti `[SCARICA_HD]` ed `[ESPORTA_CATALOGO]` nascosti; tasto destro e trascinamento immagini su desktop protetti.
  - Upload ed eliminazione disabilitati.
- **Creator Autenticato**:
  - Accesso riservato tramite terminale con credenziali dedicate.
  - Sblocco del pulsante **`+ UPLOAD MOCKUP [CREATOR]`** con Drag-and-Drop globale.
  - **HTML5 Canvas Processing Engine**: Auto-Trim / Smart Crop del capo, normalizzazione dello sfondo bianco puro studio (`#FFFFFF`) con tolleranza regolabile, incorniciatura 1400×1400px e studio drop-shadow.
  - **Eliminazione Capi**: pulsante rapido `[✕ ELIMINA]` su ogni card e `[ELIMINA_CAPO]` nella scheda tecnica con doppia conferma di sicurezza.
  - **Ripristino**: pulsante `[RIPRISTINA_ELIMINATI]` per recuperare eventuali capi rimossi per errore.
  - Salvataggio persistente su `IndexedDB` e `localStorage`.

### 4. Antigravity Physics Mode
- Motore fisico 2D rigido con rimbalzi elastici, attrito e interazione mouse.
- Shockwave a gravità zero e ripristino istantaneo della griglia CAD.

---

## 🛠️ ARCHITETTURA DEL PROGETTO

```
rdp-archive/
├── index.html       # Markup semantico brutalista con header, griglia e modal
├── styles.css       # Design brutalista puro, pattern Woodland Camo e griglia CAD
├── app.js           # Controller applicativo, routing visualizzazioni ed eventi
├── data.js          # Dataset ufficiale capi (11 articoli // 22 pagine HD)
├── auth.js          # Gestione autenticazione rigorosa dell'account Creator
├── storage.js       # Livello persistenza IndexedDB + LocalStorage fallback
├── processor.js     # Motore HTML5 Canvas per elaborazione e isolamento foto
├── ratings.js       # Motore statistico e logica del sistema di votazione 0-10
├── physics.js       # Simulatore fisico 2D rigid-body per Antigravity mode
└── assets/          # Immagini ufficiali HD 1400×1400px (rdp-001-* a rdp-011-*)
```

---

## 🚀 AVVIO LOCALE

È sufficiente servire la directory con qualsiasi server web statico:

```bash
# Con Python
python3 -m http.server 8765

# Oppure con Node / npx serve
npx serve -l 8765
```

Aprire il browser all'indirizzo: `http://localhost:8765`

---

© 2026 RDP // RAGAZZI DI PROVINCIA — OFFICIAL SHOWCASE & ARCHIVE.
