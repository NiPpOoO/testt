// Экспортирует window.__debugCanvas.startHeur/stopHeur и вызывает window.__heuristicHandler() при срабатывании

(function () {
  'use strict';

  window.addEventListener('load', () => {
    // контейнер
    let wrap = document.getElementById('debug-test-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'debug-test-wrap';
      document.body.appendChild(wrap);
      Object.assign(wrap.style, {
        position: 'fixed',
        right: '10px',
        top: '10px',
        zIndex: 100000,
        display: 'flex',
        gap: '6px',
        pointerEvents: 'none',
        alignItems: 'flex-start'
      });
    }

    // оригинальный кадр
    let orig = document.getElementById('debug-test-orig');
    if (!orig) {
      orig = document.createElement('canvas');
      orig.id = 'debug-test-orig';
      orig.width = 320; orig.height = 240;
      Object.assign(orig.style, { width: '160px', height: '120px', border: '2px solid rgba(0,0,0,0.25)', background: '#111' });
      wrap.appendChild(orig);
    }

    // маска
    let mask = document.getElementById('debug-test-mask');
    if (!mask) {
      mask = document.createElement('canvas');
      mask.id = 'debug-test-mask';
      mask.width = 320; mask.height = 240;
      Object.assign(mask.style, { width: '160px', height: '120px', border: '2px solid rgba(0,0,0,0.25)', background: '#000' });
      wrap.appendChild(mask);
    }

    const origCtx = orig.getContext('2d');
    const maskCtx = mask.getContext('2d');

    const INTERVAL_MS = 300;
    const HEUR_THRESHOLD = 0.02; // доля пикселей
    const CONS_FRAMES = 2;

    let intervalId = null;
    const history = [];

    function rgbIsRedOrange(r, g, b) {
      if (r > 140 && g < 120 && b < 120 && r > g + 30 && r > b + 30) return true;
      if (r > 120 && g > 60 && b < 100 && r > g + 20) return true;
      return false;
    }

    function analyzeOnce() {
      const video = document.querySelector('video');
      const canvases = Array.from(document.querySelectorAll('canvas')).filter(c => c.id !== orig.id && c.id !== mask.id);
      const glCanvas = canvases.length ? canvases[0] : null;

      try {
        if (video && video.readyState >= 2) origCtx.drawImage(video, 0, 0, orig.width, orig.height);
        else if (glCanvas) origCtx.drawImage(glCanvas, 0, 0, orig.width, orig.height);
        else return null;
      } catch (e) {
        console.warn('debug-canvas drawImage failed', e);
        return null;
      }

      const img = origCtx.getImageData(0, 0, orig.width, orig.height);
      const out = maskCtx.createImageData(orig.width, orig.height);
      let match = 0;
      const total = orig.width * orig.height;

      for (let i = 0; i < img.data.length; i += 4) {
        const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
        if (rgbIsRedOrange(r, g, b)) {
          match++;
          out.data[i] = 255; out.data[i + 1] = 255; out.data[i + 2] = 255; out.data[i + 3] = 255;
        } else {
          out.data[i] = 0; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 0;
        }
      }

      maskCtx.putImageData(out, 0, 0);
      const ratio = match / total;
      history.push(ratio >= HEUR_THRESHOLD ? 1 : 0);
      if (history.length > CONS_FRAMES) history.shift();
      const sum = history.reduce((a, b) => a + b, 0);

      const statusEl = document.getElementById('test-status');
      if (statusEl) statusEl.textContent = `Фолбэк: ${(ratio * 100).toFixed(2)}% (hist ${sum}/${history.length})`;

      if (sum >= CONS_FRAMES) {
        stopHeur();
        try {
          if (typeof window.__heuristicHandler === 'function') {
            window.__heuristicHandler();
          } else {
            window.dispatchEvent(new CustomEvent('heurFoundDefault'));
          }
        } catch (e) {
          console.warn('heuristic handler error', e);
        }
      }
      return ratio;
    }

    function startHeur() {
      if (intervalId) return;
      history.length = 0;
      intervalId = setInterval(analyzeOnce, INTERVAL_MS);
      console.log('debug-canvas: heur started');
    }

    function stopHeur() {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
      history.length = 0;
      console.log('debug-canvas: heur stopped');
      const statusEl = document.getElementById('test-status');
      if (statusEl) statusEl.textContent = '🔍 Статус: ничего не найдено';
    }

    window.__debugCanvas = { startHeur, stopHeur };
    console.log('debug-canvas: ready');
  });
})();
