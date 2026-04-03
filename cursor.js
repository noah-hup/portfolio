/* ── Network connections: letters + cursor ── */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'network-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Cursor connects at a slightly wider range so it reaches letters naturally
  const CURSOR_CONNECT_DIST = 400;
  // Max connections per letter node (keeps lines sparse / readable)
  const MAX_EDGES_PER_NODE = 8;

  // Line style
  const LINE_COLOR_BASE = [160, 220, 235]; // rgb
  const LINE_OPACITY_MAX = 0.78;

  let mouse = { x: -9999, y: -9999 };
  let loadDone = false;

  // Cache offscreen canvas pixel data per letter element
  const letterPixelCache = new WeakMap();

  document.fonts.ready.then(() => {
    // Populate letter cache and bust anchor cache so glyphs are re-sampled with the correct font
    cachedLetters = Array.from(document.querySelectorAll('.name-letter'));
    cachedLetters.forEach(el => letterPixelCache.delete(el));
  });

  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    // Rect positions change on resize — bust the pixel cache
    document.querySelectorAll('.name-letter').forEach(el => letterPixelCache.delete(el));
  }
  window.addEventListener('resize', resize);
  resize();

  // Wait for letter animation to finish before drawing (same gate as physics)
  document.addEventListener('DOMContentLoaded', () => {
    const letters = document.querySelectorAll('.name-letter');
    if (!letters.length) { loadDone = true; return; }
    const last = letters[letters.length - 1];
    last.addEventListener('animationend', () => { loadDone = true; }, { once: true });
    // Fallback: enable after 2.5s regardless
    setTimeout(() => { loadDone = true; }, 2500);
  });

  // Number of fixed anchor directions sampled around each glyph
  const ANCHOR_RAYS = 72;

  function buildLetterAnchors(el) {
    const r = el.getBoundingClientRect();
    const w = Math.ceil(r.width);
    const h = Math.ceil(r.height);
    const cached = letterPixelCache.get(el);
    if (cached && cached.w === w && cached.h === h) return cached;

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');

    const style = window.getComputedStyle(el);
    octx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    octx.textBaseline = 'top';
    octx.fillStyle = '#fff';
    octx.fillText(el.textContent, 0, 0);

    const data = octx.getImageData(0, 0, w, h).data;

    // Glyph center in local coords
    const lcx = w / 2;
    const lcy = h / 2;
    const maxR = Math.sqrt(w * w + h * h);

    // For each ray direction, find the outermost opaque pixel on the glyph edge
    const anchors = [];
    for (let a = 0; a < ANCHOR_RAYS; a++) {
      const angle = (a / ANCHOR_RAYS) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let lastHit = null;
      for (let s = 0; s < maxR; s++) {
        const lx = Math.round(lcx + dx * s);
        const ly = Math.round(lcy + dy * s);
        if (lx < 0 || ly < 0 || lx >= w || ly >= h) break;
        if (data[(ly * w + lx) * 4 + 3] > 32) lastHit = { lx, ly };
      }
      if (lastHit) {
        // Store as world coords (relative to viewport)
        anchors.push({ x: r.left + lastHit.lx, y: r.top + lastHit.ly });
      }
    }

    // Fallback: glyph center
    if (!anchors.length) anchors.push({ x: r.left + lcx, y: r.top + lcy });

    const entry = { w, h, anchors };
    letterPixelCache.set(el, entry);
    return entry;
  }

  // Return the fixed anchor point on the glyph closest to (fromX, fromY)
  function getLetterEdgePoint(el, fromX, fromY) {
    const { anchors } = buildLetterAnchors(el);
    let best = anchors[0], bestD2 = Infinity;
    for (const a of anchors) {
      const dx = a.x - fromX, dy = a.y - fromY;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = a; }
    }
    return best;
  }

  // Draw a line that is opaque at the cursor end and fades to transparent at the letter end
  function drawLine(x1, y1, x2, y2, dist, maxDist) {
    const t = 1 - dist / maxDist;           // 1 = close, 0 = at threshold
    const alphaStart = t * t * LINE_OPACITY_MAX;
    if (alphaStart < 0.005) return;

    const [r, g, b] = LINE_COLOR_BASE;
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alphaStart.toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.5 + t * 0.8;
    ctx.stroke();
  }

  // Cache the letter NodeList once after fonts load (avoids querySelectorAll every frame)
  let cachedLetters = null;
  document.fonts.ready.then(() => {
    cachedLetters = Array.from(document.querySelectorAll('.name-letter'));
  });

  // All interactive nodes (a, button) excluding name-letters — refreshed on resize/mutation
  let cachedInteractive = null;
  function getInteractive() {
    if (cachedInteractive) return cachedInteractive;
    cachedInteractive = Array.from(document.querySelectorAll('a, button')).filter(
      el => !el.classList.contains('name-letter') && el.offsetParent !== null
    );
    return cachedInteractive;
  }
  window.addEventListener('resize', () => { cachedInteractive = null; });
  // Bust cache when DOM changes (e.g. project links rendered by JS)
  new MutationObserver(() => { cachedInteractive = null; })
    .observe(document.body, { childList: true, subtree: true });

  // Reusable candidates array — avoids allocation per frame
  const cursorCandidates = [];

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!loadDone || !cachedLetters) {
      requestAnimationFrame(draw);
      return;
    }

    const mx = mouse.x, my = mouse.y;
    const hasCursor = mx > -1000;

    // Cursor → letters
    if (hasCursor) {
      cursorCandidates.length = 0;
      for (let i = 0, n = cachedLetters.length; i < n; i++) {
        const ep = getLetterEdgePoint(cachedLetters[i], mx, my);
        const dx = ep.x - mx, dy = ep.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < CURSOR_CONNECT_DIST) cursorCandidates.push({ d, ep });
      }
      cursorCandidates.sort((a, b) => a.d - b.d);
      const limit = Math.min(cursorCandidates.length, MAX_EDGES_PER_NODE);
      for (let i = 0; i < limit; i++) {
        const { d, ep } = cursorCandidates[i];
        drawLine(mx, my, ep.x, ep.y, d, CURSOR_CONNECT_DIST);
      }

      // Cursor → all interactive elements (center-point, same distance threshold)
      const interactive = getInteractive();
      for (let i = 0; i < interactive.length; i++) {
        const r = interactive[i].getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = cx - mx, dy = cy - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < CURSOR_CONNECT_DIST) drawLine(mx, my, cx, cy, d, CURSOR_CONNECT_DIST);
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
