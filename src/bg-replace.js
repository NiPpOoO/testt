// src/bg-replace.js
// Upload image -> remove background (MediaPipe Selfie Segmentation) -> Africa-like background -> download 16:9 PNG.

const fileEl = document.getElementById("file");
const presetEl = document.getElementById("preset");
const scaleEl = document.getElementById("scale");
const offsetXEl = document.getElementById("offsetX");
const offsetYEl = document.getElementById("offsetY");
const featherEl = document.getElementById("feather");
const downloadEl = document.getElementById("download");
const statusEl = document.getElementById("status");
const outCanvas = document.getElementById("out");

if (!outCanvas) throw new Error("Missing #out canvas");
const outCtx = outCanvas.getContext("2d", { willReadFrequently: false });

/** @type {HTMLImageElement | null} */
let currentImg = null;
/** @type {any} */
let selfieSegmentation = null;
/** @type {any} */
let lastMask = null;

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function parsePreset(value) {
  const [wStr, hStr] = String(value).split("x");
  const w = Number(wStr);
  const h = Number(hStr);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return { w: 1920, h: 1080 };
  return { w, h };
}

function ensureCanvasSize(w, h) {
  if (outCanvas.width !== w) outCanvas.width = w;
  if (outCanvas.height !== h) outCanvas.height = h;
}

function drawAfricaBackground(ctx, w, h) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1b2b58");
  sky.addColorStop(0.35, "#e96b2f");
  sky.addColorStop(0.7, "#f6b34f");
  sky.addColorStop(1, "#3b1f15");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun
  const sunX = w * 0.78;
  const sunY = h * 0.43;
  const sunR = Math.min(w, h) * 0.13;
  const sun = ctx.createRadialGradient(sunX, sunY, sunR * 0.15, sunX, sunY, sunR);
  sun.addColorStop(0, "rgba(255,245,200,0.95)");
  sun.addColorStop(0.55, "rgba(255,220,140,0.55)");
  sun.addColorStop(1, "rgba(255,180,90,0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Haze near horizon
  ctx.fillStyle = "rgba(255,210,160,0.18)";
  ctx.fillRect(0, h * 0.55, w, h * 0.12);

  // Ground
  const gY = h * 0.62;
  const ground = ctx.createLinearGradient(0, gY, 0, h);
  ground.addColorStop(0, "#5a2b1a");
  ground.addColorStop(1, "#1b0e0b");
  ctx.fillStyle = ground;
  ctx.fillRect(0, gY, w, h - gY);

  // Distant hills silhouette
  ctx.fillStyle = "rgba(25,10,8,0.55)";
  ctx.beginPath();
  ctx.moveTo(0, gY);
  ctx.bezierCurveTo(w * 0.15, h * 0.58, w * 0.25, h * 0.66, w * 0.42, h * 0.60);
  ctx.bezierCurveTo(w * 0.55, h * 0.56, w * 0.65, h * 0.67, w * 0.82, h * 0.61);
  ctx.bezierCurveTo(w * 0.92, h * 0.58, w * 0.98, h * 0.64, w, h * 0.60);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Simple acacia tree silhouettes
  function acacia(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(10,5,5,0.9)";

    // trunk
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.bezierCurveTo(-2, -30, -6, -60, 0, -90);
    ctx.bezierCurveTo(6, -60, 2, -30, 6, 0);
    ctx.closePath();
    ctx.fill();

    // canopy
    ctx.beginPath();
    ctx.moveTo(-70, -92);
    ctx.bezierCurveTo(-30, -140, 30, -140, 70, -92);
    ctx.bezierCurveTo(40, -70, -40, -70, -70, -92);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  acacia(w * 0.16, gY + h * 0.18, Math.min(w, h) / 900);
  acacia(w * 0.86, gY + h * 0.20, Math.min(w, h) / 820);

  // Subtle vignette
  const v = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.35, w * 0.5, h * 0.55, Math.min(w, h) * 0.85);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function computePlacement(img, outW, outH) {
  const scale = Number(scaleEl?.value ?? 1);
  const offsetX = Number(offsetXEl?.value ?? 0);
  const offsetY = Number(offsetYEl?.value ?? 0);

  // Base: fit image height to output height (portrait will leave side margins = ok).
  const base = outH / img.height;
  const s = base * scale;
  const drawW = img.width * s;
  const drawH = img.height * s;

  const x = (outW - drawW) / 2 + offsetX * outW;
  const y = (outH - drawH) / 2 + offsetY * outH;

  return { x, y, drawW, drawH };
}

function renderComposite() {
  if (!currentImg || !lastMask) return;

  const { w: outW, h: outH } = parsePreset(presetEl?.value ?? "1920x1080");
  ensureCanvasSize(outW, outH);

  const { x, y, drawW, drawH } = computePlacement(currentImg, outW, outH);
  const feather = Math.max(0, Number(featherEl?.value ?? 0));

  outCtx.clearRect(0, 0, outW, outH);

  // 1) Draw mask first on empty canvas (blurred) -> 2) source-in image -> 3) background under it.
  outCtx.save();
  outCtx.filter = feather > 0 ? `blur(${feather}px)` : "none";
  outCtx.drawImage(lastMask, x, y, drawW, drawH);
  outCtx.restore();

  outCtx.globalCompositeOperation = "source-in";
  outCtx.drawImage(currentImg, x, y, drawW, drawH);

  outCtx.globalCompositeOperation = "destination-over";
  drawAfricaBackground(outCtx, outW, outH);

  outCtx.globalCompositeOperation = "source-over";
}

async function initSegmentation() {
  if (selfieSegmentation) return selfieSegmentation;
  if (typeof window.SelfieSegmentation !== "function") {
    throw new Error("SelfieSegmentation not available. Check network / CDN.");
  }

  const SelfieSegmentation = window.SelfieSegmentation;
  selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
  });
  selfieSegmentation.setOptions({
    modelSelection: 1, // general landscape
    selfieMode: false
  });

  selfieSegmentation.onResults((results) => {
    if (!results?.segmentationMask) {
      setStatus("Не удалось получить маску сегментации");
      return;
    }
    lastMask = results.segmentationMask;
    renderComposite();
    downloadEl.disabled = false;
    setStatus("Готово — можно скачать PNG");
  });

  return selfieSegmentation;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function runSegmentation(img) {
  const seg = await initSegmentation();
  setStatus("Вырезаю фон…");

  // MediaPipe prefers canvas/video as input; draw the image to a canvas first.
  const inCanvas = document.createElement("canvas");
  inCanvas.width = img.width;
  inCanvas.height = img.height;
  const inCtx = inCanvas.getContext("2d");
  inCtx.drawImage(img, 0, 0);

  await seg.send({ image: inCanvas });
}

