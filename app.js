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
  const fileCounter = document.getElementById("fileCounter");
  const totalVotesCounter = document.getElementById("totalVotesCounter");
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
  const modalStage = document.getElementById("modalStage");
  const modalImage = document.getElementById("modalImage");
  const cadGridOverlay = document.getElementById("cadGridOverlay");
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
  const optTransparent = document.getElementById("optTransparent");
  const optTolerance = document.getElementById("optTolerance");
  const tolVal = document.getElementById("tolVal");
  const rawPreviewStage = document.getElementById("rawPreviewStage");
  const rawPreviewImg = document.getElementById("rawPreviewImg");
  const processedPreviewStage = document.getElementById("processedPreviewStage");
  const processedPreviewImg = document.getElementById("processedPreviewImg");
  const procStatusPill = document.getElementById("procStatusPill");
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
    RDPCloud.onGarmentsUpdated(() => {
      reloadArchiveData();
    });
    RDPCloud.onDeletionsUpdated(() => {
      reloadArchiveData();
    });

    await reloadArchiveData();
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
      if (openUploadBtn) openUploadBtn.style.display = "inline-flex";
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
      if (openUploadBtn) openUploadBtn.style.display = "none";
      if (openCloudModalBtn) openCloudModalBtn.style.display = "none";
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
    archiveGrid.innerHTML = "";

    const dirNames = {
      ALL: "ALL_GARMENTS",
      HOODIES: "HOODIES_HEAVY",
      TEES: "TEES_JERSEY",
      PANTS: "PANTS_CARGO_DENIM",
      ACCESSORIES: "ACCESSORIES_SPEC"
    };
    activeDirLabel.textContent = dirNames[activeCategory] || activeCategory;

    if (items.length === 0) {
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

    if (globalPageMode === "split_dual") {
      items.forEach((item) => {
        renderSingleCardSlot(item, "front", "P.01 // DAVANTI");
        if (item.images && item.images.back) {
          renderSingleCardSlot(item, "back", "P.02 // RETRO");
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
        renderSingleCardSlot(item, page, null);
      });
    }
  }

  function renderSingleCardSlot(item, activePage, fixedPageLabel = null) {
    const slot = document.createElement("div");
    slot.className = "archive-card-slot";
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
    const imgSrc = activePage === "back" && hasBack ? item.images.back : item.images.front;

    let headerPageControls = "";
    if (!fixedPageLabel && hasBack && globalPageMode === "interactive") {
      headerPageControls = `
        <div class="archive-card__page-switch" role="group" aria-label="Cambia vista pagina">
          <button
            class="card-page-btn ${activePage === "front" ? "is-active" : ""}"
            data-switch-to="front"
            type="button"
            title="Mostra Pagina 01 (Davanti)"
          >
            P.01
          </button>
          <button
            class="card-page-btn ${activePage === "back" ? "is-active" : ""}"
            data-switch-to="back"
            type="button"
            title="Mostra Pagina 02 (Retro)"
          >
            P.02
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

    // Quick vote buttons 0..10
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

    card.innerHTML = `
      <div class="archive-card__head">
        <div class="flex items-center gap-2">
          <span class="archive-card__code">${escapeHtml(item.code)}</span>
          ${headerPageControls}
        </div>
        <div class="flex items-center gap-2">
          ${quickDeleteHtml}
          <span class="camo-badge">${escapeHtml(item.statusBadge || "ARCHIVE SPEC")}</span>
        </div>
      </div>
      <div class="archive-card__media">
        ${creatorBadgeHtml}
        <span class="archive-card__rating-badge ${stats.hasVoted ? "has-user-vote" : ""}">
          ★ ${escapeHtml(stats.average)} (${stats.totalVotes} VOTI)
        </span>
        <span class="archive-card__page-indicator">${pageBadgeText}</span>
        <img
          class="archive-card__img"
          src="${escapeAttr(imgSrc)}"
          alt="${escapeAttr(item.title)} (${pageBadgeText})"
          loading="lazy"
        />
        <span class="archive-card__inspect-hint">[INSPECT // ${activePage === "front" ? "P.01 DAVANTI" : "P.02 RETRO"}]</span>
      </div>
      <div class="archive-card__foot">
        <h2 class="archive-card__title">${escapeHtml(item.title)}</h2>
        <div class="archive-card__meta">
          <span>${escapeHtml(item.gsm)} // ${escapeHtml(item.fit)}</span>
          <span>${escapeHtml(item.category)}</span>
        </div>
        <div class="archive-card__vote-row" title="Vota da 0 a 10 per ${escapeAttr(item.code)}">
          <span class="archive-card__vote-label">VOTA:</span>
          <div class="archive-card__vote-btns" role="group" aria-label="Vota ${escapeAttr(item.code)} da 0 a 10">
            ${quickVoteButtonsHtml}
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (RDPPhysics.getActiveState()) return;

      // Handle Quick Delete button directly on the card
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

        removeItemFromArchive(item.id, item.code);
        return;
      }

      const quickVoteBtn = e.target.closest(".quick-vote-btn");
      if (quickVoteBtn) {
        e.stopPropagation();
        const score = Number(quickVoteBtn.dataset.quickVote);
        registerVote(item.id, score);
        return;
      }

      const switchBtn = e.target.closest(".card-page-btn");
      if (switchBtn) {
        e.stopPropagation();
        const targetPage = switchBtn.dataset.switchTo;
        cardPageStates[item.id] = targetPage;
        renderGrid();
        return;
      }

      openInspectionModal(item.id, activePage);
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
        openInspectionModal(item.id, activePage);
      }
    });

    slot.appendChild(card);
    archiveGrid.appendChild(slot);
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
    inspectionModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeInspectionModal() {
    inspectionModal.hidden = true;
    activeModalItemId = null;
    resetDeleteArmed();
    resetZoom();
    document.body.style.overflow = "";
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

    modalCode.textContent = item.code;
    modalBadge.textContent = item.statusBadge || "ARCHIVE SPEC";
    modalCategory.textContent = item.category;
    modalTitle.textContent = item.title;

    specFit.textContent = item.fit || "--";
    specGsm.textContent = item.gsm || "--";
    specFabric.textContent = item.fabric || "100% HEAVYWEIGHT COMBED COTTON";
    specColorway.textContent = item.colorway || "ARCHIVE STANDARD";
    specPattern.textContent = item.patternRef || `PAT-${item.code}`;
    specConstruction.textContent = item.construction || "STANDARD INDUSTRIAL STITCH";
    specBatch.textContent = item.batch || "OFFICIAL ARCHIVE SPEC";

    if (activeModalView === "back") {
      modalPageIndicator.textContent = "PAGINA 02 DI 02 [RETRO]";
      specNotesHeader.textContent = "NOTE VISTA RETRO // ATELIER_LOG";
      specNotes.textContent =
        item.backNotes ||
        item.notes ||
        "VISTA DORSALE STANDARDIZZATA AD ALTA DEFINIZIONE (1400×1400PX // ~94% FILL).";
    } else {
      modalPageIndicator.textContent = "PAGINA 01 DI 02 [DAVANTI]";
      specNotesHeader.textContent = "NOTE VISTA DAVANTI // ATELIER_LOG";
      specNotes.textContent =
        item.frontNotes ||
        item.notes ||
        "VISTA FRONTALE STANDARDIZZATA AD ALTA DEFINIZIONE (1400×1400PX // ~94% FILL).";
    }

    const hasBack = Boolean(item.images && item.images.back);
    viewBackBtn.disabled = !hasBack;
    modalFlipPageBtn.disabled = !hasBack;
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
    modalIndexLabel.textContent = `${pad2(indexInVisible + 1)} / ${pad2(visible.length)}`;
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

    modalVoteButtons.forEach((btn) => {
      const btnScore = Number(btn.dataset.vote);
      btn.classList.toggle("is-active", stats.hasVoted && stats.userVote === btnScore);
    });
  }

  function updateModalViewImage(item) {
    const src =
      activeModalView === "back" && item.images.back
        ? item.images.back
        : item.images.front;

    modalImage.src = src;
    modalImage.alt = `${item.title} — ${activeModalView === "front" ? "Pagina 01 Davanti" : "Pagina 02 Retro"}`;

    viewFrontBtn.classList.toggle("is-active", activeModalView === "front");
    viewBackBtn.classList.toggle("is-active", activeModalView === "back");
    modalViewLabel.textContent =
      activeModalView === "front"
        ? "PAGINA 01 DI 02: VISTA DAVANTI (FRONT)"
        : "PAGINA 02 DI 02: VISTA RETRO (BACK)";

    const isDataUrl = src.startsWith("data:");
    modalAssetPath.textContent = isDataUrl
      ? `SRC: CREATOR_INGESTION://${item.code}_${activeModalView.toUpperCase()} [1400×1400 HD]`
      : `SRC: /${src.toUpperCase()} [1400×1400 HD]`;
  }

  function resetZoom() {
    isZoomed = false;
    modalStage.classList.remove("is-zoomed");
    modalImage.style.transformOrigin = "center center";
    zoomIndicator.textContent = "ZOOM: 1.0X";
  }

  function toggleZoom(e) {
    isZoomed = !isZoomed;
    modalStage.classList.toggle("is-zoomed", isZoomed);
    zoomIndicator.textContent = isZoomed ? "ZOOM: 2.5X" : "ZOOM: 1.0X";

    if (isZoomed && e) {
      updateZoomPan(e);
    } else {
      modalImage.style.transformOrigin = "center center";
    }
  }

  function updateZoomPan(e) {
    if (!isZoomed) return;
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
    await RDPCloud.deleteGarment(itemId);
    await reloadArchiveData();
    showToast(`CAPO ${itemCode || ""} ELIMINATO DALL'ARCHIVIO`);
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
    uploadForm.reset();
    draftFrontFile = null;
    draftBackFile = null;
    draftFrontResult = null;
    draftBackResult = null;
    frontFileName.textContent = "SELEZIONA O TRASCINA PNG/JPG (DAVANTI)";
    backFileName.textContent = "SELEZIONA O TRASCINA PNG/JPG (RETRO)";
    frontDropzone.classList.remove("has-file");
    backDropzone.classList.remove("has-file");

    rawPreviewImg.hidden = true;
    rawPreviewImg.src = "";
    rawPreviewStage.querySelector(".preview-placeholder").hidden = false;

    processedPreviewImg.hidden = true;
    processedPreviewImg.src = "";
    processedPreviewStage.querySelector(".preview-placeholder").hidden = false;

    procStatusPill.textContent = "IDLE";
    tolVal.textContent = optTolerance.value;
    processorTelemetry.innerHTML = `
      <span>ORIG: --</span>
      <span>CROP: --</span>
      <span>OUT: 1400×1400 (6% PAD)</span>
      <span>BG: --</span>
      <span>TIME: --</span>
    `;
    uploadErrorMsg.hidden = true;
    uploadSubmitBtn.disabled = true;
  }

  function isValidImageFile(file) {
    if (!file) return false;
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (validTypes.includes(file.type)) return true;
    return /\.(png|jpe?g|webp)$/i.test(file.name);
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
    uploadSubmitBtn.disabled = true;
    uploadErrorMsg.hidden = true;
    procStatusPill.textContent = "PROCESSING...";

    const options = {
      bgNormalize: optBgClean.checked,
      studioEnhance: optEnhance.checked,
      transparentBg: optTransparent.checked,
      bgTolerance: Number(optTolerance.value),
      paddingPct: 0.06 // 6% padding for ~94% fill
    };

    try {
      draftFrontResult = await RDPImageProcessor.processGarmentFile(draftFrontFile, options);

      rawPreviewImg.src = draftFrontResult.originalDataUrl;
      rawPreviewImg.hidden = false;
      rawPreviewStage.querySelector(".preview-placeholder").hidden = true;

      processedPreviewImg.src = draftFrontResult.processedDataUrl;
      processedPreviewImg.hidden = false;
      processedPreviewStage.querySelector(".preview-placeholder").hidden = true;

      if (draftBackFile) {
        draftBackResult = await RDPImageProcessor.processGarmentFile(draftBackFile, options);
      } else {
        draftBackResult = null;
      }

      const t = draftFrontResult.telemetry;
      procStatusPill.textContent = "READY 1:1 HD";
      processorTelemetry.innerHTML = `
        <span>ORIG: ${t.originalSize}</span>
        <span>CROP: ${t.cropBox}</span>
        <span>OUT: ${t.outputSize} (${t.padding} PAD)</span>
        <span>BG: ${t.bgMode} (${t.bgNormalizedPct})</span>
        <span>TIME: ${t.processingMs}</span>
      `;
      uploadSubmitBtn.disabled = false;
    } catch (err) {
      procStatusPill.textContent = "ERROR";
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

    const title = inputTitle.value.trim().toUpperCase();
    const category = inputCategory.value;
    let gsm = inputGsm.value.trim().toUpperCase();
    const fit = inputFit.value.trim().toUpperCase();

    if (!title || !gsm || !fit) {
      showUploadError("COMPILA I CAMPI OBBLIGATORI (NOME, CATEGORIA, GSM, FIT).");
      return;
    }

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
      await reloadArchiveData();
      if (res && res.syncedToCloud) {
        showToast(`CAPO ${newItem.code} AGGIUNTO E SINCRONIZZATO NEL CLOUD!`);
      } else {
        showToast(`CAPO ${newItem.code} AGGIUNTO CON SUCCESSO ALL'ARCHIVIO!`);
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
    sysStatus.textContent = "ZERO_G_PHYSICS";
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
    openUploadBtn.addEventListener("click", () => openUploadModal());
    uploadCloseBtn.addEventListener("click", closeUploadModal);
    uploadCancelBtn.addEventListener("click", closeUploadModal);
    uploadModal.addEventListener("click", (e) => {
      if (e.target === uploadModal) closeUploadModal();
    });

    frontDropzone.addEventListener("click", () => frontFileInput.click());
    backDropzone.addEventListener("click", () => backFileInput.click());

    frontFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) setFrontFile(e.target.files[0]);
    });
    backFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) setBackFile(e.target.files[0]);
    });

    setupZoneDrag(frontDropzone, (files) => setFrontFile(files[0]));
    setupZoneDrag(backDropzone, (files) => setBackFile(files[0]));

    [optBgClean, optEnhance, optTransparent].forEach((el) => {
      el.addEventListener("change", () => runCanvasProcessing());
    });

    optTolerance.addEventListener("input", () => {
      tolVal.textContent = optTolerance.value;
    });
    optTolerance.addEventListener("change", () => runCanvasProcessing());

    uploadForm.addEventListener("submit", handleUploadSubmit);

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
        await reloadArchiveData();
        showToast("TUTTI I MOCKUP ELIMINATI SONO STATI RIPRISTINATI");
      });
    }

    // Lightbox Modal Controls
    modalCloseBtn.addEventListener("click", closeInspectionModal);
    inspectionModal.addEventListener("click", (e) => {
      if (e.target === inspectionModal) closeInspectionModal();
    });

    viewFrontBtn.addEventListener("click", () => {
      activeModalView = "front";
      const item = allItems.find((i) => i.id === activeModalItemId);
      if (item) {
        resetZoom();
        renderInspectionModal(item);
      }
    });

    viewBackBtn.addEventListener("click", () => {
      const item = allItems.find((i) => i.id === activeModalItemId);
      if (!item || !item.images.back) return;
      activeModalView = "back";
      resetZoom();
      renderInspectionModal(item);
    });

    modalFlipPageBtn.addEventListener("click", toggleModalPage);

    gridOverlayBtn.addEventListener("click", () => {
      isCadGridOn = !isCadGridOn;
      cadGridOverlay.classList.toggle("is-visible", isCadGridOn);
      gridOverlayBtn.setAttribute("aria-pressed", isCadGridOn ? "true" : "false");
      gridOverlayBtn.textContent = isCadGridOn ? "[CAD_GRID: ON]" : "[CAD_GRID: OFF]";
    });

    modalStage.addEventListener("click", toggleZoom);
    modalStage.addEventListener("mousemove", updateZoomPan);
    modalPrevBtn.addEventListener("click", () => navigateModal(-1));
    modalNextBtn.addEventListener("click", () => navigateModal(1));
    modalDownloadBtn.addEventListener("click", handleDownloadCurrentImage);
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
        if (!adminAuthModal.hidden) {
          closeAuthModal();
        } else if (!uploadModal.hidden) {
          closeUploadModal();
        } else if (!inspectionModal.hidden) {
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
    if (cloudBtnLabel && cloudDot && openCloudModalBtn) {
      if (status.connected) {
        openCloudModalBtn.classList.add("is-connected");
        cloudBtnLabel.textContent = "[CLOUD: ONLINE ☁]";
      } else if (status.configured) {
        openCloudModalBtn.classList.remove("is-connected");
        cloudBtnLabel.textContent = "[CLOUD: ATTESA ☁]";
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

    if (votedItemIds.length === 0 && (!feedbackText || feedbackText.length < 3)) {
      if (feedbackResponseMsg) {
        feedbackResponseMsg.className = "feedback-response-msg is-error";
        feedbackResponseMsg.textContent = "ATTENZIONE: VOTA ALMENO UN CAPO O SCRIVI UN CONSIGLIO/PROPOSTA PRIMA DI INVIARE.";
        feedbackResponseMsg.hidden = false;
      }
      return;
    }

    // Inizia invio
    feedbackSubmitBtn.disabled = true;
    feedbackSubmitBtn.textContent = "[TRASMISSIONE SCHEDA IN CORSO...]";
    if (feedbackResponseMsg) feedbackResponseMsg.hidden = true;

    try {
      // 1. Invio Email a rikisolbiati@gmail.com
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
            ✓ SCHEDA TRASMESSA CON SUCCESSO A <strong>${RDPMailer.CREATOR_EMAIL}</strong>!<br />
            NOME: <strong>${voter.name}</strong> // CAPI VOTATI: <strong>${votedItemIds.length}</strong>.<br />
            GRAZIE PER IL TUO CONTRIBUTO ALLA COMMUNITY DI RAGAZZI DI PROVINCIA.
          `;
          feedbackResponseMsg.hidden = false;
        }
        if (feedbackTextInput) feedbackTextInput.value = "";
        showToast("✓ SCHEDA VOTI E FEEDBACK TRASMESSA A RIKISOLBIATI@GMAIL.COM");
      } else {
        // Fallback email client
        if (fallbackMailtoLink && emailResult.fallbackUrl) {
          fallbackMailtoLink.href = emailResult.fallbackUrl;
          fallbackMailtoLink.style.display = "inline-flex";
        }
        if (feedbackResponseMsg) {
          feedbackResponseMsg.className = "feedback-response-msg is-error";
          feedbackResponseMsg.innerHTML = `
            INVIO AUTOMATICO NON COMPLETATO. CLICCA SUL PULSANTE QUI ACCANTO <strong>[INVIA VIA APP EMAIL CLIENT]</strong> PER TRASMETTERE LA SCHEDA DIRETTAMENTE A <strong>${RDPMailer.CREATOR_EMAIL}</strong>.
          `;
          feedbackResponseMsg.hidden = false;
        }
      }
    } catch (_err) {
      if (fallbackMailtoLink) {
        fallbackMailtoLink.href = RDPMailer.generateMailtoLink(voter, userVotes, allItems, feedbackText);
        fallbackMailtoLink.style.display = "inline-flex";
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
