/* Container Haz configurator - scene, UI, persistence. */
(function (CHZ) {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.THREE || !THREE.OrbitControls) {
    $('#stage').insertAdjacentHTML('beforeend', '<div class="fail">The 3D engine could not load. Check the internet connection and reload the page.</div>');
    return;
  }

  // ------------------------------------------------------------------ state
  let cfg = Object.assign({}, CHZ.DEFAULTS, store.get('chz.current.v1', {}));
  CHZ.applyRules(cfg, null);
  const view = { cut: false, night: false, dims: false, t: 1, preset: 'exterior', hq: false, present: false };

  // ------------------------------------------------------------------ renderer + scene
  const stage = $('#stage');
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 3;
  controls.maxDistance = 70;
  controls.target.set(0, 1.3, 0);

  const hemi = new THREE.HemisphereLight('#e3edf7', '#6b6a55', 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff2df', 1.55);
  sun.position.set(14, 20, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.25);
  fill.position.set(-12, 8, -10);
  scene.add(fill);

  // ground
  // ground disc 240 m, UVs in metres so photo textures tile at real scale
  const groundGeo = new THREE.CircleGeometry(120, 64);
  { const uv = groundGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * 240, (uv.getY(i) - 0.5) * 240); }
  const GROUND_COL = { grass: '#6f8c4b', forest: '#5d4c36', snow: '#e8ecef' };
  const groundStd = {};
  function plannedGround(kind) {
    if (groundStd[kind]) return groundStd[kind];
    const t = new THREE.CanvasTexture(CHZ.tex.canvasFor({ k: kind === 'snow' ? 'concrete' : 'grass', c: GROUND_COL[kind] }, 256));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.25, 0.25); t.encoding = THREE.sRGBEncoding;
    groundStd[kind] = new THREE.MeshStandardMaterial({ map: t, roughness: 1 });
    return groundStd[kind];
  }
  const groundReal = {};
  let groundMat = plannedGround('grass');
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  let padMat = CHZ.house.texMat({ k: 'concrete', c: '#b7b4ad', tile: 3 }, { r: 0.95 });
  let pad = null;

  // ------------------------------------------------------------------ high quality (presentation) rendering
  // Extra three.js modules are loaded only when HQ is first switched on.
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/';
  const HQ_LIBS = ['objects/Sky.js', 'shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js', 'shaders/GammaCorrectionShader.js',
    'postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js', 'postprocessing/ShaderPass.js', 'postprocessing/UnrealBloomPass.js',
    'loaders/RGBELoader.js'];
  let hqLibs = null;
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function ensureHQLibs() {
    if (!hqLibs) hqLibs = HQ_LIBS.reduce((p, f) => p.then(() => loadScript(CDN + f)), Promise.resolve());
    return hqLibs;
  }
  let composer = null, bloom = null, sky = null, pmrem = null, envRT = null, nightBg = null;
  function makeComposer() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, type: THREE.HalfFloatType });
    composer = new THREE.EffectComposer(renderer, rt);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.2, 0.45, 0.9);
    composer.addPass(bloom);
    composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
    const r = stage.getBoundingClientRect();
    composer.setSize(Math.max(1, r.width), Math.max(1, r.height));
  }
  function nightTexture() {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#050a16'); g.addColorStop(0.45, '#14223d'); g.addColorStop(0.52, '#2a3a58'); g.addColorStop(1, '#0c1018');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
    const R = CHZ.tex.rng(3);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 260; i++) { ctx.globalAlpha = 0.25 + R() * 0.75; ctx.fillRect(R() * 512, R() * 110, R() < 0.9 ? 1 : 2, 1); }
    const t = new THREE.CanvasTexture(cv);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  // ---- environments: generated sky or HDRI sky maps (CC0, Poly Haven) in assets/hdri
  const ENVS = [
    { id: 'sky', name: 'Generated sky', ground: 'grass', chip: 'linear-gradient(#7fb0e6,#e6eef3)' },
    { id: 'countryside', name: 'Countryside', file: 'rolling_hills_2k.hdr', ground: 'grass', exp: 0.85, chip: 'linear-gradient(#78a9e0,#d2e4f3 58%,#6f8f4c 60%)' },
    { id: 'golden', name: 'Golden hour', file: 'spruit_sunrise_2k.hdr', ground: 'grass', exp: 0.9, chip: 'linear-gradient(#f0a764,#f6d9ab 58%,#5f6038 60%)' },
    { id: 'overcast', name: 'Overcast', file: 'farmland_overcast_2k.hdr', ground: 'grass', exp: 1.0, chip: 'linear-gradient(#a6adb3,#d9dcde 58%,#737d59 60%)' },
    { id: 'forest', name: 'Forest', file: 'forest_slope_2k.hdr', ground: 'forest', exp: 1.0, chip: 'linear-gradient(#9cc0dc,#dce7ee 50%,#3b5a2d 52%)' },
    { id: 'winter', name: 'Winter', file: 'snowy_field_2k.hdr', ground: 'snow', exp: 0.85, chip: 'linear-gradient(#b4c6d8,#eef2f6 58%,#f5f7f9 60%)' },
    { id: 'night', name: 'Night', file: 'rogland_clear_night_2k.hdr', ground: 'grass', exp: 0.45, night: true, chip: 'linear-gradient(#040915,#1c2a48 58%,#10141b 60%)' },
  ];
  const ENV_BY = {};
  ENVS.forEach((e) => { ENV_BY[e.id] = e; });
  const sceneSaved = store.get('chz.scene.v1', {});
  view.env = ENV_BY[sceneSaved.env] ? sceneSaved.env : 'sky';
  view.textures = sceneSaved.textures === 'realistic' ? 'realistic' : 'planning';
  let lastDayEnv = view.env !== 'night' ? view.env : 'countryside';
  const saveScene = () => store.set('chz.scene.v1', { env: view.env, textures: view.textures });

  const hdrCache = {};
  function analyseHDR(tex) {
    // brightest pixel above the horizon = sun direction; ratio to average tells clear vs overcast; horizon band = haze colour
    const { data, width: w, height: h } = tex.image;
    let best = 0, bi = 0, bj = 0, sum = 0, cnt = 0;
    const hz = [0, 0, 0]; let hn = 0;
    for (let j = 0; j < h; j += 2) {
      for (let i = 0; i < w; i += 2) {
        const k = (j * w + i) * 4, lum = 0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2];
        if (j < h * 0.5) { sum += lum; cnt++; if (lum > best) { best = lum; bi = i; bj = j; } }
        if (j > h * 0.46 && j < h * 0.5) { hz[0] += data[k]; hz[1] += data[k + 1]; hz[2] += data[k + 2]; hn++; }
      }
    }
    const u = (bi + 0.5) / w, v = 1 - (bj + 0.5) / h;
    const phi = (u - 0.5) * Math.PI * 2, el = (v - 0.5) * Math.PI;
    const dir = new THREE.Vector3(Math.cos(phi) * Math.cos(el), Math.sin(el), Math.sin(phi) * Math.cos(el));
    const k = (bj * w + bi) * 4, mx = Math.max(data[k], data[k + 1], data[k + 2], 1e-6);
    return { dir, ratio: best / Math.max(1e-6, sum / cnt), sunColor: new THREE.Color(data[k] / mx, data[k + 1] / mx, data[k + 2] / mx), horizon: hz.map((x) => x / Math.max(1, hn)) };
  }
  function loadHDR(env) {
    if (hdrCache[env.id]) return hdrCache[env.id];
    toast('Loading the ' + env.name + ' sky map…');
    // sky maps ship as base64 text (.hdr.b64.txt) because the web host only serves common file types
    hdrCache[env.id] = fetch('assets/hdri/' + env.file + '.b64.txt').then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then((b64) => new Promise((res) => {
      const bin = atob(b64.trim()), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const l = new THREE.RGBELoader();
      l.setDataType(THREE.FloatType);
      const d0 = l.parse(bytes.buffer);
      const tex = new THREE.DataTexture(d0.data, d0.width, d0.height, THREE.RGBAFormat, THREE.FloatType);
      tex.flipY = true; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      tex.encoding = THREE.LinearEncoding; tex.needsUpdate = true;
      {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        const info = analyseHDR(tex);
        // the directional light already plays the sun: clip the sun disc out of the map so reflections and
        // ambient light are not flooded by it (keeps blacks black and colours true)
        const dd = tex.image.data, CLIP = 4;
        for (let i = 0; i < dd.length; i += 4) { const m = Math.max(dd[i], dd[i + 1], dd[i + 2]); if (m > CLIP) { const f = CLIP / m; dd[i] *= f; dd[i + 1] *= f; dd[i + 2] *= f; } }
        tex.needsUpdate = true;
        res({ tex, info, rt: pmrem.fromEquirectangular(tex) });
      }
    })).catch((e) => { delete hdrCache[env.id]; throw e; });
    return hdrCache[env.id];
  }
  function hazeColor(lin, exp) {
    const t = (x) => { x *= exp; x = x / (1 + x); return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; };
    return new THREE.Color().setRGB(t(lin[0]), t(lin[1]), t(lin[2])).convertSRGBToLinear();
  }
  function setGround(kind) {
    const real = view.hq && view.textures === 'realistic';
    let m;
    if (real) {
      if (!groundReal[kind]) { groundReal[kind] = CHZ.house.pbrMaterial(kind, null, { r: 0.6 }); groundReal[kind].envMapIntensity = 0.4; }
      m = groundReal[kind];
    } else {
      m = plannedGround(kind);
      m.bumpMap = view.hq ? m.map : null; m.bumpScale = 0.02; m.envMapIntensity = 0.35; m.needsUpdate = true;
    }
    if (ground.material !== m) { ground.material = m; groundMat = m; }
  }

  let genKey = '', genRT = null, envToken = 0;
  async function updateEnvironment() {
    const token = ++envToken;
    if (!view.hq || !pmrem) {
      scene.background = null; scene.environment = null; scene.fog = null;
      if (sky) sky.visible = false;
      setGround('grass');
      return;
    }
    const env = ENV_BY[view.env] || ENVS[0];
    setGround(env.ground);
    if (env.file) {
      let d;
      try { d = await loadHDR(env); }
      catch (e) { toast('The ' + env.name + ' sky map could not load. Showing the generated sky.'); view.env = 'sky'; renderScenePanel(); return updateEnvironment(); }
      if (token !== envToken) return; // a newer change won
      sky.visible = false;
      scene.background = d.tex;
      scene.environment = d.rt.texture;
      const exp = env.exp || 1;
      renderer.toneMappingExposure = exp;
      scene.fog = new THREE.Fog(hazeColor(d.info.horizon, exp), 55, 150);
      hemi.intensity = 0; fill.intensity = 0;
      const clear = d.info.ratio > 40 && !env.night;
      const dir = d.info.dir.clone();
      if (dir.y < 0.12) dir.y = 0.12;
      sun.position.copy(dir.normalize().multiplyScalar(30));
      sun.color.copy(d.info.sunColor);
      sun.intensity = env.night ? 0.06 : clear ? 2.4 : 0.35;
      sun.shadow.radius = clear ? 2 : 8;
      return;
    }
    // generated sky (procedural Preetham sky by day, starry gradient at night)
    sun.position.set(14, 20, 12);
    sun.shadow.radius = 3;
    const key = view.night ? 'night' : 'day';
    if (key !== genKey || !genRT) {
      if (genRT) genRT.dispose();
      if (view.night) {
        nightBg = nightBg || nightTexture();
        genRT = pmrem.fromEquirectangular(nightBg);
      } else {
        const u = sky.material.uniforms;
        u.turbidity.value = 4; u.rayleigh.value = 2.2; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82;
        u.sunPosition.value.copy(sun.position).normalize();
        const envScene = new THREE.Scene();
        const skyCopy = new THREE.Sky();
        skyCopy.scale.setScalar(100);
        skyCopy.material.uniforms = THREE.UniformsUtils.clone(u);
        envScene.add(skyCopy);
        const gnd = new THREE.Mesh(new THREE.CircleGeometry(90, 32), new THREE.MeshBasicMaterial({ color: '#5d6e45' }));
        gnd.rotation.x = -Math.PI / 2; gnd.position.y = -1;
        envScene.add(gnd);
        genRT = pmrem.fromScene(envScene, 0.02);
        skyCopy.geometry.dispose(); gnd.geometry.dispose();
      }
      genKey = key;
    }
    if (view.night) { sky.visible = false; scene.background = nightBg; scene.fog = new THREE.Fog('#141d2c', 70, 150); }
    else { sky.material.uniforms.sunPosition.value.copy(sun.position).normalize(); sky.visible = true; scene.background = null; scene.fog = new THREE.Fog('#cdd9e2', 70, 160); }
    scene.environment = genRT.texture;
  }

  function applyQuality() {
    CHZ.house.setQuality(view.hq ? (view.textures === 'realistic' ? 'real' : 'hq') : 'std');
    // the plinth is not a catalog item, so realistic mode may use the photo-scanned concrete for it
    if (view.hq && view.textures === 'realistic') {
      padMat = padMat.userData && padMat.userData.photo ? padMat : CHZ.house.pbrMaterial('concrete', { k: 'concrete', c: '#8e8a83' }, { r: 0.75 });
      padMat.userData.photo = true;
    } else padMat = CHZ.house.texMat({ k: 'concrete', c: '#b7b4ad', tile: 3 }, { r: 0.95 });
  }
  async function setHQ(on) {
    if (on) {
      const btn = $('#btnHQ');
      btn.disabled = true;
      try { await ensureHQLibs(); }
      catch (e) { btn.disabled = false; toast('High quality mode needs an internet connection to load. Try again when online.'); return false; }
      btn.disabled = false;
      if (!pmrem) { pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader(); }
      if (!sky) { sky = new THREE.Sky(); sky.scale.setScalar(350); scene.add(sky); }
      if (!composer) makeComposer();
    }
    view.hq = on;
    applyQuality();
    const ms = on ? 4096 : 2048;
    if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    sun.shadow.radius = on ? 3 : 1;
    const g = CHZ.house.shared.glass;
    g.opacity = on ? 0.26 : 0.32; g.roughness = on ? 0.02 : 0.05; g.metalness = on ? 0.55 : 0.35; g.needsUpdate = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, on ? 2 : 1.5));
    if (on && ENV_BY[view.env].file) view.night = !!ENV_BY[view.env].night;
    if (!on) { sun.position.set(14, 20, 12); sun.shadow.radius = 1; }
    resize();
    rebuild();
    $('#btnHQ').setAttribute('aria-pressed', String(on));
    $('#btnScene').hidden = !on;
    $('#scenePanel').hidden = !on || !view.sceneOpen;
    store.set('chz.hq.v1', on);
    return true;
  }
  view.sceneOpen = true;
  function setTextures(mode) {
    view.textures = mode; saveScene();
    if (view.hq) { applyQuality(); rebuild(); }
    renderScenePanel();
    if (mode === 'realistic') toast('Realistic: your catalog textures in high definition with true surface relief.');
  }
  function setEnv(id) {
    const env = ENV_BY[id]; if (!env) return;
    view.env = id; saveScene();
    if (!env.night) lastDayEnv = id;
    if (env.file) view.night = !!env.night;
    renderScenePanel();
    applyNight();
  }
  function renderScenePanel() {
    $$('#texSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tex === view.textures)));
    $('#envGrid').innerHTML = ENVS.map((e) => `<button type="button" data-env="${e.id}" aria-pressed="${e.id === view.env}"><span class="ec" style="background:${e.chip}"></span><span>${e.name}</span></button>`).join('');
  }

  // ------------------------------------------------------------------ build / rebuild
  let H = null;
  let dimsGroup = null;
  function rebuild() {
    if (H) { scene.remove(H.root); CHZ.house.disposeTree(H.root); }
    H = CHZ.house.build(cfg, { cut: view.cut, cutSides: view.cut ? (view.cutSides || cameraSides()) : null, cutInterior: view.cutInterior, renderer, plinth: PLINTH_H });
    // the house stands on a raised concrete plinth; garden items (pool, outdoor kitchen) stay on the ground
    H.root.position.y = PLINTH_H;
    H.outside.position.y = -PLINTH_H;
    scene.add(H.root);
    buildPlinth();
    applyExpansion();
    applyNight();
    applyFrameMode();
  }

  // ---- raised concrete foundation: slab + footing reveal + gravel apron + entrance step
  const PLINTH_H = 0.28;
  const gravelMat = () => CHZ.house.texMat({ k: 'terrazzo', c: '#8f8a80', cs: ['#b7b1a5', '#6c675f', '#d2ccc0', '#55524c'], fine: 1, tile: 1.5 }, { r: 1 });
  const footMat = () => CHZ.house.stdMat('#6f6d68', { r: 0.95 });
  function slab(w, h, d, mat, x, y, z) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    CHZ.house.planarUV(g);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    pad.add(m);
    return m;
  }
  function buildPlinth() {
    if (pad) { scene.remove(pad); pad.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    pad = new THREE.Group();
    const LYp = CHZ.layout(cfg);
    const stairEast = LYp.entry.wall === 'end' && LYp.entry.side === 'west';
    const mWest = cfg.terrace && !stairEast ? 1.35 : 0.85, mEast = cfg.terrace && stairEast ? 1.35 : 0.85; // the terrace stair lands on one end
    const m = 0.85, w = H.L + mEast + mWest, d = H.W + 2 * m, cx = (mEast - mWest) / 2;
    const hx0 = cx - w / 2, hx1 = cx + w / 2, hz0 = -d / 2, hz1 = d / 2;
    // connected patio: one lower slab joined to the house plinth, under the deck, outdoor kitchen and pool
    let px0 = hx0, px1 = hx1, pz1 = hz1, eastX = hx1;
    if (H.decks && H.decks.length) H.decks.forEach((dk) => { px0 = Math.min(px0, dk.x0 - 0.5); px1 = Math.max(px1, dk.x1 + 0.9); pz1 = Math.max(pz1, dk.z1 + 0.9); eastX = Math.max(eastX, dk.x1 + 0.9); });
    if (H.yard) { px0 = Math.min(px0, H.yard.x0 - 0.8); px1 = Math.max(px1, H.yard.x1 + 0.8); pz1 = Math.max(pz1, H.yard.z1 + 0.8); }
    const gx0 = Math.min(hx0, px0), gx1 = Math.max(hx1, px1), gz1 = Math.max(hz1, pz1);
    slab(gx1 - gx0 + 1.3, 0.025, gz1 - hz0 + 1.3, gravelMat(), (gx0 + gx1) / 2, 0.0125, (hz0 + gz1) / 2); // gravel apron around everything
    if (gx1 - gx0 > w + 0.01 || gz1 > hz1 + 0.01) {
      const PH = 0.12; // patio sits lower than the house plinth, so the house still reads as raised
      slab(gx1 - gx0 + 0.06, 0.05, gz1 - hz0 + 0.06, footMat(), (gx0 + gx1) / 2, 0.025, (hz0 + gz1) / 2);
      slab(gx1 - gx0, PH - 0.04, gz1 - hz0, padMat, (gx0 + gx1) / 2, 0.04 + (PH - 0.04) / 2, (hz0 + gz1) / 2);
    }
    slab(w + 0.06, 0.07, d + 0.06, footMat(), cx, 0.035, 0);                   // darker footing reveal
    slab(w, PLINTH_H - 0.07, d, padMat, cx, 0.07 + (PLINTH_H - 0.07) / 2, 0);  // concrete slab
    const sideDeck = H.decks && H.decks.some((dk) => dk.k === 'side');
    if (LYp.entry.wall === 'end') { // entrance step outside the end door (east, or west on a mirrored plan)
      if (LYp.entry.side === 'west') slab(0.5, PLINTH_H / 2, 2.0, padMat, hx0 - 0.25, PLINTH_H / 4, 0);
      else if (!sideDeck) slab(0.5, PLINTH_H / 2, 2.0, padMat, hx1 + 0.25, PLINTH_H / 4, 0);
    } else if (!(H.decks || []).some((dk) => dk.k === 'front')) slab(2.0, PLINTH_H / 2, 0.5, padMat, LYp.entry.x, PLINTH_H / 4, d / 2 + 0.25); // front door step
    // a half step outside every drawn glass door that does not open onto a terrace
    const onDeck = (x, z) => (H.decks || []).some((dk) => x > dk.x0 - 0.05 && x < dk.x1 + 0.05 && z > dk.z0 - 0.05 && z < dk.z1 + 0.05);
    (cfg.gates || []).forEach((g) => {
      if (g.w === 'front' || g.w === 'back') {
        const sz = g.w === 'front' ? 1 : -1;
        if (onDeck(g.x, sz * (H.W / 2 + 0.4))) return;
        slab(2.0, PLINTH_H / 2, 0.5, padMat, g.x, PLINTH_H / 4, sz * (d / 2 + 0.25));
      } else {
        const sx = g.w === 'east' ? 1 : -1;
        if (onDeck(sx * (H.L / 2 + 0.4), g.x)) return;
        slab(0.5, PLINTH_H / 2, 2.0, padMat, g.w === 'east' ? hx1 + 0.25 : hx0 - 0.25, PLINTH_H / 4, g.x);
      }
    });
    scene.add(pad);
  }

  // ---- frame display in cutaway / top views: solid, ghost (see-through) or hidden
  view.frameMode = store.get('chz.frame.v1', 'ghost');
  view.cutInterior = store.get('chz.cutin.v1', true); // cutaway: interior walls cut to 0.9 m (true) or full height
  view.cutMode = store.get('chz.cut.v1', 'facing'); // cutaway: 'facing' (camera-facing walls) or 'all' 
  function applyFrameMode() {
    if (!H) return;
    const active = (view.preset === 'cutaway' || view.preset === 'plan') && !view.plan2d;
    const mode = active ? view.frameMode : 'solid';
    const fm = H.frameMat;
    fm.transparent = mode === 'ghost';
    fm.opacity = mode === 'ghost' ? 0.18 : 1;
    fm.depthWrite = mode !== 'ghost';
    fm.needsUpdate = true;
    H.root.traverse((o) => { if (o.isMesh && o.material === fm) { o.visible = mode !== 'off'; o.castShadow = mode === 'solid'; } });
    const bar = $('#frameBar');
    bar.hidden = !active;
    $$('#frameBar [data-frame]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.frame === view.frameMode)));
    const cm = $('#cutModes'); if (cm) cm.hidden = !(view.preset === 'cutaway');
    $$('#frameBar [data-cut]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cut === view.cutMode)));
    $$('#frameBar [data-cutin]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.cutin === 'cut') === !!view.cutInterior)));
  }

  function applyExpansion() {
    if (!H) return;
    const t = view.t, full = t > 0.999;
    const f = H.setFold(t);
    view.foldW = f.width;
    H.inner.visible = full;
    H.roofX.visible = full;
    buildDims();
    $('#foldRange').value = Math.round(t * 100);
    $('#foldLabel').textContent = f.label;
    $('#btnFold').textContent = t > 0.5 ? 'Fold' : 'Unfold';
  }

  // dimensions overlay
  function labelSprite(text) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(20,28,36,0.86)';
    const r = 26;
    ctx.beginPath(); ctx.moveTo(r, 8); ctx.arcTo(504, 8, 504, 120, r); ctx.arcTo(504, 120, 8, 120, r); ctx.arcTo(8, 120, 8, 8, r); ctx.arcTo(8, 8, 504, 8, r); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 58px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 68);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(1.6, 0.4, 1);
    sp.renderOrder = 10;
    return sp;
  }
  function buildDims() {
    if (dimsGroup) { scene.remove(dimsGroup); dimsGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); }); dimsGroup = null; }
    if (!view.dims || !H) return;
    dimsGroup = new THREE.Group();
    const L = H.L, We = view.foldW != null ? view.foldW : H.W, Hh = 2.8;
    const mat = new THREE.LineBasicMaterial({ color: '#1b2836', depthTest: false, transparent: true });
    const line = (pts) => { const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))); const l = new THREE.Line(g, mat); l.renderOrder = 9; dimsGroup.add(l); };
    const dim = (a, b, tick, label, at) => {
      line([a, b]);
      line([[a[0] - tick[0], a[1] - tick[1], a[2] - tick[2]], [a[0] + tick[0], a[1] + tick[1], a[2] + tick[2]]]);
      line([[b[0] - tick[0], b[1] - tick[1], b[2] - tick[2]], [b[0] + tick[0], b[1] + tick[1], b[2] + tick[2]]]);
      const sp = labelSprite(label);
      sp.position.set(at[0], at[1], at[2]);
      dimsGroup.add(sp);
    };
    const mm = (m) => Math.round(m * 1000).toLocaleString('en-US').replace(/,/g, ' ') + ' mm';
    const zf = We / 2 + 0.7, xe = L / 2 + 0.7;
    dim([-L / 2, 0.05, zf], [L / 2, 0.05, zf], [0, 0, 0.15], mm(L), [0, 0.35, zf]);
    dim([xe, 0.05, -We / 2], [xe, 0.05, We / 2], [0.15, 0, 0], mm(We), [xe, 0.35, 0]);
    dim([xe, 0, zf], [xe, Hh, zf], [0.15, 0, 0], mm(Hh), [xe, Hh / 2, zf + 0.2]);
    scene.add(dimsGroup);
  }

  // day / night
  function applyNight() {
    const n = view.night;
    stage.classList.toggle('night', n);
    hemi.intensity = n ? (view.hq ? 0.05 : 0.12) : (view.hq ? 0.18 : 0.75);
    hemi.color.set(n ? '#5a6f99' : '#e3edf7');
    sun.intensity = n ? 0.12 : 1.55;
    sun.color.set(n ? '#9fb3e0' : '#fff2df');
    fill.intensity = n ? 0.05 : (view.hq ? 0.08 : 0.25);
    renderer.toneMappingExposure = n ? (view.hq ? 1.1 : 1.25) : view.hq ? 0.9 : 1.05;
    if (bloom) { bloom.strength = n ? 0.85 : 0.18; bloom.threshold = n ? 0.6 : 0.92; bloom.radius = n ? 0.6 : 0.4; }
    const sh = CHZ.house.shared;
    sh.glass.emissiveIntensity = n ? 0.45 : 0;
    sh.lamp.emissiveIntensity = n ? 2.2 : 0.25;
    sh.led.emissiveIntensity = n ? 2.4 : 0.6;
    sh.water.emissiveIntensity = n ? 0.5 : 0.06;
    if (H) {
      H.lights.inside.forEach((l) => { l.intensity = n ? 1.1 : 0; });
      H.lights.outside.forEach((l) => { l.intensity = n ? 1.3 : 0; });
    }
    $('#btnNight').setAttribute('aria-pressed', String(n));
    $('#btnNight .lbl').textContent = n ? 'Night' : 'Day';
    updateEnvironment();
  }

  // ------------------------------------------------------------------ camera presets
  let tween = null;
  function camTo(pos, target, instant) {
    if (instant || reduceMotion) { camera.position.copy(pos); controls.target.copy(target); controls.update(); return; }
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur: 750 };
  }
  function preset(name, instant) {
    if (name === 'plan2d') { setPlan2D(true); applyFrameMode(); $$('#views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name))); return; }
    if (view.plan2d) setPlan2D(false);
    view.preset = name;
    const s = CHZ.sizeOf(cfg), R = Math.max(s.L, s.W);
    const wantCut = name === 'cutaway' || name === 'plan';
    if (wantCut !== view.cut) { view.cut = wantCut; rebuild(); }
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const k = (camera.aspect < 1 ? 1.45 : camera.aspect < 1.3 ? 1.15 : 1) * (view.present ? 1.22 : 1);
    if (name === 'exterior') camTo(V((s.L / 2 + R * 0.5 + 2.2) * k, 2.1 + R * 0.08, (s.W / 2 + R * 0.55 + 2.6) * k), V(0, 1.3, 0), instant);
    if (name === 'aerial') camTo(V((s.L * 0.45 + R * 0.4 + 1.5) * k, (R * 0.75 + 5) * k, (s.W / 2 + R * 0.6 + 3.5) * k), V(0, 1, 0), instant);
    if (name === 'cutaway') camTo(V(s.L * 0.15 + 0.5, (R * 0.7 + 5) * k, (s.W / 2 + R * 0.45 + 2.5) * k), V(0, 0.4, -0.3), instant);
    if (name === 'plan') camTo(V(0.001, (R * 1.25 + 5) * k, 0.6), V(0, 0, 0), instant);
    applyFrameMode();
    $$('#views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  }

  // ------------------------------------------------------------------ render loop
  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const draw = () => { if (view.hq && composer) composer.render(); else renderer.render(scene, camera); };
  new ResizeObserver(resize).observe(stage);
  let anim = null;
  function loop(now) {
    if (tween) {
      const k = Math.min(1, (now - tween.start) / tween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(tween.p0, tween.p1, e);
      controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (k >= 1) tween = null;
    }
    if (anim) {
      const k = Math.min(1, (now - anim.start) / anim.dur);
      view.t = anim.from + (anim.to - anim.from) * k;
      applyExpansion();
      if (k >= 1) anim = null;
    }
    controls.update();
    if (view.cut && !view.plan2d && H) updateCutSides(now);
    draw();
    requestAnimationFrame(loop);
  }

  // cutaway: cut down every outer wall that faces the camera (front / back / east / west), updated while orbiting
  let cutCheckT = 0;
  function cameraSides() {
    const d = camera.position.clone().sub(controls.target);
    const h = Math.hypot(d.x, d.z), len = d.length() || 1;
    const sides = { front: false, back: false, east: false, west: false };
    if (view.cutMode === 'all') return { front: true, back: true, east: true, west: true };
    if (h / len < 0.3) return sides; // looking straight down: the open roof is enough
    const nx = d.x / h, nz = d.z / h, th = 0.3;
    sides.front = nz > th; sides.back = nz < -th; sides.east = nx > th; sides.west = nx < -th;
    return sides;
  }
  const sidesKey = (s) => ['front', 'back', 'east', 'west'].filter((k) => s && s[k]).join(',');
  function updateCutSides(now) {
    if (now - cutCheckT < 250) return;
    cutCheckT = now;
    const s = cameraSides();
    if (sidesKey(s) !== sidesKey(view.cutSides)) { view.cutSides = s; rebuild(); }
  }

  // ------------------------------------------------------------------ picking
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const SEC_TITLE = {};
  CHZ.SECTIONS.forEach((s) => { SEC_TITLE[s.id] = s.title; });
  function pick(ev) {
    if (!H) return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObject(H.root, true);
    for (const h of hits) {
      let o = h.object, vis = true;
      while (o) { if (!o.visible) { vis = false; break; } o = o.parent; }
      if (vis && h.object.userData.sec) return h.object.userData.sec;
    }
    return null;
  }
  let down = null, hoverT = 0;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 5) return;
    const sec = pick(e);
    if (sec) openSection(sec);
  });
  const tip = $('#tip');
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons || e.pointerType !== 'mouse') { tip.hidden = true; return; }
    const now = performance.now();
    if (now - hoverT < 60) return;
    hoverT = now;
    const sec = pick(e);
    if (sec && SEC_TITLE[sec]) {
      tip.textContent = SEC_TITLE[sec];
      tip.hidden = false;
      const r = stage.getBoundingClientRect();
      tip.style.left = (e.clientX - r.left + 14) + 'px';
      tip.style.top = (e.clientY - r.top + 14) + 'px';
      canvas.style.cursor = 'pointer';
    } else { tip.hidden = true; canvas.style.cursor = ''; }
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });

  // ------------------------------------------------------------------ UI: option panel
  const panel = $('#sections');
  const openState = store.get('chz.open.v1', { model: true, exterior: true });
  const optionsOf = (it) => (typeof it.options === 'function' ? it.options(cfg) : it.options) || [];
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const UPG = '<span class="upg" title="Upgrade option">UPG</span>';

  function currentOption(it) {
    if (it.type === 'toggle') return null;
    return optionsOf(it).find((o) => String(o.id) === String(cfg[it.key]));
  }
  const drawnCount = () => ({ s: (cfg.glassSpans || []).length, g: (cfg.gates || []).length });
  function isUp(it) {
    if (it.type === 'toggle') return !!(it.up && cfg[it.key]);
    if (it.type === 'drawn') { const d = drawnCount(); return d.s + d.g > 0; }
    const o = currentOption(it);
    return !!(o && o.up);
  }
  function valueText(it) {
    if (it.type === 'toggle') return cfg[it.key] ? 'Yes' : 'No';
    if (it.type === 'drawn') {
      const d = drawnCount();
      return d.s + d.g ? `${d.s} glass section${d.s === 1 ? '' : 's'}, ${d.g} glass door${d.g === 1 ? '' : 's'}` : 'None';
    }
    const o = currentOption(it);
    return o ? o.name : String(cfg[it.key]);
  }

  function swatchStyle(o) {
    if (o.t) return `background-image:url(${CHZ.tex.swatchURL(o.t, 96)})`;
    if (o.c) return `background:${o.c}`;
    if (o.id === 'match') {
      const cl = CHZ.byId(CHZ.CLAD[cfg.cladType], cfg.clad);
      return `background-image:url(${CHZ.tex.swatchURL(cl.t, 96)})`;
    }
    return '';
  }

  function infoHTML(kind) {
    if (kind === 'sandwich') {
      const s = CHZ.byId(CHZ.SANDWICH, cfg.sandwich);
      const cl = CHZ.byId(CHZ.CLAD[cfg.cladType], cfg.clad);
      const skin = cl.t.c || (cl.t.cs && cl.t.cs[0]) || '#888';
      const thk = cfg.panelThk;
      const coreW = 40 + thk * 1.1;
      const pattern = { eps: 'dots', pu: 'none', rockwool: 'fibres', graphite: 'dots', pir: 'none' }[s.id];
      let marks = '';
      const R = CHZ.tex.rng(7);
      for (let i = 0; i < 46; i++) {
        const x = 30 + R() * (coreW - 6), y = 8 + R() * 64;
        if (pattern === 'dots') marks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.4 + R() * 1.8).toFixed(1)}" fill="${s.id === 'graphite' ? '#3d3f43' : '#d9d5c8'}"/>`;
        if (pattern === 'fibres') marks += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q4 -3 8 0" stroke="#9c7a3c" stroke-width="1" fill="none"/>`;
      }
      const u = (0.17 + thk / 1000 / Number(s.lambda)) ** -1;
      return `<div class="info sandwich">
        <svg viewBox="0 0 ${coreW + 70} 80" role="img" aria-label="Wall section: steel skin, ${esc(s.name)} core ${thk} mm, interior panel">
          <rect x="18" y="4" width="8" height="72" fill="${skin}" stroke="var(--ink)" stroke-width=".6"/>
          <rect x="26" y="4" width="${coreW}" height="72" fill="${s.core}" stroke="var(--ink)" stroke-width=".6"/>
          ${marks}
          <rect x="${26 + coreW}" y="4" width="6" height="72" fill="#efebe3" stroke="var(--ink)" stroke-width=".6"/>
          <text x="2" y="44" class="svg-t" transform="rotate(-90 8 40)">OUT</text>
          <text x="${coreW + 40}" y="44" class="svg-t">IN</text>
        </svg>
        <dl><div><dt>Core</dt><dd>${esc(s.name)}</dd></div><div><dt>&lambda; W/mK</dt><dd>${s.lambda}</dd></div>
        <div><dt>Fire class</dt><dd>${esc(s.fire)}</dd></div><div><dt>U wall &asymp;</dt><dd>${u.toFixed(2)} W/m&sup2;K</dd></div></dl>
        <p>${esc(s.note)} Typical values, confirm with the supplier.</p></div>`;
    }
    if (kind === 'electric') {
      const e = CHZ.byId(CHZ.ELECTRIC, cfg.electric);
      const icons = {
        uk: '<rect x="14" y="8" width="6" height="14" rx="1"/><rect x="5" y="28" width="12" height="6" rx="1"/><rect x="27" y="28" width="12" height="6" rx="1"/>',
        eu: '<circle cx="14" cy="24" r="3.4"/><circle cx="30" cy="24" r="3.4"/><rect x="19" y="4" width="6" height="4" rx="1"/><rect x="19" y="40" width="6" height="4" rx="1"/>',
        it: '<circle cx="12" cy="24" r="3"/><circle cx="22" cy="24" r="3"/><circle cx="32" cy="24" r="3"/>',
        au: '<rect x="9" y="12" width="4" height="12" rx="1" transform="rotate(-30 11 18)"/><rect x="31" y="12" width="4" height="12" rx="1" transform="rotate(30 33 18)"/><rect x="20" y="28" width="4" height="12" rx="1"/>',
        us: '<rect x="12" y="12" width="4" height="14" rx="1"/><rect x="28" y="12" width="4" height="16" rx="1"/><path d="M18 34h8v3a4 4 0 0 1-8 0z"/>',
      };
      return `<div class="info electric"><svg viewBox="0 0 44 48" width="44" height="48" aria-hidden="true"><rect x="1" y="1" width="42" height="46" rx="9" fill="var(--surface-2)" stroke="var(--line-strong)"/><g fill="var(--ink)">${icons[e.id]}</g></svg>
        <p><strong>${esc(e.name)} sockets</strong><br>${esc(e.sub)}. Wiring, breaker box and sockets are built to this standard.</p></div>`;
    }
    if (kind === 'plancore') {
      const p = CHZ.PLAN_BY[cfg.layout];
      return `<div class="info"><p style="margin:0"><strong>${esc(p.name)}</strong> &middot; ${p.beds} bedroom${p.beds === 1 ? '' : 's'}, ${p.bathsN} bathroom${p.bathsN === 1 ? '' : 's'} &middot; catalog ${esc(p.page)}.<br>
        Bathrooms always sit in the middle core module: the side wings fold for shipping, so all plumbing stays in the part that never moves.</p></div>`;
    }
    return '';
  }

  function itemHTML(it) {
    const hidden = it.show && !it.show(cfg);
    const opts = optionsOf(it);
    let ctrl = '';
    if (it.type === 'drawn') {
      ctrl = `<div class="drawn"><p class="note">Draw full-height panorama glass and glass double doors on any outer wall, directly on the 2D plan. End walls take one door per panel; not where the bathroom or the main entrance is.</p>
        <div class="row"><button type="button" class="btn primary" data-act="draw-glass">Draw on 2D plan</button>
        ${isUp(it) ? '<button type="button" class="btn" data-act="clear-glass">Remove all</button>' : ''}</div></div>`;
    } else if (it.type === 'plans') {
      ctrl = `<div class="plan-grid" role="group" aria-label="${esc(it.label)}">` + opts.map((o) =>
        `<button type="button" class="plan-card" data-key="${it.key}" data-val="${esc(o.id)}" aria-pressed="${String(o.id) === String(cfg[it.key])}">
          ${CHZ.plan.thumb(cfg.size, o.id, cfg.mirror)}<span class="pc-n">${esc(o.name)}</span><span class="pc-p">${esc(o.sub)}</span></button>`).join('') + '</div>';
    } else if (it.type === 'seg') {
      ctrl = `<div class="seg" role="group" aria-label="${esc(it.label)}">` + opts.map((o) =>
        `<button type="button" data-key="${it.key}" data-val="${esc(o.id)}" aria-pressed="${String(o.id) === String(cfg[it.key])}">
          <span class="n">${esc(o.name)}</span>${o.sub ? `<span class="s">${esc(o.sub)}</span>` : ''}${o.up ? UPG : ''}</button>`).join('') + '</div>';
    } else if (it.type === 'swatch') {
      ctrl = `<div class="sw-grid" role="group" aria-label="${esc(it.label)}">` + opts.map((o) =>
        `<button type="button" class="sw" data-key="${it.key}" data-val="${esc(o.id)}" aria-pressed="${String(o.id) === String(cfg[it.key])}" title="${esc(o.name)}${o.up ? ' (upgrade)' : ''}" aria-label="${esc(o.name)}">
          <span class="chip" style="${swatchStyle(o)}"></span>${o.up ? '<span class="dot"></span>' : ''}<span class="cap">${esc(o.name)}</span></button>`).join('') + '</div>';
    } else if (it.type === 'toggle') {
      ctrl = `<button type="button" class="tog" role="switch" data-key="${it.key}" data-toggle="1" aria-checked="${!!cfg[it.key]}">
        <span class="track"><span class="knob"></span></span><span class="tl">${esc(it.label)}${it.up ? ' ' + UPG : ''}${it.desc ? `<small>${esc(it.desc)}</small>` : ''}</span></button>`;
    }
    const head = it.type === 'toggle' ? '' : `<div class="item-h"><span class="lbl">${esc(it.label)}</span><span class="val">${esc(valueText(it))}</span></div>`;
    return `<div class="item${it.type === 'toggle' ? ' item-tog' : ''}" data-item="${it.key}"${hidden ? ' hidden' : ''}>${head}${ctrl}${it.info ? infoHTML(it.info) : ''}</div>`;
  }

  function sectionBadge(sec) {
    const n = sec.items.filter((it) => !(it.show && !it.show(cfg)) && isUp(it)).length;
    return n ? `<span class="sec-n">${n} UPG</span>` : '';
  }

  function renderPanel() {
    const focusKey = document.activeElement && document.activeElement.dataset ? [document.activeElement.dataset.key, document.activeElement.dataset.val] : null;
    panel.innerHTML = CHZ.SECTIONS.map((sec) => `
      <details class="sec" id="sec-${sec.id}" data-sec="${sec.id}"${openState[sec.id] ? ' open' : ''}>
        <summary><span class="st">${esc(sec.title)}</span>${sectionBadge(sec)}<span class="pg">${esc(sec.pages)}</span></summary>
        <div class="sec-body">${sec.items.map(itemHTML).join('')}</div>
      </details>`).join('');
    if (focusKey && focusKey[0]) {
      const sel = focusKey[1] != null ? `[data-key="${focusKey[0]}"][data-val="${focusKey[1]}"]` : `[data-key="${focusKey[0]}"]`;
      const el = panel.querySelector(sel);
      if (el) el.focus({ preventScroll: true });
    }
  }

  panel.addEventListener('toggle', (e) => {
    const d = e.target.closest && e.target.closest('details.sec');
    if (!d) return;
    openState[d.dataset.sec] = d.open;
    store.set('chz.open.v1', openState);
  }, true);

  panel.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'draw-glass') { preset('plan2d'); setPlanTool('glass'); return; }
    if (act && act.dataset.act === 'clear-glass') { cfg.gates = []; setValue('glassSpans', []); toast('Removed all drawn glass sections and glass doors.'); return; }
    const b = e.target.closest('button[data-key]');
    if (!b) return;
    const key = b.dataset.key;
    let val;
    if (b.dataset.toggle) val = !cfg[key];
    else {
      const raw = b.dataset.val;
      val = typeof CHZ.DEFAULTS[key] === 'number' ? Number(raw) : raw;
    }
    setValue(key, val);
  });

  function openSection(id) {
    const d = $('#sec-' + id);
    if (!d) return;
    d.open = true;
    openState[id] = true;
    store.set('chz.open.v1', openState);
    d.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    d.classList.remove('flash');
    void d.offsetWidth;
    d.classList.add('flash');
  }

  // ------------------------------------------------------------------ state changes
  function setValue(key, val) {
    cfg[key] = val;
    const msgs = CHZ.applyRules(cfg, key);
    commit();
    msgs.forEach(toast);
    if (key === 'size' && !view.plan2d) preset(view.preset === 'plan' || view.preset === 'cutaway' ? view.preset : 'exterior');
  }
  function commit() {
    store.set('chz.current.v1', cfg);
    rebuild();
    renderPanel();
    renderSummary();
    renderBenefits(true);
    if (view.plan2d) renderPlan(false);
  }

  function upgrades() {
    const out = [];
    CHZ.SECTIONS.forEach((sec) => sec.items.forEach((it) => {
      if (it.show && !it.show(cfg)) return;
      if (isUp(it)) out.push({ sec: sec.title, label: it.label, value: valueText(it) });
    }));
    return out;
  }
  function renderSummary() {
    const s = CHZ.sizeOf(cfg);
    const area = s.L * s.W;
    $('#modelSum').innerHTML = `<b>${esc(s.name)}</b><span>${esc(CHZ.LAYOUTS[cfg.layout].name)}</span><span class="num">${area.toFixed(1)} m&sup2;</span>`;
    $('#upCount').textContent = upgrades().length;
    if (view.present) renderCard();
  }

  function specText() {
    const s = CHZ.sizeOf(cfg);
    const lines = [`# Container Haz - ${s.name} expandable house`, '',
      `- Unfolded: ${s.L.toFixed(2)} x ${s.W.toFixed(2)} m (${(s.L * s.W).toFixed(1)} m2), inner height ${CHZ.INNER_H} m`,
      `- Folded for transport: ${s.L.toFixed(2)} x ${CHZ.CORE_W.toFixed(2)} m`, ''];
    CHZ.SECTIONS.forEach((sec) => {
      lines.push(`## ${sec.title} (${sec.pages})`);
      sec.items.forEach((it) => {
        if (it.spec === false || (it.show && !it.show(cfg))) return;
        lines.push(`- ${it.label}: ${valueText(it)}${isUp(it) ? ' [UPGRADE]' : ''}`);
      });
      lines.push('');
    });
    lines.push(`Configuration code: ${encodeCfg()}`);
    return lines.join('\n');
  }
  function renderSpec() {
    const s = CHZ.sizeOf(cfg);
    const ups = upgrades();
    $('#specBody').innerHTML = `
      <div class="spec-top">
        <div><span class="k">Model</span><span class="v">${esc(s.name)} expandable</span></div>
        <div><span class="k">Floor plan</span><span class="v">${esc(CHZ.LAYOUTS[cfg.layout].name)}</span></div>
        <div><span class="k">Unfolded</span><span class="v num">${s.L.toFixed(2)} &times; ${s.W.toFixed(2)} m</span></div>
        <div><span class="k">Floor area</span><span class="v num">${(s.L * s.W).toFixed(1)} m&sup2;</span></div>
        <div><span class="k">Transport size</span><span class="v num">${s.L.toFixed(2)} &times; ${CHZ.CORE_W.toFixed(2)} m</span></div>
        <div><span class="k">Upgrades</span><span class="v num">${ups.length}</span></div>
      </div>
      ${CHZ.SECTIONS.map((sec) => `<section><h3>${esc(sec.title)} <small>${esc(sec.pages)}</small></h3><dl>${sec.items
        .filter((it) => it.spec !== false && !(it.show && !it.show(cfg)))
        .map((it) => `<div class="${isUp(it) ? 'is-up' : ''}"><dt>${esc(it.label)}</dt><dd>${esc(valueText(it))}${isUp(it) ? ' ' + UPG : ''}</dd></div>`).join('')}</dl></section>`).join('')}`;
  }

  // ------------------------------------------------------------------ codes, designs
  function encodeCfg() {
    const diff = {};
    Object.keys(cfg).forEach((k) => { if (cfg[k] !== CHZ.DEFAULTS[k]) diff[k] = cfg[k]; });
    return 'CHZ1.' + btoa(unescape(encodeURIComponent(JSON.stringify(diff)))).replace(/=+$/, '');
  }
  function decodeCfg(code) {
    code = String(code || '').trim();
    if (code.startsWith('{')) return JSON.parse(code);
    const m = code.match(/CHZ1\.([A-Za-z0-9+/]+)/);
    if (!m) throw new Error('bad');
    return JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  }
  function loadCfg(obj) {
    const clean = {};
    Object.keys(CHZ.DEFAULTS).forEach((k) => { if (obj[k] !== undefined) clean[k] = obj[k]; });
    cfg = Object.assign({}, CHZ.DEFAULTS, clean);
    CHZ.applyRules(cfg, null);
    commit();
    preset('exterior');
  }
  function renderDesigns() {
    const list = store.get('chz.designs.v1', []);
    $('#designList').innerHTML = list.length ? list.map((d, i) => {
      const s = CHZ.byId(CHZ.SIZES, d.cfg.size);
      return `<li><div><b>${esc(d.name)}</b><span>${esc(s.name)} &middot; ${esc((CHZ.LAYOUTS[d.cfg.layout] || {}).name || '')} &middot; ${esc(new Date(d.at).toLocaleDateString())}</span></div>
        <button type="button" data-load="${i}">Open</button><button type="button" class="ghost" data-del="${i}" aria-label="Delete ${esc(d.name)}">Delete</button></li>`;
    }).join('') : '<li class="empty">No saved designs yet. Name the current house above and save it.</li>';
    $('#codeOut').value = encodeCfg();
  }
  $('#designList').addEventListener('click', (e) => {
    const list = store.get('chz.designs.v1', []);
    const l = e.target.closest('[data-load]'), d = e.target.closest('[data-del]');
    if (l) { loadCfg(list[Number(l.dataset.load)].cfg); $('#dlgDesigns').close(); toast('Opened "' + list[Number(l.dataset.load)].name + '".'); }
    if (d) {
      const b = d;
      if (b.dataset.armed) { const n = list[Number(b.dataset.del)].name; list.splice(Number(b.dataset.del), 1); store.set('chz.designs.v1', list); renderDesigns(); toast('Deleted "' + n + '".'); }
      else { b.dataset.armed = '1'; b.textContent = 'Confirm'; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Delete'; } }, 3000); }
    }
  });
  $('#saveForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#saveName').value.trim() || (CHZ.sizeOf(cfg).name + ' ' + CHZ.LAYOUTS[cfg.layout].name);
    const list = store.get('chz.designs.v1', []);
    list.unshift({ name, at: Date.now(), cfg: Object.assign({}, cfg) });
    store.set('chz.designs.v1', list.slice(0, 40));
    $('#saveName').value = '';
    renderDesigns();
    toast('Saved "' + name + '" in this browser.');
  });
  $('#btnCopyCode').addEventListener('click', () => copyText($('#codeOut').value, $('#codeOut'), 'Configuration code copied.'));
  $('#btnLoadCode').addEventListener('click', () => {
    try { loadCfg(decodeCfg($('#codeIn').value)); $('#codeIn').value = ''; $('#dlgDesigns').close(); toast('Configuration loaded.'); }
    catch (err) { toast('That code could not be read. Paste the full text that starts with CHZ1.'); }
  });
  $('#fileIn').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { const obj = JSON.parse(rd.result); loadCfg(obj.cfg || obj); $('#dlgDesigns').close(); toast('Imported ' + f.name + '.'); }
      catch (err) { toast('That file is not a configuration JSON.'); }
    };
    rd.readAsText(f);
    e.target.value = '';
  });

  function copyText(text, fallbackEl, msg) {
    if (CHZ.i18n) text = CHZ.i18n.block(text); // copy in the language on screen
    const done = () => toast(msg);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => { if (fallbackEl) { fallbackEl.focus(); fallbackEl.select(); } toast('Copy is blocked here. The text is selected, press Ctrl+C.'); });
    } else if (fallbackEl) { fallbackEl.focus(); fallbackEl.select(); toast('The text is selected, press Ctrl+C.'); }
  }

  // ------------------------------------------------------------------ presets gallery (ready-made designs per container size)
  let presetSize = null;
  const optOf = (key, id, c) => {
    for (const sec of CHZ.SECTIONS) for (const it of sec.items) {
      if (it.key !== key) continue;
      const list = typeof it.options === 'function' ? it.options(c) : it.options;
      return (list || []).find((o) => String(o.id) === String(id)) || null;
    }
    return null;
  };
  function renderPresets() {
    const sizes = ['10ft', '15ft', '20ft', '30ft', '40ft'];
    if (!presetSize) presetSize = sizes.includes(cfg.size) ? cfg.size : '20ft';
    $('#psTabs').innerHTML = sizes.map((s) => {
      const n = CHZ.PRESETS.filter((p) => p.size === s).length;
      return `<button type="button" role="tab" data-ps-size="${s}" aria-selected="${s === presetSize}">${CHZ.sizeOf({ size: s }).name}<small>${n}</small></button>`;
    }).join('');
    $('#psGrid').innerHTML = CHZ.PRESETS.filter((p) => p.size === presetSize).map((p) => {
      const c = Object.assign({}, CHZ.DEFAULTS, p.cfg);
      CHZ.applyRules(c, null);
      const Y = CHZ.layout(c), sz = CHZ.sizeOf(c);
      const clad = optOf('clad', c.clad, c), frame = optOf('frame', c.frame, c), floor = optOf('floor', c.floor, c);
      const hero = clad ? swatchStyle(clad) : '';
      const sw = [clad, frame, floor].filter(Boolean).map((o) => `<span style="${swatchStyle(o)}" title="${esc(o.name)}"></span>`).join('');
      const beds = Y.bedrooms.length, baths = Y.baths.length;
      const meta = `${sz.name} · ${(sz.L * sz.W).toFixed(1)} m² · ${beds ? beds + (beds > 1 ? ' bedrooms' : ' bedroom') : 'Open shell'} · ${baths} ${baths === 1 ? 'bathroom' : 'bathrooms'}`;
      return `<article class="ps-card">
        <div class="ps-hero" style="${hero}"><span class="ps-tag">${esc(p.tag)}</span><div class="ps-plan">${CHZ.plan.thumb(c.size, c.layout, c.mirror)}</div><div class="ps-sw">${sw}</div></div>
        <div class="ps-body"><h4>${esc(p.name)}</h4><div class="ps-meta">${esc(meta)}</div><p>${esc(p.blurb)}</p>
          <div class="ps-chips">${p.chips.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
          <details class="ps-why"><summary>Why it works</summary><ul>${p.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details></div>
        <div class="ps-foot"><button type="button" class="btn primary" data-ps-load="${p.id}">Load this design</button></div>
      </article>`;
    }).join('');
  }
  $('#btnPresets').addEventListener('click', () => { presetSize = null; renderPresets(); $('#dlgPresets').showModal(); });
  $('#psTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-ps-size]'); if (b) { presetSize = b.dataset.psSize; renderPresets(); } });
  $('#psGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ps-load]'); if (!b) return;
    const p = CHZ.PRESETS.find((q) => q.id === b.dataset.psLoad); if (!p) return;
    loadCfg(JSON.parse(JSON.stringify(p.cfg)));
    $('#dlgPresets').close();
    toast('Loaded the "' + p.name + '" preset. Change anything you like.');
  });

  // ------------------------------------------------------------------ language switch (EN / HU)
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => CHZ.i18n && CHZ.i18n.setLang(b.dataset.lang)));

  // ------------------------------------------------------------------ toast
  let toastT = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('on'), 3600);
  }

  // ------------------------------------------------------------------ toolbar wiring
  $('#views').addEventListener('click', (e) => { const b = e.target.closest('button[data-view]'); if (b) preset(b.dataset.view); });
  $('#btnNight').addEventListener('click', () => {
    // with a sky map, Day/Night switches between the last day sky and the night sky
    if (view.hq && view.env !== 'sky') { setEnv(view.night ? lastDayEnv : 'night'); return; }
    view.night = !view.night; applyNight();
  });
  $('#btnDims').addEventListener('click', () => { view.dims = !view.dims; $('#btnDims').setAttribute('aria-pressed', String(view.dims)); buildDims(); });
  $('#foldRange').addEventListener('input', (e) => { anim = null; view.t = Number(e.target.value) / 100; applyExpansion(); });
  $('#btnFold').addEventListener('click', () => {
    const to = view.t > 0.5 ? 0 : 1;
    if (reduceMotion) { view.t = to; applyExpansion(); return; }
    anim = { from: view.t, to, start: performance.now(), dur: 7000 };
  });
  $('#btnSpec').addEventListener('click', () => { renderSpec(); $('#dlgSpec').showModal(); });
  $('#btnCopySpec').addEventListener('click', () => copyText(specText(), null, 'Specification copied as text.'));
  $('#btnDesigns').addEventListener('click', () => { renderDesigns(); $('#dlgDesigns').showModal(); });
  $('#btnShot').addEventListener('click', () => {
    draw();
    $('#shotImg').src = canvas.toDataURL('image/png');
    $('#dlgShot').showModal();
  });
  $('#btnReset').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Confirm reset'; setTimeout(() => { delete b.dataset.armed; b.textContent = 'Reset'; }, 3000); return; }
    delete b.dataset.armed; b.textContent = 'Reset';
    loadCfg({});
    toast('Back to the standard configuration.');
  });
  $('#btnHQ').addEventListener('click', () => setHQ(!view.hq));
  $('#frameBar').addEventListener('click', (e) => {
    const ib = e.target.closest('button[data-cutin]');
    if (ib) {
      view.cutInterior = ib.dataset.cutin === 'cut'; store.set('chz.cutin.v1', view.cutInterior); rebuild();
      toast(view.cutInterior ? 'Cutaway: interior walls cut down to 0.9 m.' : 'Cutaway: interior walls at full height.');
      return;
    }
    const cb = e.target.closest('button[data-cut]');
    if (cb) {
      view.cutMode = cb.dataset.cut; store.set('chz.cut.v1', view.cutMode);
      view.cutSides = cameraSides(); rebuild();
      toast(view.cutMode === 'all' ? 'Cutaway: all four outer walls cut down to 0.9 m.' : 'Cutaway: only the walls facing the camera are cut.');
      return;
    }
    const b = e.target.closest('button[data-frame]'); if (!b) return;
    view.frameMode = b.dataset.frame; store.set('chz.frame.v1', view.frameMode); applyFrameMode();
  });
  $('#btnScene').addEventListener('click', () => { view.sceneOpen = !view.sceneOpen; $('#scenePanel').hidden = !view.sceneOpen; $('#btnScene').setAttribute('aria-pressed', String(view.sceneOpen)); });
  $('#texSeg').addEventListener('click', (e) => { const b = e.target.closest('button[data-tex]'); if (b) setTextures(b.dataset.tex); });
  $('#envGrid').addEventListener('click', (e) => { const b = e.target.closest('button[data-env]'); if (b) setEnv(b.dataset.env); });
  renderScenePanel();

  // ------------------------------------------------------------------ presentation mode
  function renderCard() {
    const s = CHZ.sizeOf(cfg);
    const cl = CHZ.byId(CHZ.CLAD[cfg.cladType], cfg.clad);
    $('#pcTitle').textContent = `${s.name} expandable house`;
    $('#pcSub').textContent = `${CHZ.LAYOUTS[cfg.layout].name} · ${(s.L * s.W).toFixed(1)} m² · ${s.L.toFixed(2)} × ${s.W.toFixed(2)} m`;
    $('#pcFeat').textContent = [cl.name, CHZ.byId(CHZ.ROOFS, cfg.roof).name + ' roof', cfg.terrace && 'roof terrace', cfg.solar && 'solar', cfg.pool !== 'none' && 'pool']
      .filter(Boolean).join(' · ') + ` · ${upgrades().length} upgrades`;
  }
  let hqBeforePresent = false;
  async function setPresent(on) {
    if (on === view.present) return;
    if (on) {
      hqBeforePresent = view.hq;
      if (!view.hq) await setHQ(true);
      renderCard();
      try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) { /* fullscreen not allowed here */ }
    } else {
      if (!hqBeforePresent && view.hq) await setHQ(false);
      try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch (e) { /* ignore */ }
    }
    view.present = on;
    document.body.classList.toggle('present', on);
    $('#presentCard').hidden = !on;
    $('#presentBar').hidden = !on;
    $('#btnPresent').setAttribute('aria-pressed', String(on));
    controls.autoRotate = on && !reduceMotion;
    controls.autoRotateSpeed = 0.5;
    $('#btnOrbit').setAttribute('aria-pressed', String(controls.autoRotate));
    camera.fov = on ? 32 : 38;
    camera.updateProjectionMatrix();
    resize();
    preset(on && view.preset !== 'aerial' ? 'exterior' : view.preset);
  }
  $('#btnPresent').addEventListener('click', () => setPresent(!view.present));
  $('#btnExitPresent').addEventListener('click', () => setPresent(false));
  $('#btnOrbit').addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; $('#btnOrbit').setAttribute('aria-pressed', String(controls.autoRotate)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && view.present && !document.querySelector('dialog[open]')) setPresent(false); });
  canvas.addEventListener('pointerdown', () => { if (controls.autoRotate && view.present) { controls.autoRotate = false; $('#btnOrbit').setAttribute('aria-pressed', 'false'); } });

  $$('dialog [data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  // ------------------------------------------------------------------ benefits drawer
  const bene = $('#bene');
  let lastUnlocked = null;
  view.beneOpen = store.get('chz.bene.v1', window.innerWidth > 700); // collapsed by default on phones
  function ring(v, size, stroke) {
    const r = (size - stroke) / 2, cf = 2 * Math.PI * r;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="ring" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-width="${stroke}" stroke-dasharray="${(cf * v) / 100} ${cf}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  }
  function renderBenefits(announce) {
    const B = CHZ.benefits.evaluate(cfg);
    const I = CHZ.benefits.icon;
    const total = B.achievements.length;
    $('#beneRail').innerHTML = `<span class="rail-ring">${ring(B.overall, 44, 4)}<b class="num">${B.overall}</b></span>
      <span class="rail-t">${I('shield', 15)}<b class="num">${B.unlocked}/${total}</b></span><span class="rail-l">Benefits</span>`;
    const sorted = B.achievements.slice().sort((a, b) => (b.done - a.done) || (b.got / b.of - a.got / a.of));
    $('#beneBody').innerHTML = `
      <div class="bn-head">
        <div class="bn-ring">${ring(B.overall, 76, 6)}<div><b class="num">${B.overall}</b><span>score</span></div></div>
        <div class="bn-ht"><span class="bn-k">Configuration rating</span><b>${B.unlocked} of ${total} benefits unlocked</b>
          <span class="bn-u num">Wall U ≈ ${B.U.toFixed(2)} W/m²K</span></div>
      </div>
      <div class="bn-scores">${B.scores.map((sc) => `<button type="button" class="bn-score" data-sec="${sc.sec}" title="Open ${esc(sc.name)} options">
        <span class="bs-i">${I(sc.icon, 15)}</span><span class="bs-n">${esc(sc.name)}</span><span class="bs-v num">${sc.v}</span>
        <span class="bs-bar"><i style="width:${sc.v}%"></i></span></button>`).join('')}</div>
      <div class="bn-k bn-sub">Benefits</div>
      <div class="bn-badges">${sorted.map((a) => `<button type="button" class="badge${a.done ? ' on' : ''}" data-sec="${a.sec}" aria-label="${esc(a.name)}: ${a.done ? 'unlocked' : 'locked'}">
        <span class="bd-medal">${I(a.icon, 22)}</span>
        <span class="bd-t"><b>${esc(a.name)}</b><small>${esc(a.done ? a.desc : a.hint)}</small>
        ${a.of > 1 ? `<span class="bd-pips">${Array.from({ length: a.of }, (_, i) => `<i class="${i < a.got ? 'f' : ''}"></i>`).join('')}</span>` : ''}</span></button>`).join('')}</div>`;
    const now = new Set(B.achievements.filter((a) => a.done).map((a) => a.id));
    if (announce && lastUnlocked) {
      B.achievements.filter((a) => a.done && !lastUnlocked.has(a.id)).slice(0, 2).forEach((a, i) => setTimeout(() => unlockPop(a), i * 900));
    }
    lastUnlocked = now;
  }
  function unlockPop(a) {
    const el = $('#unlock');
    el.innerHTML = `<span class="bd-medal">${CHZ.benefits.icon(a.icon, 26)}</span><span><small>Benefit unlocked</small><b>${esc(a.name)}</b></span>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(unlockPop.t); unlockPop.t = setTimeout(() => el.classList.remove('on'), 3200);
  }
  function setBene(open) {
    view.beneOpen = open; store.set('chz.bene.v1', open);
    bene.classList.toggle('open', open);
    $('#beneRail').setAttribute('aria-expanded', String(open));
  }
  $('#beneRail').addEventListener('click', () => setBene(!view.beneOpen));
  $('#beneClose').addEventListener('click', () => setBene(false));
  $('#beneBody').addEventListener('click', (e) => { const b = e.target.closest('[data-sec]'); if (b) openSection(b.dataset.sec); });

  // ------------------------------------------------------------------ benefits report (paged detail view)
  const REPORT_PAGES = [
    { id: 'overview', t: 'Overview' },
    { id: 'energy', t: 'Energy & insulation', score: 'energy', facts: 'energy' },
    { id: 'heating', t: 'Heating & hot water', facts: 'heating' },
    { id: 'comfort', t: 'Comfort', score: 'comfort', facts: 'comfort' },
    { id: 'safety', t: 'Safety & fire', score: 'safety', facts: 'safety' },
    { id: 'durable', t: 'Durability', score: 'durable', facts: 'durable' },
    { id: 'outdoor', t: 'Outdoor living', score: 'outdoor', facts: 'outdoor' },
    { id: 'smart', t: 'Smart & tech', score: 'smart', facts: 'smart' },
    { id: 'questions', t: 'Questions for the factory' },
  ];
  let reportPage = 0;
  const CONF = { verified: ['Verified', 'Public sources agree'], catalog: ['From catalog', 'Only stated in the supplier PDF'], check: ['Ask factory', 'Needs confirmation from the factory'] };
  function factsHTML(key) {
    const B = CHZ.benefits;
    return (B.FACTS[key] || []).map((f) => `<article class="rp-fact">
      <div class="rp-fh"><h4>${esc(f.h)}</h4><span class="rp-conf c-${f.c}" title="${CONF[f.c][1]}">${CONF[f.c][0]}</span></div>
      <p>${f.b}</p>
      ${f.s.length ? `<p class="rp-src">Sources: ${f.s.map((k) => `<a href="${B.SOURCES[k].u}" target="_blank" rel="noopener">${esc(B.SOURCES[k].t)}</a>`).join(' &middot; ')}</p>` : ''}
    </article>`).join('');
  }
  function scoreHTML(sc) {
    return `<div class="rp-score">
      <div class="bn-ring">${ring(sc.v, 92, 7)}<div><b class="num">${sc.v}</b><span>of 100</span></div></div>
      <table class="rp-parts"><tbody>${sc.base ? `<tr class="on"><td>Starting level</td><td class="num">${sc.base}</td></tr>` : ''}
      ${sc.parts.map((p) => `<tr class="${p.on ? 'on' : 'off'}"><td>${esc(p.label)}${!p.on && p.hint ? `<small>${esc(p.hint)}</small>` : ''}</td>
        <td class="num">${p.on ? (p.pts >= 0 ? '+' : '') + p.pts : (p.pts >= 0 ? 'not chosen &middot; +' + p.pts : '')}</td></tr>`).join('')}</tbody></table>
    </div>
    <p class="note">Indicative score (0-100) comparing configurations, not an engineering rating. <button type="button" class="linkbtn" data-sec="${sc.sec}">Change these options</button></p>`;
  }
  function renderReport() {
    const B = CHZ.benefits.evaluate(cfg), pg = REPORT_PAGES[reportPage];
    $('#rpSteps').innerHTML = REPORT_PAGES.map((p, i) => `<button type="button" data-page="${i}" aria-current="${i === reportPage ? 'step' : 'false'}" title="${esc(p.t)}"><span class="num">${i + 1}</span><span class="rp-st">${esc(p.t)}</span></button>`).join('');
    $('#rpTitle').textContent = pg.t;
    $('#rpCount').textContent = `Page ${reportPage + 1} of ${REPORT_PAGES.length}`;
    $('#rpPrev').disabled = reportPage === 0;
    $('#rpNext').disabled = reportPage === REPORT_PAGES.length - 1;
    let html = '';
    if (pg.id === 'overview') {
      const s = CHZ.sizeOf(cfg), plan = CHZ.PLAN_BY[cfg.layout];
      html = `<div class="rp-score"><div class="bn-ring">${ring(B.overall, 92, 7)}<div><b class="num">${B.overall}</b><span>overall</span></div></div>
        <div class="rp-ov"><h3>${esc(s.name)} expandable &middot; ${esc(plan.name)}</h3>
        <p>${B.unlocked} of ${B.achievements.length} benefits unlocked &middot; wall U &asymp; ${B.U.toFixed(2)} W/m&sup2;K &middot; ${(s.L * s.W).toFixed(1)} m&sup2;</p>
        <div class="bn-scores">${B.scores.map((sc) => `<div class="bn-score"><span class="bs-i">${CHZ.benefits.icon(sc.icon, 15)}</span><span class="bs-n">${esc(sc.name)}</span><span class="bs-v num">${sc.v}</span><span class="bs-bar"><i style="width:${sc.v}%"></i></span></div>`).join('')}</div></div></div>
        <h3 class="rp-h3">Unlocked</h3><div class="rp-badges">${B.achievements.filter((a) => a.done).map((a) => `<span class="rp-badge on">${CHZ.benefits.icon(a.icon, 16)}${esc(a.name)}</span>`).join('') || '<span class="note">None yet.</span>'}</div>
        <h3 class="rp-h3">Within reach</h3><div class="rp-badges">${B.achievements.filter((a) => !a.done).map((a) => `<span class="rp-badge" title="${esc(a.hint)}">${CHZ.benefits.icon(a.icon, 16)}${esc(a.name)} <small>${esc(a.hint)}</small></span>`).join('')}</div>`;
    } else if (pg.id === 'questions') {
      html = `<p class="note">These points could not be fully verified from the catalog or public sources. Send them to the factory before ordering; answers can be added to the Obsidian notes.</p>
        ${CHZ.benefits.QUESTIONS.map(([h, qs]) => `<section class="rp-q"><h3 class="rp-h3">${esc(h)}</h3><ol>${qs.map((q) => `<li>${esc(q)}</li>`).join('')}</ol></section>`).join('')}
        <div class="row"><button type="button" class="btn primary" id="rpCopyQ">Copy questions as text</button></div>`;
    } else {
      if (pg.score) html += scoreHTML(B.scores.find((x) => x.id === pg.score));
      if (pg.id === 'energy') {
        const rows = CHZ.SANDWICH.map((c) => { const u = CHZ.benefits.uOf(Number(c.lambda), cfg.panelThk); return `<tr class="${c.id === cfg.sandwich ? 'on' : ''}"><td>${esc(c.name)}${c.up ? ' ' + UPG : ''}</td><td class="num">${c.range}</td><td class="num">${u.toFixed(2)}</td><td>${esc(c.fire)}</td></tr>`; }).join('');
        html += `<h3 class="rp-h3">Wall panel cores compared at ${cfg.panelThk} mm</h3><div class="rp-tw"><table class="rp-table"><thead><tr><th>Core</th><th>&lambda; W/m&middot;K</th><th>U wall</th><th>Fire</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }
      if (pg.id === 'heating') {
        const h = CHZ.byId(CHZ.HEATER, cfg.heater);
        html += `<div class="rp-cur"><div><span class="k">Floor heating</span><b>${cfg.floorHeat ? 'Graphene film' : 'None'}</b></div><div><span class="k">Water heater</span><b>${esc(h.name)}</b></div>
          <div><span class="k">Bath heater</span><b>${cfg.bathHeater ? 'Yes' : 'No'}</b></div><div><span class="k">Solar</span><b>${cfg.solar ? 'Yes' : 'No'}</b></div></div>`;
      }
      html += `<h3 class="rp-h3">Background${pg.id === 'heating' ? ' (all heating options)' : ''}</h3>` + factsHTML(pg.facts);
    }
    $('#rpBody').innerHTML = html;
    $('#rpBody').scrollTop = 0;
  }
  function openReport(page) { reportPage = page || 0; renderReport(); $('#dlgReport').showModal(); }
  $('#btnReport').addEventListener('click', () => openReport(0));
  $('#rpPrev').addEventListener('click', () => { if (reportPage > 0) { reportPage--; renderReport(); } });
  $('#rpNext').addEventListener('click', () => { if (reportPage < REPORT_PAGES.length - 1) { reportPage++; renderReport(); } });
  $('#rpSteps').addEventListener('click', (e) => { const b = e.target.closest('[data-page]'); if (b) { reportPage = Number(b.dataset.page); renderReport(); } });
  $('#dlgReport').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') $('#rpNext').click();
    if (e.key === 'ArrowLeft') $('#rpPrev').click();
  });
  $('#rpBody').addEventListener('click', (e) => {
    const sec = e.target.closest('[data-sec]');
    if (sec) { $('#dlgReport').close(); openSection(sec.dataset.sec); }
    if (e.target.closest('#rpCopyQ')) {
      const txt = CHZ.benefits.QUESTIONS.map(([h, qs]) => `## ${h}\n` + qs.map((q, i) => `${i + 1}. ${q}`).join('\n')).join('\n\n');
      copyText('# Questions for the factory\n\n' + txt, null, 'Questions copied as text.');
    }
  });

  // ------------------------------------------------------------------ 2D floor plan
  const planView = $('#planView'), planHost = $('#planHost');
  const planOpts = Object.assign({ furniture: true, dims: true, fold: true }, store.get('chz.planopts.v1', {}));
  let pvb = null, baseVB = null;
  function renderPlan(fit) {
    planOpts.furniture = !!cfg.furniture; // one setting: the panel's Show furniture and the plan's Furniture button
    const issues = CHZ.roomIssues(cfg);
    const r = CHZ.plan.render(cfg, Object.assign({}, planOpts, { issues, editWalls: view.planAdv }));
    planHost.innerHTML = r.svg;
    renderIssues(issues);
    if (fit || !pvb) { baseVB = r.vb.slice(); pvb = r.vb.slice(); }
    applyVB();
    $$('#planTools [data-popt]').forEach((b) => b.setAttribute('aria-pressed', String(!!planOpts[b.dataset.popt])));
  }
  // room check list (top left of the 2D plan)
  view.issuesOpen = true;
  function renderIssues(issues) {
    const box = $('#planIssues');
    const errs = issues.filter((q) => q.sev === 'error').length, warns = issues.length - errs;
    box.hidden = false;
    box.className = (errs ? 'err' : warns ? 'warn' : 'ok') + (view.issuesOpen ? '' : ' closed');
    const head = issues.length
      ? (errs ? errs + ' problem' + (errs > 1 ? 's' : '') : '') + (errs && warns ? ' · ' : '') + (warns ? warns + ' warning' + (warns > 1 ? 's' : '') : '')
      : 'Room check: every room has a door and a window';
    box.innerHTML = `<button type="button" class="pi-h" aria-expanded="${view.issuesOpen}"><span class="pi-dot"></span>${esc(head)}</button>`
      + (issues.length ? '<ul>' + issues.map((q, i) => `<li class="${q.sev}"><b>${i + 1}</b><span>${esc(q.msg)}</span></li>`).join('') + '</ul>' : '');
  }
  $('#planIssues').addEventListener('click', (e) => { if (e.target.closest('.pi-h')) { view.issuesOpen = !view.issuesOpen; $('#planIssues').classList.toggle('closed', !view.issuesOpen); } });
  function applyVB() { const sv = planHost.querySelector('svg'); if (sv) sv.setAttribute('viewBox', pvb.map((v) => +v.toFixed(3)).join(' ')); }
  function planScale() {
    const r = planHost.querySelector('svg').getBoundingClientRect();
    const sc = Math.min(r.width / pvb[2], r.height / pvb[3]);
    return { r, sc, ox: r.left + (r.width - pvb[2] * sc) / 2, oy: r.top + (r.height - pvb[3] * sc) / 2 };
  }
  function zoomPlan(f, cx, cy) {
    if (!planHost.querySelector('svg')) return;
    const { sc, ox, oy } = planScale();
    const px = cx == null ? pvb[0] + pvb[2] / 2 : pvb[0] + (cx - ox) / sc;
    const py = cy == null ? pvb[1] + pvb[3] / 2 : pvb[1] + (cy - oy) / sc;
    const nw = Math.max(1.5, Math.min(baseVB[2] * 2, pvb[2] * f)), k = nw / pvb[2];
    pvb = [px - (px - pvb[0]) * k, py - (py - pvb[1]) * k, nw, pvb[3] * k];
    applyVB();
  }
  planHost.addEventListener('wheel', (e) => { e.preventDefault(); zoomPlan(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
  // ---- drawing tools: panorama glass (drag along a long wall), glass door (click a long wall), erase (click)
  view.planTool = null;
  const TOOL_HINT = {
    glass: 'Drag along any outer wall to draw panorama glass.',
    gate: 'Click any outer wall to place a glass double door (end walls: one per panel).',
    erase: 'Click a glass section, glass door, interior wall, room door or window to remove it.',
    wall: 'Drag inside the house to draw an interior wall (it snaps to other walls).',
    door: 'Click an interior wall to add a door. Click a door, its blue arrow, or hold on it for hinge and swing options.',
    win: 'Click the front or back wall to add a window.',
    move: 'Drag an interior wall, room door or window. Bathroom: drag its inner wall to resize, or its door to slide it.',
  };
  // ---- advanced editing: interior walls, room doors, long-wall windows
  view.planAdv = false;
  $('#btnAdv').addEventListener('click', () => {
    view.planAdv = !view.planAdv;
    $('#btnAdv').setAttribute('aria-pressed', String(view.planAdv));
    $('#advTools').hidden = !view.planAdv;
    if (!view.planAdv && ['wall', 'door', 'win', 'move'].includes(view.planTool)) setPlanTool(view.planTool);
    if (view.planAdv) toast('Advanced editing: draw, move or remove interior walls, room doors and windows. The bathroom can be resized and its door moved; it stays in the core module.');
    renderPlan(false);
  });
  $('#btnResetEdit').addEventListener('click', () => {
    if (!cfg.edit) { toast('Nothing to reset: the walls, doors and windows are the catalog ones.'); return; }
    setValue('edit', null); toast('Walls, doors and windows are back to the catalog plan.');
  });
  const cloneEdit = () => {
    const E = JSON.parse(JSON.stringify(cfg.edit || CHZ.editSnapshot(cfg)));
    if (!Array.isArray(E.baths)) E.baths = CHZ.editSnapshot(Object.assign({}, cfg, { edit: null })).baths; // older edits
    return E;
  };
  // bathroom: its inner wall (resize) and its door (slide) can be moved; the bathroom itself stays in the core strip
  function hitBath(p) {
    const Y = CHZ.layout(cfg);
    for (const b of Y.baths) {
      if (p.y < Y.zB - 0.1 || p.y > Y.zF + 0.1 || Math.abs(p.x - b.inner) > 0.3) continue;
      return { b, door: Math.abs(p.y - b.door.z) < 0.45 };
    }
    return null;
  }
  const r3 = (v) => Math.round(v * 1000) / 1000;
  function bathBlocks(o, at, a, b) { // does a wall cut through a bathroom?
    const Y = CHZ.layout(cfg);
    return Y.baths.some((bt) => (o === 'h'
      ? at > Y.zB + 0.05 && at < Y.zF - 0.05 && a < bt.x1 - 0.05 && b > bt.x0 + 0.05
      : at > bt.x0 + 0.05 && at < bt.x1 - 0.05 && a < Y.zF - 0.05 && b > Y.zB + 0.05));
  }
  function hitEditWall(p, E) {
    let best = null, bd = 0.22;
    E.walls.forEach((wl, i) => {
      const along = wl.o === 'h' ? p.x : p.y, across = wl.o === 'h' ? p.y : p.x;
      if (along < wl.a - 0.1 || along > wl.b + 0.1) return;
      const d = Math.abs(across - wl.at); if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function hitEditDoor(p, E) {
    return E.doors.findIndex((d) => {
      const along = d.o === 'h' ? p.x : p.y, across = d.o === 'h' ? p.y : p.x;
      return Math.abs(along - d.p) < d.w / 2 + 0.05 && Math.abs(across - d.at) < 0.35;
    });
  }
  function hitWindow(p, E) {
    const Y = CHZ.layout(cfg);
    const w = p.y > Y.z1 - 0.35 && p.y < Y.W / 2 + 0.35 ? 'front' : p.y < Y.z0 + 0.35 && p.y > -Y.W / 2 - 0.35 ? 'back' : null;
    if (!w) return null;
    const i = E.wins[w].findIndex((x) => Math.abs(x - p.x) < Y.winW / 2 + 0.1);
    return i >= 0 ? { w, i } : null;
  }
  function wallFits(E, wl, skip) {
    const Y = CHZ.layout(cfg);
    if (wl.b - wl.a < 0.5) return 'Walls need to be at least 0.5 m long.';
    if (wl.o === 'h' ? (wl.at < Y.z0 + 0.3 || wl.at > Y.z1 - 0.3) : (wl.at < Y.x0 + 0.3 || wl.at > Y.x1 - 0.3)) return 'Too close to the outer wall.';
    if (bathBlocks(wl.o, wl.at, wl.a, wl.b)) return 'Walls cannot cross the bathroom: it is fixed in the core module.';
    if (E.walls.some((q, i) => i !== skip && q.o === wl.o && Math.abs(q.at - wl.at) < 0.25 && q.a < wl.b - 0.05 && q.b > wl.a + 0.05)) return 'There is already a wall there.';
    return '';
  }
  function windowFits(E, w, x, skipI) {
    const Y = CHZ.layout(cfg), hw = Y.winW / 2;
    if (Math.abs(x) > Y.L / 2 - 0.35 - hw) return 'Too close to the corner.';
    if (E.wins[w].some((q, i) => i !== skipI && Math.abs(q - x) < Y.winW + 0.15)) return 'Too close to another window.';
    if (w === 'front' && Y.entry.wall === 'front' && Math.abs(Y.entry.x - x) < Y.entry.w / 2 + hw + 0.1) return 'Too close to the entrance.';
    if ((cfg.gates || []).some((q) => q.w === w && Math.abs(q.x - x) < 0.85 + hw + 0.1)) return 'Too close to a glass door.';
    if ((cfg.glassSpans || []).some((q) => q.w === w && x > q.a - hw - 0.1 && x < q.b + hw + 0.1)) return 'That part of the wall is already glass.';
    const zw = w === 'back' ? Y.z0 : Y.z1;
    if (Y.vWalls.some((v) => Math.abs(v.at - x) < hw + 0.08 && v.segs.some((sg) => Math.abs(sg[0] - zw) < 0.08 || Math.abs(sg[1] - zw) < 0.08))) return 'An interior wall meets the outer wall here.';
    return '';
  }
  // snap a wall end to the outer walls or to a crossing wall
  function snapEnd(v, o, at) {
    const Y = CHZ.layout(cfg);
    const cands = o === 'h' ? [Y.x0, Y.x1].concat(Y.vWalls.map((l) => l.at)) : [Y.z0, Y.z1].concat(Y.hWalls.map((l) => l.at));
    let best = v, bd = 0.3;
    cands.forEach((c) => { const d = Math.abs(c - v); if (d < bd) { bd = d; best = c; } });
    return r3(best);
  }
  // ---- door options menu (Advanced): swing side, hinge side, remove. Opened from the arrow marker, a click with the Door tool, or a long press
  let doorMenuFor = null;
  function doorAt(p) { // room door index, or { bath: side }
    const Y = CHZ.layout(cfg);
    for (const bt of Y.baths) if (Math.abs(p.x - bt.inner) < 0.45 && Math.abs(p.y - bt.door.z) < 0.45) return { bath: bt.side };
    const i = (Y.doors || []).findIndex((d) => {
      const along = d.o === 'h' ? p.x : p.y, across = d.o === 'h' ? p.y : p.x;
      return Math.abs(along - d.p) < d.w / 2 + 0.08 && Math.abs(across - d.at) < 0.5;
    });
    return i >= 0 ? { i } : null;
  }
  function describeDoor(target) {
    const Y = CHZ.layout(cfg);
    if (target.bath) {
      const bt = Y.baths.find((q) => q.side === target.bath);
      return { title: 'Bathroom door', swing: bt.door.swing === -1 ? 'Now opens into the bathroom' : 'Now opens out into the hall', hinge: bt.door.hinge === -1 ? 'Now hinged on the back side' : 'Now hinged on the front side', removable: false };
    }
    const d = Y.doors[target.i];
    const h = d.hinge === -1 ? (d.o === 'h' ? 'Now hinged on the east side' : 'Now hinged on the back side') : (d.o === 'h' ? 'Now hinged on the west side' : 'Now hinged on the front side');
    const sw = d.o === 'h' ? (d.into < 0 ? 'Now opens toward the back' : 'Now opens toward the front') : (d.into > 0 ? 'Now opens toward the east' : 'Now opens toward the west');
    return { title: 'Room door', swing: sw, hinge: h, removable: true };
  }
  function openDoorMenu(target, clientX, clientY) {
    doorMenuFor = target;
    const info = describeDoor(target), m = $('#doorMenu'), host = $('#planView').getBoundingClientRect();
    $('#dmTitle').textContent = info.title;
    $('#dmSwing').textContent = info.swing; $('#dmHinge').textContent = info.hinge;
    m.querySelector('[data-dm="remove"]').hidden = !info.removable;
    m.hidden = false;
    const mw = m.offsetWidth, mh = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(host.width - mw - 8, clientX - host.left + 12)) + 'px';
    m.style.top = Math.max(8, Math.min(host.height - mh - 8, clientY - host.top + 12)) + 'px';
  }
  function closeDoorMenu() { doorMenuFor = null; $('#doorMenu').hidden = true; }
  $('#doorMenu').addEventListener('click', (e) => {
    const b = e.target.closest('[data-dm]'); if (!b || !doorMenuFor) return;
    const act = b.dataset.dm, tg = doorMenuFor;
    if (act === 'close') { closeDoorMenu(); return; }
    const E = cloneEdit();
    if (tg.bath) {
      const eb = E.baths.find((q) => q.side === tg.bath); if (!eb) return;
      if (act === 'swing') eb.swing = eb.swing === -1 ? 1 : -1;
      if (act === 'hinge') eb.hinge = eb.hinge === -1 ? 1 : -1;
    } else {
      const d = E.doors[tg.i]; if (!d) return;
      if (act === 'swing') d.into = -d.into;
      if (act === 'hinge') d.hinge = d.hinge === -1 ? 1 : -1;
      if (act === 'remove') { E.doors.splice(tg.i, 1); setValue('edit', E); closeDoorMenu(); toast('Door removed.'); return; }
    }
    setValue('edit', E);
    toast(act === 'swing' ? 'Door now swings to the other side.' : 'Door now hinged on the other side.');
    const keep = tg; openDoorMenu(keep, parseFloat($('#doorMenu').style.left) + $('#planView').getBoundingClientRect().left - 12, parseFloat($('#doorMenu').style.top) + $('#planView').getBoundingClientRect().top - 12);
  });
  document.addEventListener('pointerdown', (e) => { if (doorMenuFor && !e.target.closest('#doorMenu') && !e.target.closest('.pl-dmark')) closeDoorMenu(); }, true);
  let lpTimer = null, lpStart = null;

  let editDrag = null, editLine = null;
  function editPreview(x1, y1, x2, y2) {
    const sv = planHost.querySelector('svg');
    if (!editLine || !sv.contains(editLine)) { editLine = document.createElementNS('http://www.w3.org/2000/svg', 'line'); editLine.setAttribute('class', 'pl-preview-line'); sv.appendChild(editLine); }
    editLine.setAttribute('x1', x1); editLine.setAttribute('y1', y1); editLine.setAttribute('x2', x2); editLine.setAttribute('y2', y2);
  }
  function editDown(e) {
    const p = svgPoint(e), Y = CHZ.layout(cfg);
    const inside = p.x > Y.x0 - 0.1 && p.x < Y.x1 + 0.1 && p.y > Y.z0 - 0.1 && p.y < Y.z1 + 0.1;
    const t = view.planTool;
    if (t === 'wall') {
      if (!inside) { toast('Start the wall inside the house.'); return; }
      editDrag = { t, x: snap(p.x), y: snap(p.y) }; planHost.setPointerCapture(e.pointerId); return;
    }
    const E = cloneEdit();
    if (t === 'door') {
      const dt = doorAt(p);
      if (dt) { openDoorMenu(dt, e.clientX, e.clientY); return; }
      if (hitBath(p)) { toast('The bathroom has one door. Use Move to slide it along the wall.'); return; }
      const wi = hitEditWall(p, E);
      if (wi == null) { toast(Y.vWalls.some((l) => Math.abs(l.at - p.x) < 0.2) || Y.hWalls.some((l) => Math.abs(l.at - p.y) < 0.2) ? 'That is a bathroom wall: its door is fixed.' : 'Click on an interior wall.'); return; }
      const wl = E.walls[wi], w = 0.82, along = wl.o === 'h' ? p.x : p.y;
      if (wl.b - wl.a < w + 0.2) { toast('This wall is too short for a door.'); return; }
      const pos = r3(Math.max(wl.a + w / 2 + 0.1, Math.min(wl.b - w / 2 - 0.1, snap(along))));
      if (E.doors.some((d) => d.o === wl.o && Math.abs(d.at - wl.at) < 0.01 && Math.abs(d.p - pos) < (d.w + w) / 2 + 0.1)) { toast('There is already a door there.'); return; }
      E.doors.push({ o: wl.o, at: wl.at, p: pos, w, into: wl.o === 'h' ? (wl.at < 0 ? -1 : 1) : 1, hinge: 1 });
      setValue('edit', E); toast('Door added. Click it (or its blue arrow) for hinge and swing options.'); return;
    }
    if (t === 'win') {
      const hit = wallHit(p);
      if (!hit) { toast('Click on the front or back outer wall.'); return; }
      if (isEnd(hit.w)) { toast('End walls: use Panorama glass to add glazing there.'); return; }
      const why = windowFits(E, hit.w, hit.x, -1);
      if (why) { toast(why); return; }
      E.wins[hit.w].push(r3(hit.x)); E.wins[hit.w].sort((a, b) => a - b);
      setValue('edit', E); toast('Window added to the ' + hit.w + ' wall.'); return;
    }
    if (t === 'move') {
      // inside the bathroom strip, the bathroom wall / door wins over a bedroom door at the corner
      const hb0 = p.y > Y.zB + 0.08 && p.y < Y.zF - 0.08 ? hitBath(p) : null;
      if (hb0) { editDrag = { t, kind: hb0.door ? 'bathDoor' : 'bathWall', E, side: hb0.b.side }; planHost.setPointerCapture(e.pointerId); return; }
      const di = hitEditDoor(p, E);
      if (di >= 0) { editDrag = { t, kind: 'door', E, i: di }; planHost.setPointerCapture(e.pointerId); return; }
      const hb = hitBath(p);
      if (hb) { editDrag = { t, kind: hb.door ? 'bathDoor' : 'bathWall', E, side: hb.b.side }; planHost.setPointerCapture(e.pointerId); return; }
      const wn = hitWindow(p, E);
      if (wn) { editDrag = { t, kind: 'win', E, w: wn.w, i: wn.i }; planHost.setPointerCapture(e.pointerId); return; }
      const wi = hitEditWall(p, E);
      if (wi != null) {
        const wl0 = E.walls[wi], conn = [];
        // other walls (and bathroom walls) in the moved wall's direction: a corner they also use must stay where it is
        const Yb = CHZ.layout(cfg), same = E.walls.filter((q, j) => j !== wi && q.o === wl0.o).map((q) => ({ at: q.at, a: q.a, b: q.b }));
        Yb.baths.forEach((bt) => { if (wl0.o === 'h') { same.push({ at: Yb.zB, a: bt.x0, b: bt.x1 }, { at: Yb.zF, a: bt.x0, b: bt.x1 }); } else same.push({ at: bt.inner, a: Yb.zB, b: Yb.zF }); });
        const sharedJoint = (along, at) => same.some((q) => Math.abs(q.at - at) < 0.08 && along >= q.a - 0.08 && along <= q.b + 0.08);
        E.walls.forEach((q, j) => { // perpendicular walls whose end touches this wall follow it, unless another wall also meets them there
          if (j === wi || q.o === wl0.o || q.at < wl0.a - 0.08 || q.at > wl0.b + 0.08) return;
          for (const end of ['a', 'b']) {
            if (Math.abs(q[end] - wl0.at) >= 0.08 || sharedJoint(q.at, wl0.at)) continue;
            conn.push({ j, end }); break;
          }
        });
        editDrag = { t, kind: 'wall', E, i: wi, at0: wl0.at, conn }; planHost.setPointerCapture(e.pointerId); return;
      }
      toast('Grab an interior wall, a room door, a window, or the bathroom wall / door.'); return;
    }
  }
  function editMove(e) {
    if (!editDrag) return;
    const p = svgPoint(e);
    if (editDrag.t === 'wall') {
      const dx = Math.abs(p.x - editDrag.x), dz = Math.abs(p.y - editDrag.y);
      if (dx >= dz) editPreview(editDrag.x, editDrag.y, snap(p.x), editDrag.y); else editPreview(editDrag.x, editDrag.y, editDrag.x, snap(p.y));
      return;
    }
    const E = editDrag.E;
    if (editDrag.kind === 'bathWall' || editDrag.kind === 'bathDoor') {
      const Y = CHZ.layout(cfg), eb = E.baths.find((q) => q.side === editDrag.side), bt = Y.baths.find((q) => q.side === editDrag.side);
      if (!eb || !bt) return;
      if (editDrag.kind === 'bathDoor') eb.doorZ = r3(Math.max(Y.zB + 0.45, Math.min(Y.zF - 0.45, snap(p.y))));
      else {
        const len = r3(Math.max(1.6, Math.min(bt.maxLen, editDrag.side === 'W' ? snap(p.x) - Y.x0 : Y.x1 - snap(p.x))));
        const inner = editDrag.side === 'W' ? Y.x0 + len : Y.x1 - len;
        if (E.walls.some((q) => q.o === 'v' && Math.abs(q.at - inner) < 0.3 && q.a < Y.zF && q.b > Y.zB)) return; // would hit another wall
        eb.len = len;
      }
    } else if (editDrag.kind === 'door') {
      const d = E.doors[editDrag.i];
      const wl = E.walls.find((q) => q.o === d.o && Math.abs(q.at - d.at) < 0.01 && d.p >= q.a - 0.01 && d.p <= q.b + 0.01);
      if (!wl) return;
      const along = d.o === 'h' ? p.x : p.y;
      const np = r3(Math.max(wl.a + d.w / 2 + 0.1, Math.min(wl.b - d.w / 2 - 0.1, snap(along))));
      if (E.doors.some((q, i) => i !== editDrag.i && q.o === d.o && Math.abs(q.at - d.at) < 0.01 && Math.abs(q.p - np) < (q.w + d.w) / 2 + 0.1)) return;
      d.p = np;
    } else if (editDrag.kind === 'win') {
      const nx = r3(snap(p.x));
      if (windowFits(E, editDrag.w, nx, editDrag.i)) return;
      E.wins[editDrag.w][editDrag.i] = nx;
    } else {
      const wl = E.walls[editDrag.i], old = wl.at, nat = r3(snap(wl.o === 'h' ? p.y : p.x));
      if (wallFits(E, Object.assign({}, wl, { at: nat }), editDrag.i)) return;
      // joined walls stretch or shrink with it; refuse a move that would squash one below 0.3 m
      const conn = editDrag.conn || [];
      if (conn.some(({ j, end }) => { const q = E.walls[j]; const other = end === 'a' ? q.b : q.a; return Math.abs(other - nat) < 0.3; })) return;
      wl.at = nat;
      E.doors.forEach((d) => { if (d.o === wl.o && Math.abs(d.at - old) < 0.01 && d.p >= wl.a && d.p <= wl.b) d.at = nat; });
      conn.forEach(({ j, end }) => {
        const q = E.walls[j];
        q[end] = nat;
        if (q.a > q.b) { const t0 = q.a; q.a = q.b; q.b = t0; editDrag.conn = conn.map((c) => (c.j === j ? { j, end: c.end === 'a' ? 'b' : 'a' } : c)); }
        E.doors.forEach((d) => { // a door on a shortened wall stays on it
          if (d.o !== q.o || Math.abs(d.at - q.at) > 0.01) return;
          d.p = r3(Math.max(q.a + d.w / 2 + 0.1, Math.min(q.b - d.w / 2 - 0.1, d.p)));
        });
      });
    }
    editDrag.moved = true;
    const keep = cfg.edit; cfg.edit = E; renderPlan(false); cfg.edit = keep; // live preview, 3D updates on release
  }
  // loose wall ends within 0.3 m of a crossing wall (or the outer wall) snap onto it, so no wall is left hanging
  function healEnds(E) {
    const Y = CHZ.layout(Object.assign({}, cfg, { edit: E }));
    E.walls.forEach((wl) => {
      const lines = wl.o === 'h' ? [Y.x0, Y.x1].concat(Y.vWalls.map((l) => l.at)) : [Y.z0, Y.z1].concat(Y.hWalls.map((l) => l.at));
      for (const end of ['a', 'b']) {
        if (lines.some((c) => Math.abs(c - wl[end]) < 0.005)) continue;
        let best = null, bd = 0.3;
        lines.forEach((c) => { const d = Math.abs(c - wl[end]); if (d < bd) { bd = d; best = c; } });
        if (best != null) wl[end] = r3(best);
      }
    });
  }
  function editUp(e) {
    if (!editDrag) return;
    const dr = editDrag; editDrag = null;
    if (editLine) { editLine.remove(); editLine = null; }
    if (dr.t === 'wall') {
      const p = svgPoint(e), E = cloneEdit();
      const horiz = Math.abs(p.x - dr.x) >= Math.abs(p.y - dr.y);
      const wl = horiz ? { o: 'h', at: r3(dr.y), a: Math.min(dr.x, snap(p.x)), b: Math.max(dr.x, snap(p.x)) }
        : { o: 'v', at: r3(dr.x), a: Math.min(dr.y, snap(p.y)), b: Math.max(dr.y, snap(p.y)) };
      wl.a = snapEnd(wl.a, wl.o, wl.at); wl.b = snapEnd(wl.b, wl.o, wl.at);
      const why = wallFits(E, wl, -1);
      if (why) { toast(why); renderPlan(false); return; }
      E.walls.push(wl);
      setValue('edit', E); toast('Wall added (' + (wl.b - wl.a).toFixed(2) + ' m). Add a door with the Door tool.'); return;
    }
    if (dr.moved) {
      if (dr.kind === 'wall' || dr.kind === 'bathWall') healEnds(dr.E);
      setValue('edit', dr.E);
      const bt = dr.kind === 'bathWall' && CHZ.layout(cfg).baths.find((q) => q.side === dr.side);
      toast(dr.kind === 'wall' ? 'Wall moved.' : dr.kind === 'door' ? 'Door moved.' : dr.kind === 'bathDoor' ? 'Bathroom door moved.'
        : dr.kind === 'bathWall' ? 'Bathroom resized to ' + bt.len.toFixed(2) + ' m (1.60 m minimum, stays in the core module).' : 'Window moved.');
    }
  }
  const isEnd = (w) => w === 'east' || w === 'west';
  $('#drawTools').addEventListener('click', (e) => { const b = e.target.closest('button[data-tool]'); if (b) setPlanTool(b.dataset.tool); });
  function setPlanTool(t) {
    view.planTool = view.planTool === t ? null : t;
    $$('#drawTools [data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === view.planTool)));
    planHost.classList.toggle('drawing', !!view.planTool);
    $('#planHint').textContent = view.planTool ? TOOL_HINT[view.planTool] : 'Scroll to zoom, drag to pan.';
  }
  function svgPoint(e) {
    const sv = planHost.querySelector('svg'), pt = sv.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(sv.getScreenCTM().inverse());
  }
  const snap = (v) => Math.round(v / 0.05) * 0.05;
  // which outer wall a plan point is on. Long walls: position along X. End walls: position along Z.
  function wallHit(p) {
    const s = CHZ.sizeOf(cfg), limL = s.L / 2 - 0.2, limW = s.W / 2 - 0.2;
    const cands = [];
    if (Math.abs(p.x) <= limL + 0.3) {
      cands.push({ w: 'front', d: Math.abs(p.y - s.W / 2), x: snap(Math.max(-limL, Math.min(limL, p.x))) });
      cands.push({ w: 'back', d: Math.abs(p.y + s.W / 2), x: snap(Math.max(-limL, Math.min(limL, p.x))) });
    }
    if (Math.abs(p.y) <= limW + 0.3) {
      cands.push({ w: 'east', d: Math.abs(p.x - s.L / 2), x: snap(Math.max(-limW, Math.min(limW, p.y))) });
      cands.push({ w: 'west', d: Math.abs(p.x + s.L / 2), x: snap(Math.max(-limW, Math.min(limW, p.y))) });
    }
    const best = cands.filter((q) => q.d < 0.55).sort((a, b) => a.d - b.d)[0];
    return best ? { w: best.w, x: best.x } : null;
  }
  function mergeSpans(list) {
    const out = [];
    ['front', 'back', 'east', 'west'].forEach((w) => {
      const seg = list.filter((q) => q.w === w).sort((a, b) => a.a - b.a);
      seg.forEach((q) => { const l = out[out.length - 1]; if (l && l.w === w && q.a <= l.b + 0.1) l.b = Math.max(l.b, q.b); else out.push({ w, a: q.a, b: q.b }); });
    });
    return out;
  }
  let drawSpan = null, preview = null;
  function alongWall(p, w) { // pointer position projected onto the wall being drawn
    const s = CHZ.sizeOf(cfg);
    if (isEnd(w)) { const lim = s.W / 2 - 0.2; return snap(Math.max(-lim, Math.min(lim, p.y))); }
    const lim = s.L / 2 - 0.2; return snap(Math.max(-lim, Math.min(lim, p.x)));
  }
  function showPreview(a, b, w) {
    const sv = planHost.querySelector('svg'), s = CHZ.sizeOf(cfg);
    if (!preview || !sv.contains(preview)) { preview = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); preview.setAttribute('class', 'pl-preview'); sv.appendChild(preview); }
    if (isEnd(w)) {
      preview.setAttribute('x', w === 'east' ? s.L / 2 - 0.35 : -s.L / 2 - 0.05); preview.setAttribute('y', Math.min(a, b));
      preview.setAttribute('width', 0.4); preview.setAttribute('height', Math.abs(b - a));
      return;
    }
    const y = w === 'front' ? s.W / 2 - 0.35 : -s.W / 2 - 0.05;
    preview.setAttribute('x', Math.min(a, b)); preview.setAttribute('y', y);
    preview.setAttribute('width', Math.abs(b - a)); preview.setAttribute('height', 0.4);
  }
  function toolDown(e) {
    if (['wall', 'door', 'win', 'move'].includes(view.planTool)) { editDown(e); return; }
    if (view.planTool === 'erase') { // interior walls and room doors (Advanced)
      const p = svgPoint(e), E = cloneEdit();
      if (hitBath(p)) { toast('Bathroom walls stay (plumbing in the core module). Use Move to resize the bathroom or slide its door.'); return; }
      const di = hitEditDoor(p, E);
      if (di >= 0) { E.doors.splice(di, 1); setValue('edit', E); toast('Door removed.'); return; }
      const wi = hitEditWall(p, E);
      if (wi != null) {
        const wl = E.walls[wi];
        E.doors = E.doors.filter((d) => !(d.o === wl.o && Math.abs(d.at - wl.at) < 0.01 && d.p >= wl.a - 0.01 && d.p <= wl.b + 0.01));
        E.walls.splice(wi, 1); setValue('edit', E); toast('Interior wall removed.'); return;
      }
    }
    const hit = wallHit(svgPoint(e));
    if (!hit) { toast('Click on an outer wall of the drawing.'); return; }
    if (view.planTool === 'glass') { drawSpan = { w: hit.w, a: hit.x }; showPreview(hit.x, hit.x + 0.05, hit.w); planHost.setPointerCapture(e.pointerId); return; }
    if (view.planTool === 'gate') { // the door slides to the nearest spot that clears partitions, counters and beds
      const r = CHZ.gateSnap(cfg, hit.w, hit.x);
      if (r.x == null) { toast(r.why || 'A glass door does not fit here.'); return; }
      setValue('gates', (cfg.gates || []).concat([{ w: hit.w, x: r.x }]));
      toast(isEnd(hit.w) ? 'Glass double door added to the ' + hit.w + ' end. It also shows in 3D.'
        : r.moved ? 'Glass door moved ' + Math.abs(r.x - hit.x).toFixed(2) + ' m to clear the interior wall / furniture.' : 'Glass double door added. It also shows in 3D.');
      return;
    }
    if (view.planTool === 'erase') {
      const spans = cfg.glassSpans || [], gates = cfg.gates || [];
      const gi0 = gates.findIndex((q) => q.w === hit.w && Math.abs(q.x - hit.x) < 0.9);
      const si0 = spans.findIndex((q) => q.w === hit.w && hit.x >= q.a - 0.1 && hit.x <= q.b + 0.1);
      if (gi0 < 0 && si0 < 0 && !isEnd(hit.w)) {
        const E = cloneEdit(), wn = hitWindow(svgPoint(e), E);
        if (wn) { E.wins[wn.w].splice(wn.i, 1); setValue('edit', E); toast('Window removed.'); return; }
      }
      const gi = gates.findIndex((q) => q.w === hit.w && Math.abs(q.x - hit.x) < 0.9);
      if (gi >= 0) { setValue('gates', gates.filter((_, i) => i !== gi)); toast('Glass door removed.'); return; }
      const si = spans.findIndex((q) => q.w === hit.w && hit.x >= q.a - 0.1 && hit.x <= q.b + 0.1);
      if (si >= 0) { setValue('glassSpans', spans.filter((_, i) => i !== si)); toast('Glass section removed.'); return; }
      toast('Nothing to remove there.');
    }
  }
  function toolUp(e) {
    if (!drawSpan) return;
    const b = alongWall(svgPoint(e), drawSpan.w);
    const a = Math.min(drawSpan.a, b), bb = Math.max(drawSpan.a, b), w = drawSpan.w;
    drawSpan = null;
    if (preview) { preview.remove(); preview = null; }
    if (bb - a < 0.6) { toast('Drag a bit further: glass sections are at least 0.6 m.'); return; }
    setValue('glassSpans', mergeSpans((cfg.glassSpans || []).concat([{ w, a, b: bb }])));
    toast(`Panorama glass ${(bb - a).toFixed(2)} m added to the ${w} wall. It also shows in 3D.`);
  }

  let drag = null;
  planHost.addEventListener('pointerdown', (e) => {
    const mk = e.target.closest && e.target.closest('.pl-dmark');
    if (mk) { // door option arrow
      e.preventDefault();
      openDoorMenu(mk.dataset.dmarkBath ? { bath: mk.dataset.dmarkBath } : { i: Number(mk.dataset.dmark) }, e.clientX, e.clientY);
      return;
    }
    if (view.planAdv) { // long press on a door opens its options
      clearTimeout(lpTimer); lpStart = { x: e.clientX, y: e.clientY };
      const p0 = svgPoint(e), cx0 = e.clientX, cy0 = e.clientY;
      lpTimer = setTimeout(() => {
        const dt = doorAt(p0); if (!dt) return;
        editDrag = null; drawSpan = null; drag = null; planHost.classList.remove('grab');
        if (editLine) { editLine.remove(); editLine = null; }
        renderPlan(false); openDoorMenu(dt, cx0, cy0);
      }, 480);
    }
    if (view.planTool) { toolDown(e); return; }
    drag = { x: e.clientX, y: e.clientY, vb: pvb.slice() }; planHost.setPointerCapture(e.pointerId); planHost.classList.add('grab');
  });
  planHost.addEventListener('pointermove', (e) => {
    if (lpStart && Math.hypot(e.clientX - lpStart.x, e.clientY - lpStart.y) > 6) { clearTimeout(lpTimer); lpStart = null; }
    if (editDrag) { editMove(e); return; }
    if (drawSpan) { showPreview(drawSpan.a, alongWall(svgPoint(e), drawSpan.w), drawSpan.w); return; }
    if (!drag) return;
    const { sc } = planScale();
    pvb = [drag.vb[0] - (e.clientX - drag.x) / sc, drag.vb[1] - (e.clientY - drag.y) / sc, pvb[2], pvb[3]];
    applyVB();
  });
  const endDrag = (e) => { clearTimeout(lpTimer); lpStart = null; if (editDrag) editUp(e); if (drawSpan) toolUp(e); drag = null; planHost.classList.remove('grab'); };
  planHost.addEventListener('pointerup', endDrag);
  planHost.addEventListener('pointercancel', () => { editDrag = null; if (editLine) { editLine.remove(); editLine = null; } drawSpan = null; if (preview) { preview.remove(); preview = null; } drag = null; });
  $('#planTools').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) setPlanTool(b.dataset.tool); // (tools live in #drawTools)
    if (b.dataset.popt === 'furniture') { setValue('furniture', !cfg.furniture); return; }
    if (b.dataset.popt) { planOpts[b.dataset.popt] = !planOpts[b.dataset.popt]; store.set('chz.planopts.v1', planOpts); renderPlan(false); }
    if (b.dataset.zoom === 'in') zoomPlan(1 / 1.3);
    if (b.dataset.zoom === 'out') zoomPlan(1.3);
    if (b.dataset.zoom === 'fit') { pvb = baseVB.slice(); applyVB(); }
    if (b.id === 'btnCopySvg') copyText(planHost.innerHTML, null, 'Floor plan copied as SVG. Paste it into a drawing app or a .svg file.');
  });
  function setPlan2D(on) {
    view.plan2d = on;
    stage.classList.toggle('mode-2d', on);
    planView.hidden = !on;
    if (!on && view.planTool) setPlanTool(view.planTool); // leaving 2D switches the tool off
    if (on) renderPlan(true);
  }

  // ------------------------------------------------------------------ go
  resize();
  rebuild();
  renderPanel();
  renderSummary();
  renderBenefits(false);
  setBene(view.beneOpen);
  preset('exterior', true);
  requestAnimationFrame(loop);
  if (store.get('chz.hq.v1', false)) setHQ(true);
  CHZ.app = { get cfg() { return cfg; }, setValue, preset, view, renderer, scene, camera, controls, get composer() { return composer; }, get H() { return H; }, setHQ, setPresent };
})(window.CHZ);
