/* ── 3D Organic Blob ── */
(function () {
  let active = false;
  let rafId  = null;
  let resizeHandler = null;
  let scrollHandler = null;

  function loadThree(cb) {
    if (window.THREE) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  function initBlob() {
    if (active) return;
    active = true;

    /* ── Canvas setup ── */
    const canvas = document.createElement('canvas');
    canvas.id = 'blob-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    // Render at fixed size; CSS scales it — GPU work is constant regardless of screen size
    const RENDER_SIZE = 600;
    Object.assign(canvas.style, {
      position:  'fixed',
      top:       '50%',
      left:      '50%',
      width:     '100vmin',
      height:    '100vmin',
      transform: 'translate(-50%, -50%)',
      zIndex:    '1',
      pointerEvents: 'none',
    });
    const noiseCanvas = document.getElementById('noise-canvas');
    noiseCanvas.parentNode.insertBefore(canvas, noiseCanvas.nextSibling);

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(RENDER_SIZE, RENDER_SIZE);

    /* ── Scene / Camera ── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;

    /* ── Vertex shader ── */
    const vertShader = `
      uniform float uTime;
      varying vec3  vNormal;
      varying vec3  vPosition;
      varying float vNoise;

      vec3 mod289(vec3 x){ return x - floor(x*(1./289.))*289.; }
      vec4 mod289(vec4 x){ return x - floor(x*(1./289.))*289.; }
      vec4 permute(vec4 x){ return mod289(((x*34.)+1.)*x); }
      vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }
      float snoise(vec3 v){
        const vec2 C = vec2(1./6., 1./3.);
        const vec4 D = vec4(0., 0.5, 1., 2.);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g  = step(x0.yzx, x0.xyz);
        vec3 l  = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.,i1.z,i2.z,1.))
          + i.y + vec4(0.,i1.y,i2.y,1.))
          + i.x + vec4(0.,i1.x,i2.x,1.));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.*floor(p*ns.z*ns.z);
        vec4 x_ = floor(j*ns.z);
        vec4 y_ = floor(j - 7.*x_);
        vec4 x  = x_*ns.x + ns.yyyy;
        vec4 y  = y_*ns.x + ns.yyyy;
        vec4 h  = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.+1.;
        vec4 s1 = floor(b1)*2.+1.;
        vec4 sh = -step(h, vec4(0.));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.);
        m = m*m;
        return 42.*dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }

      void main(){
        vNormal   = normalize(normalMatrix * normal);
        vPosition = position;
        float t  = uTime * 0.18;
        float n1 = snoise(position * 1.6  + vec3(t*0.7,   t*0.5,  t*0.3));
        float n2 = snoise(position * 3.2  + vec3(-t*0.4,  t*0.6, -t*0.5)) * 0.40;
        float n3 = snoise(position * 6.0  + vec3(t*0.3,  -t*0.4,  t*0.7)) * 0.15;
        float n4 = snoise(position * 14.0 + vec3(t*0.2,   t*0.3, -t*0.2)) * 0.06;
        float n5 = snoise(position * 28.0 + vec3(-t*0.15, t*0.1,  t*0.25)) * 0.03;
        vNoise = n3 + n4 + n5;
        vec3 newPos = position + normal * (n1+n2+n3+n4+n5) * 0.28;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `;

    /* ── Fragment shader ── */
    const fragShader = `
      varying vec3  vNormal;
      varying vec3  vPosition;
      varying float vNoise;
      void main(){
        vec3  viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.2);
        vec3  darkCol = vec3(0.02, 0.02, 0.02);
        vec3  edgeCol = vec3(0.4,  0.4,  0.4);
        vec3  midCol  = vec3(0.1,  0.1,  0.1);
        float midBand = smoothstep(0.3, 0.7, fresnel) * (1.0 - smoothstep(0.7, 1.0, fresnel));
        vec3 col = mix(darkCol, edgeCol, fresnel * fresnel);
        col      = mix(col, midCol, midBand * 0.5);
        col     += edgeCol * smoothstep(0.72, 1.0, fresnel) * 0.6;
        float grain   = vNoise * 3.0;
        col += vec3(grain * 0.13);
        col += vec3(abs(vNoise) * smoothstep(0.2, 0.6, fresnel) * 0.35);
        float alpha = smoothstep(0.0, 0.18, 1.0 - fresnel * 0.3);
        gl_FragColor = vec4(col, alpha * 0.92);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader: vertShader, fragmentShader: fragShader,
      transparent: true, side: THREE.FrontSide,
      uniforms: { uTime: { value: 0 } },
    });

    const geo  = new THREE.IcosahedronGeometry(1, 64);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    /* ── Scroll fade ── */
    let scrollT = 0;
    scrollHandler = () => {
      scrollT = Math.min(window.scrollY / (window.innerHeight * 0.8), 1);
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    /* ── Resize — no-op: renderer is fixed-size, CSS scales ── */
    resizeHandler = () => {};
    window.addEventListener('resize', resizeHandler);

    /* ── Render loop ── */
    const clock = new THREE.Clock();
    let lastBlurPx = -1;

    function tick() {
      rafId = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();
      mat.uniforms.uTime.value = elapsed;
      mesh.rotation.x = 0.2;
      mesh.rotation.y = elapsed * 0.05;
      const sc = 1 - scrollT * 0.25;
      mesh.scale.setScalar(sc);
      const blurPx = Math.round(scrollT * 100) / 10;
      if (blurPx !== lastBlurPx) {
        canvas.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : '';
        lastBlurPx = blurPx;
      }
      renderer.render(scene, camera);
    }
    tick();

    /* ── Store teardown on canvas for destroyBlob ── */
    canvas._blobDestroy = () => {
      cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener('scroll', scrollHandler, { passive: true });
      window.removeEventListener('resize', resizeHandler);
      renderer.dispose();
      mat.dispose();
      geo.dispose();
      canvas.remove();
      active = false;
    };
  }

  window.blobInit = function () {
    loadThree(initBlob);
  };

  window.blobDestroy = function () {
    const canvas = document.getElementById('blob-canvas');
    if (canvas && canvas._blobDestroy) canvas._blobDestroy();
  };

  window.blobInit();
})();
