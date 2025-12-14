// Основная логика: реагируем на NFT и Hiro, управляем UI, подключаем эвристику из debug-canvas.js

document.addEventListener('DOMContentLoaded', () => {
  const ui = document.getElementById('ui');
  const testStatus = document.getElementById('test-status');
  const btnShot = document.getElementById('shot');

  const nftMarker = document.getElementById('nft-snowman');
  const hiroMarker = document.getElementById('marker-hiro');

  const cubeNft = document.getElementById('cube-nft');
  const cubeHiro = document.getElementById('cube-hiro');

  function setUI(text) { if (ui) ui.textContent = text; }
  function setTestStatus(text, color = '#222') {
    if (!testStatus) return;
    testStatus.textContent = text;
    testStatus.style.color = color;
  }

  function resetUI() {
    setUI('Наведи камеру на снеговика или Hiro');
    setTestStatus('🔍 Статус: ничего не найдено', '#222');
    cubeNft?.setAttribute('visible', 'true');
    cubeNft?.setAttribute('color', '#ff4444');
    cubeHiro?.setAttribute('visible', 'true');
    cubeHiro?.setAttribute('color', '#4444ff');
  }

  function onFound(source) {
    if (source === 'nft') {
      setUI('Снеговик (NFT) найден 🎯');
      setTestStatus('✅ Найден по NFT', 'green');
      cubeNft?.setAttribute('color', '#22cc22');
      cubeHiro?.setAttribute('visible', 'false');
      window.__debugCanvas?.stopHeur();
    } else if (source === 'hiro') {
      setUI('Метка Hiro найдена 🎯');
      setTestStatus('✅ Найден по Hiro', 'green');
      cubeHiro?.setAttribute('color', '#22cc22');
      cubeNft?.setAttribute('visible', 'false');
      window.__debugCanvas?.stopHeur();
    } else if (source === 'heur') {
      setUI('Фолбэк: снеговик найден 🎯');
      setTestStatus('✅ Найден по цвету', 'green');
      cubeNft?.setAttribute('color', '#22cc22');
      cubeHiro?.setAttribute('visible', 'false');
    }

    clearTimeout(window.__resetTimer);
    window.__resetTimer = setTimeout(resetUI, 3000);
  }

  // Подписки на маркеры
  nftMarker?.addEventListener('markerFound', () => onFound('nft'));
  nftMarker?.addEventListener('markerLost', () => {
    // через 1.2s запускаем эвристику (цветовой фолбэк), если NFT потерян
    setTimeout(() => window.__debugCanvas?.startHeur(), 1200);
  });

  hiroMarker?.addEventListener('markerFound', () => onFound('hiro'));
  hiroMarker?.addEventListener('markerLost', () => { /* no-op */ });

  // Фолбэк уведомляет через handler
  window.__heuristicHandler = () => onFound('heur');

  // Снимок канваса
  btnShot?.addEventListener('click', () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return setUI('Canvas не найден');
    try {
      const dataURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'screenshot.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setUI('Снимок сохранён');
    } catch {
      setUI('Ошибка при сохранении снимка');
    }
  });

  // Стартовый UI
  resetUI();

  // Smoke test: проверка нужных элементов
  window.addEventListener('load', () => {
    const hasScene = !!document.querySelector('a-scene');
    const hasHiro = !!document.getElementById('marker-hiro');
    const hasNft = !!document.getElementById('nft-snowman');
    console.log('[test] scene:', hasScene, 'hiro:', hasHiro, 'nft:', hasNft);
  });
});
