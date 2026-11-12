// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — HTML5 CANVAS IMAGE PROCESSING ENGINE
// Ottimizzazione automatica delle foto dei capi caricati dal Creatore:
// 1. Auto-Trim / Smart Bounding Box
// 2. Studio Background Normalization (sfondo bianco puro o trasparente)
// 3. Standardizzazione Proporzioni 1:1 (1400×1400px con padding calibrato)
// 4. Studio Enhancement (contrasto/nitidezza tessile + contact drop shadow)
// ==========================================================================

const RDPImageProcessor = (() => {
  "use strict";

  const OUTPUT_DIM = 1400; // 1400×1400px HD Canvas
  const DEFAULT_PADDING_PCT = 0.06; // 6% padding (~94% fill safe span)

  // Carica un file come HTMLImageElement
  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("IMPOSSIBILE DECODIFICARE L'IMMAGINE."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("ERRORE LETTURA FILE."));
      reader.readAsDataURL(file);
    });
  }

  // Rileva se un pixel appartiene allo sfondo (bianco, chiaro, o trasparente)
  function isBackgroundPixel(r, g, b, a, tolerance) {
    if (a < 20) return true; // Trasparente

    // Se quasi bianco o grigio chiaro
    const threshold = 255 - tolerance;
    const isLight = r >= threshold && g >= threshold && b >= threshold;
    const isDesaturated = Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && Math.abs(r - b) < 22;

    return isLight && isDesaturated;
  }

  // Trova il bounding box del capo (Smart Bounding Box detection)
  function findBoundingBox(ctx, width, height, tolerance) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    // Scan a passo di 2 pixel per efficienza
    const step = 2;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (!isBackgroundPixel(r, g, b, a, tolerance)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) {
      return { x: 0, y: 0, w: width, h: height };
    }

    // Aggiungi un piccolo margine di sicurezza di 4px
    const pad = 4;
    const bx = Math.max(0, minX - pad);
    const by = Math.max(0, minY - pad);
    const bw = Math.min(width - bx, maxX - minX + pad * 2);
    const bh = Math.min(height - by, maxY - minY + pad * 2);

    return { x: bx, y: by, w: bw, h: bh };
  }

  // Pipeline Principale di Ottimizzazione
  async function processGarmentFile(file, options = {}) {
    const startTime = performance.now();
    const {
      bgNormalize = true,
      studioEnhance = true,
      transparentBg = false,
      bgTolerance = 28,
      paddingPct = DEFAULT_PADDING_PCT
    } = options;

    const img = await fileToImage(file);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    // Canvas Temporaneo per analisi
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = origW;
    sampleCanvas.height = origH;
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCtx.drawImage(img, 0, 0);

    // 1. Smart Crop / Bounding Box
    const bbox = findBoundingBox(sampleCtx, origW, origH, bgTolerance);

    // 2. Canvas di Destinazione HD 1400×1400
    const outCanvas = document.createElement("canvas");
    outCanvas.width = OUTPUT_DIM;
    outCanvas.height = OUTPUT_DIM;
    const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });

    // Sfondo di base: Bianco puro #FFFFFF o Trasparente
    if (!transparentBg) {
      outCtx.fillStyle = "#FFFFFF";
      outCtx.fillRect(0, 0, OUTPUT_DIM, OUTPUT_DIM);
    }

    // 3. Calcolo Proporzioni & Centratura Uniforme con Safe Padding
    const availableSpan = OUTPUT_DIM * (1 - paddingPct * 2);
    const scale = Math.min(availableSpan / bbox.w, availableSpan / bbox.h);
    const drawW = Math.round(bbox.w * scale);
    const drawH = Math.round(bbox.h * scale);
    const drawX = Math.round((OUTPUT_DIM - drawW) / 2);
    const drawY = Math.round((OUTPUT_DIM - drawH) / 2);

    // 4. Studio Contact Drop Shadow (per tridimensionalità brutalist)
    if (studioEnhance && !transparentBg) {
      outCtx.save();
      outCtx.shadowColor = "rgba(17, 17, 17, 0.08)";
      outCtx.shadowBlur = 24;
      outCtx.shadowOffsetX = 0;
      outCtx.shadowOffsetY = 14;
      // Disegna sagoma per ombra
      outCtx.drawImage(sampleCanvas, bbox.x, bbox.y, bbox.w, bbox.h, drawX, drawY, drawW, drawH);
      outCtx.restore();
    }

    // Disegna il capo ritagliato e centrato
    outCtx.drawImage(sampleCanvas, bbox.x, bbox.y, bbox.w, bbox.h, drawX, drawY, drawW, drawH);

    // 5. Studio Background Normalization & Enhancements
    let normalizedPixelCount = 0;
    if (bgNormalize || studioEnhance) {
      const outImgData = outCtx.getImageData(0, 0, OUTPUT_DIM, OUTPUT_DIM);
      const data = outImgData.data;
      const totalPixels = OUTPUT_DIM * OUTPUT_DIM;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (bgNormalize && isBackgroundPixel(r, g, b, a, bgTolerance)) {
          if (transparentBg) {
            data[i + 3] = 0;
          } else {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
          }
          normalizedPixelCount++;
        } else if (studioEnhance && a > 30) {
          // Leggero enhancement del contrasto per evidenziare la trama del tessuto
          const contrast = 1.05;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          data[i] = Math.max(0, Math.min(255, factor * (r - 128) + 128));
          data[i + 1] = Math.max(0, Math.min(255, factor * (g - 128) + 128));
          data[i + 2] = Math.max(0, Math.min(255, factor * (b - 128) + 128));
        }
      }
      outCtx.putImageData(outImgData, 0, 0);
    }

    const elapsed = Math.round(performance.now() - startTime);
    const mime = transparentBg ? "image/png" : "image/jpeg";
    const quality = transparentBg ? undefined : 0.94;
    const processedDataUrl = outCanvas.toDataURL(mime, quality);

    // Telemetria di Processamento
    const telemetry = {
      originalSize: `${origW}×${origH}px`,
      cropBox: `${bbox.w}×${bbox.h}px`,
      outputSize: `${OUTPUT_DIM}×${OUTPUT_DIM}px`,
      padding: `${Math.round(paddingPct * 100)}%`,
      bgMode: transparentBg ? "TRANSPARENT_PNG" : "STUDIO_WHITE_#FFFFFF",
      bgNormalizedPct: `${Math.round((normalizedPixelCount / (OUTPUT_DIM * OUTPUT_DIM)) * 100)}%`,
      processingMs: `${elapsed}ms`
    };

    return {
      processedDataUrl,
      originalDataUrl: sampleCanvas.toDataURL("image/jpeg", 0.8),
      telemetry
    };
  }

  return {
    processGarmentFile
  };
})();
