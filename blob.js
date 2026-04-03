/* ── 3D Organic Blob ── */
(function () {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
  s.onload = initBlob;
  document.head.appendChild(s);

  function initBlob() {
    /* ── Canvas ── */
    const canvas = document.createElement('canvas');
    canvas.id = 'blob-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'fixed', inset: '0',
      width: '100%', height: '100%',
      zIndex: '0', pointerEvents: 'none',
    });
    const noiseCanvas = document.getElementById('noise-canvas');
    noiseCanvas.parentNode.insertBefore(canvas, noiseCanvas.nextSibling);

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const nativeDPR = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(nativeDPR);
    renderer.setSize(window.innerWidth, window.innerHeight);

    /* ── Scene / Camera ── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 4;

    /* ── Shared simplex noise GLSL ── */
    const snoiseFn = `
      vec3 mod289v3(vec3 x){ return x - floor(x*(1./289.))*289.; }
      vec4 mod289v4(vec4 x){ return x - floor(x*(1./289.))*289.; }
      vec4 permute(vec4 x){ return mod289v4(((x*34.)+1.)*x); }
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
        i = mod289v3(i);
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
    `;

    /* ── Fragment shader (shared) ── */
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
        col     += vec3(vNoise * 3.0 * 0.13);
        col     += vec3(abs(vNoise) * smoothstep(0.2, 0.6, fresnel) * 0.35);
        float alpha = smoothstep(0.0, 0.18, 1.0 - fresnel * 0.3);
        gl_FragColor = vec4(col, alpha * 0.92);
      }
    `;

    /* ── HQ vertex shader: 5 noise octaves ── */
    const vertHQ = snoiseFn + `
      uniform float uTime;
      varying vec3  vNormal;
      varying vec3  vPosition;
      varying float vNoise;
      void main(){
        vNormal   = normalize(normalMatrix * normal);
        vPosition = position;
        float t  = uTime * 0.18;
        float n1 = snoise(position * 1.6  + vec3(t*0.7,   t*0.5,  t*0.3));
        float n2 = snoise(position * 3.2  + vec3(-t*0.4,  t*0.6, -t*0.5))  * 0.40;
        float n3 = snoise(position * 6.0  + vec3(t*0.3,  -t*0.4,  t*0.7))  * 0.15;
        float n4 = snoise(position * 14.0 + vec3(t*0.2,   t*0.3, -t*0.2))  * 0.06;
        float n5 = snoise(position * 28.0 + vec3(-t*0.15, t*0.1,  t*0.25)) * 0.03;
        vNoise = n3 + n4 + n5;
        vec3 newPos = position + normal * (n1+n2+n3+n4+n5) * 0.28;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `;

    /* ── LQ vertex shader: 1 noise octave ── */
    const vertLQ = snoiseFn + `
      uniform float uTime;
      varying vec3  vNormal;
      varying vec3  vPosition;
      varying float vNoise;
      void main(){
        vNormal   = normalize(normalMatrix * normal);
        vPosition = position;
        float t  = uTime * 0.18;
        float n1 = snoise(position * 1.6 + vec3(t*0.7, t*0.5, t*0.3));
        vNoise = 0.0;
        vec3 newPos = position + normal * n1 * 0.28;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `;

    function makeMat(vert) {
      return new THREE.ShaderMaterial({
        vertexShader: vert, fragmentShader: fragShader,
        transparent: true, side: THREE.FrontSide,
        uniforms: { uTime: { value: 0 } },
      });
    }
    const matHQ = makeMat(vertHQ);
    const matLQ = makeMat(vertLQ);

    /* ── Geometry pool ── */
    const geoCache = {};
    function getGeo(detail) {
      const steps = [4, 8, 16, 32, 64];
      const sub   = steps[Math.round(detail * (steps.length - 1))];
      if (!geoCache[sub]) geoCache[sub] = new THREE.IcosahedronGeometry(1, sub);
      return geoCache[sub];
    }

    const mesh = new THREE.Mesh(getGeo(1.0), matHQ);
    scene.add(mesh);

    /* ── Detail state ── */
    let frameTarget = 60; // fps cap — throttled in LQ mode

    function applyDetail(d) {
      mesh.geometry = getGeo(d);
      mesh.material = d < 0.5 ? matLQ : matHQ;
      // Drop pixel ratio: 1.0 at full detail → 0.4 at zero
      renderer.setPixelRatio(0.4 + d * (nativeDPR - 0.4));
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Throttle frame rate at low detail
      frameTarget = d < 0.5 ? 30 : 60;
    }

    /* ── Performance slider ── */
    const perfSlider = document.getElementById('perf-slider');
    if (perfSlider) {
      perfSlider.addEventListener('input', () => {
        applyDetail(1 - perfSlider.value / 100);
      });
    }

    /* ── Mouse ── */
    document.addEventListener('mousemove', e => {
      // kept for potential future use
      void e;
    });

    /* ── Scroll fade ── */
    let scrollT = 0;
    window.addEventListener('scroll', () => {
      scrollT = Math.min(window.scrollY / (window.innerHeight * 0.8), 1);
    }, { passive: true });

    /* ── Resize ── */
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ── Render loop with frame throttle ── */
    const clock = new THREE.Clock();
    let lastBlurPx  = -1;
    let lastFrameTs = 0;

    function tick(ts) {
      requestAnimationFrame(tick);

      // Frame throttle
      const minInterval = 1000 / frameTarget;
      if (ts - lastFrameTs < minInterval) return;
      lastFrameTs = ts;

      const elapsed = clock.getElapsedTime();
      mesh.material.uniforms.uTime.value = elapsed;
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
    requestAnimationFrame(tick);
  }
})();
