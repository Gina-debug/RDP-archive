// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — SYNTHETIC AUDIO FX ENGINE (Web Audio API)
// Effetti sonori procedurali tattili e minimali ad alta definizione:
// zero file audio esterni da scaricare, latenza zero e toggle persistente.
// ==========================================================================

const RDPSound = (() => {
  "use strict";

  let audioCtx = null;
  let enabled = true;

  try {
    const saved = localStorage.getItem("rdp_sound_enabled");
    if (saved !== null) {
      enabled = saved === "1";
    }
  } catch (_e) {
    enabled = true;
  }

  function getContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Click meccanico tattile per pulsanti e schede
  function playClick() {
    if (!enabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.032);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    } catch (_e) {}
  }

  // Transizione morbida di navigazione tra le pagine
  function playWhoosh() {
    if (!enabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.12);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch (_e) {}
  }

  // Scatto foto / cambio angolazione mockup
  function playSnap() {
    if (!enabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Click principale
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(950, t);
      osc1.frequency.exponentialRampToValueAtTime(320, t + 0.04);
      gain1.gain.setValueAtTime(0.07, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.042);
    } catch (_e) {}
  }

  // Feedback sonoro quando si esprime un voto (la tonalità sale con il punteggio)
  function playVote(score = 5) {
    if (!enabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const numScore = Math.max(0, Math.min(10, Number(score) || 0));
      const baseFreq = 220 + (numScore * 38); // da 220Hz (A3) a 600Hz (D5)

      // Nota primaria armonica
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = numScore >= 9 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (numScore === 10 ? 1.5 : 1.25), t + 0.16);

      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.19);

      // Secondo armonico brillante per punteggio 10/10
      if (numScore === 10) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(baseFreq * 2, t + 0.04);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, t + 0.24);
        gain2.gain.setValueAtTime(0.08, t + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(t + 0.04);
        osc2.stop(t + 0.26);
      }
    } catch (_e) {}
  }

  function toggle() {
    enabled = !enabled;
    try {
      localStorage.setItem("rdp_sound_enabled", enabled ? "1" : "0");
    } catch (_e) {}
    if (enabled) {
      playClick();
    }
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  return {
    playClick,
    playWhoosh,
    playSnap,
    playVote,
    toggle,
    isEnabled
  };
})();
