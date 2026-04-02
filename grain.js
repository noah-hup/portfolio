/**
 * grain.js
 * Renders a single static frame of fine paper-grain noise, then stops.
 * The canvas is never redrawn — the noise is completely still.
 *
 * Technique: softer biased distribution with tighter value range
 * for a subtle matte paper texture.
 */
(function () {
  const canvas = document.getElementById('noise-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function bake() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Use device pixel ratio for crisp grain on retina screens
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    const img = ctx.createImageData(canvas.width, canvas.height);
    const d   = img.data;
    const len = d.length;

    for (let i = 0; i < len; i += 4) {
      const rnd = Math.random();
      let v;

      // Softer, more subtle paper grain
      // ~80% very light
      // ~19% light-mid
      // ~1% slightly darker speck
      if (rnd < 0.80) {
        v = 30 + (Math.random() * 69) | 0;    // 30–60  (dark grain)
      } else if (rnd < 0.99) {
        v = 15 + (Math.random() * 35) | 0;    // 15–35
      } else {
        v = 60 + (Math.random() * 60) | 0;    // 60–90  (rare lighter speck)
      }

      // Slight cool blue-teal tint to grain
      d[i]     = v;
      d[i + 1] = v + ((Math.random() * 4) | 0);
      d[i + 2] = v + ((Math.random() * 8) | 0);
      d[i + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
    // Done — no animation loop, grain is frozen.
  }

  // Bake once on load
  bake();

  // Rebake on resize
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(bake, 120);
  });
})();