function downloadPng() {
  const a = document.createElement("a");
  const { w, h } = parsePreset(presetEl?.value ?? "1920x1080");
  const filename = `africa_${w}x${h}.png`;
  a.download = filename;
  a.href = outCanvas.toDataURL("image/png");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function wireRerender() {
  const inputs = [presetEl, scaleEl, offsetXEl, offsetYEl, featherEl].filter(Boolean);
  for (const el of inputs) {
    el.addEventListener("input", () => {
      if (currentImg && lastMask) renderComposite();
    });
    el.addEventListener("change", () => {
      if (currentImg && lastMask) renderComposite();
    });
  }
}

fileEl?.addEventListener("change", async (e) => {
  const file = e.target?.files?.[0];
  if (!file) return;
  downloadEl.disabled = true;
  lastMask = null;
  setStatus("Загружаю фото…");
  try {
    currentImg = await loadImageFromFile(file);
    await runSegmentation(currentImg);
  } catch (err) {
    console.error(err);
    setStatus("Ошибка: не удалось обработать фото (проверьте интернет и консоль).");
  }
});

downloadEl?.addEventListener("click", () => {
  if (downloadEl.disabled) return;
  downloadPng();
});

// Initial background (so the canvas isn't empty)
(() => {
  const { w, h } = parsePreset(presetEl?.value ?? "1920x1080");
  ensureCanvasSize(w, h);
  drawAfricaBackground(outCtx, w, h);
})();

wireRerender();

