// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — MAIN APPLICATION CONTROLLER
// Showcase & 0-10 Community Voting System for 100% User Garments
// With Restricted Creator Account Authentication for Mockup Ingestion
// Two pages per garment: Pagina 01 (Davanti) & Pagina 02 (Retro)
// 1400×1400px HD Resolution // Woodland Camo Brutalist Aesthetic
// ==========================================================================

(() => {
  "use strict";

  // Application State
  let activeCategory = "ALL";
  let activeSortBy = "code"; // "code" | "rating" | "votes"
  let globalPageMode = "interactive"; // "interactive" | "front_only" | "back_only" | "split_dual"
  let cardPageStates = {}; // itemId -> "front" | "back"
  let seedItems = [];
  let userItems = [];
  let allItems = [];
  let activeModalItemId = null;
  let activeModalView = "front"; // "front" | "back"
  let isZoomed = false;
  let isCadGridOn = false;
  let toastTimer = null;
  let deleteConfirmTimer = null;

  // Upload Processor Draft State (Creator Only)
  let draftFrontFile = null;
  let draftBackFile = null;
  let draftFrontResult = null;
  let draftBackResult = null;
  let isProcessingImage = false;
  let globalDragCounter = 0;

  // DOM References — Header & Telemetry
  const archiveGrid = document.getElementById("archiveGrid");
  const fileCounter = document.getElementById("totalGarmentsVal") || document.getElementById("fileCounter");
  const totalVotesCounter = document.getElementById("totalVotesVal") || document.getElementById("totalVotesCounter");
  const liveClock = document.getElementById("liveClock");
  const sysStatus = document.getElementById("sysStatus");
  const activeDirLabel = document.getElementById("activeDirLabel");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const pageModeButtons = document.querySelectorAll(".page-mode-btn");
  const sortButtons = document.querySelectorAll(".sort-btn");
  const antigravityToggle = document.getElementById("antigravityToggle");
  const antigravityState = document.getElementById("antigravityState");
  const physicsHud = document.getElementById("physicsHud");
  const pulseZeroGBtn = document.getElementById("pulseZeroGBtn");
  const resetGridBtn = document.getElementById("resetGridBtn");
  // Voter Registration DOM Elements
  const openVoterModalBtn = document.getElementById("openVoterModalBtn");
  const voterDot = document.getElementById("voterDot");
  const voterBtnLabel = document.getElementById("voterBtnLabel");
  const voterRegistrationModal = document.getElementById("voterRegistrationModal");
  const voterModalCloseBtn = document.getElementById("voterModalCloseBtn");
  const voterCancelBtn = document.getElementById("voterCancelBtn");
  const voterRegistrationForm = document.getElementById("voterRegistrationForm");
  const voterInputName = document.getElementById("voterInputName");
  const voterInputEmail = document.getElementById("voterInputEmail");
  const voterErrorMsg = document.getElementById("voterErrorMsg");

  // Creator Cloud Modal Elements
  const openCloudModalBtn = document.getElementById("openCloudModalBtn");
  const cloudDot = document.getElementById("cloudDot");
  const cloudBtnLabel = document.getElementById("cloudBtnLabel");
  const cloudConfigModal = document.getElementById("cloudConfigModal");
  const cloudModalCloseBtn = document.getElementById("cloudModalCloseBtn");
  const cloudCancelBtn = document.getElementById("cloudCancelBtn");
  const cloudConfigForm = document.getElementById("cloudConfigForm");
  const cloudConfigJson = document.getElementById("cloudConfigJson");
  const cloudLiveStatusPill = document.getElementById("cloudLiveStatusPill");
  const cloudConfigMsg = document.getElementById("cloudConfigMsg");

  // Community Feedback Section Elements
  // Main Page View Switch Elements
  const tabIntroBtn = document.getElementById("tabIntroBtn");
  const tabShowcaseBtn = document.getElementById("tabShowcaseBtn");
  const tabFeedbackBtn = document.getElementById("tabFeedbackBtn");
  const introPageView = document.getElementById("introPageView");
  const showcasePageView = document.getElementById("showcasePageView");
  const feedbackPageView = document.getElementById("feedbackPageView");
  const enterArchiveBtn = document.getElementById("enterArchiveBtn");
  const introDirectFeedbackBtn = document.getElementById("introDirectFeedbackBtn");
  const brandHomeLink = document.getElementById("brandHomeLink");
  const goToFeedbackBtn = document.getElementById("goToFeedbackBtn");
  const backToShowcaseBtn = document.getElementById("backToShowcaseBtn");
  const scrollToFeedbackBtn = document.getElementById("scrollToFeedbackBtn");
  const ballotCounterBadge = document.getElementById("ballotCounterBadge");
  const ballotVoterNameLabel = document.getElementById("ballotVoterNameLabel");
  const ballotChangeVoterBtn = document.getElementById("ballotChangeVoterBtn");
  const ballotChipsGrid = document.getElementById("ballotChipsGrid");
  const feedbackTextInput = document.getElementById("feedbackTextInput");
  const feedbackSubmitBtn = document.getElementById("feedbackSubmitBtn");
  const feedbackResponseMsg = document.getElementById("feedbackResponseMsg");
  const fallbackMailtoLink = document.getElementById("fallbackMailtoLink");

  // Telemetry Elements
  const totalGarmentsVal = document.getElementById("totalGarmentsVal");
  const totalPagesVal = document.getElementById("totalPagesVal");
  const globalRatingVal = document.getElementById("globalRatingVal");
  const totalVotesVal = document.getElementById("totalVotesVal");

  let pendingVote = null;
  let pendingOpenUpload = false;

  // Admin / Creator Auth Elements
  const adminAuthBtn = document.getElementById("adminAuthBtn");
  const adminLoggedPill = document.getElementById("adminLoggedPill");
  const adminLoggedName = document.getElementById("adminLoggedName");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  const openUploadBtn = document.getElementById("openUploadBtn");
  const adminAuthModal = document.getElementById("adminAuthModal");
  const authCloseBtn = document.getElementById("authCloseBtn");
  const authCancelBtn = document.getElementById("authCancelBtn");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const authUsername = document.getElementById("authUsername");
  const authPassword = document.getElementById("authPassword");
  const authErrorMsg = document.getElementById("authErrorMsg");

  // Directory Actions
  const exportArchiveBtn = document.getElementById("exportArchiveBtn");
  const resetVotesBtn = document.getElementById("resetVotesBtn");
  const restoreDeletedBtn = document.getElementById("restoreDeletedBtn");

  // Lightbox Modal Elements
  const inspectionModal = document.getElementById("inspectionModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalCode = document.getElementById("modalCode");
  const modalBadge = document.getElementById("modalBadge");
  const modalCategory = document.getElementById("modalCategory");
  const modalTitle = document.getElementById("modalTitle");
  const modalPageIndicator = document.getElementById("modalPageIndicator");
  const modalStage = document.getElementById("viewerStage") || document.getElementById("modalStage");
  const modalImage = document.getElementById("modalImage");
  const cadGridOverlay = document.getElementById("viewerGridLines") || document.getElementById("cadGridOverlay");
  const gridOverlayBtn = document.getElementById("gridOverlayBtn");
  const zoomIndicator = document.getElementById("zoomIndicator");
  const viewFrontBtn = document.getElementById("viewFrontBtn");
  const viewBackBtn = document.getElementById("viewBackBtn");
  const modalViewLabel = document.getElementById("modalViewLabel");
  const modalAssetPath = document.getElementById("modalAssetPath");
  const modalDownloadBtn = document.getElementById("modalDownloadBtn");
  const modalDeleteBtn = document.getElementById("modalDeleteBtn");
  const modalFlipPageBtn = document.getElementById("modalFlipPageBtn");
  const modalPrevBtn = document.getElementById("modalPrevBtn");
  const modalNextBtn = document.getElementById("modalNextBtn");
  const modalIndexLabel = document.getElementById("modalIndexLabel");

  // Modal Rating Elements
  const modalRatingScore = document.getElementById("modalRatingScore");
  const modalVoteCount = document.getElementById("modalVoteCount");
  const modalUserVoteStatus = document.getElementById("modalUserVoteStatus");
  const modalMeterFill = document.getElementById("modalMeterFill");
  const modalVoteButtons = document.querySelectorAll(".vote-num-btn");

  // Spec Fields
  const specFit = document.getElementById("specFit");
  const specGsm = document.getElementById("specGsm");
  const specFabric = document.getElementById("specFabric");
  const specColorway = document.getElementById("specColorway");
  const specPattern = document.getElementById("specPattern");
  const specConstruction = document.getElementById("specConstruction");
  const specBatch = document.getElementById("specBatch");
  const specNotesHeader = document.getElementById("specNotesHeader");
  const specNotes = document.getElementById("specNotes");
  const pageNotesTag = document.getElementById("pageNotesTag");
  const pageNotesBody = document.getElementById("pageNotesBody");

  // Creator Upload Modal Elements
  const globalDropOverlay = document.getElementById("globalDropOverlay");
  const uploadModal = document.getElementById("uploadModal");
  const uploadCloseBtn = document.getElementById("uploadCloseBtn");
  const uploadCancelBtn = document.getElementById("uploadCancelBtn");
  const uploadForm = document.getElementById("uploadForm");
  const uploadNextCode = document.getElementById("uploadNextCode");
  const frontDropzone = document.getElementById("frontDropzone");
  const backDropzone = document.getElementById("backDropzone");
  const frontFileInput = document.getElementById("frontFileInput");
  const backFileInput = document.getElementById("backFileInput");
  const frontFileName = document.getElementById("frontFileName");
  const backFileName = document.getElementById("backFileName");
  const optBgClean = document.getElementById("optBgClean");
  const optEnhance = document.getElementById("optEnhance");
  const processorPlaceholder = document.getElementById("processorPlaceholder");
  const processorCanvasWrapper = document.getElementById("processorCanvasWrapper");
  const processedPreviewImg = document.getElementById("processedPreviewImg");
  const processorTelemetry = document.getElementById("processorTelemetry");
  const uploadErrorMsg = document.getElementById("uploadErrorMsg");
  const uploadSubmitBtn = document.getElementById("uploadSubmitBtn");

  // Upload Form Inputs
  const inputTitle = document.getElementById("inputTitle");
  const inputCategory = document.getElementById("inputCategory");
  const inputGsm = document.getElementById("inputGsm");
  const inputFit = document.getElementById("inputFit");
  const inputBadge = document.getElementById("inputBadge");
  const inputFabric = document.getElementById("inputFabric");
  const inputColorway = document.getElementById("inputColorway");
  const inputNotes = document.getElementById("inputNotes");

  const archiveToast = document.getElementById("archiveToast");

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  async function init() {
    startClock();
    bindEvents();
    updateAuthUI();
    updateVoterUI();
    updateCloudUI();

    // Inizializza sincronizzazione cloud multi-dispositivo
    RDPCloud.init();
    RDPCloud.onStatusChange(() => {
      updateCloudUI();
    });
    RDPCloud.onGarmentsUpdated(() => {
      triggerArchiveReload();
    });
    RDPCloud.onDeletionsUpdated(() => {
      triggerArchiveReload();
    });

    // All'apertura del sito mostra per prima la pagina Intro minimal
    switchMainView("intro");
    await reloadArchiveData();
  }

  let reloadDebounceTimer = null;
  function triggerArchiveReload(immediate = false) {
    if (immediate) {
      if (reloadDebounceTimer) {
        clearTimeout(reloadDebounceTimer);
        reloadDebounceTimer = null;
      }
      return reloadArchiveData();
    }
    if (reloadDebounceTimer) {
      clearTimeout(reloadDebounceTimer);
    }
    reloadDebounceTimer = setTimeout(() => {
      reloadDebounceTimer = null;
      reloadArchiveData();
    }, 150);
  }

  async function reloadArchiveData() {
    // Official 11 user-uploaded garments (SS26)
    seedItems = typeof RDP_ARCHIVE !== "undefined" ? RDP_ARCHIVE : [];

    // Capi aggiunti dal Creatore con il proprio account (Cloud o Locale)
    userItems = await RDPCloud.getAllCreatorGarments();

    // Filtra tutti i capi rimossi dall'archivio (Cloud o Locale)
    const deletedIdsArray = await RDPCloud.getAllDeletedIds();
    const deletedIds = new Set(deletedIdsArray);
    const activeSeed = seedItems.filter((item) => !deletedIds.has(item.id));
    const activeUser = userItems.filter((item) => !deletedIds.has(item.id));
    const combined = [...activeSeed, ...activeUser];

    // Assegnazione progressiva automatica dei codici (RDP-001, RDP-002... RDP-012...)
    allItems = combined.map((item, idx) => ({
      ...item,
      code: formatArchiveCode(idx + 1)
    }));

    // Pulsante di ripristino visibile all'admin se ci sono capi eliminati
    if (restoreDeletedBtn) {
      const isCreator = RDPAuth.isAuthenticated();
      if (isCreator && deletedIds.size > 0) {
        restoreDeletedBtn.style.display = "inline-flex";
        restoreDeletedBtn.textContent = `[RIPRISTINA_ELIMINATI (${deletedIds.size})]`;
      } else {
        restoreDeletedBtn.style.display = "none";
      }
    }

    updateCounts();
    renderGrid();
    updateBallotSummary();
  }

  function formatArchiveCode(num) {
    return `RDP-${String(num).padStart(3, "0")}`;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function startClock() {
    const tick = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("it-IT", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      if (liveClock) {
        liveClock.textContent = `${timeStr} CET`;
      }
    };
    tick();
    window.setInterval(tick, 1000);
  }

  function showToast(msg) {
    if (!archiveToast) return;
    archiveToast.textContent = msg;
    archiveToast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      archiveToast.hidden = true;
    }, 3200);
  }

  // ========================================================================
  // AUTHENTICATION & UI ROLE STATE (ADMIN / CREATOR VS PUBLIC GUEST)
  // ========================================================================
  function updateAuthUI() {
    const isAuth = RDPAuth.isAuthenticated();

    if (isAuth) {
      const username = RDPAuth.getCurrentUser() || "RIKI SOLBIATI";
      if (adminAuthBtn) adminAuthBtn.style.display = "none";
      if (adminLoggedPill) adminLoggedPill.style.display = "inline-flex";
      if (adminLoggedName) adminLoggedName.textContent = `CREATOR: ${username}`;
      if (openUploadBtn) {
        openUploadBtn.style.display = "inline-flex";
        openUploadBtn.textContent = "+ CARICA MOCKUP [CREATOR]";
      }
      if (openCloudModalBtn) openCloudModalBtn.style.display = "inline-flex";
      if (exportArchiveBtn) exportArchiveBtn.style.display = "inline-flex";
      if (modalDownloadBtn) modalDownloadBtn.style.display = "inline-block";
      if (sysStatus) {
        sysStatus.textContent = "CREATOR_ONLINE [MANAGEMENT_ON]";
        sysStatus.classList.add("telemetry-cell__value--camo");
      }
    } else {
      if (adminAuthBtn) adminAuthBtn.style.display = "inline-flex";
      if (adminLoggedPill) adminLoggedPill.style.display = "none";
      if (openUploadBtn) {
        openUploadBtn.style.display = "none";
      }
      if (openCloudModalBtn) openCloudModalBtn.style.display = "inline-flex";
      if (exportArchiveBtn) exportArchiveBtn.style.display = "none";
      if (modalDownloadBtn) modalDownloadBtn.style.display = "none";
      if (sysStatus) {
        sysStatus.textContent = "VOTING_OPEN [0-10]";
      }
    }

    if (restoreDeletedBtn) {
      const deletedIds = RDPStorage.getDeletedItemIds();
      if (isAuth && deletedIds.length > 0) {
        restoreDeletedBtn.style.display = "inline-flex";
        restoreDeletedBtn.textContent = `[RIPRISTINA_ELIMINATI (${deletedIds.length})]`;
      } else {
        restoreDeletedBtn.style.display = "none";
      }
    }
  }

  function openAuthModal() {
    if (adminAuthModal) {
      authErrorMsg.hidden = true;
      authUsername.value = "";
      authPassword.value = "";
      adminAuthModal.hidden = false;
      document.body.style.overflow = "hidden";
      setTimeout(() => authUsername.focus(), 80);
    }
  }

  function closeAuthModal() {
    if (adminAuthModal) {
      adminAuthModal.hidden = true;
      document.body.style.overflow = "";
    }
  }

  function handleAuthSubmit(e) {
    e.preventDefault();
    const user = authUsername.value.trim();
    const pass = authPassword.value.trim();

    const result = RDPAuth.login(user, pass);
    if (result.success) {
      closeAuthModal();
      updateAuthUI();
      renderGrid();
      showToast(`ACCESSO ESEGUITO: BENVENUTO ${result.user} // UPLOAD & GESTIONE SBLOCCATI`);

      if (pendingOpenUpload) {
        pendingOpenUpload = false;
        openUploadModal();
      }
    } else {
      authErrorMsg.textContent = result.message;
      authErrorMsg.hidden = false;
    }
  }

  function handleLogout() {
    RDPAuth.logout();
    updateAuthUI();
    renderGrid();
    if (!uploadModal.hidden) closeUploadModal();
    if (!inspectionModal.hidden) {
      modalDeleteBtn.style.display = "none";
    }
    showToast("DISCONNESSIONE ESEGUITA // MODALITÀ OSPITE ATTIVA");
  }

  // ========================================================================
  // FILTERING, SORTING & COUNTS
  // ========================================================================
  function getFilteredAndSortedItems() {
    let items = allItems;
    if (activeCategory !== "ALL") {
      items = items.filter((item) => item.category === activeCategory);
    }

    const sorted = [...items];
    if (activeSortBy === "rating") {
      sorted.sort((a, b) => {
        const statsA = RDPRatings.getItemStats(a);
        const statsB = RDPRatings.getItemStats(b);
        return statsB.numericAverage - statsA.numericAverage;
      });
    } else if (activeSortBy === "votes") {
      sorted.sort((a, b) => {
        const statsA = RDPRatings.getItemStats(a);
        const statsB = RDPRatings.getItemStats(b);
        return statsB.totalVotes - statsA.totalVotes;
      });
    } else {
      // Default: archive code sequence
      sorted.sort((a, b) => a.code.localeCompare(b.code));
    }

    return sorted;
  }

  function updateCounts() {
    const visible = getFilteredAndSortedItems();
    if (fileCounter) {
      fileCounter.textContent = `${pad2(visible.length)} / ${pad2(allItems.length)}`;
    }

    const globalStats = RDPRatings.getGlobalStats(allItems);
    if (totalVotesCounter) {
      totalVotesCounter.textContent = String(globalStats.totalVotes);
    }
    if (totalGarmentsVal) {
      totalGarmentsVal.textContent = String(allItems.length);
    }
    if (totalPagesVal) {
      totalPagesVal.textContent = String(allItems.length * 2);
    }
    if (globalRatingVal) {
      globalRatingVal.textContent = `★ ${globalStats.globalAvg}`;
    }
    if (totalVotesVal) {
      totalVotesVal.textContent = String(globalStats.totalVotes);
    }
    const introGarmentCountVal = document.getElementById("introGarmentCountVal");
    if (introGarmentCountVal) {
      introGarmentCountVal.textContent = `${allItems.length} CAPI // ${allItems.length * 2} PAGINE HD`;
    }

    const categories = ["ALL", "HOODIES", "TEES", "PANTS", "ACCESSORIES"];
    categories.forEach((cat) => {
      const countEl = document.querySelector(`[data-count-for="${cat}"]`);
      if (!countEl) return;
      const count =
        cat === "ALL"
          ? allItems.length
          : allItems.filter((i) => i.category === cat).length;
      countEl.textContent = pad2(count);
    });
  }

  // ========================================================================
  // GRID RENDERING (SUPPORTING DUAL PAGES & 0-10 RATING CARDS)
  // ========================================================================
  function renderGrid() {
    if (RDPPhysics.getActiveState()) {
      disableAntigravity(true);
    }

    const items = getFilteredAndSortedItems();

    const dirNames = {
      ALL: "ALL_GARMENTS",
      HOODIES: "HOODIES_HEAVY",
      TEES: "TEES_JERSEY",
      PANTS: "PANTS_CARGO_DENIM",
      ACCESSORIES: "ACCESSORIES_SPEC"
    };
    activeDirLabel.textContent = dirNames[activeCategory] || activeCategory;

    if (items.length === 0) {
      archiveGrid.innerHTML = "";
      const emptyEl = document.createElement("div");
      emptyEl.style.gridColumn = "1 / -1";
      emptyEl.style.padding = "64px 20px";
      emptyEl.style.textAlign = "center";
      emptyEl.style.fontSize = "12px";
      emptyEl.style.color = "var(--muted)";
      emptyEl.textContent = "NESSUN CAPO TROVATO IN QUESTA CATEGORIA";
      archiveGrid.appendChild(emptyEl);
      return;
    }

    // Costruisci l'elenco dei target da visualizzare nella griglia
    const targets = [];
    if (globalPageMode === "split_dual") {
      items.forEach((item) => {
        targets.push({ item, page: "front", label: "P.01 // DAVANTI" });
        if (item.images && item.images.back) {
          targets.push({ item, page: "back", label: "P.02 // RETRO" });
        }
      });
    } else {
      items.forEach((item) => {
        let page = "front";
        if (globalPageMode === "back_only" && item.images && item.images.back) {
          page = "back";
        } else if (globalPageMode === "front_only") {
          page = "front";
        } else {
          page = cardPageStates[item.id] || "front";
        }
        targets.push({ item, page, label: null });
      });
    }

    // Mappa gli slot DOM già presenti per chiave univoca: se esistono già,
    // riutilizziamo i nodi DOM senza toccare i tag <img> ed evitando qualsiasi sfarfallio
    const existingSlotsMap = new Map();
    Array.from(archiveGrid.children).forEach((child) => {
      const key = child.dataset ? child.dataset.slotKey : null;
      if (key) {
        existingSlotsMap.set(key, child);
      }
    });

    const activeKeys = new Set();
    const orderedSlots = [];

    targets.forEach((target) => {
      const key = `${target.item.id}_${target.page}_${target.label || "single"}`;
      activeKeys.add(key);

      let slot = existingSlotsMap.get(key);
      if (slot) {
        updateExistingCardSlot(slot, target.item, target.page, target.label);
      } else {
        slot = createCardSlotElement(target.item, target.page, target.label);
      }
      orderedSlots.push(slot);
    });

    // Rimuovi eventuali slot obsoleti non più presenti
    existingSlotsMap.forEach((slot, key) => {
      if (!activeKeys.has(key)) {
        slot.remove();
      }
    });

    // Rimuovi eventuali nodi residui (es. messaggio di archivio vuoto)
    Array.from(archiveGrid.children).forEach((child) => {
      if (!child.classList.contains("archive-card-slot")) {
        child.remove();
      }
    });

    // Sincronizza l'ordine visivo senza ricreare il DOM
    orderedSlots.forEach((slot, index) => {
      if (archiveGrid.children[index] !== slot) {
        archiveGrid.insertBefore(slot, archiveGrid.children[index] || null);
      }
    });
  }

  // Crea un nuovo slot scheda con tutti i controlli interattivi
  function createCardSlotElement(item, activePage, fixedPageLabel = null) {
    const slot = document.createElement("div");
    slot.className = "archive-card-slot";
    const slotKey = `${item.id}_${activePage}_${fixedPageLabel || "single"}`;
    slot.dataset.slotKey = slotKey;

    const slotDisplayCode = fixedPageLabel
      ? `${item.code} [${activePage === "front" ? "01" : "02"}]`
      : item.code;
    slot.dataset.slotCode = slotDisplayCode;

    const card = document.createElement("article");
    card.className = "archive-card";
    card.tabIndex = 0;
    card.dataset.itemId = item.id;
    card.dataset.activePage = activePage;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `${item.code} ${item.title} - ${activePage === "front" ? "Pagina Davanti" : "Pagina Retro"}`
    );

    const hasBack = Boolean(item.images && item.images.back);
    const imgSrc = activePage === "back" && hasBack ? item.images.back : (item.images ? item.images.front : "");

    let headerPageControls = "";
    if (!fixedPageLabel && hasBack && globalPageMode === "interactive") {
      headerPageControls = `
        <div class="archive-card__page-switch" role="group" aria-label="Cambia vista pagina">
          <button
            class="card-page-btn ${activePage === "front" ? "is-active" : ""}"
            data-switch-to="front"
            type="button"
            title="Mostra Davanti"
          >
            01 FRONTE
          </button>
          <button
            class="card-page-btn ${activePage === "back" ? "is-active" : ""}"
            data-switch-to="back"
            type="button"
            title="Mostra Retro"
          >
            02 RETRO
          </button>
        </div>
      `;
    }

    const pageBadgeText = fixedPageLabel
      ? fixedPageLabel
      : activePage === "front"
      ? "P.01 // DAVANTI"
      : "P.02 // RETRO";

    const stats = RDPRatings.getItemStats(item);
    const userVote = stats.userVote;

    // Pulsanti voto rapido 0..10 segmentati
    let quickVoteButtonsHtml = "";
    for (let i = 0; i <= 10; i++) {
      const isSelected = userVote === i;
      quickVoteButtonsHtml += `
        <button
          class="quick-vote-btn ${isSelected ? "is-voted" : ""}"
          data-quick-vote="${i}"
          type="button"
          title="Vota ${i}/10 per ${escapeAttr(item.code)}"
          aria-label="Vota ${i} su 10"
        >
          ${i}
        </button>
      `;
    }

    const isCreator = RDPAuth.isAuthenticated();
    const quickDeleteHtml = isCreator
      ? `<button class="card-delete-quick-btn" data-delete-id="${escapeAttr(item.id)}" type="button" title="Rimuovi ${escapeAttr(item.code)} dall'archivio">[✕ ELIMINA]</button>`
      : "";

    const creatorBadgeHtml = item.isCreatorUpload
      ? `<span class="archive-card__creator-badge">[CREATOR_DROP]</span>`
      : "";

    const ratingBadgeText = stats.hasVoted
      ? `★ ${stats.average} (TUO: ${stats.userVote}★)`
      : `★ ${stats.average} (${stats.totalVotes} VOTI)`;

    const voteRowLabel = stats.hasVoted
      ? `TUO VOTO: ★ ${stats.userVote}/10 ✓`
      : "VOTA QUESTO CAPO (0-10):";

    card.innerHTML = `
      <div class="archive-card__head">
        <div class="archive-card__head-left">
          <span class="archive-card__code">${escapeHtml(item.code)}</span>
          ${creatorBadgeHtml}
        </div>
        <div class="archive-card__head-right">
          ${quickDeleteHtml}
          ${headerPageControls}
        </div>
      </div>
      <div class="archive-card__media">
        <span class="archive-card__rating-badge ${stats.hasVoted ? "has-user-vote" : ""}">
          ${escapeHtml(ratingBadgeText)}
        </span>
        <img
          class="archive-card__img"
          src="${escapeAttr(imgSrc)}"
          alt="${escapeAttr(item.title)} (${pageBadgeText})"
          loading="lazy"
        />
        <span class="archive-card__inspect-hint">[ISPEZIONA HD ↗]</span>
      </div>
      <div class="archive-card__foot">
        <div class="archive-card__title-row">
          <h2 class="archive-card__title">${escapeHtml(item.title)}</h2>
        </div>
        <div class="archive-card__meta">
          <span>${escapeHtml(item.gsm)} // ${escapeHtml(item.fit)}</span>
          <span class="archive-card__cat-pill">${escapeHtml(item.category)}</span>
        </div>
        <div class="archive-card__vote-row" title="Vota da 0 a 10 per ${escapeAttr(item.code)}">
          <div class="archive-card__vote-head">
            <span class="archive-card__vote-label">${escapeHtml(voteRowLabel)}</span>
            <span class="archive-card__inspect-trigger">[SCHEDA TECNICA ↗]</span>
          </div>
          <div class="archive-card__vote-btns" role="group" aria-label="Vota ${escapeAttr(item.code)} da 0 a 10">
            ${quickVoteButtonsHtml}
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", async (e) => {
      if (RDPPhysics.getActiveState()) return;

      const currentItemId = card.dataset.itemId;
      const currentActivePage = card.dataset.activePage || "front";
      const currentItem = allItems.find((i) => i.id === currentItemId);

      // Gestione eliminazione rapida da parte del Creator
      const quickDeleteBtn = e.target.closest(".card-delete-quick-btn");
      if (quickDeleteBtn) {
        e.stopPropagation();
        if (!quickDeleteBtn.classList.contains("is-armed")) {
          document.querySelectorAll(".card-delete-quick-btn.is-armed").forEach((b) => {
            b.classList.remove("is-armed");
            b.textContent = "[✕ ELIMINA]";
          });
          quickDeleteBtn.classList.add("is-armed");
          quickDeleteBtn.textContent = "[CONFERMI?]";
          window.setTimeout(() => {
            quickDeleteBtn.classList.remove("is-armed");
            quickDeleteBtn.textContent = "[✕ ELIMINA]";
          }, 3500);
          return;
        }

        await removeItemFromArchive(currentItemId, currentItem ? currentItem.code : "");
        return;
      }

      // Gestione voto rapido 0-10
      const quickVoteBtn = e.target.closest(".quick-vote-btn");
      if (quickVoteBtn) {
        e.stopPropagation();
        const score = Number(quickVoteBtn.dataset.quickVote);
        registerVote(currentItemId, score);
        return;
      }

      // Gestione cambio pagina davanti / retro
      const switchBtn = e.target.closest(".card-page-btn");
      if (switchBtn) {
        e.stopPropagation();
        const targetPage = switchBtn.dataset.switchTo;
        cardPageStates[currentItemId] = targetPage;
        renderGrid();
        return;
      }

      // Apertura Lightbox / Ispezione dettagliata capo
      openInspectionModal(currentItemId, currentActivePage);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (
          e.target.closest(".quick-vote-btn") ||
          e.target.closest(".card-page-btn") ||
          e.target.closest(".card-delete-quick-btn")
        ) {
          return;
        }
        e.preventDefault();
        const currentItemId = card.dataset.itemId;
        const currentActivePage = card.dataset.activePage || "front";
        openInspectionModal(currentItemId, currentActivePage);
      }
    });

    slot.appendChild(card);
    return slot;
  }

  // Aggiorna uno slot esistente sul posto senza distruggere il tag <img> per azzerare lo sfarfallio
  function updateExistingCardSlot(slot, item, activePage, fixedPageLabel = null) {
    const card = slot.querySelector(".archive-card");
    if (!card) return;

    card.dataset.itemId = item.id;
    card.dataset.activePage = activePage;

    const slotDisplayCode = fixedPageLabel
      ? `${item.code} [${activePage === "front" ? "01" : "02"}]`
      : item.code;
    slot.dataset.slotCode = slotDisplayCode;

    card.setAttribute(
      "aria-label",
      `${item.code} ${item.title} - ${activePage === "front" ? "Pagina Davanti" : "Pagina Retro"}`
    );

    // Codice capo
    const codeEl = card.querySelector(".archive-card__code");
    if (codeEl && codeEl.textContent !== item.code) {
      codeEl.textContent = item.code;
    }

    // Titolo
    const titleEl = card.querySelector(".archive-card__title");
    if (titleEl && titleEl.textContent !== item.title) {
      titleEl.textContent = item.title;
    }

    // Meta & category
    const metaEl = card.querySelector(".archive-card__meta");
    if (metaEl) {
      metaEl.innerHTML = `<span>${escapeHtml(item.gsm)} // ${escapeHtml(item.fit)}</span><span class="archive-card__cat-pill">${escapeHtml(item.category)}</span>`;
    }

    // Indicatore pagina
    const pageBadgeText = fixedPageLabel
      ? fixedPageLabel
      : activePage === "front"
      ? "P.01 // DAVANTI"
      : "P.02 // RETRO";

    // Immagine: AGGIORNA SOLO SE CAMBIATA per impedire flicker/ricaricamento browser!
    const hasBack = Boolean(item.images && item.images.back);
    const imgSrc = activePage === "back" && hasBack ? item.images.back : (item.images ? item.images.front : "");
    const imgEl = card.querySelector(".archive-card__img");
    if (imgEl) {
      if (imgEl.getAttribute("src") !== imgSrc) {
        imgEl.src = imgSrc;
      }
      imgEl.alt = `${item.title} (${pageBadgeText})`;
    }

    // Badge Creator Drop
    let creatorBadge = card.querySelector(".archive-card__creator-badge");
    if (item.isCreatorUpload) {
      if (!creatorBadge) {
        const headLeft = card.querySelector(".archive-card__head-left") || card.querySelector(".archive-card__head");
        if (headLeft) {
          const badge = document.createElement("span");
          badge.className = "archive-card__creator-badge";
          badge.textContent = "[CREATOR_DROP]";
          headLeft.appendChild(badge);
        }
      }
    } else if (creatorBadge) {
      creatorBadge.remove();
    }

    // Pulsante eliminazione rapida per Creator
    const isCreator = RDPAuth.isAuthenticated();
    const headRight = card.querySelector(".archive-card__head-right") || card.querySelector(".archive-card__head");
    let deleteBtn = card.querySelector(".card-delete-quick-btn");
    if (isCreator) {
      if (!deleteBtn && headRight) {
        deleteBtn = document.createElement("button");
        deleteBtn.className = "card-delete-quick-btn";
        deleteBtn.dataset.deleteId = item.id;
        deleteBtn.type = "button";
        deleteBtn.title = `Rimuovi ${item.code} dall'archivio`;
        deleteBtn.textContent = "[✕ ELIMINA]";
        headRight.prepend(deleteBtn);
      } else if (deleteBtn) {
        deleteBtn.dataset.deleteId = item.id;
      }
    } else if (deleteBtn) {
      deleteBtn.remove();
    }

    // Pulsanti switch davanti/retro
    const p1Btn = card.querySelector(".card-page-btn[data-switch-to='front']");
    const p2Btn = card.querySelector(".card-page-btn[data-switch-to='back']");
    if (p1Btn) p1Btn.classList.toggle("is-active", activePage === "front");
    if (p2Btn) p2Btn.classList.toggle("is-active", activePage === "back");

    // Voti e statistiche
    const stats = RDPRatings.getItemStats(item);
    const ratingBadge = card.querySelector(".archive-card__rating-badge");
    if (ratingBadge) {
      const badgeText = stats.hasVoted
        ? `★ ${stats.average} (TUO: ${stats.userVote}★)`
        : `★ ${stats.average} (${stats.totalVotes} VOTI)`;
      if (ratingBadge.textContent !== badgeText) {
        ratingBadge.textContent = badgeText;
      }
      ratingBadge.classList.toggle("has-user-vote", Boolean(stats.hasVoted));
    }

    const voteLabel = card.querySelector(".archive-card__vote-label");
    if (voteLabel) {
      voteLabel.textContent = stats.hasVoted
        ? `TUO VOTO: ★ ${stats.userVote}/10 ✓`
        : "VOTA QUESTO CAPO (0-10):";
    }

    const voteBtns = card.querySelectorAll(".quick-vote-btn");
    voteBtns.forEach((btn) => {
      const val = Number(btn.dataset.quickVote);
      btn.classList.toggle("is-voted", stats.userVote === val);
    });
  }

  // ========================================================================
  // VOTING SYSTEM INTERACTION (0 TO 10)
  // ========================================================================
  function registerVote(itemId, score) {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    // Registrazione obbligatoria (Nome e Cognome) prima di votare
    if (!RDPVoter.isRegistered()) {
      pendingVote = { itemId, score };
      openVoterModal();
      showToast("REGISTRA LA TUA IDENTITÀ (NOME E COGNOME) PER VOTARE");
      return;
    }

    RDPRatings.setRating(itemId, score);
    updateCounts();

    if (!inspectionModal.hidden && activeModalItemId === itemId) {
      updateModalVotingTerminal(item);
    }

    renderGrid();
    updateBallotSummary();
    showToast(`VOTO ${score}/10 REGISTRATO PER ${item.code}`);
  }

  function handleResetUserVotes() {
    RDPRatings.clearAllUserVotes();
    updateCounts();
    if (!inspectionModal.hidden && activeModalItemId) {
      const currentItem = allItems.find((i) => i.id === activeModalItemId);
      if (currentItem) updateModalVotingTerminal(currentItem);
    }
    renderGrid();
    updateBallotSummary();
    showToast("TUTTI I TUOI VOTI PERSONALI SONO STATI AZZERATI");
  }

  // ========================================================================
  // LIGHTBOX / TECHNICAL SPEC MODAL & MODAL VOTING TERMINAL
  // ========================================================================
  function openInspectionModal(itemId, initialPage = "front") {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    activeModalItemId = itemId;
    activeModalView = initialPage === "back" && item.images && item.images.back ? "back" : "front";
    resetDeleteArmed();
    resetZoom();
    renderInspectionModal(item);
    if (inspectionModal) {
      inspectionModal.hidden = false;
      document.body.style.overflow = "hidden";
    }
  }

  function closeInspectionModal() {
    if (inspectionModal) {
      inspectionModal.hidden = true;
      document.body.style.overflow = "";
    }
    activeModalItemId = null;
    resetDeleteArmed();
    resetZoom();
  }

  function toggleModalPage() {
    const item = allItems.find((i) => i.id === activeModalItemId);
    if (!item || !item.images || !item.images.back) return;
    activeModalView = activeModalView === "front" ? "back" : "front";
    resetZoom();
    renderInspectionModal(item);
  }

  function renderInspectionModal(item) {
    const visible = getFilteredAndSortedItems();
    const indexInVisible = Math.max(
      0,
      visible.findIndex((i) => i.id === item.id)
    );

    if (modalCode) modalCode.textContent = item.code;
    if (modalBadge) modalBadge.textContent = item.statusBadge || "ARCHIVE SPEC";
    if (modalCategory) modalCategory.textContent = item.category;
    if (modalTitle) modalTitle.textContent = item.title;

    if (specFit) specFit.textContent = item.fit || "--";
    if (specGsm) specGsm.textContent = item.gsm || "--";
    if (specFabric) specFabric.textContent = item.fabric || "100% HEAVYWEIGHT COMBED COTTON";
    if (specColorway) specColorway.textContent = item.colorway || "ARCHIVE STANDARD";
    if (specPattern) specPattern.textContent = item.patternRef || `PAT-${item.code}`;
    if (specConstruction) specConstruction.textContent = item.construction || "STANDARD INDUSTRIAL STITCH";
    if (specBatch) specBatch.textContent = item.batch || "OFFICIAL ARCHIVE SPEC";

    const isBack = activeModalView === "back";
    if (modalPageIndicator) {
      modalPageIndicator.textContent = isBack
        ? "PAGINA 02 DI 02 [RETRO]"
        : "PAGINA 01 DI 02 [DAVANTI]";
    }

    if (pageNotesTag) {
      pageNotesTag.textContent = isBack
        ? "PAGINA 02 NOTE (RETRO):"
        : "PAGINA 01 NOTE (DAVANTI):";
    }

    if (pageNotesBody) {
      pageNotesBody.textContent = isBack
        ? (item.backNotes || "VISTA DORSALE STANDARDIZZATA AD ALTA DEFINIZIONE (1400×1400PX // ~94% FILL).")
        : (item.frontNotes || "VISTA FRONTALE STANDARDIZZATA AD ALTA DEFINIZIONE (1400×1400PX // ~94% FILL).");
    }

    if (specNotesHeader) {
      specNotesHeader.textContent = isBack
        ? "NOTE VISTA RETRO // ATELIER_LOG"
        : "NOTE VISTA DAVANTI // ATELIER_LOG";
    }

    if (specNotes) {
      specNotes.textContent =
        item.notes ||
        item.frontNotes ||
        "CAPO UFFICIALE ARCHIVIO RAGAZZI DI PROVINCIA // STANDARDIZZATO AD ALTA RISOLUZIONE.";
    }

    const hasBack = Boolean(item.images && item.images.back);
    if (viewBackBtn) viewBackBtn.disabled = !hasBack;
    if (modalFlipPageBtn) modalFlipPageBtn.disabled = !hasBack;
    if (!hasBack && activeModalView === "back") {
      activeModalView = "front";
    }

    // Delete & Download buttons: visible EXCLUSIVELY to authenticated Creator!
    const isCreator = RDPAuth.isAuthenticated();
    if (modalDeleteBtn) {
      modalDeleteBtn.style.display = isCreator ? "inline-block" : "none";
      modalDeleteBtn.textContent = "[ELIMINA_CAPO]";
      modalDeleteBtn.classList.remove("is-armed");
    }
    if (modalDownloadBtn) {
      modalDownloadBtn.style.display = isCreator ? "inline-block" : "none";
    }

    updateModalViewImage(item);
    updateModalVotingTerminal(item);
    if (modalIndexLabel) {
      modalIndexLabel.textContent = `${pad2(indexInVisible + 1)} / ${pad2(visible.length)}`;
    }
  }

  function updateModalVotingTerminal(item) {
    const stats = RDPRatings.getItemStats(item);

    if (modalRatingScore) {
      modalRatingScore.textContent = `★ ${stats.average} / 10`;
    }
    if (modalVoteCount) {
      modalVoteCount.textContent = `${stats.totalVotes} VOTI ESPRESSI`;
    }
    if (modalUserVoteStatus) {
      modalUserVoteStatus.textContent = stats.hasVoted
        ? `TUO VOTO: ${stats.userVote} / 10`
        : "TUO VOTO: NON ESPRESSO";
    }
    if (modalMeterFill) {
      const pct = Math.max(0, Math.min(100, (stats.numericAverage / 10) * 100));
      modalMeterFill.style.width = `${pct.toFixed(1)}%`;
    }

    if (modalVoteButtons) {
      modalVoteButtons.forEach((btn) => {
        const btnScore = Number(btn.dataset.vote);
        btn.classList.toggle("is-active", stats.hasVoted && stats.userVote === btnScore);
      });
    }
  }

  function updateModalViewImage(item) {
    const src =
      activeModalView === "back" && item.images && item.images.back
        ? item.images.back
        : (item.images ? item.images.front : "");

    if (modalImage) {
      modalImage.src = src;
      modalImage.alt = `${item.title} — ${activeModalView === "front" ? "Pagina 01 Davanti" : "Pagina 02 Retro"}`;
    }

    if (viewFrontBtn) viewFrontBtn.classList.toggle("is-active", activeModalView === "front");
    if (viewBackBtn) viewBackBtn.classList.toggle("is-active", activeModalView === "back");
    if (modalViewLabel) {
      modalViewLabel.textContent =
        activeModalView === "front"
          ? "PAGINA 01 DI 02: VISTA DAVANTI (FRONT)"
          : "PAGINA 02 DI 02: VISTA RETRO (BACK)";
    }

    if (modalAssetPath) {
      const isDataUrl = src && src.startsWith("data:");
      modalAssetPath.textContent = isDataUrl
        ? `SRC: CREATOR_INGESTION://${item.code}_${activeModalView.toUpperCase()} [1400×1400 HD]`
        : `SRC: /${src ? src.toUpperCase() : "IMG"} [1400×1400 HD]`;
    }
  }

  function resetZoom() {
    isZoomed = false;
    if (modalStage) modalStage.classList.remove("is-zoomed");
    if (modalImage) modalImage.style.transformOrigin = "center center";
    if (zoomIndicator) zoomIndicator.textContent = "ZOOM: 1.0X";
  }

  function toggleZoom(e) {
    isZoomed = !isZoomed;
    if (modalStage) modalStage.classList.toggle("is-zoomed", isZoomed);
    if (zoomIndicator) zoomIndicator.textContent = isZoomed ? "ZOOM: 2.5X" : "ZOOM: 1.0X";

    if (isZoomed && e) {
      updateZoomPan(e);
    } else {
      if (modalImage) modalImage.style.transformOrigin = "center center";
    }
  }

  function updateZoomPan(e) {
    if (!isZoomed || !modalStage || !modalImage) return;
    const rect = modalStage.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    modalImage.style.transformOrigin = `${xPct.toFixed(1)}% ${yPct.toFixed(1)}%`;
  }

  function navigateModal(delta) {
    const visible = getFilteredAndSortedItems();
    if (visible.length === 0 || !activeModalItemId) return;
    const idx = visible.findIndex((i) => i.id === activeModalItemId);
    const nextIdx = (idx + delta + visible.length) % visible.length;
    activeModalItemId = visible[nextIdx].id;

    const nextItem = visible[nextIdx];
    if (activeModalView === "back" && (!nextItem.images || !nextItem.images.back)) {
      activeModalView = "front";
    }
    resetDeleteArmed();
    resetZoom();
    renderInspectionModal(nextItem);
  }

  function handleDownloadCurrentImage() {
    if (!RDPAuth.isAuthenticated()) {
      showToast("DOWNLOAD BLOCCATO: ACCEDI CON L'ACCOUNT CREATOR PER SCARICARE");
      openAuthModal();
      return;
    }
    const item = allItems.find((i) => i.id === activeModalItemId);
    if (!item) return;
    const src =
      activeModalView === "back" && item.images.back
        ? item.images.back
        : item.images.front;

    const ext = src.endsWith(".png") ? "png" : src.includes("image/png") ? "png" : "jpg";
    const link = document.createElement("a");
    link.href = src;
    link.download = `${item.code.toLowerCase()}-${activeModalView === "front" ? "davanti" : "retro"}-hd.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`DOWNLOAD AVVIATO // ${item.code}`);
  }

  function resetDeleteArmed() {
    if (!modalDeleteBtn) return;
    window.clearTimeout(deleteConfirmTimer);
    modalDeleteBtn.classList.remove("is-armed");
    modalDeleteBtn.textContent = "[ELIMINA_CAPO]";
  }

  async function handleDeleteCurrentItem() {
    if (!RDPAuth.isAuthenticated()) {
      showToast("ACCESSO RICHIESTO: ACCEDI PER ELIMINARE CAPI DALL'ARCHIVIO");
      openAuthModal();
      return;
    }
    const item = allItems.find((i) => i.id === activeModalItemId);
    if (!item) return;

    if (!modalDeleteBtn.classList.contains("is-armed")) {
      modalDeleteBtn.classList.add("is-armed");
      modalDeleteBtn.textContent = "[CONFERMI ELIMINAZIONE?]";
      deleteConfirmTimer = window.setTimeout(resetDeleteArmed, 3500);
      return;
    }

    closeInspectionModal();
    await removeItemFromArchive(item.id, item.code);
  }

  async function removeItemFromArchive(itemId, itemCode) {
    if (!RDPAuth.isAuthenticated()) {
      showToast("ACCESSO RICHIESTO PER ELIMINARE CAPI DALL'ARCHIVIO");
      openAuthModal();
      return;
    }
    const res = await RDPCloud.deleteGarment(itemId);
    switchMainView("showcase");
    await reloadArchiveData();
    if (res && res.syncedToCloud) {
      showToast(`✓ CAPO ${itemCode || ""} ELIMINATO E SINCRONIZZATO NEL CLOUD!`);
    } else {
      showToast(`⚠ CAPO ${itemCode || ""} RIMOSSO IN LOCALE (DATABASE NON CREATO SU FIREBASE)`);
    }
  }

  // ========================================================================
  // CREATOR UPLOAD & CANVAS IMAGE PROCESSING PIPELINE
  // ========================================================================
  function openUploadModal(preloadedFiles = null) {
    if (!RDPAuth.isAuthenticated()) {
      showToast("ACCESSO RICHIESTO: ACCEDI CON IL TUO ACCOUNT PER CARICARE");
      openAuthModal();
      return;
    }

    if (RDPPhysics.getActiveState()) {
      disableAntigravity(true);
    }

    resetUploadForm();
    uploadNextCode.textContent = formatArchiveCode(allItems.length + 1);
    uploadModal.hidden = false;
    document.body.style.overflow = "hidden";

    if (preloadedFiles && preloadedFiles.length > 0) {
      handleDroppedFiles(preloadedFiles);
    }
  }

  function closeUploadModal() {
    uploadModal.hidden = true;
    document.body.style.overflow = "";
  }

  function resetUploadForm() {
    if (uploadForm) uploadForm.reset();
    draftFrontFile = null;
    draftBackFile = null;
    draftFrontResult = null;
    draftBackResult = null;
    if (frontFileName) frontFileName.textContent = "TOCCA PER SELEZIONARE O SCATTARE FOTO";
    if (backFileName) backFileName.textContent = "TOCCA PER SELEZIONARE O SCATTARE FOTO";
    if (frontDropzone) frontDropzone.classList.remove("has-file");
    if (backDropzone) backDropzone.classList.remove("has-file");

    if (processedPreviewImg) {
      processedPreviewImg.hidden = true;
      processedPreviewImg.src = "";
    }
    if (processorCanvasWrapper) {
      processorCanvasWrapper.hidden = true;
    }
    if (processorPlaceholder) {
      processorPlaceholder.hidden = false;
    }

    if (processorTelemetry) {
      processorTelemetry.innerHTML = `
        <span>ORIG: --</span>
        <span>CROP: --</span>
        <span>OUT: 1400×1400 (6% PAD)</span>
        <span>BG: --</span>
        <span>TIME: --</span>
      `;
    }
    if (uploadErrorMsg) uploadErrorMsg.hidden = true;
    if (uploadSubmitBtn) uploadSubmitBtn.disabled = true;
  }

  function isValidImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) return true;
    return /\.(png|jpe?g|webp|heic|heif|avif|bmp)$/i.test(file.name || "");
  }

  async function handleDroppedFiles(fileList) {
    const validImages = Array.from(fileList).filter(isValidImageFile);
    if (validImages.length === 0) {
      showUploadError("FORMATO NON SUPPORTATO. USA IMMAGINI PNG, JPG O WEBP.");
      return;
    }

    await setFrontFile(validImages[0]);
    if (validImages[1]) {
      await setBackFile(validImages[1]);
    }
  }

  async function setFrontFile(file) {
    if (!isValidImageFile(file)) {
      showUploadError("IMMAGINE FRONT NON VALIDA. USA PNG, JPG O WEBP.");
      return;
    }

    draftFrontFile = file;
    frontFileName.textContent = file.name.toUpperCase();
    frontDropzone.classList.add("has-file");

    if (!inputTitle.value.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim()
        .toUpperCase();
      inputTitle.value = cleanName;
    }

    await runCanvasProcessing();
  }

  async function setBackFile(file) {
    if (!isValidImageFile(file)) {
      showUploadError("IMMAGINE BACK NON VALIDA. USA PNG, JPG O WEBP.");
      return;
    }
    draftBackFile = file;
    backFileName.textContent = file.name.toUpperCase();
    backDropzone.classList.add("has-file");
    await runCanvasProcessing();
  }

  async function runCanvasProcessing() {
    if (!draftFrontFile) return;

    isProcessingImage = true;
    if (uploadSubmitBtn) uploadSubmitBtn.disabled = true;
    if (uploadErrorMsg) uploadErrorMsg.hidden = true;

    const options = {
      bgNormalize: optBgClean ? optBgClean.checked : true,
      studioEnhance: optEnhance ? optEnhance.checked : true,
      transparentBg: false,
      bgTolerance: 28,
      paddingPct: 0.06 // 6% padding for ~94% fill
    };

    try {
      draftFrontResult = await RDPImageProcessor.processGarmentFile(draftFrontFile, options);

      if (processedPreviewImg) {
        processedPreviewImg.src = draftFrontResult.processedDataUrl;
        processedPreviewImg.hidden = false;
      }
      if (processorCanvasWrapper) {
        processorCanvasWrapper.hidden = false;
      }
      if (processorPlaceholder) {
        processorPlaceholder.hidden = true;
      }

      if (draftBackFile) {
        draftBackResult = await RDPImageProcessor.processGarmentFile(draftBackFile, options);
      } else {
        draftBackResult = null;
      }

      const t = draftFrontResult.telemetry;
      if (processorTelemetry) {
        processorTelemetry.innerHTML = `
          <span>ORIG: ${t.originalSize}</span>
          <span>CROP: ${t.cropBox}</span>
          <span>OUT: ${t.outputSize} (${t.padding} PAD)</span>
          <span>BG: ${t.bgMode} (${t.bgNormalizedPct})</span>
          <span>TIME: ${t.processingMs}</span>
        `;
      }
      if (uploadSubmitBtn) uploadSubmitBtn.disabled = false;
    } catch (err) {
      showUploadError(err.message || "ERRORE DURANTE OTTIMIZZAZIONE CANVAS.");
    } finally {
      isProcessingImage = false;
    }
  }

  function showUploadError(msg) {
    uploadErrorMsg.textContent = msg;
    uploadErrorMsg.hidden = false;
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!RDPAuth.isAuthenticated()) {
      showUploadError("ACCESSO SCADUTO O NON VALIDO. EFFETTUA IL LOGIN.");
      return;
    }

    if (isProcessingImage || !draftFrontResult) {
      showUploadError("ATTENDI L'ELABORAZIONE O CARICA UN'IMMAGINE VALIDA.");
      return;
    }

    const title = inputTitle.value.trim().toUpperCase() || `MOCKUP ${formatArchiveCode(allItems.length + 1)}`;
    const category = inputCategory.value || "TEES";
    let gsm = inputGsm.value.trim().toUpperCase() || "450 GSM";
    const fit = inputFit.value.trim().toUpperCase() || "OVERSIZED BOXY";

    if (/^\d+$/.test(gsm)) {
      gsm = `${gsm} GSM`;
    }

    const statusBadge = inputBadge.value.trim().toUpperCase() || "CREATOR ARCHIVE";
    const fabric = inputFabric.value.trim().toUpperCase() || "100% HEAVYWEIGHT COTTON";
    const colorway = inputColorway.value.trim().toUpperCase() || "STUDIO SPEC";
    const notes =
      inputNotes.value.trim().toUpperCase() ||
      "MOCKUP CARICATO DAL CREATORE E STANDARDIZZATO AD ALTA RISOLUZIONE (1400×1400PX // CANVAS ENGINE).";

    const newItem = {
      id: `rdp-creator-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: formatArchiveCode(allItems.length + 1),
      title,
      category,
      season: "SS26 // CREATOR DROP",
      statusBadge,
      fit,
      gsm,
      fabric,
      colorway,
      patternRef: `PAT-CR-${String(userItems.length + 1).padStart(2, "0")}`,
      construction: "CANVAS_AUTO_PROCESSED // 1400×1400PX HD",
      batch: "CREATOR ARCHIVE SPEC",
      initialRating: 10.0,
      initialVotes: 1,
      isCreatorUpload: true,
      frontNotes: `VISTA FRONTALE (PAGINA 01): ${notes}`,
      backNotes: draftBackResult
        ? `VISTA DORSALE (PAGINA 02): DETTAGLI POSTERIORI E COSTRUZIONE TESSUTO.`
        : null,
      notes,
      createdAt: Date.now(),
      images: {
        front: draftFrontResult.processedDataUrl,
        back: draftBackResult ? draftBackResult.processedDataUrl : null
      }
    };

    try {
      const res = await RDPCloud.saveGarment(newItem);
      closeUploadModal();
      switchMainView("showcase");
      await reloadArchiveData();
      if (res && res.syncedToCloud) {
        showToast(`✓ CAPO ${newItem.code} AGGIUNTO E SINCRONIZZATO NEL CLOUD!`);
      } else {
        showToast(`⚠ CAPO ${newItem.code} SALVATO IN LOCALE MA NON NEL CLOUD (${res && res.error ? res.error : "DATABASE NON CREATO"}). APRI [CLOUD SYNC]!`);
      }
    } catch (_err) {
      showUploadError("ERRORE SALVATAGGIO CAPO.");
    }
  }

  // ========================================================================
  // ANTIGRAVITY MODE CONTROLS
  // ========================================================================
  function toggleAntigravity() {
    if (RDPPhysics.getActiveState()) {
      disableAntigravity(false);
    } else {
      enableAntigravity();
    }
  }

  function enableAntigravity() {
    const cards = archiveGrid.querySelectorAll(".archive-card");
    if (cards.length === 0) return;

    RDPPhysics.enable(cards, (itemId) => {
      const card = archiveGrid.querySelector(`.archive-card[data-item-id="${itemId}"]`);
      const initialPage = card ? card.dataset.activePage || "front" : "front";
      openInspectionModal(itemId, initialPage);
    });
    antigravityToggle.classList.add("is-active");
    antigravityToggle.setAttribute("aria-pressed", "true");
    antigravityState.textContent = "[ON]";
    if (sysStatus) sysStatus.textContent = "ZERO_G_PHYSICS";
    physicsHud.hidden = false;
  }

  function disableAntigravity(immediate = false) {
    RDPPhysics.disable(immediate);
    antigravityToggle.classList.remove("is-active");
    antigravityToggle.setAttribute("aria-pressed", "false");
    antigravityState.textContent = "[OFF]";
    updateAuthUI();
    physicsHud.hidden = true;
  }

  // ========================================================================
  // EXPORT ARCHIVE
  // ========================================================================
  function handleExportArchive() {
    if (!RDPAuth.isAuthenticated()) {
      showToast("DOWNLOAD BLOCCATO: ACCEDI CON L'ACCOUNT CREATOR PER ESPORTARE");
      openAuthModal();
      return;
    }
    const payload = {
      brand: "RDP // RAGAZZI DI PROVINCIA",
      edition: "DROP 04 OFFICIAL SHOWCASE & COMMUNITY RATINGS",
      exportedAt: new Date().toISOString(),
      creatorSession: RDPAuth.isAuthenticated() ? RDPAuth.getCurrentUser() : "PUBLIC_GUEST",
      totalGarments: allItems.length,
      globalCommunityRating: RDPRatings.getGlobalStats(allItems),
      garments: allItems.map((item) => ({
        ...item,
        ratings: RDPRatings.getItemStats(item)
      }))
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);

    const a = document.createElement("a");
    a.href = url;
    a.download = `rdp-catalog-export-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`CATALOGO ESPORTATO (${allItems.length} CAPI // 22+ PAGINE HD)`);
  }

  // ========================================================================
  // EVENT BINDINGS & GLOBAL LISTENERS
  // ========================================================================
  function bindEvents() {
    // Utility Menu Popover Toggle
    const utilityMenuToggle = document.getElementById("utilityMenuToggle");
    const utilityMenuPopover = document.getElementById("utilityMenuPopover");
    if (utilityMenuToggle && utilityMenuPopover) {
      const closePopover = () => {
        utilityMenuPopover.hidden = true;
        utilityMenuToggle.classList.remove("is-active");
        utilityMenuToggle.setAttribute("aria-expanded", "false");
      };

      const openPopover = () => {
        utilityMenuPopover.hidden = false;
        utilityMenuToggle.classList.add("is-active");
        utilityMenuToggle.setAttribute("aria-expanded", "true");
      };

      utilityMenuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (utilityMenuPopover.hidden) {
          openPopover();
        } else {
          closePopover();
        }
      });

      document.addEventListener("click", (e) => {
        if (!utilityMenuPopover.hidden && !utilityMenuPopover.contains(e.target) && e.target !== utilityMenuToggle) {
          closePopover();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !utilityMenuPopover.hidden) {
          closePopover();
        }
      });

      utilityMenuPopover.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (btn && btn.id !== "antigravityToggle") {
          closePopover();
        }
      });
    }

    // Auth Trigger & Modal
    adminAuthBtn.addEventListener("click", openAuthModal);
    authCloseBtn.addEventListener("click", closeAuthModal);
    authCancelBtn.addEventListener("click", closeAuthModal);
    adminAuthModal.addEventListener("click", (e) => {
      if (e.target === adminAuthModal) closeAuthModal();
    });
    adminAuthForm.addEventListener("submit", handleAuthSubmit);
    adminLogoutBtn.addEventListener("click", handleLogout);

    // Upload Trigger & Modal
    if (openUploadBtn) {
      openUploadBtn.addEventListener("click", () => {
        if (RDPAuth.isAuthenticated()) {
          openUploadModal();
        } else {
          pendingOpenUpload = true;
          showToast("ACCESSO RICHIESTO: ACCEDI COME CREATOR PER CARICARE I MOCKUP");
          openAuthModal();
        }
      });
    }
    if (uploadCloseBtn) uploadCloseBtn.addEventListener("click", closeUploadModal);
    if (uploadCancelBtn) uploadCancelBtn.addEventListener("click", closeUploadModal);
    if (uploadModal) {
      uploadModal.addEventListener("click", (e) => {
        if (e.target === uploadModal) closeUploadModal();
      });
    }

    if (frontFileInput) {
      frontFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) setFrontFile(e.target.files[0]);
      });
      frontFileInput.addEventListener("click", (e) => e.stopPropagation());
    }
    if (backFileInput) {
      backFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) setBackFile(e.target.files[0]);
      });
      backFileInput.addEventListener("click", (e) => e.stopPropagation());
    }

    if (frontDropzone && frontFileInput) {
      frontDropzone.addEventListener("click", (e) => {
        if (e.target !== frontFileInput) frontFileInput.click();
      });
      frontDropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          frontFileInput.click();
        }
      });
      setupZoneDrag(frontDropzone, (files) => setFrontFile(files[0]));
    }

    if (backDropzone && backFileInput) {
      backDropzone.addEventListener("click", (e) => {
        if (e.target !== backFileInput) backFileInput.click();
      });
      backDropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          backFileInput.click();
        }
      });
      setupZoneDrag(backDropzone, (files) => setBackFile(files[0]));
    }

    [optBgClean, optEnhance].forEach((el) => {
      if (el) el.addEventListener("change", () => runCanvasProcessing());
    });

    if (uploadForm) uploadForm.addEventListener("submit", handleUploadSubmit);

    // Voter Registration Modal Bindings
    if (openVoterModalBtn) openVoterModalBtn.addEventListener("click", openVoterModal);
    if (voterModalCloseBtn) voterModalCloseBtn.addEventListener("click", closeVoterModal);
    if (voterCancelBtn) voterCancelBtn.addEventListener("click", closeVoterModal);
    if (voterRegistrationModal) {
      voterRegistrationModal.addEventListener("click", (e) => {
        if (e.target === voterRegistrationModal) closeVoterModal();
      });
    }
    if (voterRegistrationForm) voterRegistrationForm.addEventListener("submit", handleVoterSubmit);
    if (ballotChangeVoterBtn) ballotChangeVoterBtn.addEventListener("click", openVoterModal);

    // Cloud Configuration Modal Bindings
    if (openCloudModalBtn) openCloudModalBtn.addEventListener("click", openCloudModal);
    if (cloudModalCloseBtn) cloudModalCloseBtn.addEventListener("click", closeCloudModal);
    if (cloudCancelBtn) cloudCancelBtn.addEventListener("click", closeCloudModal);
    if (cloudConfigModal) {
      cloudConfigModal.addEventListener("click", (e) => {
        if (e.target === cloudConfigModal) closeCloudModal();
      });
    }
    if (cloudConfigForm) cloudConfigForm.addEventListener("submit", handleCloudConfigSubmit);

    // Feedback Page Bindings
    if (feedbackSubmitBtn) feedbackSubmitBtn.addEventListener("click", handleFeedbackSubmit);
    if (scrollToFeedbackBtn) scrollToFeedbackBtn.addEventListener("click", () => switchMainView("feedback"));


    // Main View Switcher Bindings (Intro vs Showcase vs Secondary Feedback Page)
    if (tabIntroBtn) tabIntroBtn.addEventListener("click", () => switchMainView("intro"));
    if (tabShowcaseBtn) tabShowcaseBtn.addEventListener("click", () => switchMainView("showcase"));
    if (tabFeedbackBtn) tabFeedbackBtn.addEventListener("click", () => switchMainView("feedback"));
    const handleEnterArchive = () => {
      switchMainView("showcase");
      if (!RDPVoter.isRegistered() && !RDPAuth.isAuthenticated()) {
        setTimeout(() => {
          openVoterModal();
        }, 350);
      }
    };

    if (enterArchiveBtn) enterArchiveBtn.addEventListener("click", handleEnterArchive);
    if (introDirectFeedbackBtn) {
      introDirectFeedbackBtn.addEventListener("click", () => {
        switchMainView("feedback");
        if (!RDPVoter.isRegistered() && !RDPAuth.isAuthenticated()) {
          setTimeout(() => {
            openVoterModal();
          }, 350);
        }
      });
    }
    if (brandHomeLink) {
      brandHomeLink.addEventListener("click", () => switchMainView("intro"));
      brandHomeLink.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          switchMainView("intro");
        }
      });
    }
    if (goToFeedbackBtn) goToFeedbackBtn.addEventListener("click", () => switchMainView("feedback"));
    if (backToShowcaseBtn) backToShowcaseBtn.addEventListener("click", () => switchMainView("showcase"));

    // Intro Screen Keyboard Shortcut: Press Enter to Enter Archive
    document.addEventListener("keydown", (e) => {
      if (activeMainView === "intro" && e.key === "Enter" && !e.target.closest("input, textarea, button")) {
        handleEnterArchive();
      }
    });

    // Category Filter Buttons
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.category;
        filterButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        updateCounts();
        renderGrid();
      });
    });

    // Page Mode Buttons (Interactive Flip / Davanti / Retro / Split Dual)
    pageModeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        globalPageMode = btn.dataset.pageMode;
        pageModeButtons.forEach((b) => {
          b.classList.toggle("is-active", b === btn);
        });
        renderGrid();
      });
    });

    // Sort Buttons (Code / Rating / Votes)
    sortButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeSortBy = btn.dataset.sortBy;
        sortButtons.forEach((b) => {
          b.classList.toggle("is-active", b === btn);
        });
        renderGrid();
      });
    });

    // Antigravity Mode
    antigravityToggle.addEventListener("click", toggleAntigravity);
    pulseZeroGBtn.addEventListener("click", () => RDPPhysics.shockwave());
    resetGridBtn.addEventListener("click", () => disableAntigravity(false));

    // Directory Bar Actions
    exportArchiveBtn.addEventListener("click", handleExportArchive);
    resetVotesBtn.addEventListener("click", handleResetUserVotes);
    if (restoreDeletedBtn) {
      restoreDeletedBtn.addEventListener("click", async () => {
        await RDPCloud.restoreAllDeleted();
        switchMainView("showcase");
    await reloadArchiveData();
        showToast("TUTTI I MOCKUP ELIMINATI SONO STATI RIPRISTINATI");
      });
    }

    // Lightbox Modal Controls
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeInspectionModal);
    if (inspectionModal) {
      inspectionModal.addEventListener("click", (e) => {
        if (e.target === inspectionModal) closeInspectionModal();
      });
    }

    if (viewFrontBtn) {
      viewFrontBtn.addEventListener("click", () => {
        activeModalView = "front";
        const item = allItems.find((i) => i.id === activeModalItemId);
        if (item) {
          resetZoom();
          renderInspectionModal(item);
        }
      });
    }

    if (viewBackBtn) {
      viewBackBtn.addEventListener("click", () => {
        const item = allItems.find((i) => i.id === activeModalItemId);
        if (!item || !item.images.back) return;
        activeModalView = "back";
        resetZoom();
        renderInspectionModal(item);
      });
    }

    if (modalFlipPageBtn) modalFlipPageBtn.addEventListener("click", toggleModalPage);

    if (gridOverlayBtn) {
      gridOverlayBtn.addEventListener("click", () => {
        isCadGridOn = !isCadGridOn;
        if (cadGridOverlay) cadGridOverlay.classList.toggle("is-visible", isCadGridOn);
        gridOverlayBtn.setAttribute("aria-pressed", isCadGridOn ? "true" : "false");
        gridOverlayBtn.textContent = isCadGridOn ? "[CAD_GRID: ON]" : "[CAD_GRID: OFF]";
      });
    }

    if (modalStage) modalStage.addEventListener("click", toggleZoom);
    if (modalStage) modalStage.addEventListener("mousemove", updateZoomPan);
    if (modalPrevBtn) modalPrevBtn.addEventListener("click", () => navigateModal(-1));
    if (modalNextBtn) modalNextBtn.addEventListener("click", () => navigateModal(1));
    if (modalDownloadBtn) modalDownloadBtn.addEventListener("click", handleDownloadCurrentImage);
    if (modalDeleteBtn) {
      modalDeleteBtn.addEventListener("click", handleDeleteCurrentItem);
    }

    // Modal 0 to 10 Voting Buttons
    modalVoteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!activeModalItemId) return;
        const score = Number(btn.dataset.vote);
        registerVote(activeModalItemId, score);
      });
    });

    // Global Drag & Drop: ONLY Active if Logged in as Creator
    window.addEventListener("dragenter", (e) => {
      if (!RDPAuth.isAuthenticated()) return;
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      globalDragCounter++;
      if (uploadModal.hidden) {
        globalDropOverlay.hidden = false;
      }
    });

    window.addEventListener("dragover", (e) => {
      if (!RDPAuth.isAuthenticated()) return;
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
    });

    window.addEventListener("dragleave", (e) => {
      if (!RDPAuth.isAuthenticated()) return;
      if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes("Files")) return;
      globalDragCounter = Math.max(0, globalDragCounter - 1);
      if (globalDragCounter === 0) {
        globalDropOverlay.hidden = true;
      }
    });

    window.addEventListener("drop", (e) => {
      if (!RDPAuth.isAuthenticated()) return;
      if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
      e.preventDefault();
      globalDragCounter = 0;
      globalDropOverlay.hidden = true;

      if (e.target.closest("#frontDropzone") || e.target.closest("#backDropzone")) return;

      if (uploadModal.hidden) {
        openUploadModal(e.dataTransfer.files);
      } else {
        handleDroppedFiles(e.dataTransfer.files);
      }
    });

    // Global Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (voterRegistrationModal && !voterRegistrationModal.hidden) {
          closeVoterModal();
        } else if (cloudConfigModal && !cloudConfigModal.hidden) {
          closeCloudModal();
        } else if (adminAuthModal && !adminAuthModal.hidden) {
          closeAuthModal();
        } else if (uploadModal && !uploadModal.hidden) {
          closeUploadModal();
        } else if (inspectionModal && !inspectionModal.hidden) {
          closeInspectionModal();
        }
      } else if (!inspectionModal.hidden) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigateModal(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          navigateModal(1);
        } else if (e.key === " " || e.key === "Tab") {
          e.preventDefault();
          toggleModalPage();
        } else if (e.key === "1" || e.key.toLowerCase() === "f") {
          e.preventDefault();
          activeModalView = "front";
          const item = allItems.find((i) => i.id === activeModalItemId);
          if (item) {
            resetZoom();
            renderInspectionModal(item);
          }
        } else if (e.key === "2" || e.key.toLowerCase() === "b") {
          e.preventDefault();
          const item = allItems.find((i) => i.id === activeModalItemId);
          if (item && item.images && item.images.back) {
            activeModalView = "back";
            resetZoom();
            renderInspectionModal(item);
          }
        } else if (/^[0-9]$/.test(e.key) && activeModalItemId) {
          registerVote(activeModalItemId, Number(e.key));
        }
      }
    });

    // Blocco download non autorizzato delle immagini (tasto destro / drag su desktop)
    window.addEventListener("contextmenu", (e) => {
      if (e.target.tagName === "IMG" && !RDPAuth.isAuthenticated()) {
        e.preventDefault();
        showToast("DOWNLOAD BLOCCATO: FILE RISERVATI ALL'ACCOUNT CREATOR");
      }
    });

    window.addEventListener("dragstart", (e) => {
      if (e.target.tagName === "IMG" && !RDPAuth.isAuthenticated()) {
        e.preventDefault();
        showToast("DOWNLOAD BLOCCATO: FILE RISERVATI ALL'ACCOUNT CREATOR");
      }
    });
  }

  function setupZoneDrag(zoneEl, onDropFiles) {
    zoneEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      zoneEl.classList.add("is-dragover");
    });
    zoneEl.addEventListener("dragleave", () => {
      zoneEl.classList.remove("is-dragover");
    });
    zoneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      globalDragCounter = 0;
      globalDropOverlay.hidden = true;
      zoneEl.classList.remove("is-dragover");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onDropFiles(e.dataTransfer.files);
      }
    });
  }



  // ========================================================================
  // MAIN VIEW SWITCHER: INTRO (DEFAULT) VS SHOWCASE VS FEEDBACK
  // ========================================================================
  let activeMainView = "intro"; // "intro" | "showcase" | "feedback"

  function switchMainView(targetView) {
    activeMainView = targetView;
    const isIntro = targetView === "intro";
    const isShowcase = targetView === "showcase";
    const isFeedback = targetView === "feedback";

    if (introPageView) {
      introPageView.hidden = !isIntro;
      introPageView.classList.toggle("is-active", isIntro);
    }
    if (showcasePageView) {
      showcasePageView.hidden = !isShowcase;
      showcasePageView.classList.toggle("is-active", isShowcase);
    }
    if (feedbackPageView) {
      feedbackPageView.hidden = !isFeedback;
      feedbackPageView.classList.toggle("is-active", isFeedback);
    }

    if (tabIntroBtn) {
      tabIntroBtn.classList.toggle("is-active", isIntro);
      tabIntroBtn.setAttribute("aria-selected", isIntro ? "true" : "false");
    }
    if (tabShowcaseBtn) {
      tabShowcaseBtn.classList.toggle("is-active", isShowcase);
      tabShowcaseBtn.setAttribute("aria-selected", isShowcase ? "true" : "false");
    }
    if (tabFeedbackBtn) {
      tabFeedbackBtn.classList.toggle("is-active", isFeedback);
      tabFeedbackBtn.setAttribute("aria-selected", isFeedback ? "true" : "false");
    }

    if (isFeedback) {
      updateBallotSummary();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ========================================================================
  // VOTER REGISTRATION MODAL & UI HANDLERS
  // ========================================================================
  function openVoterModal() {
    if (!voterRegistrationModal) return;
    if (voterErrorMsg) voterErrorMsg.hidden = true;

    const profile = RDPVoter.getProfile();
    if (profile) {
      if (voterInputName) voterInputName.value = profile.name;
      if (voterInputEmail) voterInputEmail.value = profile.email || "";
    } else {
      if (voterInputName) voterInputName.value = "";
      if (voterInputEmail) voterInputEmail.value = "";
    }

    voterRegistrationModal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      if (voterInputName) voterInputName.focus();
    }, 80);
  }

  function closeVoterModal() {
    if (!voterRegistrationModal) return;
    voterRegistrationModal.hidden = true;
    document.body.style.overflow = "";
    if (voterErrorMsg) voterErrorMsg.hidden = true;
  }

  function handleVoterSubmit(e) {
    e.preventDefault();
    const nameVal = voterInputName ? voterInputName.value.trim() : "";
    const emailVal = voterInputEmail ? voterInputEmail.value.trim() : "";

    const res = RDPVoter.setProfile(nameVal, emailVal);
    if (!res.success) {
      if (voterErrorMsg) {
        voterErrorMsg.textContent = res.message;
        voterErrorMsg.hidden = false;
      }
      return;
    }

    closeVoterModal();
    updateVoterUI();
    showToast(`BENVENUTO ${res.profile.name}! ORA PUOI VOTARE I CAPI.`);

    // Se un voto in sospeso ha scatenato la registrazione, eseguilo subito
    if (pendingVote) {
      const { itemId, score } = pendingVote;
      pendingVote = null;
      registerVote(itemId, score);
    }
  }

  function updateVoterUI() {
    const isReg = RDPVoter.isRegistered();
    const profile = RDPVoter.getProfile();

    if (openVoterModalBtn && voterBtnLabel && voterDot) {
      if (isReg && profile) {
        openVoterModalBtn.classList.add("is-registered");
        voterBtnLabel.textContent = `VOTANTE: ${profile.name}`;
      } else {
        openVoterModalBtn.classList.remove("is-registered");
        voterBtnLabel.textContent = `[REGISTRATI PER VOTARE]`;
      }
    }

    if (ballotVoterNameLabel && ballotChangeVoterBtn) {
      if (isReg && profile) {
        ballotVoterNameLabel.textContent = `VOTANTE REGISTRATO: ${profile.name} ${profile.email ? `(${profile.email})` : ""}`;
        ballotChangeVoterBtn.textContent = `[MODIFICA IDENTITÀ]`;
      } else {
        ballotVoterNameLabel.textContent = `VOTANTE: NON REGISTRATO`;
        ballotChangeVoterBtn.textContent = `[REGISTRATI ORA]`;
      }
    }
  }

  // ========================================================================
  // CREATOR CLOUD CONFIGURATION MODAL & UI HANDLERS
  // ========================================================================
  function openCloudModal() {
    if (!cloudConfigModal) return;
    if (cloudConfigMsg) cloudConfigMsg.hidden = true;

    const isConfigured = RDP_FIREBASE_CONFIG.isConfigured();
    const status = RDPCloud.getStatus();

    if (cloudLiveStatusPill) {
      if (status.connected) {
        cloudLiveStatusPill.className = "cloud-live-status-pill is-connected";
        cloudLiveStatusPill.textContent = "CONNESSO IN TEMPO REALE (FIREBASE FIRESTORE)";
      } else if (status.dbMissing) {
        cloudLiveStatusPill.className = "cloud-live-status-pill is-error";
        cloudLiveStatusPill.textContent = "DATABASE NON ANCORA CREATO SU FIREBASE CONSOLE ⚠";
      } else if (status.permissionDenied) {
        cloudLiveStatusPill.className = "cloud-live-status-pill is-error";
        cloudLiveStatusPill.textContent = "REGOLE BLOCCATE: ABILITA MODALITÀ TEST IN FIRESTORE ⚠";
      } else if (isConfigured) {
        cloudLiveStatusPill.className = "cloud-live-status-pill";
        cloudLiveStatusPill.textContent = "CONFIGURATO // IN CONNESSIONE...";
      } else {
        cloudLiveStatusPill.className = "cloud-live-status-pill";
        cloudLiveStatusPill.textContent = "NON CONFIGURATO (MODALITÀ LOCALE)";
      }
    }

    if (cloudConfigJson && isConfigured) {
      cloudConfigJson.value = JSON.stringify(RDP_FIREBASE_CONFIG.getConfig(), null, 2);
    }

    cloudConfigModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCloudModal() {
    if (!cloudConfigModal) return;
    cloudConfigModal.hidden = true;
    document.body.style.overflow = "";
    if (cloudConfigMsg) cloudConfigMsg.hidden = true;
  }

  function handleCloudConfigSubmit(e) {
    e.preventDefault();
    const raw = cloudConfigJson ? cloudConfigJson.value.trim() : "";
    if (!raw) return;

    try {
      let configObj = null;
      if (raw.includes("{")) {
        const clean = raw.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
        configObj = JSON.parse(clean);
      }
      if (configObj && configObj.apiKey && configObj.projectId) {
        RDP_FIREBASE_CONFIG.setConfig(configObj);
        RDPCloud.init();
        showToast("CONFIGURAZIONE FIREBASE SALVATA CON SUCCESSO");
        closeCloudModal();
        updateCloudUI();
        reloadArchiveData();
      } else {
        if (cloudConfigMsg) {
          cloudConfigMsg.textContent = "FORMATO NON VALIDO: ASSICURATI DI INCLUDERE apiKey E projectId";
          cloudConfigMsg.hidden = false;
        }
      }
    } catch (err) {
      if (cloudConfigMsg) {
        cloudConfigMsg.textContent = `ERRORE PARSING CONFIGURAZIONE: ${err.message}`;
        cloudConfigMsg.hidden = false;
      }
    }
  }

  function updateCloudUI() {
    const status = RDPCloud.getStatus();
    if (cloudBtnLabel && openCloudModalBtn) {
      if (status.connected) {
        openCloudModalBtn.classList.add("is-connected");
        cloudBtnLabel.textContent = "[CLOUD: ONLINE ☁]";
      } else if (status.dbMissing) {
        openCloudModalBtn.classList.remove("is-connected");
        cloudBtnLabel.textContent = "[CLOUD: DB DA CREARE ⚠]";
      } else if (status.permissionDenied) {
        openCloudModalBtn.classList.remove("is-connected");
        cloudBtnLabel.textContent = "[CLOUD: REGOLE ⚠]";
      } else if (status.configured) {
        openCloudModalBtn.classList.remove("is-connected");
        cloudBtnLabel.textContent = "[CLOUD: IN CONNESSIONE ☁]";
      } else {
        openCloudModalBtn.classList.remove("is-connected");
        cloudBtnLabel.textContent = "[CLOUD SYNC]";
      }
    }
  }

  // ========================================================================
  // COMMUNITY BALLOT SUMMARY & FEEDBACK DISPATCH HANDLERS
  // ========================================================================
  function updateBallotSummary() {
    if (!ballotCounterBadge || !ballotChipsGrid) return;

    const userVotes = RDPRatings.getAllUserVotes();
    let votedCount = 0;

    ballotChipsGrid.innerHTML = "";

    allItems.forEach((item) => {
      const score = typeof userVotes[item.id] === "number" ? userVotes[item.id] : null;
      if (score !== null) votedCount++;

      const chip = document.createElement("div");
      chip.className = `ballot-chip ${score !== null ? "is-voted" : ""}`;
      chip.title = `Clicca per aprire la scheda di ${item.code}`;

      chip.innerHTML = `
        <span class="ballot-chip__code">${item.code}</span>
        <span class="ballot-chip__score ${score !== null ? "has-score" : ""}">
          ${score !== null ? `★ ${score}/10` : "NON VOTATO"}
        </span>
      `;

      chip.addEventListener("click", () => {
        openInspectionModal(item.id, "front");
      });

      ballotChipsGrid.appendChild(chip);
    });

    ballotCounterBadge.textContent = `${votedCount} / ${allItems.length} CAPI VOTATI`;

    const tabVoteCountPill = document.getElementById("tabVoteCountPill");
    if (tabVoteCountPill) {
      tabVoteCountPill.textContent = `${votedCount}/${allItems.length}`;
      tabVoteCountPill.classList.toggle("has-votes", votedCount > 0);
    }
  }

  async function handleFeedbackSubmit() {
    if (!feedbackSubmitBtn) return;

    // 1. Verifica registrazione votante
    if (!RDPVoter.isRegistered()) {
      showToast("REGISTRAZIONE NOME E COGNOME OBBLIGATORIA PRIMA DELL'INVIO");
      openVoterModal();
      return;
    }

    const voter = RDPVoter.getProfile();
    const userVotes = RDPRatings.getAllUserVotes();
    const feedbackText = feedbackTextInput ? feedbackTextInput.value.trim() : "";
    const votedItemIds = Object.keys(userVotes);

    const hasVotes = votedItemIds.length > 0;
    const hasText = Boolean(feedbackText && feedbackText.length > 0);

    // Permetti l'invio se il visitatore ha votato ALMENO un capo OPPURE ha scritto un commento/consiglio
    if (!hasVotes && !hasText) {
      if (feedbackResponseMsg) {
        feedbackResponseMsg.className = "feedback-response-msg is-error";
        feedbackResponseMsg.textContent = "ATTENZIONE: ASSEGNA UN VOTO A UN CAPO O SCRIVI UN CONSIGLIO/PROPOSTA PRIMA DI TRASMETTERE.";
        feedbackResponseMsg.hidden = false;
      }
      return;
    }

    // Inizia trasmissione
    feedbackSubmitBtn.disabled = true;
    feedbackSubmitBtn.textContent = "[TRASMISSIONE SCHEDA IN CORSO...]";
    if (feedbackResponseMsg) feedbackResponseMsg.hidden = true;

    try {
      // 1. Invio automatico email a rikisolbiati@gmail.com
      const emailResult = await RDPMailer.sendBallotAndFeedback({
        voter,
        votesMap: userVotes,
        allItems,
        feedbackText
      });

      // 2. Registrazione su Cloud Firestore (se connesso)
      await RDPCloud.recordBallot({
        voter,
        votesMap: userVotes,
        feedbackText
      });

      if (emailResult.success) {
        if (feedbackResponseMsg) {
          feedbackResponseMsg.className = "feedback-response-msg is-success";
          feedbackResponseMsg.innerHTML = `
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 6px; color: #12B76A;">
              ✓ SCHEDA TRASMESSA CON SUCCESSO A <strong>${RDPMailer.CREATOR_EMAIL}</strong>!
            </div>
            <div style="font-size: 11px; margin-bottom: 4px;">
              VOTANTE: <strong>${escapeHtml(voter.name)}</strong> // CAPI VOTATI: <strong>${votedItemIds.length}</strong>.
            </div>
            <div style="font-size: 11px; color: var(--muted); margin-bottom: 10px;">
              ${escapeHtml(emailResult.message || "GRAZIE PER IL TUO CONTRIBUTO ALLA COMMUNITY DI RAGAZZI DI PROVINCIA.")}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${emailResult.gmailUrl ? `<a href="${emailResult.gmailUrl}" target="_blank" rel="noopener" class="dir-action-btn" style="text-decoration: none; padding: 6px 12px; font-size: 10px;">[APRI COPIA IN GMAIL ↗]</a>` : ""}
              ${emailResult.fallbackUrl ? `<a href="${emailResult.fallbackUrl}" class="dir-action-btn" style="text-decoration: none; padding: 6px 12px; font-size: 10px;">[APRI IN APP EMAIL ↗]</a>` : ""}
            </div>
          `;
          feedbackResponseMsg.hidden = false;
        }
        if (feedbackTextInput) feedbackTextInput.value = "";
        showToast("✓ SCHEDA VOTI E FEEDBACK TRASMESSA A RIKISOLBIATI@GMAIL.COM");
      } else {
        // Fallback con pulsanti rapidi Gmail e Mailto
        if (fallbackMailtoLink && emailResult.fallbackUrl) {
          fallbackMailtoLink.href = emailResult.fallbackUrl;
          fallbackMailtoLink.style.display = "inline-flex";
        }
        if (feedbackResponseMsg) {
          feedbackResponseMsg.className = "feedback-response-msg is-error";
          feedbackResponseMsg.innerHTML = `
            <div style="font-weight: 800; font-size: 12px; margin-bottom: 8px;">
              ⚠ TRASMISSIONE SCHEDA: PUOI TRASMETTERE SUBITO CON 1 TAP VIA GMAIL WEB O EMAIL CLIENT:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
              ${emailResult.gmailUrl ? `<a href="${emailResult.gmailUrl}" target="_blank" rel="noopener" class="dir-action-btn" style="background: var(--ink); color: #fff; padding: 8px 14px; text-decoration: none; font-weight: 800;">[INVIA SUBITO DA GMAIL WEB ↗]</a>` : ""}
              ${emailResult.fallbackUrl ? `<a href="${emailResult.fallbackUrl}" class="dir-action-btn" style="background: var(--ink); color: #fff; padding: 8px 14px; text-decoration: none; font-weight: 800;">[INVIA DA APP EMAIL ↗]</a>` : ""}
            </div>
          `;
          feedbackResponseMsg.hidden = false;
        }
      }
    } catch (_err) {
      if (feedbackResponseMsg) {
        const mailtoUrl = RDPMailer.generateMailtoLink(voter, userVotes, allItems, feedbackText);
        const gmailUrl = RDPMailer.generateGmailWebLink(voter, userVotes, allItems, feedbackText);
        feedbackResponseMsg.className = "feedback-response-msg is-error";
        feedbackResponseMsg.innerHTML = `
          <div style="font-weight: 800; font-size: 12px; margin-bottom: 8px;">
            TRASMETTI LA SCHEDA CON 1 TAP A <strong>${RDPMailer.CREATOR_EMAIL}</strong>:
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <a href="${gmailUrl}" target="_blank" rel="noopener" class="dir-action-btn" style="background: var(--ink); color: #fff; padding: 8px 14px; text-decoration: none; font-weight: 800;">[APRI GMAIL WEB ↗]</a>
            <a href="${mailtoUrl}" class="dir-action-btn" style="background: var(--ink); color: #fff; padding: 8px 14px; text-decoration: none; font-weight: 800;">[APRI APP EMAIL ↗]</a>
          </div>
        `;
        feedbackResponseMsg.hidden = false;
      }
    } finally {
      feedbackSubmitBtn.disabled = false;
      feedbackSubmitBtn.textContent = "[TRASMETTI SCHEDA VOTI & FEEDBACK ↗]";
    }
  }

  // ========================================================================
  // ESCAPING HELPERS
  // ========================================================================
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  // Kickstart on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
