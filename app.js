// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — MAIN APPLICATION CONTROLLER
// Showcase & 0-10 Community Voting System for 100% User Garments
// With Restricted Creator Account Authentication for Mockup Ingestion
// Dynamic multi-image per garment & Showcase Cover Photo
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
  let activeModalImageIndex = 0; // 0, 1, 2, ...
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

  // Floating Ballot Bar & Modal Hint Elements
  const pendingBallotBar = document.getElementById("pendingBallotBar");
  const pendingBallotMsg = document.getElementById("pendingBallotMsg");
  const pendingBallotSendBtn = document.getElementById("pendingBallotSendBtn");
  const modalVoteSendHint = document.getElementById("modalVoteSendHint");
  const modalVoteSendBtn = document.getElementById("modalVoteSendBtn");

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
  const stageFlipBtn = document.getElementById("stageFlipBtn");
  const stageFlipLabel = document.getElementById("stageFlipLabel");
  const modalImgPrevBtn = document.getElementById("modalImgPrevBtn");
  const modalImgNextBtn = document.getElementById("modalImgNextBtn");
  const modalGalleryThumbs = document.getElementById("modalGalleryThumbs");
  const modalViewSwitcher = document.getElementById("modalViewSwitcher");
  const specCategory = document.getElementById("specCategory");
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
  const uploadExtraWrap = document.getElementById("uploadExtraWrap");
  const uploadExtraThumbs = document.getElementById("uploadExtraThumbs");
  const uploadAddExtraBtn = document.getElementById("uploadAddExtraBtn");
  const uploadExtraFileInput = document.getElementById("uploadExtraFileInput");
  let draftExtraResults = [];

  // Dedicated Foto Vetrina Upload Elements
  const uploadShowcaseCard = document.getElementById("uploadShowcaseCard");
  const uploadShowcaseFileInput = document.getElementById("uploadShowcaseFileInput");
  const uploadShowcaseDropzone = document.getElementById("uploadShowcaseDropzone");
  const uploadShowcasePreviewWrap = document.getElementById("uploadShowcasePreviewWrap");
  const uploadShowcasePreviewImg = document.getElementById("uploadShowcasePreviewImg");
  const uploadShowcaseRemoveBtn = document.getElementById("uploadShowcaseRemoveBtn");
  const uploadShowcasePlaceholder = document.getElementById("uploadShowcasePlaceholder");
  let uploadShowcaseDataUrl = null;

  // Unified Multi-photo Upload Elements & State
  const uploadPhotosList = document.getElementById("uploadPhotosList");
  const uploadDropzoneUnified = document.getElementById("uploadDropzoneUnified");
  const uploadUnifiedFileInput = document.getElementById("uploadUnifiedFileInput");
  const uploadDropzoneTag = document.getElementById("uploadDropzoneTag");
  const uploadUnifiedFileName = document.getElementById("uploadUnifiedFileName");
  let uploadDraftResults = [];
  let uploadDraftShowcaseIndex = 0;

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

  // Creator Edit Modal Elements
  const modalEditBtn = document.getElementById("modalEditBtn");
  const editGarmentModal = document.getElementById("editGarmentModal");
  const editGarmentCloseBtn = document.getElementById("editGarmentCloseBtn");
  const editGarmentCancelBtn = document.getElementById("editGarmentCancelBtn");
  const editGarmentForm = document.getElementById("editGarmentForm");
  const editGarmentCode = document.getElementById("editGarmentCode");
  const editGarmentModalTitle = document.getElementById("editGarmentModalTitle");

  // Dedicated Foto Vetrina in Creator Edit Modal
  const editShowcaseCard = document.getElementById("editShowcaseCard");
  const editShowcaseFileInput = document.getElementById("editShowcaseFileInput");
  const editShowcaseDropzone = document.getElementById("editShowcaseDropzone");
  const editShowcasePreviewWrap = document.getElementById("editShowcasePreviewWrap");
  const editShowcasePreviewImg = document.getElementById("editShowcasePreviewImg");
  const editShowcaseRemoveBtn = document.getElementById("editShowcaseRemoveBtn");
  const editShowcasePlaceholder = document.getElementById("editShowcasePlaceholder");
  let editDraftShowcaseImage = null;

  // Showcase 3:4 Rectangle Framer & Calibrator Elements (Edit Modal)
  const editShowcaseFramer = document.getElementById("editShowcaseFramer");
  const editShowcaseViewport = document.getElementById("editShowcaseViewport");
  const editShowcaseFramerImg = document.getElementById("editShowcaseFramerImg");
  const editShowcaseChangeBtn = document.getElementById("editShowcaseChangeBtn");
  const editShowcaseFramerRemoveBtn = document.getElementById("editShowcaseFramerRemoveBtn");
  const editFramerPosY = document.getElementById("editFramerPosY");
  const editFramerPosYVal = document.getElementById("editFramerPosYVal");
  const editFramerPosX = document.getElementById("editFramerPosX");
  const editFramerPosXVal = document.getElementById("editFramerPosXVal");
  const editFramerZoom = document.getElementById("editFramerZoom");
  const editFramerZoomVal = document.getElementById("editFramerZoomVal");
  const editFramerPresetTop = document.getElementById("editFramerPresetTop");
  const editFramerPresetCenter = document.getElementById("editFramerPresetCenter");
  const editFramerPresetBottom = document.getElementById("editFramerPresetBottom");
  const editFramerPresetFit = document.getElementById("editFramerPresetFit");
  const editFramerPresetCover = document.getElementById("editFramerPresetCover");
  const editFramerApplyBtn = document.getElementById("editFramerApplyBtn");
  const editFramerUsePhoto1Btn = document.getElementById("editFramerUsePhoto1Btn");

  let editFramerState = {
    posX: 50,
    posY: 50,
    zoom: 100,
    fitMode: "cover",
    baseImageSrc: null
  };

  // Showcase 3:4 Rectangle Framer & Calibrator Elements (Upload Modal)
  const uploadShowcaseFramer = document.getElementById("uploadShowcaseFramer");
  const uploadShowcaseViewport = document.getElementById("uploadShowcaseViewport");
  const uploadShowcaseFramerImg = document.getElementById("uploadShowcaseFramerImg");
  const uploadShowcaseChangeBtn = document.getElementById("uploadShowcaseChangeBtn");
  const uploadShowcaseFramerRemoveBtn = document.getElementById("uploadShowcaseFramerRemoveBtn");
  const uploadFramerPosY = document.getElementById("uploadFramerPosY");
  const uploadFramerPosYVal = document.getElementById("uploadFramerPosYVal");
  const uploadFramerPosX = document.getElementById("uploadFramerPosX");
  const uploadFramerPosXVal = document.getElementById("uploadFramerPosXVal");
  const uploadFramerZoom = document.getElementById("uploadFramerZoom");
  const uploadFramerZoomVal = document.getElementById("uploadFramerZoomVal");
  const uploadFramerPresetTop = document.getElementById("uploadFramerPresetTop");
  const uploadFramerPresetCenter = document.getElementById("uploadFramerPresetCenter");
  const uploadFramerPresetBottom = document.getElementById("uploadFramerPresetBottom");
  const uploadFramerPresetFit = document.getElementById("uploadFramerPresetFit");
  const uploadFramerPresetCover = document.getElementById("uploadFramerPresetCover");
  const uploadFramerApplyBtn = document.getElementById("uploadFramerApplyBtn");
  const uploadFramerUsePhoto1Btn = document.getElementById("uploadFramerUsePhoto1Btn");

  let uploadFramerState = {
    posX: 50,
    posY: 50,
    zoom: 100,
    fitMode: "cover",
    baseImageSrc: null
  };

  const editImagesCountLabel = document.getElementById("editImagesCountLabel");
  const editPhotosList = document.getElementById("editPhotosList");
  const editAddPhotoZone = document.getElementById("editAddPhotoZone");
  const editAddPhotoFileInput = document.getElementById("editAddPhotoFileInput");
  const editReplacePhotoFileInput = document.getElementById("editReplacePhotoFileInput");
  const editProcessedPreviewImg = document.getElementById("editProcessedPreviewImg");
  const inputEditTitle = document.getElementById("inputEditTitle");
  const inputEditCategory = document.getElementById("inputEditCategory");
  const inputEditGsm = document.getElementById("inputEditGsm");
  const inputEditFit = document.getElementById("inputEditFit");
  const inputEditBadge = document.getElementById("inputEditBadge");
  const inputEditFabric = document.getElementById("inputEditFabric");
  const inputEditColorway = document.getElementById("inputEditColorway");
  const inputEditNotes = document.getElementById("inputEditNotes");
  const editErrorMsg = document.getElementById("editErrorMsg");
  const editGarmentSubmitBtn = document.getElementById("editGarmentSubmitBtn");

  // Edit Garment State (Supporta più di 2 foto per capo e foto vetrina)
  let editingGarmentId = null;
  let editDraftImages = [];
  let editDraftShowcaseIndex = 0;
  let replacingPhotoIndex = null;
  let isProcessingEditImage = false;

  const archiveToast = document.getElementById("archiveToast");

  // ========================================================================
  // IMAGE HELPERS (MULTI-IMAGE SUPPORT & FOTO VETRINA)
  // ========================================================================
  // Restituisce ESCLUSIVAMENTE le foto del capo destinate all'ispezione fullscreen.
  // La Foto Vetrina NON fa parte di questa lista e non deve MAI comparire nell'ispezione!
  function getItemImages(item) {
    if (!item) return [];
    if (Array.isArray(item.images)) {
      return item.images.filter(Boolean);
    }
    if (item.images && typeof item.images === "object") {
      if (Array.isArray(item.images.gallery) && item.images.gallery.length > 0) {
        return item.images.gallery.filter(Boolean);
      }
      const list = [];
      if (item.images.front) list.push(item.images.front);
      if (item.images.back) list.push(item.images.back);
      if (Array.isArray(item.images.extra)) {
        list.push(...item.images.extra.filter(Boolean));
      }
      return list;
    }
    return [];
  }

  // Restituisce la Foto Vetrina del capo (mostrata SOLO nelle card del catalogo)
  // Se non è stata caricata una foto vetrina dedicata, ripiega sulla 1ª foto del capo
  function getShowcaseImage(item) {
    if (!item) return "";
    if (item.showcaseImage) return item.showcaseImage;
    const imgs = getItemImages(item);
    if (imgs.length === 0) return "";
    const idx =
      typeof item.showcaseImageIndex === "number" &&
      item.showcaseImageIndex >= 0 &&
      item.showcaseImageIndex < imgs.length
        ? item.showcaseImageIndex
        : 0;
    return imgs[idx] || imgs[0] || "";
  }

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

    // Supporta la modifica sia dei capi caricati che dei capi di serie:
    // Se un capo di serie è stato modificato dal Creator, carica la versione modificata
    const editedSeedMap = new Map();
    const newUserItems = [];
    activeUser.forEach((u) => {
      const isOriginalSeed = seedItems.some((s) => s.id === u.id);
      if (isOriginalSeed) {
        editedSeedMap.set(u.id, u);
      } else {
        newUserItems.push(u);
      }
    });

    const mappedSeed = activeSeed.map((s) => {
      if (editedSeedMap.has(s.id)) {
        return {
          ...s,
          ...editedSeedMap.get(s.id)
        };
      }
      return s;
    });
    // I nuovi capi aggiunti dal Creator compaiono per primi (ordine decrescente di caricamento)
    const sortedUser = [...newUserItems].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const combined = [...sortedUser, ...mappedSeed];

    // Assegnazione progressiva automatica dei codici (RDP-001, RDP-002... RDP-012...)
    allItems = combined.map((item, idx) => ({
      ...item,
      code: formatArchiveCode(idx + 1)
    }));

    preloadBackImages();

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

  function preloadBackImages() {
    if (!Array.isArray(allItems)) return;
    allItems.forEach((item) => {
      const imgs = getItemImages(item);
      for (let i = 1; i < imgs.length; i++) {
        if (imgs[i]) {
          const img = new Image();
          img.src = imgs[i];
        }
      }
    });
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
        openUploadBtn.textContent = "+ AGGIUNGI MOCKUP";
      }
      const popoverUploadWrapper = document.getElementById("popoverUploadWrapper");
      if (popoverUploadWrapper) popoverUploadWrapper.style.display = "block";
      if (openCloudModalBtn) openCloudModalBtn.style.display = "inline-flex";
      if (exportArchiveBtn) exportArchiveBtn.style.display = "inline-flex";
      if (modalDownloadBtn) modalDownloadBtn.style.display = "inline-block";
      if (modalEditBtn) modalEditBtn.style.display = "inline-block";
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
      const popoverUploadWrapper = document.getElementById("popoverUploadWrapper");
      if (popoverUploadWrapper) popoverUploadWrapper.style.display = "none";
      if (openCloudModalBtn) openCloudModalBtn.style.display = "inline-flex";
      if (exportArchiveBtn) exportArchiveBtn.style.display = "none";
      if (modalDownloadBtn) modalDownloadBtn.style.display = "none";
      if (modalEditBtn) modalEditBtn.style.display = "none";
      if (sysStatus) {
        sysStatus.textContent = "VOTING_OPEN [0-10]";
      }
    }

    // Aggiorna i pulsanti di modifica rapida sulle schede della vetrina
    if (archiveGrid && archiveGrid.children.length > 0) {
      renderGrid();
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
        targets.push({ item, page: "front", label: "FOTO 01" });
        const imgs = getItemImages(item);
        if (imgs.length > 1) {
          targets.push({ item, page: "back", label: "FOTO 02" });
        }
      });
    } else {
      items.forEach((item) => {
        let page = "front";
        const imgs = getItemImages(item);
        if (globalPageMode === "back_only" && imgs.length > 1) {
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

    targets.forEach((target, index) => {
      const key = `${target.item.id}_${target.page}_${target.label || "single"}`;
      activeKeys.add(key);

      let slot = existingSlotsMap.get(key);
      if (slot) {
        updateExistingCardSlot(slot, target.item, target.page, target.label);
      } else {
        slot = createCardSlotElement(target.item, target.page, target.label);
      }
      slot.style.setProperty("--slot-index", Math.min(index, 16));
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

  // Crea un nuovo slot scheda con design minimal: solo foto, nome del capo e schema votazione 0..10
  function createCardSlotElement(item, activePage, fixedPageLabel = null) {
    const slot = document.createElement("div");
    slot.className = "archive-card-slot";
    const slotKey = `${item.id}_${activePage}_${fixedPageLabel || "single"}`;
    slot.dataset.slotKey = slotKey;
    slot.dataset.slotCode = item.code;

    const card = document.createElement("article");
    card.className = "archive-card";
    card.tabIndex = 0;
    card.dataset.itemId = item.id;
    card.dataset.activePage = activePage;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `${item.title} - Clicca per ispezionare a schermo intero`
    );

    const cardImgs = getItemImages(item);
    const imgSrc = getShowcaseImage(item);
    const stats = RDPRatings.getItemStats(item);
    const userVote = stats.userVote;

    // Schema pulsanti voto rapido 0..10
    let quickVoteButtonsHtml = "";
    for (let i = 0; i <= 10; i++) {
      const isSelected = userVote === i;
      quickVoteButtonsHtml += `
        <button
          class="quick-vote-btn ${isSelected ? "is-voted" : ""}"
          data-quick-vote="${i}"
          type="button"
          title="Vota ${i}/10 per ${escapeAttr(item.title)}"
          aria-label="Vota ${i} su 10"
        >
          ${i}
        </button>
      `;
    }

    const isCreator = RDPAuth.isAuthenticated();
    const creatorEditBtnHtml = isCreator
      ? `<button class="card-creator-edit-btn" data-edit-item="${escapeAttr(item.id)}" type="button" title="Modifica ${escapeAttr(item.title)} (Solo Creator)">✎ MODIFICA</button>`
      : "";
    const codeBadgeHtml = `<span class="archive-card__code-badge"><span class="code-dot"></span>${escapeHtml(item.code || "")}</span>`;

    card.innerHTML = `
      <div class="archive-card__media">
        ${codeBadgeHtml}
        ${creatorEditBtnHtml}
        <img
          class="archive-card__img"
          src="${escapeAttr(imgSrc)}"
          alt="${escapeAttr(item.title)}"
          loading="lazy"
        />
      </div>
      <div class="archive-card__foot">
        <div class="archive-card__title-row">
          <h2 class="archive-card__title">${escapeHtml(item.title)}</h2>
        </div>
        <div class="archive-card__vote-btns" role="group" aria-label="Schema votazione ${escapeAttr(item.title)} da 0 a 10">
          ${quickVoteButtonsHtml}
        </div>
      </div>
    `;

    // Hover desktop: mostra la 1ª foto caricata del capo (imgs[0]) con transizione fluida
    card.addEventListener("mouseenter", () => {
      const currentItem = allItems.find((i) => i.id === card.dataset.itemId);
      if (!currentItem) return;
      const imgs = getItemImages(currentItem);
      if (imgs.length > 0) {
        const currentShowcase = getShowcaseImage(currentItem);
        const hoverTargetSrc = (currentShowcase !== imgs[0]) ? imgs[0] : (imgs[1] || imgs[0]);
        const img = card.querySelector(".archive-card__img");
        if (img && img.dataset.state !== "hover") {
          img.dataset.state = "hover";
          img.src = hoverTargetSrc;
        }
      }
    });

    card.addEventListener("mouseleave", () => {
      const currentItem = allItems.find((i) => i.id === card.dataset.itemId);
      if (!currentItem) return;
      const currentShowcase = getShowcaseImage(currentItem);
      const img = card.querySelector(".archive-card__img");
      if (img && img.dataset.state === "hover") {
        img.dataset.state = "default";
        img.src = currentShowcase;
      }
    });

    card.addEventListener("click", async (e) => {
      if (RDPPhysics.getActiveState()) return;

      const currentItemId = card.dataset.itemId;

      // Gestione pulsante Modifica rapida Creator
      const creatorEditBtn = e.target.closest(".card-creator-edit-btn");
      if (creatorEditBtn) {
        e.stopPropagation();
        openEditGarmentModal(currentItemId);
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

      // Apertura Lightbox / Ispezione a tutto schermo
      openInspectionModal(currentItemId, "front");
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest(".quick-vote-btn") || e.target.closest(".card-creator-edit-btn")) {
          return;
        }
        e.preventDefault();
        const currentItemId = card.dataset.itemId;
        openInspectionModal(currentItemId, "front");
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

    // Codice
    let codeBadge = card.querySelector(".archive-card__code-badge");
    const media = card.querySelector(".archive-card__media");
    if (!codeBadge && media) {
      codeBadge = document.createElement("span");
      codeBadge.className = "archive-card__code-badge";
      media.prepend(codeBadge);
    }
    if (codeBadge) {
      codeBadge.innerHTML = `<span class="code-dot"></span>${escapeHtml(item.code || "")}`;
    }

    // Titolo
    const titleEl = card.querySelector(".archive-card__title");
    if (titleEl && titleEl.textContent !== item.title) {
      titleEl.textContent = item.title;
    }

    // Pulsante Modifica Rapida Creator
    const isCreator = RDPAuth.isAuthenticated();
    let editBtn = card.querySelector(".card-creator-edit-btn");
    if (isCreator && !editBtn && media) {
      const btn = document.createElement("button");
      btn.className = "card-creator-edit-btn";
      btn.dataset.editItem = item.id;
      btn.type = "button";
      btn.title = `Modifica ${item.title} (Solo Creator)`;
      btn.textContent = "✎ MODIFICA";
      media.appendChild(btn);
    } else if (!isCreator && editBtn) {
      editBtn.remove();
    }

    // Immagine: mostra la foto vetrina del capo se non in hover
    const imgEl = card.querySelector(".archive-card__img");
    const showcaseSrc = getShowcaseImage(item);
    if (imgEl && !card.matches(":hover")) {
      if (imgEl.getAttribute("src") !== showcaseSrc) {
        imgEl.src = showcaseSrc;
      }
      imgEl.alt = item.title;
    }

    // Schema voti
    const stats = RDPRatings.getItemStats(item);
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
      if (modalVoteSendHint) modalVoteSendHint.hidden = false;
    }

    renderGrid();
    updateBallotSummary();
    if (pendingBallotBar) {
      pendingBallotBar.classList.remove("has-new-vote");
      void pendingBallotBar.offsetWidth;
      pendingBallotBar.classList.add("has-new-vote");
      setTimeout(() => {
        if (pendingBallotBar) pendingBallotBar.classList.remove("has-new-vote");
      }, 500);
    }
    showToast(`✓ Voto ${score}/10 registrato! Invia la tua scheda all'Atelier nella sezione Feedback ↗`);
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
  function openInspectionModal(itemId, initialPage = 0) {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    activeModalItemId = itemId;
    const imgs = getItemImages(item);
    if (initialPage === "back" || initialPage === 1) {
      activeModalImageIndex = imgs.length > 1 ? 1 : 0;
    } else if (typeof initialPage === "number") {
      activeModalImageIndex = Math.max(0, Math.min(imgs.length - 1, initialPage));
    } else {
      activeModalImageIndex = 0;
    }
    activeModalView = activeModalImageIndex === 1 ? "back" : (activeModalImageIndex === 0 ? "front" : `img_${activeModalImageIndex}`);

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

  function navigateModalImage(direction = 1) {
    const item = allItems.find((i) => i.id === activeModalItemId);
    if (!item) return;
    const imgs = getItemImages(item);
    if (imgs.length <= 1) return;
    activeModalImageIndex = (activeModalImageIndex + direction + imgs.length) % imgs.length;
    activeModalView = activeModalImageIndex === 1 ? "back" : (activeModalImageIndex === 0 ? "front" : `img_${activeModalImageIndex}`);
    resetZoom();
    renderInspectionModal(item);
  }

  function setActiveModalImage(index) {
    const item = allItems.find((i) => i.id === activeModalItemId);
    if (!item) return;
    const imgs = getItemImages(item);
    if (index < 0 || index >= imgs.length) return;
    activeModalImageIndex = index;
    activeModalView = activeModalImageIndex === 1 ? "back" : (activeModalImageIndex === 0 ? "front" : `img_${activeModalImageIndex}`);
    resetZoom();
    renderInspectionModal(item);
  }

  function toggleModalPage() {
    navigateModalImage(1);
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
    if (specCategory) specCategory.textContent = `${item.category || "CORE"} // SS26 ARCHIVE`;
    if (modalTitle) modalTitle.textContent = item.title;

    if (specFit) specFit.textContent = item.fit || "OVERSIZED RELAXED";
    if (specGsm) specGsm.textContent = item.gsm || "450 GSM";
    if (specFabric) specFabric.textContent = item.fabric || "100% COTONE PETTINATO AD ALTA DENSITÀ";
    if (specColorway) specColorway.textContent = item.colorway || "ARCHIVE STANDARD // CAMO DETAIL";
    if (specPattern) specPattern.textContent = item.patternRef || `PAT-${item.code}`;
    if (specConstruction) specConstruction.textContent = item.construction || "STANDARD INDUSTRIAL STITCH";
    if (specBatch) specBatch.textContent = item.batch || "OFFICIAL ARCHIVE SPEC";

    const imgs = getItemImages(item);
    if (activeModalImageIndex >= imgs.length) {
      activeModalImageIndex = 0;
    }
    const totalPhotos = Math.max(1, imgs.length);

    if (modalPageIndicator) {
      modalPageIndicator.textContent = `FOTO ${pad2(activeModalImageIndex + 1)} DI ${pad2(totalPhotos)}`;
    }

    if (pageNotesTag) {
      pageNotesTag.textContent = `NOTE FOTO ${pad2(activeModalImageIndex + 1)}:`;
    }

    if (pageNotesBody) {
      pageNotesBody.textContent = (activeModalImageIndex === 0 ? (item.frontNotes || item.notes) : (item.backNotes || item.notes)) ||
        `FOTO ${pad2(activeModalImageIndex + 1)} STANDARDIZZATA AD ALTA DEFINIZIONE (1400×1400PX // CANVAS STUDIO).`;
    }

    if (specNotesHeader) {
      specNotesHeader.textContent = `NOTE FOTO ${pad2(activeModalImageIndex + 1)} // ATELIER_LOG`;
    }

    if (specNotes) {
      specNotes.textContent =
        item.notes ||
        item.frontNotes ||
        "CAPO UFFICIALE ARCHIVIO RAGAZZI DI PROVINCIA // STANDARDIZZATO AD ALTA RISOLUZIONE.";
    }

    const hasMultiple = imgs.length > 1;
    if (viewBackBtn) viewBackBtn.disabled = imgs.length < 2;
    if (modalFlipPageBtn) {
      modalFlipPageBtn.disabled = !hasMultiple;
      modalFlipPageBtn.textContent = "[PROSSIMA FOTO ⟲]";
    }

    // Delete, Edit & Download buttons: visible EXCLUSIVELY to authenticated Creator!
    const isCreator = RDPAuth.isAuthenticated();
    if (modalEditBtn) {
      modalEditBtn.style.display = isCreator ? "inline-block" : "none";
    }
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

    if (modalVoteSendHint) {
      modalVoteSendHint.hidden = !stats.hasVoted;
    }
  }

  function updateModalViewImage(item) {
    const imgs = getItemImages(item);
    if (activeModalImageIndex >= imgs.length) {
      activeModalImageIndex = 0;
    }
    const src = imgs[activeModalImageIndex] || "";

    if (modalImage) {
      if (modalImage.src !== src) {
        modalImage.classList.remove("is-flipping");
        void modalImage.offsetWidth; // trigger reflow
        modalImage.classList.add("is-flipping");
        setTimeout(() => {
          if (modalImage) modalImage.classList.remove("is-flipping");
        }, 360);
      }
      modalImage.src = src;
      const imgLabel = `Foto ${pad2(activeModalImageIndex + 1)}`;
      modalImage.alt = `${item.title} — ${imgLabel}`;
    }

    const hasMultiple = imgs.length > 1;

    // Freccia Avanti / Indietro sul visualizzatore
    if (modalImgPrevBtn) modalImgPrevBtn.style.display = hasMultiple ? "flex" : "none";
    if (modalImgNextBtn) modalImgNextBtn.style.display = hasMultiple ? "flex" : "none";

    // Pulsante pill fluttuante
    if (stageFlipBtn) {
      stageFlipBtn.style.display = hasMultiple ? "inline-flex" : "none";
      if (stageFlipLabel) {
        stageFlipLabel.textContent = `FOTO ${activeModalImageIndex + 1}/${imgs.length} ⟲`;
      }
    }

    // Modal View Switcher Tabs (Dinamico per qualsiasi numero di foto)
    if (modalViewSwitcher) {
      if (imgs.length <= 1) {
        modalViewSwitcher.style.display = "none";
        modalViewSwitcher.innerHTML = "";
      } else {
        modalViewSwitcher.style.display = "inline-flex";
        modalViewSwitcher.innerHTML = imgs.map((_, idx) => `
          <button class="modal-view-tab ${idx === activeModalImageIndex ? "is-active" : ""}" data-tab-idx="${idx}" type="button" aria-pressed="${idx === activeModalImageIndex ? "true" : "false"}">
            FOTO ${pad2(idx + 1)}
          </button>
        `).join("");
        modalViewSwitcher.querySelectorAll(".modal-view-tab").forEach((btn) => {
          btn.addEventListener("click", () => {
            setActiveModalImage(Number(btn.dataset.tabIdx));
          });
        });
      }
    }

    // Striscia Miniature Galleria
    if (modalGalleryThumbs) {
      if (hasMultiple) {
        modalGalleryThumbs.style.display = "flex";
        modalGalleryThumbs.innerHTML = imgs.map((imgSrc, idx) => `
          <button
            type="button"
            class="modal-gallery-thumb-btn ${idx === activeModalImageIndex ? "is-active" : ""}"
            data-thumb-idx="${idx}"
            title="Mostra foto ${idx + 1}"
            aria-label="Foto ${idx + 1}"
          >
            <img src="${escapeAttr(imgSrc)}" alt="Miniatura foto ${idx + 1}" class="modal-gallery-thumb-img" />
            <span class="modal-gallery-thumb-idx">${pad2(idx + 1)}</span>
          </button>
        `).join("");

        modalGalleryThumbs.querySelectorAll(".modal-gallery-thumb-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            setActiveModalImage(Number(btn.dataset.thumbIdx));
          });
        });
      } else {
        modalGalleryThumbs.style.display = "none";
        modalGalleryThumbs.innerHTML = "";
      }
    }

    if (modalViewLabel) {
      modalViewLabel.textContent = `FOTO ${pad2(activeModalImageIndex + 1)} DI ${pad2(imgs.length)}`;
    }

    if (modalAssetPath) {
      const isDataUrl = src && src.startsWith("data:");
      modalAssetPath.textContent = isDataUrl
        ? `SRC: CREATOR_INGESTION://${item.code}_IMG${activeModalImageIndex + 1} [1400×1400 HD]`
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
    const nextImgs = getItemImages(nextItem);
    if (activeModalImageIndex >= nextImgs.length) {
      activeModalImageIndex = 0;
    }
    activeModalView = activeModalImageIndex === 1 ? "back" : (activeModalImageIndex === 0 ? "front" : `img_${activeModalImageIndex}`);
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
    const imgs = getItemImages(item);
    const src = imgs[activeModalImageIndex] || imgs[0] || "";
    if (!src) return;

    const ext = src.endsWith(".png") ? "png" : src.includes("image/png") ? "png" : "jpg";
    const link = document.createElement("a");
    link.href = src;
    link.download = `${item.code.toLowerCase()}-foto-${pad2(activeModalImageIndex + 1)}-hd.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`DOWNLOAD AVVIATO // ${item.code} [FOTO ${activeModalImageIndex + 1}]`);
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
      handleAddUploadFiles(preloadedFiles);
    }
  }

  function closeUploadModal() {
    uploadModal.hidden = true;
    document.body.style.overflow = "";
    uploadDraftResults = [];
    uploadDraftShowcaseIndex = 0;
    uploadShowcaseDataUrl = null;
    renderUploadShowcaseSlot();
  }

  function resetUploadForm() {
    if (uploadForm) uploadForm.reset();
    uploadDraftResults = [];
    uploadDraftShowcaseIndex = 0;
    uploadShowcaseDataUrl = null;
    renderUploadShowcaseSlot();
    renderUploadPhotosManager();
    if (uploadErrorMsg) uploadErrorMsg.hidden = true;
    if (uploadSubmitBtn) uploadSubmitBtn.disabled = true;
  }

  function isValidImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) return true;
    return /\.(png|jpe?g|webp|heic|heif|avif|bmp)$/i.test(file.name || "");
  }

  // ========================================================================
  // FOTO VETRINA MANAGEMENT & MANUAL RECTANGULAR FRAMER (3:4 RATIO)
  // Permette al Creator di calibrare, inquadrare e adattare manualmente
  // l'immagine per il rettangolo delle card catalogo (3:4) e salvarla nel Cloud e Locale.
  // ========================================================================

  // Disegna l'immagine su un Canvas HD 3:4 (900×1200px) con zoom, panX e panY manuali
  async function bakeShowcaseFraming(baseSrc, state) {
    if (!baseSrc) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const cw = 900;
        const ch = 1200; // Esatto rapporto 3:4 delle schede catalogo
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");

        // Sfondo scuro ossidiana matching con l'archivio
        ctx.fillStyle = "#0A0B0E";
        ctx.fillRect(0, 0, cw, ch);

        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const zoom = Math.max(0.5, ((state && state.zoom) || 100) / 100);
        const posX = Math.max(0, Math.min(100, (state && state.posX !== undefined) ? state.posX : 50)) / 100;
        const posY = Math.max(0, Math.min(100, (state && state.posY !== undefined) ? state.posY : 50)) / 100;
        const isFit = state && state.fitMode === "contain";

        let baseScale;
        if (isFit) {
          baseScale = Math.min(cw / iw, ch / ih) * zoom;
        } else {
          baseScale = Math.max(cw / iw, ch / ih) * zoom;
        }

        const dw = Math.round(iw * baseScale);
        const dh = Math.round(ih * baseScale);
        const dx = Math.round((cw - dw) * posX);
        const dy = Math.round((ch - dh) * posY);

        ctx.drawImage(img, dx, dy, dw, dh);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => resolve(baseSrc);
      img.src = baseSrc;
    });
  }

  function updateUploadFramerLivePreview() {
    if (!uploadShowcaseFramerImg) return;
    const { posX, posY, zoom, fitMode } = uploadFramerState;
    uploadShowcaseFramerImg.style.objectFit = fitMode;
    uploadShowcaseFramerImg.style.objectPosition = `${posX}% ${posY}%`;
    uploadShowcaseFramerImg.style.transformOrigin = `${posX}% ${posY}%`;
    uploadShowcaseFramerImg.style.transform = `scale(${zoom / 100})`;

    if (uploadFramerPosY) uploadFramerPosY.value = posY;
    if (uploadFramerPosYVal) uploadFramerPosYVal.textContent = `${Math.round(posY)}%`;
    if (uploadFramerPosX) uploadFramerPosX.value = posX;
    if (uploadFramerPosXVal) uploadFramerPosXVal.textContent = `${Math.round(posX)}%`;
    if (uploadFramerZoom) uploadFramerZoom.value = zoom;
    if (uploadFramerZoomVal) uploadFramerZoomVal.textContent = `${Math.round(zoom)}%`;
  }

  function renderUploadShowcaseSlot() {
    if (!uploadShowcaseCard) return;
    const currentSrc = uploadFramerState.baseImageSrc || uploadShowcaseDataUrl;
    if (currentSrc) {
      if (uploadShowcaseFramerImg) {
        uploadShowcaseFramerImg.src = currentSrc;
      }
      updateUploadFramerLivePreview();
      if (uploadShowcaseFramer) uploadShowcaseFramer.hidden = false;
      if (uploadShowcaseDropzone) uploadShowcaseDropzone.hidden = true;
    } else {
      if (uploadShowcaseFramer) uploadShowcaseFramer.hidden = true;
      if (uploadShowcaseDropzone) uploadShowcaseDropzone.hidden = false;
      if (uploadShowcasePreviewImg) uploadShowcasePreviewImg.src = "";
    }
  }

  function updateEditFramerLivePreview() {
    if (!editShowcaseFramerImg) return;
    const { posX, posY, zoom, fitMode } = editFramerState;
    editShowcaseFramerImg.style.objectFit = fitMode;
    editShowcaseFramerImg.style.objectPosition = `${posX}% ${posY}%`;
    editShowcaseFramerImg.style.transformOrigin = `${posX}% ${posY}%`;
    editShowcaseFramerImg.style.transform = `scale(${zoom / 100})`;

    if (editFramerPosY) editFramerPosY.value = posY;
    if (editFramerPosYVal) editFramerPosYVal.textContent = `${Math.round(posY)}%`;
    if (editFramerPosX) editFramerPosX.value = posX;
    if (editFramerPosXVal) editFramerPosXVal.textContent = `${Math.round(posX)}%`;
    if (editFramerZoom) editFramerZoom.value = zoom;
    if (editFramerZoomVal) editFramerZoomVal.textContent = `${Math.round(zoom)}%`;
  }

  function renderEditShowcaseSlot() {
    if (!editShowcaseCard) return;
    const currentSrc = editFramerState.baseImageSrc || editDraftShowcaseImage;
    if (currentSrc) {
      if (editShowcaseFramerImg) {
        editShowcaseFramerImg.src = currentSrc;
      }
      updateEditFramerLivePreview();
      if (editShowcaseFramer) editShowcaseFramer.hidden = false;
      if (editShowcaseDropzone) editShowcaseDropzone.hidden = true;
    } else {
      if (editShowcaseFramer) editShowcaseFramer.hidden = true;
      if (editShowcaseDropzone) editShowcaseDropzone.hidden = false;
      if (editShowcasePreviewImg) editShowcasePreviewImg.src = "";
    }
  }

  async function handleShowcaseUploadFile(file, isEdit = false) {
    if (!file) return;
    if (!isValidImageFile(file)) {
      if (isEdit) showEditError("FORMATO NON VALIDO PER LA FOTO VETRINA (USA PNG, JPG O WEBP).");
      else showUploadError("FORMATO NON VALIDO PER LA FOTO VETRINA (USA PNG, JPG O WEBP).");
      return;
    }
    const options = {
      bgNormalize: true,
      studioEnhance: true,
      transparentBg: false,
      bgTolerance: 28,
      paddingPct: 0.04
    };
    try {
      const res = await RDPImageProcessor.processGarmentFile(file, options);
      if (isEdit) {
        editFramerState.baseImageSrc = res.processedDataUrl;
        editFramerState.posX = 50;
        editFramerState.posY = 50;
        editFramerState.zoom = 100;
        editFramerState.fitMode = "cover";
        editDraftShowcaseImage = res.processedDataUrl;
        renderEditShowcaseSlot();
        showToast("✓ FOTO VETRINA CARICATA! REGOLA ORA L'INQUADRATURA NEL RETTANGOLO");
      } else {
        uploadFramerState.baseImageSrc = res.processedDataUrl;
        uploadFramerState.posX = 50;
        uploadFramerState.posY = 50;
        uploadFramerState.zoom = 100;
        uploadFramerState.fitMode = "cover";
        uploadShowcaseDataUrl = res.processedDataUrl;
        renderUploadShowcaseSlot();
        showToast("✓ FOTO VETRINA CARICATA! REGOLA ORA L'INQUADRATURA NEL RETTANGOLO");
      }
    } catch (err) {
      if (isEdit) showEditError("ERRORE ELABORAZIONE FOTO VETRINA: " + (err.message || ""));
      else showUploadError("ERRORE ELABORAZIONE FOTO VETRINA: " + (err.message || ""));
    }
  }

  function setupFramerViewportDrag(viewport, state, updateFn) {
    if (!viewport) return;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialPosX = 50;
    let initialPosY = 50;

    viewport.addEventListener("pointerdown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialPosX = state.posX;
      initialPosY = state.posY;
      viewport.classList.add("is-dragging");
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch (_e) {}
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const rect = viewport.getBoundingClientRect();
      const deltaX = ((e.clientX - startX) / rect.width) * 100;
      const deltaY = ((e.clientY - startY) / rect.height) * 100;
      state.posX = Math.max(0, Math.min(100, initialPosX - deltaX));
      state.posY = Math.max(0, Math.min(100, initialPosY - deltaY));
      updateFn();
    });

    const endDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        viewport.classList.remove("is-dragging");
        try {
          viewport.releasePointerCapture(e.pointerId);
        } catch (_e) {}
      }
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
  }

  function setupFramerControls(prefix, state, updateFn, onApplyFn, onUsePhoto1Fn, changeInput) {
    const posYEl = document.getElementById(`${prefix}FramerPosY`);
    const posXEl = document.getElementById(`${prefix}FramerPosX`);
    const zoomEl = document.getElementById(`${prefix}FramerZoom`);

    if (posYEl) posYEl.addEventListener("input", (e) => { state.posY = Number(e.target.value); updateFn(); });
    if (posXEl) posXEl.addEventListener("input", (e) => { state.posX = Number(e.target.value); updateFn(); });
    if (zoomEl) zoomEl.addEventListener("input", (e) => { state.zoom = Number(e.target.value); updateFn(); });

    const btnTop = document.getElementById(`${prefix}FramerPresetTop`);
    const btnCenter = document.getElementById(`${prefix}FramerPresetCenter`);
    const btnBottom = document.getElementById(`${prefix}FramerPresetBottom`);
    const btnFit = document.getElementById(`${prefix}FramerPresetFit`);
    const btnCover = document.getElementById(`${prefix}FramerPresetCover`);
    const btnApply = document.getElementById(`${prefix}FramerApplyBtn`);
    const btnUsePhoto1 = document.getElementById(`${prefix}FramerUsePhoto1Btn`);
    const btnChange = document.getElementById(`${prefix}ShowcaseChangeBtn`);

    if (btnTop) btnTop.addEventListener("click", (e) => { e.preventDefault(); state.posY = 15; state.posX = 50; state.zoom = 105; state.fitMode = "cover"; updateFn(); });
    if (btnCenter) btnCenter.addEventListener("click", (e) => { e.preventDefault(); state.posY = 50; state.posX = 50; state.zoom = 100; state.fitMode = "cover"; updateFn(); });
    if (btnBottom) btnBottom.addEventListener("click", (e) => { e.preventDefault(); state.posY = 85; state.posX = 50; state.zoom = 105; state.fitMode = "cover"; updateFn(); });
    if (btnFit) btnFit.addEventListener("click", (e) => { e.preventDefault(); state.fitMode = "contain"; state.zoom = 100; state.posX = 50; state.posY = 50; updateFn(); });
    if (btnCover) btnCover.addEventListener("click", (e) => { e.preventDefault(); state.fitMode = "cover"; state.zoom = 100; state.posX = 50; state.posY = 50; updateFn(); });

    if (btnApply && typeof onApplyFn === "function") {
      btnApply.addEventListener("click", (e) => { e.preventDefault(); onApplyFn(e); });
    }
    if (btnUsePhoto1 && typeof onUsePhoto1Fn === "function") {
      btnUsePhoto1.addEventListener("click", (e) => { e.preventDefault(); onUsePhoto1Fn(e); });
    }
    if (btnChange && changeInput) {
      btnChange.addEventListener("click", (e) => { e.preventDefault(); changeInput.click(); });
    }
  }

  // Multi-Photo Upload Manager: Gestione foto del capo visibili a tutto schermo
  function renderUploadPhotosManager() {
    if (!uploadPhotosList) return;

    if (uploadDraftResults.length === 0) {
      uploadPhotosList.innerHTML = "";
      if (uploadUnifiedFileName) {
        uploadUnifiedFileName.textContent = "TOCCA O TRASCINA PER CARICARE LE FOTO DEL CAPO";
      }
      if (uploadDropzoneUnified) {
        uploadDropzoneUnified.classList.remove("has-file");
      }
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
      if (uploadSubmitBtn) {
        uploadSubmitBtn.disabled = true;
      }
      return;
    }

    uploadPhotosList.innerHTML = uploadDraftResults.map((item, idx) => {
      const tag = `FOTO CAPO ${pad2(idx + 1)}`;
      const hint = "Foto visibile nell'ispezione a schermo intero";

      return `
        <div class="upload-photo-item" data-idx="${idx}">
          <div class="upload-photo-thumb-wrap">
            <img src="${escapeAttr(item.processedDataUrl)}" alt="Foto ${idx + 1}" class="upload-photo-thumb-img" />
            <span class="upload-photo-badge">${pad2(idx + 1)}</span>
          </div>
          <div class="upload-photo-details">
            <span class="upload-photo-label">${tag}</span>
            <span class="upload-photo-hint">${hint}</span>
          </div>
          <div class="upload-photo-btns">
            ${idx > 0 ? `<button type="button" class="btn-edit-action btn-edit-action--move" data-upload-action="up" data-idx="${idx}" title="Sposta prima">▲</button>` : ""}
            ${idx < uploadDraftResults.length - 1 ? `<button type="button" class="btn-edit-action btn-edit-action--move" data-upload-action="down" data-idx="${idx}" title="Sposta dopo">▼</button>` : ""}
            ${uploadDraftResults.length > 1 ? `<button type="button" class="btn-edit-action btn-edit-action--delete" data-upload-action="delete" data-idx="${idx}" title="Elimina foto">✕</button>` : ""}
          </div>
        </div>
      `;
    }).join("");

    uploadPhotosList.querySelectorAll("[data-upload-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.uploadAction;
        const idx = Number(btn.dataset.idx);

        if (action === "delete") {
          uploadDraftResults.splice(idx, 1);
          renderUploadPhotosManager();
        } else if (action === "up" && idx > 0) {
          const tmp = uploadDraftResults[idx];
          uploadDraftResults[idx] = uploadDraftResults[idx - 1];
          uploadDraftResults[idx - 1] = tmp;
          renderUploadPhotosManager();
        } else if (action === "down" && idx < uploadDraftResults.length - 1) {
          const tmp = uploadDraftResults[idx];
          uploadDraftResults[idx] = uploadDraftResults[idx + 1];
          uploadDraftResults[idx + 1] = tmp;
          renderUploadPhotosManager();
        }
      });
    });

    const activeShowcase = uploadDraftResults[0];
    if (processedPreviewImg && activeShowcase) {
      processedPreviewImg.src = activeShowcase.processedDataUrl;
      processedPreviewImg.hidden = false;
    }
    if (processorCanvasWrapper) {
      processorCanvasWrapper.hidden = false;
    }
    if (processorPlaceholder) {
      processorPlaceholder.hidden = true;
    }
    if (uploadUnifiedFileName) {
      uploadUnifiedFileName.textContent = `+ AGGIUNGI ALTRE FOTO (${uploadDraftResults.length} ATTIVE)`;
    }
    if (uploadDropzoneUnified) {
      uploadDropzoneUnified.classList.add("has-file");
    }
    if (uploadSubmitBtn) {
      uploadSubmitBtn.disabled = false;
    }

    if (processorTelemetry && activeShowcase && activeShowcase.telemetry) {
      const t = activeShowcase.telemetry;
      processorTelemetry.innerHTML = `
        <span>ORIG: ${t.originalSize}</span>
        <span>CROP: ${t.cropBox}</span>
        <span>OUT: ${t.outputSize} (${t.padding} PAD)</span>
        <span>BG: ${t.bgMode} (${t.bgNormalizedPct})</span>
        <span>TIME: ${t.processingMs}</span>
      `;
    }
  }

  async function handleAddUploadFiles(fileList) {
    const valid = Array.from(fileList).filter(isValidImageFile);
    if (valid.length === 0) {
      showUploadError("FORMATO NON SUPPORTATO. USA IMMAGINI PNG, JPG O WEBP.");
      return;
    }

    if (uploadErrorMsg) uploadErrorMsg.hidden = true;
    isProcessingImage = true;
    if (uploadSubmitBtn) uploadSubmitBtn.disabled = true;

    const options = {
      bgNormalize: optBgClean ? optBgClean.checked : true,
      studioEnhance: optEnhance ? optEnhance.checked : true,
      transparentBg: false,
      bgTolerance: 28,
      paddingPct: 0.06
    };

    let firstFile = null;
    for (const f of valid) {
      if (!firstFile) firstFile = f;
      try {
        const res = await RDPImageProcessor.processGarmentFile(f, options);
        uploadDraftResults.push({
          file: f,
          processedDataUrl: res.processedDataUrl,
          fileName: f.name,
          telemetry: res.telemetry
        });
      } catch (err) {
        console.warn("Errore elaborazione foto upload:", err);
      }
    }

    if (inputTitle && !inputTitle.value.trim() && firstFile) {
      const cleanName = firstFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim()
        .toUpperCase();
      inputTitle.value = cleanName;
    }

    isProcessingImage = false;
    renderUploadPhotosManager();
  }

  // Compatibility stubs for any legacy event
  function handleDroppedFiles(fileList) {
    handleAddUploadFiles(fileList);
  }
  function setFrontFile(file) {
    if (file) handleAddUploadFiles([file]);
  }
  function setBackFile(file) {
    if (file) handleAddUploadFiles([file]);
  }
  function addExtraUploadFiles(fileList) {
    handleAddUploadFiles(fileList);
  }

  function showUploadError(msg) {
    if (!uploadErrorMsg) return;
    uploadErrorMsg.textContent = msg;
    uploadErrorMsg.hidden = false;
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!RDPAuth.isAuthenticated()) {
      showUploadError("ACCESSO SCADUTO O NON VALIDO. EFFETTUA IL LOGIN.");
      return;
    }

    if (isProcessingImage) {
      showUploadError("ATTENDI L'ELABORAZIONE DELLE IMMAGINI...");
      return;
    }

    const allUploaded = uploadDraftResults.map((r) => r.processedDataUrl);
    if (allUploaded.length === 0) {
      showUploadError("CARICA ALMENO UNA FOTO DEL CAPO.");
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

    let finalShowcase = uploadShowcaseDataUrl || null;
    const framerBase = uploadFramerState.baseImageSrc || uploadShowcaseDataUrl;
    if (framerBase) {
      try {
        const baked = await bakeShowcaseFraming(framerBase, uploadFramerState);
        if (baked) {
          finalShowcase = baked;
          uploadShowcaseDataUrl = baked;
        }
      } catch (err) {
        console.warn("[Framer Upload] Errore bake canvas:", err);
      }
    }

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
      frontNotes: notes,
      backNotes: null,
      notes,
      showcaseImage: finalShowcase,
      showcaseBaseImage: framerBase || null,
      showcasePosX: uploadFramerState.posX,
      showcasePosY: uploadFramerState.posY,
      showcaseZoom: uploadFramerState.zoom,
      showcaseFitMode: uploadFramerState.fitMode || "cover",
      createdAt: Date.now(),
      images: {
        front: allUploaded[0] || "",
        back: allUploaded[1] || null,
        extra: allUploaded.slice(2),
        gallery: allUploaded
      }
    };

    try {
      await RDPStorage.saveUserItem(newItem);
      closeUploadModal();
      switchMainView("showcase");
      await reloadArchiveData();
      showToast(`✓ CAPO ${newItem.code} AGGIUNTO ALL'ARCHIVIO! (${allUploaded.length} FOTO)`);

      RDPCloud.saveGarment(newItem).then((res) => {
        if (res && res.syncedToCloud) {
          showToast(`✓ CAPO ${newItem.code} SINCRONIZZATO SU CLOUD FIRESTORE!`);
        }
      }).catch((err) => {
        console.warn("[RDP Cloud] Sync differito:", err);
      });
    } catch (_err) {
      showUploadError("ERRORE SALVATAGGIO CAPO.");
    }
  }

  // ========================================================================
  // CREATOR GARMENT EDITOR (EXCLUSIVE TO AUTHENTICATED CREATOR)
  // Gestione dinamica multi-immagine (> 2 foto) e specifiche tecniche
  // ========================================================================
  function renderEditImagesManager() {
    if (!editPhotosList) return;
    if (editImagesCountLabel) {
      editImagesCountLabel.textContent = `FOTO DEL CAPO (${editDraftImages.length} FOTO ATTIVE) // VISIBILI A SCHERMO INTERO`;
    }

    if (editDraftImages.length === 0) {
      editPhotosList.innerHTML = `
        <div style="font-size: 11px; color: var(--muted); padding: 14px; text-align: center; border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px;">
          NESSUNA FOTO PRESENTE. AGGIUNGI ALMENO UNA FOTO QUI SOTTO.
        </div>
      `;
      if (editProcessedPreviewImg) editProcessedPreviewImg.src = "";
      return;
    }

    editPhotosList.innerHTML = editDraftImages.map((src, idx) => {
      const tag = `FOTO CAPO ${pad2(idx + 1)}`;
      const hint = "Foto visibile nell'ispezione a schermo intero";

      return `
        <div class="edit-photo-item" data-idx="${idx}">
          <div class="edit-photo-thumb-wrap">
            <img src="${escapeAttr(src)}" alt="Foto ${idx + 1}" class="edit-photo-thumb-img" />
            <span class="edit-photo-badge">${pad2(idx + 1)}</span>
          </div>
          <div class="edit-photo-details">
            <span class="edit-photo-label">${tag}</span>
            <span class="edit-photo-hint">${hint}</span>
          </div>
          <div class="edit-photo-btns">
            ${idx > 0 ? `<button type="button" class="btn-edit-action btn-edit-action--move" data-action="up" data-idx="${idx}" title="Sposta prima">▲</button>` : ""}
            ${idx < editDraftImages.length - 1 ? `<button type="button" class="btn-edit-action btn-edit-action--move" data-action="down" data-idx="${idx}" title="Sposta dopo">▼</button>` : ""}
            <button type="button" class="btn-edit-action btn-edit-action--replace" data-action="replace" data-idx="${idx}">✎ CAMBIA</button>
            ${editDraftImages.length > 1 ? `<button type="button" class="btn-edit-action btn-edit-action--delete" data-action="delete" data-idx="${idx}" title="Elimina foto">✕</button>` : ""}
          </div>
        </div>
      `;
    }).join("");

    editPhotosList.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const idx = Number(btn.dataset.idx);

        if (action === "replace") {
          replacingPhotoIndex = idx;
          if (editReplacePhotoFileInput) {
            editReplacePhotoFileInput.value = "";
            editReplacePhotoFileInput.click();
          }
        } else if (action === "delete") {
          editDraftImages.splice(idx, 1);
          renderEditImagesManager();
        } else if (action === "up" && idx > 0) {
          const tmp = editDraftImages[idx];
          editDraftImages[idx] = editDraftImages[idx - 1];
          editDraftImages[idx - 1] = tmp;
          renderEditImagesManager();
        } else if (action === "down" && idx < editDraftImages.length - 1) {
          const tmp = editDraftImages[idx];
          editDraftImages[idx] = editDraftImages[idx + 1];
          editDraftImages[idx + 1] = tmp;
          renderEditImagesManager();
        }
      });
    });

    if (editProcessedPreviewImg && editDraftImages[0]) {
      editProcessedPreviewImg.src = editDraftImages[0];
      editProcessedPreviewImg.hidden = false;
    }
  }

  function openEditGarmentModal(itemId) {
    if (!RDPAuth.isAuthenticated()) {
      showToast("ACCESSO RICHIESTO: ACCEDI COME CREATOR PER MODIFICARE I CAPI");
      openAuthModal();
      return;
    }

    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    editingGarmentId = item.id;
    editDraftImages = [...getItemImages(item)];
    editDraftShowcaseImage = item.showcaseImage || null;
    editFramerState = {
      posX: item.showcasePosX !== undefined ? Number(item.showcasePosX) : 50,
      posY: item.showcasePosY !== undefined ? Number(item.showcasePosY) : 50,
      zoom: item.showcaseZoom !== undefined ? Number(item.showcaseZoom) : 100,
      fitMode: item.showcaseFitMode || "cover",
      baseImageSrc: item.showcaseBaseImage || item.showcaseImage || (editDraftImages[0] || null)
    };
    if (!editDraftShowcaseImage && editDraftImages[0]) {
      editDraftShowcaseImage = editDraftImages[0];
    }
    replacingPhotoIndex = null;
    isProcessingEditImage = false;

    if (editGarmentCode) {
      editGarmentCode.textContent = item.code || "RDP-SPEC";
    }
    if (editGarmentModalTitle) {
      editGarmentModalTitle.textContent = `MODIFICA ${item.code} // ${item.title}`;
    }

    if (inputEditTitle) inputEditTitle.value = item.title || "";
    if (inputEditCategory) inputEditCategory.value = item.category || "HOODIES";
    if (inputEditGsm) inputEditGsm.value = item.gsm || "";
    if (inputEditFit) inputEditFit.value = item.fit || "";
    if (inputEditBadge) inputEditBadge.value = item.statusBadge || "CREATOR ARCHIVE";
    if (inputEditFabric) inputEditFabric.value = item.fabric || "";
    if (inputEditColorway) inputEditColorway.value = item.colorway || "";
    if (inputEditNotes) inputEditNotes.value = item.notes || item.frontNotes || "";

    renderEditShowcaseSlot();
    renderEditImagesManager();

    if (editErrorMsg) editErrorMsg.hidden = true;
    if (editGarmentSubmitBtn) editGarmentSubmitBtn.disabled = false;

    if (editGarmentModal) {
      editGarmentModal.hidden = false;
      document.body.style.overflow = "hidden";
    }
  }

  function closeEditGarmentModal() {
    if (editGarmentModal) {
      editGarmentModal.hidden = true;
      document.body.style.overflow = "";
    }
    editingGarmentId = null;
    editDraftShowcaseImage = null;
    editDraftImages = [];
    replacingPhotoIndex = null;
    editFramerState = {
      posX: 50,
      posY: 50,
      zoom: 100,
      fitMode: "cover",
      baseImageSrc: null
    };
    renderEditShowcaseSlot();
  }

  function showEditError(msg) {
    if (!editErrorMsg) return;
    editErrorMsg.textContent = msg;
    editErrorMsg.hidden = false;
  }

  async function handleAddEditPhotos(fileList) {
    const valid = Array.from(fileList).filter(isValidImageFile);
    if (valid.length === 0) {
      showEditError("FORMATO NON VALIDO. USA IMMAGINI PNG, JPG O WEBP.");
      return;
    }

    try {
      isProcessingEditImage = true;
      if (editGarmentSubmitBtn) editGarmentSubmitBtn.disabled = true;
      if (editErrorMsg) editErrorMsg.hidden = true;

      const options = {
        bgNormalize: true,
        studioEnhance: true,
        transparentBg: false,
        bgTolerance: 28,
        paddingPct: 0.06
      };

      for (const file of valid) {
        const result = await RDPImageProcessor.processGarmentFile(file, options);
        editDraftImages.push(result.processedDataUrl);
        if (editProcessedPreviewImg) {
          editProcessedPreviewImg.src = result.processedDataUrl;
        }
      }

      renderEditImagesManager();
    } catch (err) {
      showEditError(err.message || "ERRORE ELABORAZIONE FOTO.");
    } finally {
      isProcessingEditImage = false;
      if (editGarmentSubmitBtn) editGarmentSubmitBtn.disabled = false;
    }
  }

  async function handleReplaceEditPhoto(file) {
    if (replacingPhotoIndex === null || replacingPhotoIndex < 0) return;
    if (!isValidImageFile(file)) {
      showEditError("FORMATO NON VALIDO. USA PNG, JPG O WEBP.");
      return;
    }

    try {
      isProcessingEditImage = true;
      if (editGarmentSubmitBtn) editGarmentSubmitBtn.disabled = true;
      if (editErrorMsg) editErrorMsg.hidden = true;

      const options = {
        bgNormalize: true,
        studioEnhance: true,
        transparentBg: false,
        bgTolerance: 28,
        paddingPct: 0.06
      };

      const result = await RDPImageProcessor.processGarmentFile(file, options);
      editDraftImages[replacingPhotoIndex] = result.processedDataUrl;
      if (editProcessedPreviewImg) {
        editProcessedPreviewImg.src = result.processedDataUrl;
      }
      renderEditImagesManager();
    } catch (err) {
      showEditError(err.message || "ERRORE SOSTITUZIONE FOTO.");
    } finally {
      isProcessingEditImage = false;
      replacingPhotoIndex = null;
      if (editGarmentSubmitBtn) editGarmentSubmitBtn.disabled = false;
    }
  }

  async function handleEditGarmentSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!RDPAuth.isAuthenticated()) {
      showEditError("ACCESSO NON AUTORIZZATO. EFFETTUA IL LOGIN.");
      return;
    }

    if (isProcessingEditImage) {
      showEditError("ATTENDI IL COMPLETAMENTO DELL'ELABORAZIONE IMMAGINE.");
      return;
    }

    const targetId = editingGarmentId || activeModalItemId;
    const currentItem = allItems.find((i) => i.id === targetId);
    if (!currentItem) {
      showEditError("CAPO NON TROVATO.");
      return;
    }

    let finalImages = editDraftImages.filter(Boolean);
    if (finalImages.length === 0) {
      finalImages = getItemImages(currentItem);
    }
    if (finalImages.length === 0) {
      showEditError("IL CAPO DEVE AVERE ALMENO UNA FOTO CARICATA.");
      return;
    }

    const title = (inputEditTitle && inputEditTitle.value.trim().toUpperCase()) || currentItem.title || "RDP ARCHIVE SPEC";
    const category = (inputEditCategory && inputEditCategory.value) || currentItem.category || "HOODIES";
    let gsm = (inputEditGsm && inputEditGsm.value.trim().toUpperCase()) || currentItem.gsm || "450 GSM";
    if (/^\d+$/.test(gsm)) {
      gsm = `${gsm} GSM`;
    }

    const fit = (inputEditFit && inputEditFit.value.trim().toUpperCase()) || currentItem.fit || "OVERSIZED BOXY";
    const statusBadge = (inputEditBadge && inputEditBadge.value.trim().toUpperCase()) || currentItem.statusBadge || "CREATOR ARCHIVE";
    const fabric = (inputEditFabric && inputEditFabric.value.trim().toUpperCase()) || currentItem.fabric || "100% HEAVYWEIGHT COTTON";
    const colorway = (inputEditColorway && inputEditColorway.value.trim().toUpperCase()) || currentItem.colorway || "STUDIO SPEC";
    const notes = (inputEditNotes && inputEditNotes.value.trim().toUpperCase()) || currentItem.notes || "";

    if (editGarmentSubmitBtn) {
      editGarmentSubmitBtn.disabled = true;
      editGarmentSubmitBtn.textContent = "[SALVATAGGIO_IN_CORSO...]";
    }

    // 1. Bake dell'inquadratura manuale al rettangolo [3:4] su Canvas se presente
    let finalShowcase = editDraftShowcaseImage || null;
    const framerBase = editFramerState.baseImageSrc || editDraftShowcaseImage;
    if (framerBase) {
      try {
        const baked = await bakeShowcaseFraming(framerBase, editFramerState);
        if (baked) {
          finalShowcase = baked;
          editDraftShowcaseImage = baked;
        }
      } catch (err) {
        console.warn("[Framer Edit] Errore bake canvas:", err);
      }
    }

    const updatedItem = {
      ...currentItem,
      title,
      category,
      gsm,
      fit,
      statusBadge,
      fabric,
      colorway,
      notes,
      frontNotes: notes,
      backNotes: null,
      showcaseImage: finalShowcase,
      showcaseBaseImage: framerBase || null,
      showcasePosX: editFramerState.posX,
      showcasePosY: editFramerState.posY,
      showcaseZoom: editFramerState.zoom,
      showcaseFitMode: editFramerState.fitMode || "cover",
      images: {
        front: finalImages[0] || "",
        back: finalImages[1] || null,
        extra: finalImages.slice(2),
        gallery: finalImages
      },
      updatedAt: Date.now()
    };

    try {
      // 2. SALVATAGGIO LOCALE IMMEDIATO (Infallibile e istantaneo in IndexedDB + LocalStorage)
      await RDPStorage.saveUserItem(updatedItem);

      // 3. Chiudi subito la finestra modale e ricarica i dati a video
      closeEditGarmentModal();
      await reloadArchiveData();

      // 4. Se il capo modificato è attualmente aperto nel modal a tutto schermo, aggiornalo sul posto
      if (activeModalItemId === updatedItem.id && inspectionModal && !inspectionModal.hidden) {
        openInspectionModal(updatedItem.id, activeModalImageIndex);
      }

      showToast(`✓ MODIFICHE E INQUADRATURA SALVATE IN LOCALE (${updatedItem.code})!`);

      // 5. Sincronizzazione Cloud in background ("salvare nel claude per tutti i dispositivi al mondo")
      RDPCloud.saveGarment(updatedItem).then((cloudRes) => {
        if (cloudRes && cloudRes.syncedToCloud) {
          showToast(`✓ MODIFICHE SALVATE PERMANENTEMENTE NEL CLOUD PER TUTTI I DISPOSITIVI (${updatedItem.code})!`);
        }
      }).catch((cloudErr) => {
        console.warn("[RDP Cloud] Errore sync differito:", cloudErr);
      });
    } catch (err) {
      console.error("Errore salvataggio modifiche:", err);
      showEditError("ERRORE DURANTE IL SALVATAGGIO: " + (err.message || ""));
      if (editGarmentSubmitBtn) {
        editGarmentSubmitBtn.disabled = false;
        editGarmentSubmitBtn.textContent = "[SALVA_MODIFICHE_CAPO]";
      }
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

    if (uploadUnifiedFileInput) {
      uploadUnifiedFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleAddUploadFiles(e.target.files);
        }
      });
      uploadUnifiedFileInput.addEventListener("click", (e) => e.stopPropagation());
    }

    if (uploadDropzoneUnified && uploadUnifiedFileInput) {
      uploadDropzoneUnified.addEventListener("click", (e) => {
        if (e.target !== uploadUnifiedFileInput) uploadUnifiedFileInput.click();
      });
      uploadDropzoneUnified.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          uploadUnifiedFileInput.click();
        }
      });
      setupZoneDrag(uploadDropzoneUnified, (files) => handleAddUploadFiles(files));
    }

    if (frontFileInput) {
      frontFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) handleAddUploadFiles([e.target.files[0]]);
      });
      frontFileInput.addEventListener("click", (e) => e.stopPropagation());
    }
    if (backFileInput) {
      backFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) handleAddUploadFiles([e.target.files[0]]);
      });
      backFileInput.addEventListener("click", (e) => e.stopPropagation());
    }

    if (frontDropzone && frontFileInput) {
      frontDropzone.addEventListener("click", (e) => {
        if (e.target !== frontFileInput) frontFileInput.click();
      });
      setupZoneDrag(frontDropzone, (files) => handleAddUploadFiles(files));
    }

    if (backDropzone && backFileInput) {
      backDropzone.addEventListener("click", (e) => {
        if (e.target !== backFileInput) backFileInput.click();
      });
      setupZoneDrag(backDropzone, (files) => handleAddUploadFiles(files));
    }

    [optBgClean, optEnhance].forEach((el) => {
      if (el) el.addEventListener("change", () => renderUploadPhotosManager());
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

    if (pendingBallotSendBtn) {
      pendingBallotSendBtn.addEventListener("click", () => {
        switchMainView("feedback");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (modalVoteSendBtn) {
      modalVoteSendBtn.addEventListener("click", () => {
        closeInspectionModal();
        switchMainView("feedback");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

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

    // Page Mode Buttons (Interactive Gallery / Grid)
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

    // Optional / Legacy Action Listeners (safely guarded)
    if (antigravityToggle) antigravityToggle.addEventListener("click", toggleAntigravity);
    if (pulseZeroGBtn) pulseZeroGBtn.addEventListener("click", () => RDPPhysics.shockwave());
    if (resetGridBtn) resetGridBtn.addEventListener("click", () => disableAntigravity(false));
    if (exportArchiveBtn) exportArchiveBtn.addEventListener("click", handleExportArchive);
    if (resetVotesBtn) resetVotesBtn.addEventListener("click", handleResetUserVotes);
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

    if (stageFlipBtn) {
      stageFlipBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateModalImage(1);
      });
    }

    if (modalImgPrevBtn) {
      modalImgPrevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateModalImage(-1);
      });
    }

    if (modalImgNextBtn) {
      modalImgNextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateModalImage(1);
      });
    }

    if (modalStage) {
      modalStage.addEventListener("click", (e) => {
        if (e.target.closest("#stageFlipBtn") || e.target.closest(".stage-nav-arrow")) return;
        const item = allItems.find((i) => i.id === activeModalItemId);
        if (item) {
          const imgs = getItemImages(item);
          if (imgs.length > 1) {
            navigateModalImage(1);
          } else {
            toggleZoom(e);
          }
        }
      });
      modalStage.addEventListener("mousemove", updateZoomPan);
    }
    if (modalPrevBtn) modalPrevBtn.addEventListener("click", () => navigateModal(-1));
    if (modalNextBtn) modalNextBtn.addEventListener("click", () => navigateModal(1));
    if (modalDownloadBtn) modalDownloadBtn.addEventListener("click", handleDownloadCurrentImage);
    if (modalDeleteBtn) {
      modalDeleteBtn.addEventListener("click", handleDeleteCurrentItem);
    }
    if (modalEditBtn) {
      modalEditBtn.addEventListener("click", () => {
        if (activeModalItemId) openEditGarmentModal(activeModalItemId);
      });
    }

    // Upload Extra Photos Bindings
    if (uploadAddExtraBtn && uploadExtraFileInput) {
      uploadAddExtraBtn.addEventListener("click", () => {
        uploadExtraFileInput.value = "";
        uploadExtraFileInput.click();
      });
      uploadExtraFileInput.addEventListener("change", async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          await addExtraUploadFiles(e.target.files);
          uploadExtraFileInput.value = "";
        }
      });
    }

    // Edit Garment Modal Bindings (Dynamic Multi-Photo Manager)
    if (editGarmentCloseBtn) editGarmentCloseBtn.addEventListener("click", closeEditGarmentModal);
    if (editGarmentCancelBtn) editGarmentCancelBtn.addEventListener("click", closeEditGarmentModal);
    if (editGarmentModal) {
      editGarmentModal.addEventListener("click", (e) => {
        if (e.target === editGarmentModal) closeEditGarmentModal();
      });
    }
    if (editGarmentForm) editGarmentForm.addEventListener("submit", handleEditGarmentSubmit);
    if (editGarmentSubmitBtn) {
      editGarmentSubmitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        handleEditGarmentSubmit(e);
      });
    }

    // Dedicated Showcase Photo bindings for Upload Modal
    if (uploadShowcaseDropzone && uploadShowcaseFileInput) {
      uploadShowcaseDropzone.addEventListener("click", (e) => {
        if (e.target.closest("#uploadShowcaseRemoveBtn")) return;
        uploadShowcaseFileInput.value = "";
        uploadShowcaseFileInput.click();
      });
      uploadShowcaseFileInput.addEventListener("change", async (e) => {
        if (e.target.files && e.target.files[0]) {
          await handleShowcaseUploadFile(e.target.files[0], false);
          uploadShowcaseFileInput.value = "";
        }
      });
      setupZoneDrag(uploadShowcaseDropzone, (files) => {
        if (files && files[0]) handleShowcaseUploadFile(files[0], false);
      });
    }
    if (uploadShowcaseRemoveBtn) {
      uploadShowcaseRemoveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        uploadShowcaseDataUrl = null;
        uploadFramerState.baseImageSrc = null;
        renderUploadShowcaseSlot();
        showToast("FOTO VETRINA RIMOSSA");
      });
    }
    if (uploadShowcaseFramerRemoveBtn) {
      uploadShowcaseFramerRemoveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        uploadShowcaseDataUrl = null;
        uploadFramerState.baseImageSrc = null;
        renderUploadShowcaseSlot();
        showToast("FOTO VETRINA RIMOSSA");
      });
    }

    // 3:4 Showcase Framer Viewport Drag and Controls (Upload Modal)
    setupFramerViewportDrag(uploadShowcaseViewport, uploadFramerState, updateUploadFramerLivePreview);

    const onApplyUploadFramer = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const src = uploadFramerState.baseImageSrc || uploadShowcaseDataUrl;
      if (!src) return;
      if (uploadShowcaseViewport) {
        uploadShowcaseViewport.classList.add("framer-locked-flash");
        setTimeout(() => uploadShowcaseViewport.classList.remove("framer-locked-flash"), 600);
      }
      showToast("✓ INQUADRATURA BLOCCATA E CALIBRATA AL RETTANGOLO [3:4]");
    };

    const onUsePhoto1UploadFramer = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const photo1 = uploadDraftResults && uploadDraftResults[0] ? uploadDraftResults[0].processedDataUrl : null;
      if (photo1) {
        uploadFramerState.baseImageSrc = photo1;
        uploadFramerState.posX = 50;
        uploadFramerState.posY = 50;
        uploadFramerState.zoom = 100;
        uploadFramerState.fitMode = "cover";
        uploadShowcaseDataUrl = photo1;
        renderUploadShowcaseSlot();
        showToast("✓ 1ª FOTO DEL CAPO IMPOSTATA COME VETRINA! ADATTA ORA L'INQUADRATURA");
      } else {
        showToast("PRIMA CARICA UNA FOTO DEL CAPO");
      }
    };

    setupFramerControls("upload", uploadFramerState, updateUploadFramerLivePreview, onApplyUploadFramer, onUsePhoto1UploadFramer, uploadShowcaseFileInput);

    // Dedicated Showcase Photo bindings for Edit Modal
    if (editShowcaseDropzone && editShowcaseFileInput) {
      editShowcaseDropzone.addEventListener("click", (e) => {
        if (e.target.closest("#editShowcaseRemoveBtn")) return;
        editShowcaseFileInput.value = "";
        editShowcaseFileInput.click();
      });
      editShowcaseFileInput.addEventListener("change", async (e) => {
        if (e.target.files && e.target.files[0]) {
          await handleShowcaseUploadFile(e.target.files[0], true);
          editShowcaseFileInput.value = "";
        }
      });
      setupZoneDrag(editShowcaseDropzone, (files) => {
        if (files && files[0]) handleShowcaseUploadFile(files[0], true);
      });
    }
    if (editShowcaseRemoveBtn) {
      editShowcaseRemoveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editDraftShowcaseImage = null;
        editFramerState.baseImageSrc = null;
        renderEditShowcaseSlot();
        showToast("FOTO VETRINA RIMOSSA");
      });
    }
    if (editShowcaseFramerRemoveBtn) {
      editShowcaseFramerRemoveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editDraftShowcaseImage = null;
        editFramerState.baseImageSrc = null;
        renderEditShowcaseSlot();
        showToast("FOTO VETRINA RIMOSSA");
      });
    }

    // 3:4 Showcase Framer Viewport Drag and Controls (Edit Modal)
    setupFramerViewportDrag(editShowcaseViewport, editFramerState, updateEditFramerLivePreview);

    const onApplyEditFramer = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const src = editFramerState.baseImageSrc || editDraftShowcaseImage;
      if (!src) return;
      if (editShowcaseViewport) {
        editShowcaseViewport.classList.add("framer-locked-flash");
        setTimeout(() => editShowcaseViewport.classList.remove("framer-locked-flash"), 600);
      }
      showToast("✓ INQUADRATURA BLOCCATA E CALIBRATA AL RETTANGOLO [3:4]");
    };

    const onUsePhoto1EditFramer = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (editDraftImages && editDraftImages[0]) {
        editFramerState.baseImageSrc = editDraftImages[0];
        editFramerState.posX = 50;
        editFramerState.posY = 50;
        editFramerState.zoom = 100;
        editFramerState.fitMode = "cover";
        editDraftShowcaseImage = editDraftImages[0];
        renderEditShowcaseSlot();
        showToast("✓ 1ª FOTO DEL CAPO IMPOSTATA COME VETRINA! ADATTA ORA L'INQUADRATURA");
      } else {
        showToast("NESSUNA FOTO DEL CAPO PRESENTE");
      }
    };

    setupFramerControls("edit", editFramerState, updateEditFramerLivePreview, onApplyEditFramer, onUsePhoto1EditFramer, editShowcaseFileInput);

    if (editAddPhotoZone && editAddPhotoFileInput) {
      editAddPhotoZone.addEventListener("click", (e) => {
        if (e.target !== editAddPhotoFileInput) {
          editAddPhotoFileInput.value = "";
          editAddPhotoFileInput.click();
        }
      });
      editAddPhotoFileInput.addEventListener("change", async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          await handleAddEditPhotos(e.target.files);
          editAddPhotoFileInput.value = "";
        }
      });
      setupZoneDrag(editAddPhotoZone, (files) => handleAddEditPhotos(files));
    }

    if (editReplacePhotoFileInput) {
      editReplacePhotoFileInput.addEventListener("change", async (e) => {
        if (e.target.files && e.target.files[0]) {
          await handleReplaceEditPhoto(e.target.files[0]);
          editReplacePhotoFileInput.value = "";
        }
      });
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

      if (e.target.closest("#uploadDropzonesContainer") || e.target.closest("#frontDropzone") || e.target.closest("#backDropzone") || e.target.closest("#editAddPhotoZone")) return;

      if (uploadModal && !uploadModal.hidden) {
        handleAddUploadFiles(e.dataTransfer.files);
      } else if (editGarmentModal && !editGarmentModal.hidden) {
        handleAddEditPhotos(e.dataTransfer.files);
      } else {
        openUploadModal(e.dataTransfer.files);
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
        } else if (editGarmentModal && !editGarmentModal.hidden) {
          closeEditGarmentModal();
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
          navigateModalImage(1);
        } else if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          setActiveModalImage(0);
        } else if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          setActiveModalImage(1);
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

    const siteHeader = document.getElementById("siteHeader");
    if (siteHeader) {
      siteHeader.classList.toggle("header--intro", isIntro);
    }

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

    if (pendingBallotBar) {
      const userVotes = RDPRatings.getAllUserVotes();
      const votedCount = Object.keys(userVotes).length;
      pendingBallotBar.hidden = !(votedCount > 0 && isShowcase);
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

      const frontImg = item.images ? item.images.front : "";
      chip.innerHTML = `
        <img class="ballot-chip__thumb" src="${escapeAttr(frontImg)}" alt="${escapeAttr(item.title)}" loading="lazy" />
        <div class="ballot-chip__info">
          <span class="ballot-chip__title">${escapeHtml(item.title)}</span>
          <span class="ballot-chip__code">${escapeHtml(item.code)}</span>
        </div>
        <span class="ballot-chip__score ${score !== null ? "has-score" : ""}">
          ${score !== null ? `★ ${score}/10` : "Non votato"}
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

    if (pendingBallotBar) {
      if (votedCount > 0 && activeMainView === "showcase") {
        pendingBallotBar.hidden = false;
        if (pendingBallotMsg) {
          pendingBallotMsg.innerHTML = `Hai espresso <strong>${votedCount} ${votedCount === 1 ? "voto" : "voti"}</strong>. Ricordati di inviare la tua scheda all'Atelier!`;
        }
      } else {
        pendingBallotBar.hidden = true;
      }
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
