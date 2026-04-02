/* ── 3D Organic Blob ── */
(function () {
  // Inject Three.js from CDN then boot
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
  s.onload = initBlob;
  document.head.appendChild(s);

  function initBlob() {
    /* ── Canvas setup ── */
    const canvas = document.createElement('canvas');
    canvas.id = 'blob-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position:  'fixed',
      inset:     '0',
      width:     '100%',
      height:    '100%',
      zIndex:    '0',
      pointerEvents: 'none',
    });
    // Insert after the noise canvas so it renders above the dark bg but below content
    const noiseCanvas = document.getElementById('noise-canvas');
    noiseCanvas.parentNode.insertBefore(canvas, noiseCanvas.nextSibling);

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    /* ── Scene / Camera ── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 4;

    /* ── Shader material ── */
    const vertShader = `
      uniform float uTime;
      uniform float uMouse; // subtle mouse influence
      varying vec3  vNormal;
      varying vec3  vPosition;
      varying float vNoise;

      //  Simplex 3D noise (Stefan Gustavson)
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

        float t  = uTime * 0.28;
        float n1 = snoise(position * 1.6 + vec3(t * 0.7, t * 0.5, t * 0.3));
        float n2 = snoise(position * 3.2 + vec3(-t * 0.4, t * 0.6, -t * 0.5)) * 0.4;
        float n3 = snoise(position * 6.0 + vec3(t * 0.3, -t * 0.4, t * 0.7)) * 0.15;
        // High-frequency grain layer
        float n4 = snoise(position * 14.0 + vec3(t * 0.2, t * 0.3, -t * 0.2)) * 0.06;
        float n5 = snoise(position * 28.0 + vec3(-t * 0.15, t * 0.1, t * 0.25)) * 0.03;
        float displacement = n1 + n2 + n3 + n4 + n5;

        // Pass raw surface noise to fragment for texture coloring
        vNoise = n3 + n4 + n5;

        vec3 newPos = position + normal * displacement * 0.28;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `;

    const fragShader = `
      varying vec3  vNormal;
      varying vec3  vPosition;
      varying float vNoise;

      void main(){
        // Fresnel — bright edge glow
        vec3  viewDir  = normalize(cameraPosition - vPosition);
        float fresnel  = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.2);

        // Core darkness
        vec3  darkCol  = vec3(0.02, 0.03, 0.04);   // near-black interior
        vec3  edgeCol  = vec3(0.88, 0.92, 0.95);   // cool white edge

        // Subtle warm-grey mid tones
        vec3  midCol   = vec3(0.20, 0.22, 0.24);
        float midBand  = smoothstep(0.3, 0.7, fresnel) * (1.0 - smoothstep(0.7, 1.0, fresnel));

        vec3 col = mix(darkCol, edgeCol, fresnel * fresnel);
        col      = mix(col, midCol, midBand * 0.5);

        // Thin bright rim
        float rim  = smoothstep(0.72, 1.0, fresnel);
        col       += edgeCol * rim * 0.6;

        // Surface grain: modulate brightness by high-freq noise
        float grain = vNoise * 3.0;
        col += vec3(grain * 0.18);
        // Scratch-like streaks in the mid zone
        float scratch = abs(vNoise) * smoothstep(0.2, 0.6, fresnel) * 0.35;
        col += vec3(scratch);

        // Alpha: fully opaque core, fade to transparent at extremes
        float alpha = smoothstep(0.0, 0.18, 1.0 - fresnel * 0.3);

        gl_FragColor = vec4(col, alpha * 0.92);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader:   vertShader,
      fragmentShader: fragShader,
      transparent:    true,
      side:           THREE.FrontSide,
      uniforms: {
        uTime:  { value: 0 },
        uMouse: { value: 0 },
      },
    });

    /* ── Geometry ── */
    const geo  = new THREE.IcosahedronGeometry(1, 64);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    /* ── Mouse influence ── */
    let targetMouseX = 0, targetMouseY = 0;
    let currentRotX  = 0, currentRotY  = 0;
    document.addEventListener('mousemove', e => {
      targetMouseX = (e.clientX / window.innerWidth  - 0.5) * 0.4;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
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

    /* ── Render loop ── */
    const clock = new THREE.Clock();
    function tick() {
      requestAnimationFrame(tick);

      const elapsed = clock.getElapsedTime();
      mat.uniforms.uTime.value = elapsed;

      // Smooth mouse rotation
      currentRotX += (targetMouseY - currentRotX) * 0.04;
      currentRotY += (targetMouseX - currentRotY) * 0.04;
      mesh.rotation.x = currentRotX;
      mesh.rotation.y = elapsed * 0.12 + currentRotY;

      // Scroll-based scale-down + blur (stays visible, goes out of focus)
      const s = 1 - scrollT * 0.25;
      mesh.scale.setScalar(s);
      const blurPx = scrollT * 10;
      canvas.style.filter = blurPx > 0 ? `blur(${blurPx.toFixed(1)}px)` : '';

      renderer.render(scene, camera);
    }
    tick();
  }
})();
