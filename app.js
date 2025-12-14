// Minimal logic: show models when Hiro is found, hide when lost.
// No custom positioning — AR.js handles alignment to the marker.
document.addEventListener('DOMContentLoaded', () => {
  const marker = document.getElementById('hiro-marker');
  const model1 = document.getElementById('model1');
  const model2 = document.getElementById('model2'); // may be null if commented

  const showModels = () => {
    if (model1) model1.setAttribute('visible', true);
    if (model2) model2.setAttribute('visible', true);
  };
  const hideModels = () => {
    if (model1) model1.setAttribute('visible', false);
    if (model2) model2.setAttribute('visible', false);
  };

  marker.addEventListener('markerFound', showModels);
  marker.addEventListener('markerLost', hideModels);
});
