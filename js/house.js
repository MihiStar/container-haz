/* 3D model builder for the expandable container house.
 * Coordinates: metres, Y up. X = container length (entrance at +X end), Z = width (front long side at +Z).
 * Core module |z| < 1.1 m, two fold-out wings on -Z (back) and +Z (front).
 */
(function (CHZ) {
  'use strict';
  const T3 = THREE;
  // correct colour management: material colour codes are sRGB and get converted to linear light
  if (T3.ColorManagement) T3.ColorManagement.legacyMode = false;
  const { byId } = CHZ;
  const shade = CHZ.tex.shade;

  // ------------------------------------------------------------------ materials
  const matCache = new Map();
  function stdMat(color, o) {
    o = o || {};
    const key = 's|' + color + '|' + JSON.stringify(o);
    if (matCache.has(key)) return matCache.get(key);
    const m = new T3.MeshStandardMaterial({
      color: new T3.Color(color), roughness: o.r != null ? o.r : 0.6, metalness: o.m != null ? o.m : 0.05,
      transparent: o.op != null, opacity: o.op != null ? o.op : 1, depthWrite: o.op == null,
      emissive: new T3.Color(o.em || '#000000'), emissiveIntensity: o.ei != null ? o.ei : 1,
      side: o.ds ? T3.DoubleSide : T3.FrontSide,
    });
    matCache.set(key, m);
    return m;
  }
  let maxAniso = 4;
  let Q = 'std'; // 'std' | 'hq' (presentation quality)
  // relief strength per texture kind, used as bump map in HQ mode
  const BUMP = { rib: 0.012, wood: 0.004, flute: 0.03, boards: 0.012, stone: 0.035, brick: 0.03, planks: 0.004, herring: 0.005, checker: 0.02, concrete: 0.008, travertine: 0.006, terrazzo: 0.002, fabric: 0.003, marble: 0.001, camo: 0, digicamo: 0, solid: 0.001, cells: 0.004 };
  // ---------------------------------------------------------------- realistic PBR texture sets
  // Photo-scanned CC0 sets from Poly Haven in assets/tex (colour + OpenGL normal + roughness).
  // size = real-world metres covered by one texture repeat (from Poly Haven metadata).
  const ASSET_TEX = 'assets/tex/';
  const SETS = {
    corrugated: { f: 'corrugated_iron_02', r: '2k', size: 3 },     // 2.7 m, rounded to 3 so printed patterns tile cleanly
    cedar: { f: 'japanese_cedar_planks', r: '2k', size: 1.13 },
    stone: { f: 'stacked_stone_wall', r: '1k', size: 2 },
    brick: { f: 'red_brick_03', r: '1k', size: 1 },
    marble: { f: 'marble_01', r: '1k', size: 1.5 },
    laminate: { f: 'laminate_floor_02', r: '1k', size: 1.7 },
    parquet: { f: 'herringbone_parquet', r: '1k', size: 3.4 },
    deck: { f: 'wood_floor_deck', r: '1k', size: 1.8 },
    concrete: { f: 'concrete_floor_02', r: '1k', size: 2 },
    grass: { f: 'aerial_grass_rock', r: '2k', size: 15 },
    forest: { f: 'forrest_ground_01', r: '1k', size: 2 },
    snow: { f: 'snow_02', r: '1k', size: 2 },
  };
  function setFor(d) {
    if (d.pbr) return d.pbr;
    switch (d.k) {
      case 'rib': return 'corrugated';
      case 'flute': case 'boards': return 'cedar';
      case 'stone': return 'stone';
      case 'brick': return 'brick';
      case 'marble': return 'marble';
      case 'planks': return 'laminate';
      case 'herring': return 'parquet';
      case 'concrete': return 'concrete';
      default: return d.rib ? 'corrugated' : null; // printed steel (wood / camo prints) keeps its print, gains real relief
    }
  }
  const texLoader = new T3.TextureLoader();
  const photoCache = new Map();
  function photoTex(url, repeat, srgb, onload) {
    const key = url + '|' + repeat;
    if (photoCache.has(key)) { const e = photoCache.get(key); if (onload) e.cbs.push(onload); if (e.done && onload) onload(e.tex); return e.tex; }
    const e = { cbs: onload ? [onload] : [], done: false, tex: null };
    e.tex = texLoader.load(url, (t) => { e.done = true; e.cbs.forEach((cb) => cb(t)); });
    e.tex.wrapS = e.tex.wrapT = T3.RepeatWrapping;
    e.tex.repeat.set(repeat, repeat);
    e.tex.anisotropy = 16;
    if (srgb) e.tex.encoding = T3.sRGBEncoding;
    photoCache.set(key, e);
    return e.tex;
  }
  const s2l = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  // tint a photo albedo so its average colour equals the chosen catalog colour (keeps photo detail, keeps catalog colour)
  function tintTo(mat, hex) {
    return (tex) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 16;
      const ctx = cv.getContext('2d'); ctx.drawImage(tex.image, 0, 0, 16, 16);
      const px = ctx.getImageData(0, 0, 16, 16).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < px.length; i += 4) { r += s2l(px[i] / 255); g += s2l(px[i + 1] / 255); b += s2l(px[i + 2] / 255); }
      const n = px.length / 4, c = new T3.Color(hex); // already linear (ColorManagement)
      mat.color.setRGB(Math.min(4, c.r / Math.max(0.01, r / n)), Math.min(4, c.g / Math.max(0.01, g / n)), Math.min(4, c.b / Math.max(0.01, b / n)));
      mat.needsUpdate = true;
    };
  }
  function pbrMaterial(setName, d, o) {
    o = o || {};
    const S = SETS[setName], rep = 1 / S.size, base = ASSET_TEX + S.f + '_';
    const m = new T3.MeshStandardMaterial({
      normalMap: photoTex(base + 'nor_gl_' + S.r + '.jpg', rep, false),
      roughnessMap: photoTex(base + 'rough_' + S.r + '.jpg', rep, false),
      roughness: o.r != null ? Math.min(1, o.r + 0.35) : 1,
      metalness: 0,
      side: o.ds ? T3.DoubleSide : T3.FrontSide,
    });
    if (setName === 'corrugated') {
      // painted / printed steel: exact catalog print as colour, real corrugation + sheen from the scan
      const flat = Object.assign({}, d); delete flat.rib; if (flat.k === 'rib') flat.k = 'solid';
      const tiles = S.size, px = 2048, one = CHZ.tex.canvasFor(flat, Math.round(px / tiles));
      const cv = document.createElement('canvas'); cv.width = cv.height = px;
      const ctx = cv.getContext('2d');
      for (let i = 0; i < tiles; i++) for (let j = 0; j < tiles; j++) ctx.drawImage(one, (i * px) / tiles, (j * px) / tiles, px / tiles + 1, px / tiles + 1);
      const map = new T3.CanvasTexture(cv);
      map.wrapS = map.wrapT = T3.RepeatWrapping; map.repeat.set(rep, rep); map.encoding = T3.sRGBEncoding; map.anisotropy = 16;
      m.map = map;
      m.metalness = d.metal != null ? d.metal : 0.35;
      m.roughness = 0.85;
      m.normalScale.set(1.4, 1.4);
    } else {
      m.map = photoTex(base + 'diff_' + S.r + '.jpg', rep, true, d && d.c ? tintTo(m, d.c) : null);
      if (d && d.metal) m.metalness = d.metal;
    }
    m.envMapIntensity = 1;
    return m;
  }

  // ---------------------------------------------------------------- HD catalog material (realistic mode)
  // Draws the listed catalog texture at high resolution and derives a matching normal map from it
  // (dark joints/grooves/grain read as recessed), so relief always lines up with the chosen pattern.
  const RELIEF = { wood: 1.2, flute: 3.2, boards: 2.2, stone: 3.4, brick: 3.0, planks: 1.4, herring: 1.6, concrete: 1.0, travertine: 1.2, terrazzo: 0.6, fabric: 0.8, marble: 0.25, solid: 0.15, checker: 2.4, camo: 0, digicamo: 0 };
  const ROUGH = { wood: 0.62, flute: 0.68, boards: 0.6, stone: 0.88, brick: 0.85, planks: 0.5, herring: 0.5, concrete: 0.85, travertine: 0.55, terrazzo: 0.35, fabric: 0.9, marble: 0.22, solid: 0.45, checker: 0.7 };
  function normalFromCanvas(cv) {
    const S = cv.width, src = cv.getContext('2d').getImageData(0, 0, S, S).data;
    const h = new Float32Array(S * S), b = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) h[i] = (0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2]) / 255;
    // 3x3 box blur (wrapping) to keep relief smooth instead of noisy
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += h[((y + dy + S) % S) * S + ((x + dx + S) % S)];
      b[y * S + x] = s / 9;
    }
    const out = document.createElement('canvas'); out.width = out.height = S;
    const ctx = out.getContext('2d'), img = ctx.createImageData(S, S), o = img.data;
    const k = S / 256; // keep slope strength independent of resolution
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const l = b[y * S + ((x - 1 + S) % S)], r = b[y * S + ((x + 1) % S)], u = b[((y - 1 + S) % S) * S + x], d = b[((y + 1) % S) * S + x];
      let nx = (l - r) * k, ny = (d - u) * k, nz = 1;
      const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
      const i = (y * S + x) * 4;
      o[i] = (nx * 0.5 + 0.5) * 255; o[i + 1] = (ny * 0.5 + 0.5) * 255; o[i + 2] = (nz * 0.5 + 0.5) * 255; o[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }
  function hdCatalogMat(d, o) {
    const big = ['wood', 'flute', 'boards', 'stone', 'brick', 'planks', 'herring', 'marble'].includes(d.k);
    const cv = CHZ.tex.canvasFor(d, big ? 2048 : 1024);
    const tile = d.tile || 1;
    const prep = (t, srgb) => { t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(1 / tile, 1 / tile); t.anisotropy = 16; if (srgb) t.encoding = T3.sRGBEncoding; return t; };
    const m = new T3.MeshStandardMaterial({
      map: prep(new T3.CanvasTexture(cv), true),
      roughness: o.r != null ? o.r : (d.gloss ? 0.15 : (ROUGH[d.k] != null ? ROUGH[d.k] : 0.6)),
      metalness: o.m != null ? o.m : (d.metal != null ? d.metal : 0.02),
      side: o.ds ? T3.DoubleSide : T3.FrontSide,
    });
    const rel = RELIEF[d.k] != null ? RELIEF[d.k] : 0.5;
    if (rel > 0) { m.normalMap = prep(new T3.CanvasTexture(normalFromCanvas(cv))); m.normalScale.set(rel, rel); }
    m.envMapIntensity = m.roughness < 0.35 ? 1 : 0.7;
    return m;
  }

  function texMat(d, o) {
    o = o || {};
    if (!d.k) return stdMat(d.c || '#888', o);
    const key = 't|' + Q + '|' + JSON.stringify(d) + '|' + JSON.stringify(o);
    if (matCache.has(key)) return matCache.get(key);
    if (Q === 'real' && !o.uv01) {
      // Catalog finishes keep their exact listed pattern. Painted/printed steel gains the scanned corrugation;
      // every other finish gets HD resolution plus a normal map derived from its own pattern.
      const m = (d.k === 'rib' || d.rib) ? pbrMaterial('corrugated', d, o) : hdCatalogMat(d, o);
      matCache.set(key, m);
      return m;
    }
    const hq = Q !== 'std';
    const tex = new T3.CanvasTexture(CHZ.tex.canvasFor(d, hq ? 1024 : 512));
    tex.wrapS = tex.wrapT = T3.RepeatWrapping;
    tex.encoding = T3.sRGBEncoding;
    tex.anisotropy = hq ? Math.max(maxAniso, 16) : maxAniso;
    const tile = d.tile || 1;
    if (!o.uv01) tex.repeat.set(1 / tile, 1 / tile);
    const m = new T3.MeshStandardMaterial({
      map: tex,
      roughness: o.r != null ? o.r : (d.gloss ? 0.18 : 0.72),
      metalness: o.m != null ? o.m : (d.metal != null ? d.metal : (d.rib ? 0.25 : d.k === 'rib' ? 0.3 : 0.02)),
      side: o.ds ? T3.DoubleSide : T3.FrontSide,
    });
    if (hq) {
      const b = d.rib ? Math.max(BUMP.rib, BUMP[d.k] || 0) : BUMP[d.k];
      if (b) { m.bumpMap = tex; m.bumpScale = b; }
      m.envMapIntensity = m.metalness > 0.2 || m.roughness < 0.3 ? 1.0 : 0.55;
    }
    matCache.set(key, m);
    return m;
  }
  function setQuality(q) { Q = q === 'hq' || q === 'real' ? q : 'std'; }
  const optMat = (opt, o) => (opt.t ? texMat(opt.t, o) : stdMat(opt.c, o));

  // shared, mutable materials (day/night)
  const shared = {
    glass: new T3.MeshStandardMaterial({ color: '#7a95a3', roughness: 0.05, metalness: 0.35, transparent: true, opacity: 0.32, depthWrite: false, emissive: new T3.Color('#ffcf8a'), emissiveIntensity: 0 }),
    lamp: new T3.MeshStandardMaterial({ color: '#ffffff', emissive: new T3.Color('#fff1d6'), emissiveIntensity: 0.25, roughness: 0.4 }),
    led: new T3.MeshStandardMaterial({ color: '#ffffff', emissive: new T3.Color('#f4f8ff'), emissiveIntensity: 0.6, roughness: 0.4 }),
    water: new T3.MeshStandardMaterial({ color: '#3fa6c9', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.78, emissive: new T3.Color('#2bb3e6'), emissiveIntensity: 0.06 }),
    heat: new T3.MeshBasicMaterial({ color: '#ff5a1a', transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }),
  };

  // ------------------------------------------------------------------ geometry helpers
  let SEC = 'model';
  function planarUV(geo) {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); }
      else if (ay >= az) { u = p.getX(i); v = p.getZ(i); }
      else { u = p.getX(i); v = p.getY(i); }
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }
  function tag(m, o) {
    m.castShadow = !(o && o.noShadow);
    m.receiveShadow = true;
    m.userData.sec = (o && o.sec) || SEC;
    return m;
  }
  function box(parent, w, h, d, mat, x, y, z, o) {
    const geo = new T3.BoxGeometry(Math.max(w, 0.001), Math.max(h, 0.001), Math.max(d, 0.001));
    geo.translate(x || 0, y || 0, z || 0);
    if (!(o && o.uv01)) planarUV(geo);
    const m = tag(new T3.Mesh(geo, mat), o);
    parent.add(m);
    return m;
  }
  function cyl(parent, rt, rb, h, mat, x, y, z, o) {
    const geo = new T3.CylinderGeometry(rt, rb, h, (o && o.seg) || 24);
    if (o && o.rx) geo.rotateX(o.rx);
    if (o && o.rz) geo.rotateZ(o.rz);
    geo.translate(x || 0, y || 0, z || 0);
    const m = tag(new T3.Mesh(geo, mat), o);
    parent.add(m);
    return m;
  }
  function grp(parent, x, y, z, ry) {
    const g = new T3.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (ry) g.rotation.y = ry;
    parent.add(g);
    return g;
  }
  function shapeMesh(parent, pts, mat, o) { // pts in (u,v) plane -> XY plane geometry
    const s = new T3.Shape(pts.map((p) => new T3.Vector2(p[0], p[1])));
    const geo = new T3.ShapeGeometry(s);
    const uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i));
    const m = tag(new T3.Mesh(geo, mat), o);
    parent.add(m);
    return m;
  }

  // wall along local X, bottom at y=0, outside face +Z. ops: [{u, w, y0, h}]
  function wallMesh(parent, len, h, t, ops, mats) {
    const list = (ops || []).filter((o) => o.w > 0).sort((a, b) => a.u - b.u);
    let cur = -len / 2;
    const seg = (x0, x1, y0, y1) => {
      if (x1 - x0 < 0.005 || y1 - y0 < 0.005) return;
      box(parent, x1 - x0, y1 - y0, t, mats, (x0 + x1) / 2, (y0 + y1) / 2, 0);
    };
    for (const o of list) {
      const a = Math.max(-len / 2, o.u - o.w / 2), b = Math.min(len / 2, o.u + o.w / 2);
      seg(cur, a, 0, h);
      seg(a, b, 0, Math.min(o.y0, h)); // an opening above a cut-down wall leaves the wall whole
      seg(a, b, o.y0 + o.h, h);
      cur = Math.max(cur, b);
    }
    seg(cur, len / 2, 0, h);
  }

  // ------------------------------------------------------------------ the build
  function build(cfg, opt) {
    opt = opt || {};
    const C = CHZ;
    const size = C.sizeOf(cfg);
    const L = size.L, W = size.W, c = C.CORE_W / 2, D = W / 2 - c;
    const beds = C.LAYOUTS[cfg.layout].beds;
    const T = cfg.panelThk / 1000 + 0.01;
    const F = 0.2, CEIL = 2.6, TOP = 2.8, P = 0.16, IN = 0.03, WH = CEIL - F, PT = 0.06;
    const cut = !!opt.cut;
    // cutaway: interior partitions, bathroom linings and room doors are cut down to the same 0.9 m as the outer walls
    const cutIn = cut && opt.cutInterior !== false; // the Cutaway bar's Interior: Cut / Full switch
    const IH = cutIn ? 0.9 : CEIL - 0.2, DH = cutIn ? 0.9 : 2.04;
    // cutaway: which outer walls face the camera and get cut down to 0.9 m (default: the front)
    const CS = cut ? Object.assign({ front: false, back: false, east: false, west: false }, opt.cutSides || { front: true }) : {};
    if (opt.renderer) maxAniso = Math.min(8, opt.renderer.capabilities.getMaxAnisotropy());

    const root = new T3.Group();
    const core = grp(root), wingB = grp(root), wingF = grp(root);
    const inner = grp(root), roofX = grp(root), outside = grp(root);
    const lights = { inside: [], outside: [] };

    // ---- materials from config
    const frameC = byId(C.FRAME, cfg.frame).c;
    const frameM = stdMat(frameC, { r: 0.55, m: 0.15 }); // painted steel
    const cladOpt = byId(C.CLAD[cfg.cladType], cfg.clad);
    const outM = texMat(cladOpt.t);
    const sand = byId(C.SANDWICH, cfg.sandwich);
    const edgeM = stdMat(sand.core, { r: 0.95, m: 0 });
    const iw = byId(C.INT_WALL[cfg.intWallType], cfg.intWall);
    let inD = iw.t;
    if (!inD) { inD = Object.assign({}, cladOpt.t); delete inD.rib; delete inD.metal; if (inD.k === 'rib') inD.k = 'solid'; }
    inD = Object.assign({}, inD, { tile: 1.2, seam: { every: 0.6, c: byId(C.JOINT, cfg.joint).c } });
    const inM = texMat(inD, { r: 0.55, m: 0 });
    const wallMats = [edgeM, edgeM, edgeM, edgeM, outM, inM];
    const floorOpt = byId(C.FLOOR[cfg.floorType], cfg.floor);
    const floorM = texMat(floorOpt.t, { r: cfg.floorType === 'spc6' ? 0.42 : 0.6, m: 0 });
    const winM = stdMat(byId(C.WIN_FRAME, cfg.winFrame).c, { r: 0.45, m: 0.25 });
    const roofC = cfg.frame === 'white' || cfg.frame === 'lightgray' ? '#c9cbcd' : cfg.frame === 'brown' ? '#3d2c22' : '#34373b';
    const roofM = texMat({ k: 'rib', c: roofC });
    const chromeM = stdMat('#c9cdd1', { r: 0.18, m: 0.95 });
    const darkM = stdMat('#202124', { r: 0.5, m: 0.2 });
    const whiteM = stdMat('#f4f4f1', { r: 0.25, m: 0 });
    const glassM = shared.glass;

    // ================================================================ HINGED WINGS
    // Real unfold sequence (supplier diagram): 1 roof panel swings up, 2 floor folds down,
    // 3 long side wall rises from the floor, 4 end walls swing closed. Core stays fixed.
    // Each hinge = pivot group (rotates) + content group offset back, so content is built in world coords.
    const hinge = (parentContent, x, y, z) => {
      const p = grp(parentContent, x, y, z);
      return { p, c: grp(p, -x, -y, -z), x, y, z };
    };
    const WG = {};
    for (const sgn of [-1, 1]) {
      const rootW = sgn < 0 ? wingB : wingF;
      const floor = hinge(rootW, 0, F, sgn * c);
      // side wall pivots on the inner edge of its panel stack (wall + folded end walls), so it lies on top of the floor
      const wall = hinge(floor.c, 0, F, sgn * (W / 2 - IN - T - 0.28));
      const eo = IN + T + 0.01, wo = IN + T + 0.13;
      const endE = hinge(wall.c, L / 2 - eo, 0, sgn * (W / 2 - eo));
      const endW = hinge(wall.c, -(L / 2 - wo), 0, sgn * (W / 2 - wo));
      const roof = hinge(rootW, 0, TOP, sgn * c);
      WG[sgn] = { floor, wall, endE, endW, roof };
    }
    const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const FOLD_STEPS = ['Folded for transport', '1 Roof expansion', '2 Floor deployment', '3 Side walls unfold', '4 End walls close', 'Completed house'];
    function setFold(t) {
      const ph = (a, b) => ease((t - a) / (b - a));
      const kr = ph(0, 0.25), kf = ph(0.25, 0.5), kw = ph(0.5, 0.75), ke = ph(0.75, 1);
      for (const sgn of [-1, 1]) {
        const g = WG[sgn];
        g.roof.p.rotation.x = sgn * (Math.PI / 2) * (1 - kr);
        g.roof.p.position.z = sgn * (c + 0.42 * (1 - kr)); // folded roof hangs outside the raised floor
        g.floor.p.rotation.x = -sgn * (Math.PI / 2) * (1 - kf);
        g.wall.p.rotation.x = -sgn * (Math.PI / 2) * (1 - kw);
        g.endE.p.rotation.y = sgn * (Math.PI / 2) * (1 - ke);
        g.endW.p.rotation.y = -sgn * (Math.PI / 2) * (1 - ke);
      }
      const step = t <= 0.001 ? 0 : t >= 0.999 ? 5 : 1 + Math.min(3, Math.floor(t / 0.25));
      return { width: 2 * c + 2 * D * kf, label: FOLD_STEPS[step], step };
    }

    // ================================================================ FRAME
    SEC = 'structure';
    // Only the two long top beams of the core span over the rooms (between core and wings).
    // They get their own material instance so the Cutaway / Top views can ghost or hide them.
    // Posts, base beams and the top beams resting on outer/end walls always stay solid.
    const structM = stdMat(frameC, { r: 0.55, m: 0.15, frame: 1 });
    const frameFor = (g, isCore, sign) => {
      const ex = L / 2 - P / 2;
      if (isCore) {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, P, TOP, P, frameM, sx * ex, TOP / 2, sz * (c - P / 2));
        for (const y of [0.1, TOP - 0.1]) {
          // base beams sit 30 mm below the floor surface (top at 0.17) so they never z-fight with the floor boards
          const bh = y > 1 ? 0.2 : 0.17, by = y > 1 ? y : 0.085;
          for (const sz of [-1, 1]) box(g, L - 2 * P, bh, P, y > 1 ? structM : frameM, 0, by, sz * (c - P / 2));
          for (const sx of [-1, 1]) if (y < 1 || !CS[sx > 0 ? 'east' : 'west']) box(g, P, bh, 2 * c - 2 * P, frameM, sx * ex, by, 0);
        }
      } else {
        const zo = sign * (W / 2 - P / 2), zm = sign * (c + D / 2);
        const cutWing = !!CS[sign > 0 ? 'front' : 'back'];
        const G = WG[sign];
        // outer corner posts rise with the side wall; base beams go with the floor; top beams with the roof.
        // In the cutaway, posts and top beams next to a cut (camera-facing) wall are cut down too.
        for (const sx of [-1, 1]) {
          const cutEnd = !!CS[sx > 0 ? 'east' : 'west'];
          if (!cutWing && !cutEnd) box(G.wall.c, P, TOP - 0.4, P, frameM, sx * ex, TOP / 2, zo);
          else box(G.wall.c, P, 0.9, P, frameM, sx * ex, 0.65, zo);
        }
        box(G.floor.c, L, 0.17, P, frameM, 0, 0.085, zo);
        if (!cutWing) box(G.roof.c, L, 0.2, P, frameM, 0, TOP - 0.1, zo);
        for (const sx of [-1, 1]) {
          box(G.floor.c, P, 0.17, D - P, frameM, sx * ex, 0.085, zm - sign * P / 2);
          if (!cutWing && !CS[sx > 0 ? 'east' : 'west']) box(G.roof.c, P, 0.2, D - P, frameM, sx * ex, TOP - 0.1, zm - sign * P / 2);
        }
      }
    };
    frameFor(core, true, 0);
    frameFor(wingB, false, -1);
    frameFor(wingF, false, 1);

    // floors, ceilings, roof slabs per module
    SEC = 'interior';
    box(core, L - 0.04, 0.04, 2 * c, floorM, 0, F - 0.02, 0);
    // wing floor panels: steel underside shows on the outside when folded up
    const underM = texMat({ k: 'rib', c: '#8d9196' });
    const wingFloorMats = [underM, underM, floorM, underM, underM, underM];
    box(WG[-1].floor.c, L - 0.04, 0.04, D, wingFloorMats, 0, F - 0.02, -(c + D / 2));
    box(WG[1].floor.c, L - 0.04, 0.04, D, wingFloorMats, 0, F - 0.02, c + D / 2);
    box(WG[-1].floor.c, L - 0.3, 0.16, D - 0.2, underM, 0, 0.1, -(c + D / 2));
    box(WG[1].floor.c, L - 0.3, 0.16, D - 0.2, underM, 0, 0.1, c + D / 2);
    if (!cut) {
      box(core, L - 0.1, 0.02, 2 * c, inM, 0, CEIL + 0.01, 0, { noShadow: true });
      box(WG[-1].roof.c, L - 0.1, 0.02, D - 0.05, inM, 0, CEIL + 0.01, -(c + D / 2), { noShadow: true });
      box(WG[1].roof.c, L - 0.1, 0.02, D - 0.05, inM, 0, CEIL + 0.01, c + D / 2, { noShadow: true });
      SEC = 'structure';
      box(core, L + 0.02, 0.04, 2 * c, roofM, 0, TOP, 0);
      box(WG[-1].roof.c, L + 0.02, 0.04, D + 0.01, roofM, 0, TOP - 0.005, -(c + D / 2));
      box(WG[1].roof.c, L + 0.02, 0.04, D + 0.01, roofM, 0, TOP - 0.005, c + D / 2);
    }

    // ================================================================ WINDOW / DOOR BUILDERS
    const winType = cfg.winType;
    const winW = { strip: 0.5, double: 1.2, sliding: 1.2 }[winType] || 0.93;
    const WIN_Y0 = 0.9, WIN_H = 1.2;
    const handleM = cfg.winFrame === 'wf-white' ? stdMat('#d7d7d2', { r: 0.3, m: 0.6 }) : chromeM;

    function sash(parent, sw, sh, cx, cy, z) {
      const s = 0.035, sd = 0.045;
      box(parent, sw, s, sd, winM, cx, cy - sh / 2 + s / 2, z);
      box(parent, sw, s, sd, winM, cx, cy + sh / 2 - s / 2, z);
      box(parent, s, sh - 2 * s, sd, winM, cx - sw / 2 + s / 2, cy, z);
      box(parent, s, sh - 2 * s, sd, winM, cx + sw / 2 - s / 2, cy, z);
      box(parent, sw - 2 * s, sh - 2 * s, 0.008, glassM, cx, cy, z, { noShadow: true });
    }
    function makeWindow(g, u, y0, w, h, type, blinds) {
      SEC = 'openings';
      const wg = grp(g, u, y0, 0);
      const f = 0.05, d = Math.max(0.07, T + 0.012);
      box(wg, w, f, d, winM, 0, f / 2, 0);
      box(wg, w, f, d, winM, 0, h - f / 2, 0);
      box(wg, f, h - 2 * f, d, winM, -w / 2 + f / 2, h / 2, 0);
      box(wg, f, h - 2 * f, d, winM, w / 2 - f / 2, h / 2, 0);
      const iw = w - 2 * f, ih = h - 2 * f, cy = f + ih / 2;
      if (type === 'inward' || type === 'strip') {
        const th = type === 'inward' ? ih * 0.3 : 0;
        if (th) {
          box(wg, iw, 0.04, d * 0.8, winM, 0, f + ih - th, 0);
          box(wg, iw, th - 0.02, 0.008, glassM, 0, f + ih - th / 2 + 0.01, 0, { noShadow: true });
        }
        sash(wg, iw, ih - th, 0, f + (ih - th) / 2, 0);
        box(wg, 0.02, 0.12, 0.03, handleM, iw / 2 - 0.07, f + (ih - th) / 2, -d / 2 - 0.015);
      } else if (type === 'outward') {
        box(wg, 0.045, ih, d * 0.8, winM, 0, cy, 0);
        sash(wg, iw / 2 - 0.02, ih, -iw / 4 - 0.01, cy, 0);
        const hg = grp(wg, iw / 2, 0, 0.02);
        hg.rotation.y = 0.5;
        sash(hg, iw / 2 - 0.02, ih, -iw / 4, cy, 0);
      } else if (type === 'hanging') {
        const hg = grp(wg, 0, f + ih, 0.02);
        hg.rotation.x = -0.32;
        sash(hg, iw, ih, 0, -ih / 2, 0);
        box(hg, 0.012, 0.02, 0.35, chromeM, iw / 2 - 0.08, -ih + 0.05, -0.17);
      } else if (type === 'double') {
        sash(wg, iw / 2, ih, -iw / 4, cy, 0);
        sash(wg, iw / 2, ih, iw / 4, cy, 0);
        box(wg, 0.02, 0.12, 0.03, handleM, -0.04, cy, -d / 2 - 0.015);
        box(wg, 0.02, 0.12, 0.03, handleM, 0.04, cy, -d / 2 - 0.015);
      } else if (type === 'sliding') {
        sash(wg, iw / 2 + 0.03, ih, -iw / 4 + 0.015, cy, 0.014);
        sash(wg, iw / 2 + 0.03, ih, iw / 4 - 0.015, cy, -0.014);
        box(wg, 0.015, 0.16, 0.02, handleM, iw / 2 - 0.09, cy, -0.04);
      }
      if (blinds) {
        const n = Math.floor((ih - 0.02) / 0.045);
        const geo = new T3.BoxGeometry(iw - 0.06, 0.003, 0.025);
        const im = new T3.InstancedMesh(geo, stdMat('#d9d9d4', { r: 0.6 }), n);
        const m4 = new T3.Matrix4(), q = new T3.Quaternion().setFromEuler(new T3.Euler(0.5, 0, 0));
        for (let i = 0; i < n; i++) { m4.compose(new T3.Vector3(0, f + 0.03 + i * 0.045, -0.006), q, new T3.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); }
        tag(im, { noShadow: true });
        wg.add(im);
      }
      return wg;
    }

    function doorLeaf(g, hingeU, y0, w, h, style, mat, angle, zOff) {
      const hg = grp(g, hingeU, y0, zOff || 0);
      hg.rotation.y = angle || 0;
      const t = 0.04;
      if (style === 'rainbow' || style === 'chinese') {
        const s = 0.07;
        box(hg, w, s, t, mat, w / 2, s / 2, 0);
        box(hg, w, s, t, mat, w / 2, h - s / 2, 0);
        box(hg, s, h - 2 * s, t, mat, s / 2, h / 2, 0);
        box(hg, s, h - 2 * s, t, mat, w - s / 2, h / 2, 0);
        const gm = style === 'rainbow'
          ? stdMat('#e9eef0', { op: 0.62, r: 0.25 })
          : stdMat('#f3efe4', { op: 0.75, r: 0.6 });
        box(hg, w - 2 * s, h - 2 * s, 0.01, gm, w / 2, h / 2, 0, { noShadow: true });
        if (style === 'rainbow') for (let x = s + 0.02; x < w - s; x += 0.035) box(hg, 0.006, h - 2 * s, 0.014, stdMat('#ffffff', { op: 0.5 }), x, h / 2, 0, { noShadow: true });
        else {
          for (let x = s + 0.11; x < w - s - 0.05; x += 0.11) box(hg, 0.012, h - 2 * s, 0.02, mat, x, h / 2, 0);
          for (let y = s + 0.14; y < h - s - 0.05; y += 0.14) box(hg, w - 2 * s, 0.012, 0.02, mat, w / 2, y, 0);
        }
      } else {
        box(hg, w, h, t, mat, w / 2, h / 2, 0);
      }
      if (h > 1.1) { // handles (left off a door cut down in the cutaway)
        box(hg, 0.12, 0.02, 0.02, chromeM, w - 0.12, 1.0, t / 2 + 0.02);
        box(hg, 0.12, 0.02, 0.02, chromeM, w - 0.12, 1.0, -t / 2 - 0.02);
      }
      return hg;
    }

    function makeEntrance(g, u, typeArg, isGate) {
      SEC = 'openings';
      const type = typeArg || cfg.entrance;
      const dg = grp(g, u, 0, 0);
      const f = 0.06, d = Math.max(0.08, T + 0.015);
      const w = type === 'steel' ? 1.0 : 1.7, h = type === 'steel' ? 2.1 : 2.2;
      const fm = type === 'steel' ? frameM : winM;
      box(dg, w, f, d, fm, 0, h - f / 2, 0);
      box(dg, f, h - f, d, fm, -w / 2 + f / 2, (h - f) / 2, 0);
      box(dg, f, h - f, d, fm, w / 2 - f / 2, (h - f) / 2, 0);
      const ih = h - f, iw = w - 2 * f;
      const glassLeaf = (cx, lw, handleSide) => {
        const s = 0.08;
        box(dg, lw, s, 0.05, winM, cx, s / 2, 0);
        box(dg, lw, s, 0.05, winM, cx, ih - s / 2, 0);
        box(dg, s, ih - 2 * s, 0.05, winM, cx - lw / 2 + s / 2, ih / 2, 0);
        box(dg, s, ih - 2 * s, 0.05, winM, cx + lw / 2 - s / 2, ih / 2, 0);
        box(dg, lw - 2 * s, ih - 2 * s, 0.01, glassM, cx, ih / 2, 0, { noShadow: true });
        if (handleSide) {
          const hx = cx + handleSide * (lw / 2 - 0.12);
          cyl(dg, 0.014, 0.014, 0.6, chromeM, hx, 1.05, 0.07, { seg: 10 });
          cyl(dg, 0.014, 0.014, 0.6, chromeM, hx, 1.05, -0.07, { seg: 10 });
        }
      };
      if (type === 'glassDouble') {
        glassLeaf(-iw / 4, iw / 2, 1);
        glassLeaf(iw / 4, iw / 2, -1);
      } else if (type === 'glassSingle') {
        glassLeaf(-iw / 2 + 0.5, 1.0, 1);
        glassLeaf(iw / 2 - (iw - 1.0) / 2, iw - 1.0, 0);
      } else {
        const sc = byId(C.STEEL_DOOR_COLORS, cfg.steelColor);
        const sm = optMat(sc, { r: 0.45, m: sc.t ? 0.05 : 0.55 });
        box(dg, iw, ih, 0.06, sm, 0, ih / 2, 0);
        const pm = sc.t ? sm : stdMat(shade(sc.c, 0.12), { r: 0.4, m: 0.55 });
        box(dg, iw - 0.24, ih * 0.38, 0.02, pm, 0, ih * 0.72, 0.035);
        box(dg, iw - 0.24, ih * 0.38, 0.02, pm, 0, ih * 0.27, 0.035);
        box(dg, 0.03, 0.45, 0.03, chromeM, iw / 2 - 0.1, 1.05, 0.07);
      }
      if (cfg.smartLock && !isGate) {
        SEC = 'smart';
        const hx = type === 'glassDouble' ? -0.2 : type === 'glassSingle' ? -iw / 2 + 0.82 : iw / 2 - 0.1;
        box(dg, 0.07, 0.24, 0.03, darkM, hx, 1.35, 0.08);
        box(dg, 0.05, 0.08, 0.005, stdMat('#4aa8ff', { em: '#4aa8ff', ei: 1.2 }), hx, 1.4, 0.097, { noShadow: true });
      }
      return { w, h };
    }

    // glass curtain wall centred on the group origin; gaps = door openings ({u, w, h}), one object or a list
    function makeCurtain(g, len, h, gap) {
      SEC = 'openings';
      const gaps = gap ? (Array.isArray(gap) ? gap : [gap]) : [];
      const n = Math.max(1, Math.round(len / 1.05));
      const bw = len / n;
      for (let i = 0; i <= n; i++) {
        const u = -len / 2 + i * bw;
        if (gaps.some((q) => Math.abs(u - q.u) < q.w / 2 + 0.02)) continue;
        box(g, 0.06, h, 0.11, frameM, u, h / 2, 0);
      }
      box(g, len, 0.07, 0.11, frameM, 0, 0.035, 0);
      box(g, len, 0.07, 0.11, frameM, 0, h - 0.035, 0);
      for (let i = 0; i < n; i++) {
        const a = -len / 2 + i * bw, b = a + bw, mid = (a + b) / 2;
        const q = gaps.find((q2) => b > q2.u - q2.w / 2 && a < q2.u + q2.w / 2);
        if (q) {
          const top = q.h + 0.04;
          if (h - 0.07 - top > 0.05) box(g, bw - 0.06, h - 0.07 - top, 0.012, glassM, mid, (top + h - 0.07) / 2, 0, { noShadow: true });
          box(g, bw, 0.05, 0.11, frameM, mid, q.h + 0.02, 0);
          continue;
        }
        box(g, bw - 0.06, h - 0.14, 0.012, glassM, mid, h / 2, 0, { noShadow: true });
      }
    }

    function sideGroup(parent, which, along) {
      const off = IN + T / 2;
      if (which === 'front') return { g: grp(parent, along, F, W / 2 - off, 0), u: (x) => x - along };
      if (which === 'back') return { g: grp(parent, along, F, -(W / 2 - off), Math.PI), u: (x) => -(x - along) };
      if (which === 'east') return { g: grp(parent, L / 2 - off, F, along, Math.PI / 2), u: (z) => -(z - along) };
      return { g: grp(parent, -(L / 2 - off), F, along, -Math.PI / 2), u: (z) => z - along };
    }

    // ================================================================ LAYOUT (shared with the 2D plan via layout.js)
    const LY = CHZ.layout(cfg);
    const { x0, x1, z0, z1, zB, zF, baths, bedrooms, kitchens, hWalls, vWalls, entry, frontXs, backXs, bathW, bathE, furniture } = LY;

    // ================================================================ SHELL (exterior walls)
    SEC = 'exterior';
    const longLen = L - 2 * P;
    const curtainFront = !CS.front && (cfg.curtain === 'front' || cfg.curtain === 'both');
    const curtainEnd = cfg.curtain === 'end' || cfg.curtain === 'both';
    const entW = cfg.entrance === 'steel' ? 1.0 : 1.7, entH = cfg.entrance === 'steel' ? 2.1 : 2.2;
    // long walls: windows, main entrance, drawn panorama glass spans and glass doors (drawn on the 2D plan)
    const GATE_W = 1.7, GATE_H = 2.2;
    // cutaway: a camera-facing wall cut down to 0.9 m keeps its panorama glass, glass doors and entrance (cut too)
    // ops: [{ u, w, kind: 'glass' | 'door', glassDoor, gaps: [{ u, w }] (doors inside a glass section) }]
    const CUT_H = 0.9;
    const cutWall = (g, len, ops) => {
      wallMesh(g, len, CUT_H, T, ops.map((o) => ({ u: o.u, w: o.w, y0: 0, h: CUT_H + 0.1 })), wallMats);
      SEC = 'openings';
      ops.forEach((o) => {
        const sub = grp(g, o.u, 0, 0);
        if (o.kind === 'glass') { makeCurtain(sub, o.w, CUT_H, (o.gaps || []).map((q) => ({ u: q.u, w: q.w, h: CUT_H }))); (o.gaps || []).forEach((q) => cutDoor(sub, q.u, q.w, q.glass)); }
        else cutDoor(sub, 0, o.w, o.glassDoor);
      });
      SEC = 'exterior';
    };
    function cutDoor(g, u, w, glass) { // a door seen in the cut: frame posts, threshold and the lower part of the leaves
      const f = 0.06, d = Math.max(0.08, T + 0.015), fm = glass ? winM : frameM;
      for (const sx of [-1, 1]) box(g, f, CUT_H, d, fm, u + sx * (w / 2 - f / 2), CUT_H / 2, 0);
      box(g, w, 0.03, d, fm, u, 0.015, 0);
      if (glass) {
        box(g, 0.05, CUT_H, 0.05, winM, u, CUT_H / 2, 0);
        for (const sx of [-1, 1]) box(g, w / 2 - f - 0.03, CUT_H - 0.08, 0.01, glassM, u + sx * (w / 4), CUT_H / 2, 0, { noShadow: true });
      } else box(g, w - 2 * f, CUT_H - 0.03, 0.05, optMat(byId(C.STEEL_DOOR_COLORS, cfg.steelColor), { r: 0.45, m: 0.5 }), u, (CUT_H + 0.03) / 2, 0);
    }
    const longWall = (which) => {
      SEC = 'exterior';
      const s = sideGroup(WG[which === 'front' ? 1 : -1].wall.c, which, 0);
      const spans = (cfg.glassSpans || []).filter((q) => q.w === which);
      const gates = (cfg.gates || []).filter((q) => q.w === which);
      const mainDoor = which === 'front' && entry.wall === 'front' ? entry.x : null;
      if (CS[which]) { // cutaway: keep glass and doors on the cut wall
        const ops = [];
        const glassEntry = cfg.entrance !== 'steel';
        const doorsOn = gates.map((q) => ({ x: q.x, w: GATE_W, glass: true })).concat(mainDoor != null ? [{ x: mainDoor, w: entW, glass: glassEntry }] : []);
        if (which === 'front' && (cfg.curtain === 'front' || cfg.curtain === 'both')) {
          ops.push({ u: 0, w: longLen, kind: 'glass', gaps: doorsOn.map((d) => ({ u: s.u(d.x), w: d.w, glass: d.glass })) });
        } else {
          spans.forEach((q) => {
            const mid = (q.a + q.b) / 2;
            ops.push({ u: s.u(mid), w: q.b - q.a, kind: 'glass', gaps: doorsOn.filter((d) => d.x > q.a && d.x < q.b).map((d) => ({ u: s.u(d.x) - s.u(mid), w: d.w, glass: d.glass })) });
          });
          doorsOn.filter((d) => !spans.some((q) => d.x > q.a && d.x < q.b)).forEach((d) => ops.push({ u: s.u(d.x), w: d.w, kind: 'door', glassDoor: d.glass }));
        }
        cutWall(s.g, longLen, ops);
        return;
      }
      if (which === 'front' && curtainFront) { // whole long side glazed
        const gaps = gates.map((q) => ({ u: s.u(q.x), w: GATE_W, h: GATE_H }));
        if (mainDoor != null) gaps.push({ u: s.u(mainDoor), w: entW, h: entH });
        if (mainDoor != null) makeEntrance(s.g, s.u(mainDoor));
        gates.forEach((q) => makeEntrance(s.g, s.u(q.x), 'glassDouble', true));
        makeCurtain(s.g, longLen, WH, gaps);
        return;
      }
      const inSpan = (x, pad) => spans.some((q) => x > q.a - pad && x < q.b + pad);
      const xs = (which === 'front' ? frontXs : backXs).filter((x) => !inSpan(x, winW / 2 + 0.1) && !gates.some((q) => Math.abs(q.x - x) < GATE_W / 2 + winW / 2 + 0.1));
      const ops = xs.map((x) => ({ u: s.u(x), w: winW, y0: WIN_Y0, h: WIN_H }));
      const doorOps = [];
      if (mainDoor != null && !inSpan(mainDoor, 0)) doorOps.push({ u: s.u(mainDoor), w: entW, y0: 0, h: entH, main: true });
      gates.filter((q) => !inSpan(q.x, 0)).forEach((q) => doorOps.push({ u: s.u(q.x), w: GATE_W, y0: 0, h: GATE_H }));
      const spanOps = spans.map((q) => ({ u: s.u((q.a + q.b) / 2), w: q.b - q.a, y0: 0, h: WH, span: q }));
      wallMesh(s.g, longLen, WH, T, ops.concat(doorOps, spanOps), wallMats);
      ops.forEach((o) => makeWindow(s.g, o.u, o.y0, o.w, o.h, winType, cfg.blinds));
      doorOps.forEach((o) => makeEntrance(s.g, o.u, o.main ? null : 'glassDouble', !o.main));
      spanOps.forEach((o) => {
        const sub = grp(s.g, o.u, 0, 0);
        const gapsIn = gates.filter((q) => q.x > o.span.a && q.x < o.span.b).map((q) => ({ u: s.u(q.x) - o.u, w: GATE_W, h: GATE_H }));
        if (mainDoor != null && mainDoor > o.span.a && mainDoor < o.span.b) gapsIn.push({ u: s.u(mainDoor) - o.u, w: entW, h: entH, main: true });
        gapsIn.forEach((q) => makeEntrance(sub, q.u, q.main ? null : 'glassDouble', !q.main));
        makeCurtain(sub, o.w, WH, gapsIn);
      });
    };
    longWall('front');
    longWall('back');
    // ends: per module piece
    const wingLen = D - P, wingMid = c + (D - P) / 2;
    const endPiece = (which, module, zc, len, kind) => {
      SEC = 'exterior';
      const s = sideGroup(module, which, zc);
      const isEast = which === 'east', entryEnd = which === (entry.side || 'east');
      const coreDoor = kind === 'core' && entryEnd && entry.wall === 'end';
      if (CS[which]) { // cutaway: camera-facing end wall, cut to 0.9 m but keeping its glass and doors
        const glassEntry = cfg.entrance !== 'steel';
        if (entryEnd && curtainEnd) { cutWall(s.g, len, [{ u: 0, w: len - 0.02, kind: 'glass', gaps: coreDoor ? [{ u: 0, w: entW, glass: glassEntry }] : [] }]); return; }
        const bathC = kind === 'core' && (isEast ? bathE : bathW), pz0c = zc - len / 2, pz1c = zc + len / 2;
        const sp = bathC ? [] : (cfg.glassSpans || []).filter((q) => q.w === which)
          .map((q) => ({ a: Math.max(q.a, pz0c + 0.03), b: Math.min(q.b, pz1c - 0.03) })).filter((q) => q.b - q.a >= 0.4);
        const gt = bathC || coreDoor ? null : (cfg.gates || []).find((q) => q.w === which && q.x > pz0c && q.x < pz1c);
        const door = coreDoor ? { u: 0, w: entW, glass: glassEntry } : gt ? { u: 0, w: GATE_W, glass: true } : null;
        const ops = sp.map((q) => {
          const ua = s.u(q.a), ub = s.u(q.b), u0 = Math.min(ua, ub), u1 = Math.max(ua, ub), um = (u0 + u1) / 2;
          return { u: um, w: u1 - u0, kind: 'glass', gaps: door && door.u > u0 && door.u < u1 ? [{ u: door.u - um, w: door.w, glass: door.glass }] : [] };
        });
        if (door && !ops.some((o) => door.u > o.u - o.w / 2 && door.u < o.u + o.w / 2)) ops.push({ u: door.u, w: door.w, kind: 'door', glassDoor: door.glass });
        cutWall(s.g, len, ops);
        return;
      }
      if (entryEnd && curtainEnd) {
        if (coreDoor) {
          makeEntrance(s.g, 0);
          makeCurtain(s.g, len, WH, { u: 0, w: entW, h: entH });
        } else makeCurtain(s.g, len, WH, null);
        return;
      }
      const bathHere = kind === 'core' && (isEast ? bathE : bathW);
      // drawn panorama glass / glass door on this end panel (a span is cut at the panel edges; one door per panel, centred)
      const pz0 = zc - len / 2, pz1 = zc + len / 2;
      const dSpans = bathHere ? [] : (cfg.glassSpans || []).filter((q) => q.w === which)
        .map((q) => ({ a: Math.max(q.a, pz0 + 0.03), b: Math.min(q.b, pz1 - 0.03) })).filter((q) => q.b - q.a >= 0.4);
      const dGate = bathHere || coreDoor ? null : (cfg.gates || []).find((q) => q.w === which && q.x > pz0 && q.x < pz1);
      if (dSpans.length || dGate) {
        const uR = (q) => { const ua = s.u(q.a), ub = s.u(q.b); return [Math.min(ua, ub), Math.max(ua, ub)]; };
        const doors = coreDoor ? [{ u: 0, w: entW, h: entH, main: true }] : dGate ? [{ u: 0, w: GATE_W, h: GATE_H }] : [];
        const inSp = (u0, w0) => dSpans.some((q) => { const [ua, ub] = uR(q); return u0 + w0 / 2 > ua && u0 - w0 / 2 < ub; });
        const ww = Math.min(winW, len - 0.4);
        const wins = doors.length || inSp(0, ww) || len <= 1.3 ? [] : [{ u: 0, w: ww, y0: WIN_Y0, h: WIN_H }];
        const spanOps = dSpans.map((q) => { const [ua, ub] = uR(q); return { u: (ua + ub) / 2, w: ub - ua, y0: 0, h: WH }; });
        const wallDoors = doors.filter((d) => !inSp(d.u, 0.01)).map((d) => ({ u: d.u, w: d.w, y0: 0, h: d.h, main: d.main }));
        wallMesh(s.g, len, WH, T, wins.concat(spanOps, wallDoors), wallMats);
        wins.forEach((o) => makeWindow(s.g, o.u, o.y0, o.w, o.h, winType, cfg.blinds));
        wallDoors.forEach((d) => makeEntrance(s.g, d.u, d.main ? null : 'glassDouble', !d.main));
        spanOps.forEach((o) => {
          const sub = grp(s.g, o.u, 0, 0);
          const gapsIn = doors.filter((d) => d.u > o.u - o.w / 2 && d.u < o.u + o.w / 2).map((d) => ({ u: d.u - o.u, w: d.w, h: d.h, main: d.main }));
          gapsIn.forEach((d) => makeEntrance(sub, d.u, d.main ? null : 'glassDouble', !d.main));
          makeCurtain(sub, o.w, WH, gapsIn);
        });
        return;
      }
      if (coreDoor) {
        wallMesh(s.g, len, WH, T, [{ u: 0, w: entW, y0: 0, h: entH }], wallMats);
        makeEntrance(s.g, 0);
        return;
      }
      let ops = [];
      if (kind === 'wing' && len > 1.3) ops = [{ u: 0, w: Math.min(winW, len - 0.4), y0: WIN_Y0, h: WIN_H }];
      if (kind === 'core') {
        ops = bathHere ? [{ u: s.u((zB + zF) / 2), w: 0.5, y0: 1.5, h: 0.6, bath: true }] : [{ u: 0, w: Math.min(winW, len - 0.4), y0: WIN_Y0, h: WIN_H }];
      }
      wallMesh(s.g, len, WH, T, ops, wallMats);
      ops.forEach((o) => makeWindow(s.g, o.u, o.y0, o.w, o.h, o.bath ? 'hanging' : winType, cfg.blinds && !o.bath));
    };
    for (const which of ['east', 'west']) {
      endPiece(which, core, 0, 2 * c - 2 * P, 'core');
      const key = which === 'east' ? 'endE' : 'endW';
      endPiece(which, WG[-1][key].c, -wingMid, wingLen, 'wing');
      endPiece(which, WG[1][key].c, wingMid, wingLen, 'wing');
    }

    // ================================================================ INTERIOR
    const intMats = [inM, inM, edgeM, inM, inM, inM];
    const partX = (z, xa, xb, doors) => {
      SEC = 'interior';
      const cx = (xa + xb) / 2, g = grp(inner, cx, F, z);
      wallMesh(g, xb - xa, IH, PT, (doors || []).map((d) => ({ u: d.x - cx, w: d.w, y0: 0, h: 2.05 })), intMats);
      return { g, u: (x) => x - cx };
    };
    const partZ = (x, za, zb, doors) => {
      SEC = 'interior';
      const cz = (za + zb) / 2, g = grp(inner, x, F, cz, Math.PI / 2);
      wallMesh(g, zb - za, IH, PT, (doors || []).map((d) => ({ u: -(d.z - cz), w: d.w, y0: 0, h: 2.05 })), intMats);
      return { g, u: (z) => -(z - cz) };
    };
    const rdOpt = byId(C.ROOM_DOOR, cfg.roomDoor);
    const roomDoorM = optMat(rdOpt, { r: 0.5 });

    // ---- partition walls (merged per line) with door openings
    const hGroups = {};
    hWalls.forEach((ln) => ln.segs.forEach(([a, b]) => {
      const gaps = ln.gaps.filter((g) => g.at > a && g.at < b).map((g) => ({ x: g.at, w: g.w }));
      const p = partX(ln.at, a - PT / 2, b + PT / 2, gaps);
      gaps.forEach((g) => { hGroups[ln.at.toFixed(3) + '|' + g.x.toFixed(3)] = p; });
    }));
    const vGroups = {};
    vWalls.forEach((ln) => ln.segs.forEach(([a, b]) => {
      const gaps = ln.gaps.filter((g) => g.at > a && g.at < b).map((g) => ({ z: g.at, w: g.w }));
      const p = partZ(ln.at, a + PT / 2, b - PT / 2, gaps);
      gaps.forEach((g) => { vGroups[ln.at.toFixed(3) + '|' + g.z.toFixed(3)] = p; });
    }));
    // room doors (generated or edited on the 2D plan); into = swing side
    SEC = 'openings';
    (LY.doors || []).forEach((d) => {
      const w = d.w - 0.02, flip = d.hinge === -1; // hinge -1: hinged on the other jamb (leaf mirrored)
      if (d.o === 'h') {
        const p = hGroups[(+d.at).toFixed(3) + '|' + (+d.p).toFixed(3)];
        // hinge on the west edge, leaf along +x; positive angle swings toward -z, negative toward +z
        const a = d.into < 0 ? 1.2 : -1.2;
        if (p) doorLeaf(p.g, p.u(d.p) + (flip ? w / 2 : -w / 2), 0, w, DH, 'plain', roomDoorM, flip ? Math.PI - a : a);
      } else {
        const p = vGroups[(+d.at).toFixed(3) + '|' + (+d.p).toFixed(3)];
        const a = d.into > 0 ? -1.1 : 1.1;
        if (p) doorLeaf(p.g, p.u(d.p) + (flip ? w / 2 : -w / 2), 0, w, DH, 'plain', roomDoorM, flip ? Math.PI - a : a);
      }
    });

    // ---- bathrooms (core strip only)
    const bathOpt = byId(C.BATH_WALL[cfg.bathWallType], cfg.bathWall);
    const bathM = texMat(Object.assign({}, bathOpt.t, { tile: 1.2 }), { r: cfg.bathWallType === 'uv' ? 0.2 : 0.45, m: 0 });
    const finishM = cfg.shower === 'gungrey' ? stdMat('#55575b', { r: 0.25, m: 0.9 }) : chromeM;
    const hc = byId(C.HEATER_COLORS, cfg.heaterColor).c;
    const vmOpt = byId(C.VANITY, cfg.vanity);
    const lin = 0.012;
    baths.forEach((b) => {
      SEC = 'bathroom';
      const s = b.side === 'W' ? 1 : -1, ox = b.side === 'W' ? x0 : x1; // ox = outer end wall, s = direction into the room
      const nz = zB + PT / 2 + lin, sz = zF - PT / 2 - lin, mz = (nz + sz) / 2, depth = sz - nz;
      const at = (d) => ox + s * d;
      // door leaf (opens out into the hall)
      const p = vGroups[b.inner.toFixed(3) + '|' + b.door.z.toFixed(3)];
      if (p) {
        const st = cfg.bathDoor, m = st === 'std' ? whiteM : roomDoorM;
        const a = (s > 0 ? -1.1 : 1.1) * (b.door.swing === -1 ? -1 : 1), flip = b.door.hinge === -1; // swing -1: opens into the bathroom
        doorLeaf(p.g, p.u(b.door.z) + (flip ? 0.35 : -0.35), 0, 0.7, DH, st === 'rainbow' || st === 'chinese' ? st : 'plain', m, flip ? Math.PI - a : a);
      }
      // wall linings
      const blen = b.len - PT / 2;
      box(inner, blen, IH, lin, bathM, at(blen / 2), F + IH / 2, nz - lin / 2, { noShadow: true });
      box(inner, blen, IH, lin, bathM, at(blen / 2), F + IH / 2, sz + lin / 2, { noShadow: true });
      {
        const g = grp(inner, ox + s * (lin / 2 + 0.001), F, mz, Math.PI / 2);
        wallMesh(g, depth, IH, lin, [{ u: 0, w: 0.5, y0: 1.5, h: 0.6 }], bathM);
        const g2 = grp(inner, b.inner - s * (PT / 2 + lin / 2), F, mz, Math.PI / 2);
        wallMesh(g2, depth, IH, lin, [{ u: -(b.door.z - mz), w: 0.72, y0: 0, h: 2.05 }], bathM);
      }
      // shower tray + column at the outer end
      box(inner, 0.8, 0.06, depth, whiteM, at(0.4), F + 0.03, mz);
      cyl(inner, 0.012, 0.012, 1.4, finishM, at(0.06), F + 1.2, mz, { seg: 10 });
      cyl(inner, 0.11, 0.11, 0.015, finishM, at(0.2), F + 1.95, mz, { seg: 24 });
      box(inner, 0.16, 0.012, 0.012, finishM, at(0.13), F + 1.95, mz);
      box(inner, 0.03, 0.18, 0.1, finishM, at(0.02), F + 1.05, mz);
      // wet / dry screen
      {
        const frM = cfg.wetDryFrame === 'black' ? stdMat('#1d1e20', { r: 0.4, m: 0.6 }) : chromeM;
        const gM = cfg.wetDryGlass === 'frosted' ? stdMat('#eef2f3', { op: 0.68, r: 0.5 }) : stdMat('#cfe3ea', { op: 0.22, r: 0.05, m: 0.2 });
        const sx = at(0.82), hgt = 1.95;
        const fixedLen = cfg.wetDry === 'door' ? depth * 0.45 : depth * 0.62;
        box(inner, 0.01, hgt, fixedLen, gM, sx, F + 0.06 + hgt / 2, nz + fixedLen / 2, { noShadow: true });
        box(inner, 0.025, hgt, 0.025, frM, sx, F + 0.06 + hgt / 2, nz + 0.012);
        box(inner, 0.025, 0.025, fixedLen, frM, sx, F + 0.06 + hgt, nz + fixedLen / 2);
        if (cfg.wetDry === 'door') {
          const dl = depth - fixedLen - 0.05;
          const hg = grp(inner, sx, F + 0.06, sz - 0.02);
          hg.rotation.y = -0.5 * s;
          box(hg, 0.01, hgt, dl, gM, 0, hgt / 2, -dl / 2, { noShadow: true });
          box(hg, 0.025, hgt, 0.025, frM, 0, hgt / 2, -0.012);
          box(hg, 0.025, 0.025, dl, frM, 0, hgt, -dl / 2);
          box(hg, 0.02, 0.3, 0.02, frM, s * 0.03, 1.0, -dl + 0.05);
        } else box(inner, 0.025, 0.025, depth, frM, at(0.42), F + 0.06 + hgt, mz);
      }
      // toilet (back wall of the strip) + water heater above it
      {
        const tx = at(0.82 + 0.42), tz = nz;
        if (cfg.smartToilet) {
          SEC = 'smart';
          box(inner, 0.4, 0.42, 0.62, whiteM, tx, F + 0.21, tz + 0.33);
          box(inner, 0.38, 0.05, 0.5, stdMat('#e9e9e6', { r: 0.2 }), tx, F + 0.44, tz + 0.36);
          box(inner, 0.3, 0.08, 0.14, darkM, tx, F + 0.48, tz + 0.08);
          box(inner, 0.08, 0.02, 0.06, stdMat('#4aa8ff', { em: '#4aa8ff', ei: 1 }), tx, F + 0.53, tz + 0.08, { noShadow: true });
        } else {
          cyl(inner, 0.19, 0.15, 0.4, whiteM, tx, F + 0.2, tz + 0.42, { seg: 24 });
          box(inner, 0.38, 0.04, 0.46, whiteM, tx, F + 0.42, tz + 0.38);
          box(inner, 0.4, 0.38, 0.17, whiteM, tx, F + 0.62, tz + 0.09);
          box(inner, 0.06, 0.02, 0.04, chromeM, tx + 0.1, F + 0.82, tz + 0.1);
        }
        SEC = 'bathroom';
        if (cfg.heater === 'basic') box(inner, 0.3, 0.4, 0.12, whiteM, tx, F + 1.75, tz + 0.06);
        else if (cfg.heater === 'instant') {
          box(inner, 0.24, 0.36, 0.06, stdMat(hc, { r: 0.3, m: 0.2 }), tx, F + 1.6, tz + 0.03);
          box(inner, 0.1, 0.05, 0.005, stdMat('#8fd3ff', { em: '#8fd3ff', ei: 1.1 }), tx, F + 1.68, tz + 0.063, { noShadow: true });
        } else cyl(inner, 0.2, 0.2, 0.75, stdMat(hc, { r: 0.3, m: 0.2 }), tx, F + 1.95, tz + 0.21, { seg: 28, rz: Math.PI / 2 });
      }
      // vanity + LED mirror cabinet (front wall of the strip)
      {
        const avail = b.len - PT / 2 - 0.86 - 0.05, vw = Math.max(0.4, Math.min(cfg.vanityW / 100, avail));
        const vx = at(0.86 + vw / 2), vz = sz, vM = stdMat(vmOpt.c, { r: 0.45 });
        box(inner, vw, 0.45, 0.46, vM, vx, F + 0.62, vz - 0.23);
        box(inner, vw, 0.04, 0.48, whiteM, vx, F + 0.87, vz - 0.24);
        box(inner, Math.min(0.42, vw - 0.12), 0.02, 0.3, stdMat('#dfe4e6', { r: 0.1 }), vx, F + 0.885, vz - 0.24);
        cyl(inner, 0.012, 0.012, 0.18, chromeM, vx, F + 0.97, vz - 0.07, { seg: 10 });
        box(inner, vw, 0.72, 0.14, vM, vx, F + 1.55, vz - 0.07);
        box(inner, vw - 0.04, 0.68, 0.006, stdMat('#dfe7ea', { r: 0.03, m: 1 }), vx, F + 1.55, vz - 0.142, { noShadow: true });
        box(inner, vw - 0.04, 0.015, 0.008, shared.led, vx, F + 1.18, vz - 0.142, { noShadow: true });
      }
      if (cfg.exhaust) {
        box(inner, 0.3, 0.02, 0.3, stdMat('#ececea', { r: 0.4 }), at(Math.min(1.4, b.len - 0.4)), CEIL - 0.01, mz, { noShadow: true });
        box(inner, 0.3, 0.02, 0.3, stdMat('#ececea', { r: 0.4 }), at(0.17), F + 1.25, nz + 0.17);
      }
      if (cfg.towelRack) {
        SEC = 'smart';
        const tx = b.inner - s * (PT / 2 + lin + 0.012), tz = zB + 0.33;
        for (const dz of [-0.22, 0.22]) box(inner, 0.02, 0.8, 0.02, chromeM, tx, F + 1.25, tz + dz);
        for (let i = 0; i < 6; i++) box(inner, 0.016, 0.016, 0.44, chromeM, tx, F + 0.9 + i * 0.14, tz);
      }
      if (cfg.bathHeater) {
        SEC = 'smart';
        const hx = at(Math.min(1.4, b.len - 0.4)), hz = mz + (cfg.exhaust ? 0.35 : 0);
        box(inner, 0.6, 0.03, 0.3, stdMat('#f0f0ee', { r: 0.4 }), hx, CEIL - 0.015, hz, { noShadow: true });
        for (const dx of [-0.18, 0, 0.18]) cyl(inner, 0.05, 0.05, 0.01, stdMat('#ffb36b', { em: '#ffb36b', ei: 1.2 }), hx + dx, CEIL - 0.032, hz, { noShadow: true });
      }
    });

    // cutaway (Interior: Cut): bathroom fittings are trimmed at the same 0.9 m as the walls, so the bathroom opens up
    // like every other room (glass screen, shower column, mirror, heater, vents above the cut are cut away)
    if (cutIn) {
      const cutY = F + IH + 0.001, bx = new T3.Box3(), kill = [];
      root.updateMatrixWorld(true);
      inner.traverse((o) => {
        if (!o.isMesh || o.userData.sec !== 'bathroom') return;
        bx.setFromObject(o);
        if (bx.min.y >= cutY - 0.005) { kill.push(o); return; }
        if (bx.max.y <= cutY) return;
        const g = o.geometry; g.computeBoundingBox();
        const lb = g.boundingBox, sc = (cutY - bx.min.y) / (bx.max.y - bx.min.y); // parents only turn about Y, so local Y = world Y
        g.translate(0, -lb.min.y, 0); g.scale(1, sc, 1); g.translate(0, lb.min.y, 0);
      });
      kill.forEach((o) => { o.parent.remove(o); o.geometry.dispose(); });
    }

    // ---- kitchens (L-shape: run along the core strip + return along the cell's west side)
    if (kitchens.length) {
      SEC = 'kitchen';
      const cabOpt = C.CAB_FINISH.find((o) => o.id === cfg.cabFinish) || C.CAB_FINISH[0];
      const cabM = texMat(Object.assign({}, cabOpt.t, { tile: 1.2 }), { r: cabOpt.gloss ? 0.15 : 0.55, m: 0 });
      const ctOpt = byId(C.COUNTER[cfg.counterType], cfg.counter);
      const ctM = texMat(Object.assign({}, ctOpt.t, { tile: 1.2 }), { r: cfg.counterType === 'quartz' ? 0.2 : 0.3, m: 0 });
      const plinthM = stdMat('#2a2b2d', { r: 0.7 });
      const run = (xa, xb, za0, zb0) => {
        const za = Math.min(za0, zb0), zb = Math.max(za0, zb0);
        const w = xb - xa, d = zb - za, cx = (xa + xb) / 2, cz = (za + zb) / 2;
        box(inner, w - 0.02, 0.1, d - 0.06, plinthM, cx, F + 0.05, cz);
        box(inner, w, 0.76, d - 0.02, cabM, cx, F + 0.48, cz);
        box(inner, w + 0.01, 0.03, d + 0.01, ctM, cx, F + 0.875, cz);
      };
      const sinkDouble = cfg.sink.indexOf('double') >= 0;
      const sinkM = cfg.sink.indexOf('bk') === 0 ? stdMat('#1f2023', { r: 0.35, m: 0.3 }) : stdMat('#b9bec3', { r: 0.25, m: 0.9 });
      kitchens.forEach((k) => {
        const { kx, rx, kLen, aZa, aZb, kRet } = k, zd = k.zd || 1;
        run(kx, kx + kLen, aZa, aZb);
        const nA = Math.max(1, Math.round(kLen / 0.5));
        for (let i = 1; i < nA; i++) box(inner, 0.004, 0.7, 0.004, plinthM, kx + (i * kLen) / nA, F + 0.5, aZb + zd * 0.001, { noShadow: true });
        for (let i = 0; i < nA; i++) box(inner, 0.14, 0.012, 0.015, chromeM, kx + ((i + 0.5) * kLen) / nA, F + 0.8, aZb + zd * 0.01);
        const bZa = aZb, bZb = aZb + zd * kRet;
        run(rx, rx + 0.6, bZa, bZb);
        const sw = sinkDouble ? 0.75 : 0.6, sx = k.sinkAt(sw), szc = (aZa + aZb) / 2;
        box(inner, sw, 0.012, 0.42, sinkM, sx, F + 0.896, szc, { noShadow: true });
        if (sinkDouble) box(inner, 0.02, 0.014, 0.4, ctM, sx, F + 0.9, szc, { noShadow: true });
        cyl(inner, 0.014, 0.014, 0.3, chromeM, sx, F + 1.04, aZa + zd * 0.06, { seg: 10 });
        box(inner, 0.02, 0.02, 0.18, chromeM, sx, F + 1.18, aZa + zd * 0.14);
        box(inner, 0.52, 0.01, 0.5, stdMat('#0d0d0e', { r: 0.1, m: 0.3 }), rx + 0.3, F + 0.895, bZa + zd * kRet / 2, { noShadow: true });
        if (cfg.kitchenCab === 'up') {
          box(inner, kLen, 0.7, 0.34, cabM, kx + kLen / 2, F + 1.85, aZa + zd * 0.17);
          box(inner, kLen - 0.04, 0.012, 0.3, shared.led, kx + kLen / 2, F + 1.495, aZa + zd * 0.17, { noShadow: true });
          box(inner, 0.34, 0.7, kRet, cabM, k.flip ? rx + 0.43 : rx + 0.17, F + 1.85, (bZa + bZb) / 2);
          if (zd > 0 ? bZb + 0.62 < z1 - 0.05 : bZb - 0.62 > z0 + 0.05) box(inner, 0.6, 2.2, 0.62, cabM, rx + 0.3, F + 1.1, bZb + zd * 0.32);
        } else box(inner, kLen, 0.025, 0.25, cabM, kx + kLen / 2, F + 1.6, aZa + zd * 0.125);
      });
    }

    // ---- furniture
    if (cfg.furniture) {
      SEC = 'model';
      const woodM = texMat({ k: 'wood', c: '#a07a52', g: '#6b4c2e', tile: 1 });
      const fabM = stdMat('#8794a0', { r: 0.9 });
      const sheetM = stdMat('#f2f0ea', { r: 0.9 });
      const sofaM = stdMat('#5c6670', { r: 0.95 });
      const bed = (cx, bw, hz, dr) => { // head against the wall at hz, bed extends in direction dr (+1 / -1 along z)
        box(inner, bw + 0.08, 0.3, 2.06, woodM, cx, F + 0.15, hz + dr * 1.05);
        box(inner, bw + 0.08, 0.95, 0.06, woodM, cx, F + 0.47, hz + dr * 0.03);
        box(inner, bw, 0.2, 1.98, sheetM, cx, F + 0.4, hz + dr * 1.05);
        box(inner, bw + 0.04, 0.06, 1.3, fabM, cx, F + 0.52, hz + dr * 1.38);
        for (const sg of [-1, 1]) box(inner, bw / 2 - 0.1, 0.12, 0.34, sheetM, cx + sg * bw / 4, F + 0.55, hz + dr * 0.28);
      };
      bedrooms.forEach((r) => {
        const { cx, bw, headZ, dir } = r.bed;
        bed(cx, bw, headZ, dir);
        if (r.bed.stands[0]) box(inner, 0.42, 0.5, 0.38, woodM, cx - bw / 2 - 0.28, F + 0.25, headZ + dir * 0.2);
        if (r.bed.stands[1]) box(inner, 0.42, 0.5, 0.38, woodM, cx + bw / 2 + 0.28, F + 0.25, headZ + dir * 0.2);
      });
      const so = furniture.sofa;
      if (so && so.chair) box(inner, 0.75, 0.42, 0.75, sofaM, so.cx, F + 0.21, so.cz);
      else if (so) {
        box(inner, so.w, 0.42, so.d, sofaM, so.cx, F + 0.21, so.cz);
        box(inner, so.w, 0.45, 0.2, sofaM, so.cx, F + 0.62, so.cz - so.back * 0.32);
        for (const sg of [-1, 1]) box(inner, 0.18, 0.6, so.d, sofaM, so.cx + sg * (so.w / 2 - 0.09), F + 0.3, so.cz);
        box(inner, 1.6, 0.012, 1.2, stdMat('#c9c1b3', { r: 1 }), so.cx, F + 0.006, so.cz + so.back * 1.05, { noShadow: true });
        box(inner, 0.9, 0.4, 0.5, woodM, so.cx, F + 0.2, so.cz + so.back * 1.0);
      }
      const di = furniture.dining;
      if (di) {
        box(inner, di.w, 0.04, di.d, woodM, di.cx, F + 0.74, di.cz);
        for (const sg of [-1, 1]) for (const t of [-1, 1]) box(inner, 0.04, 0.72, 0.04, darkM, di.cx + sg * 0.34, F + 0.36, di.cz + t * 0.74);
        for (const sg of [-1, 1]) for (const t of [-0.5, 0.5]) {
          box(inner, 0.42, 0.04, 0.42, darkM, di.cx + sg * 0.62, F + 0.45, di.cz + t * 0.9);
          box(inner, 0.04, 0.42, 0.42, darkM, di.cx + sg * 0.82, F + 0.66, di.cz + t * 0.9);
        }
      }
    }

    // ---- floor heating (x-ray, cutaway only): film strips everywhere except the bathrooms
    if (cfg.floorHeat && cut) {
      SEC = 'interior';
      for (let z = z0 + 0.35; z < z1 - 0.3; z += 0.62) {
        let spans = [[x0 + 0.2, x1 - 0.2]];
        if (z > zB && z < zF) baths.forEach((b) => { spans = spans.flatMap(([a, bb]) => [[a, Math.min(bb, b.x0 - 0.2)], [Math.max(a, b.x1 + 0.2), bb]]).filter(([a, bb]) => bb - a > 0.3); });
        spans.forEach(([a, bb]) => { const g = box(inner, bb - a, 0.004, 0.32, shared.heat, (a + bb) / 2, F + 0.012, z, { noShadow: true }); g.renderOrder = 2; });
      }
    }

    // ---- indoor lights: one per room + hall
    SEC = 'interior';
    const lampAt = [];
    LY.rooms.forEach((r) => lampAt.push([(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]));
    lampAt.push([(LY.hall.x0 + LY.hall.x1) / 2, (zB + zF) / 2]);
    lampAt.forEach(([x, z], i) => {
      if (!cut) {
        if (cfg.indoorLights === 'up') {
          for (const dx of [-0.6, 0.6]) cyl(inner, 0.05, 0.05, 0.01, shared.lamp, x + dx, CEIL - 0.006, z, { noShadow: true, seg: 16 });
          box(inner, 1.4, 0.02, 0.05, shared.led, x, CEIL - 0.01, z, { noShadow: true });
        } else cyl(inner, 0.2, 0.2, 0.05, shared.lamp, x, CEIL - 0.025, z, { noShadow: true, seg: 28 });
      }
      if (i < 9) {
        const pl = new T3.PointLight('#ffd9a8', 0, 6, 2);
        pl.position.set(x, CEIL - 0.25, z);
        inner.add(pl);
        lights.inside.push(pl);
      }
    });
    if (cfg.indoorLights === 'up' && !cut) box(inner, x1 - x0 - 0.2, 0.015, 0.02, shared.led, (x0 + x1) / 2, CEIL - 0.03, z1 - 0.05, { noShadow: true });

    // ================================================================ ROOF UPGRADES
    const fasciaM = frameM;
    const o = 0.28;
    // shared roof geometry (also used by solar)
    const RB = TOP + 0.05;
    const G = { rh: 1.0 }; G.s = G.rh / (W / 2); G.y = (z) => RB + G.rh - G.s * Math.abs(z);
    const SL = { zc: 0.45, sB: 0.12 };
    SL.yB = (z) => RB + SL.sB * (z + W / 2);
    SL.topF = SL.yB(SL.zc) + 0.55; SL.sF = (SL.topF - (RB + 0.2)) / (W / 2 - SL.zc);
    SL.yF = (z) => SL.topF - SL.sF * (z - SL.zc);
    if (!cut && cfg.roof === 'gable') {
      SEC = 'structure';
      const rh = G.rh, s = G.s, base = RB;
      const R = W / 2 + o, len = Math.hypot(R, rh + s * o), ang = Math.atan(s);
      for (const side of [-1, 1]) {
        const g = grp(roofX, 0, base + rh - (rh + s * o) / 2, side * R / 2);
        g.rotation.x = side * ang;
        box(g, L + 2 * o, 0.05, len, roofM, 0, 0, 0);
        box(g, L + 2 * o, 0.14, 0.04, fasciaM, 0, -0.04, side * len / 2);
      }
      for (const sx of [-1, 1]) {
        const g = grp(roofX, sx * (L / 2 - IN), 0, 0, -Math.PI / 2);
        shapeMesh(g, [[-W / 2, TOP], [W / 2, TOP], [0, base + rh - 0.02]], texMat(cladOpt.t, { ds: true }), { ds: true });
      }
      box(roofX, L + 2 * o, 0.08, 0.12, fasciaM, 0, base + rh + 0.03, 0);
    } else if (!cut && cfg.roof === 'sloping') {
      SEC = 'structure';
      const zc = SL.zc, yB = SL.yB, yF = SL.yF, topF = SL.topF;
      const plane = (za, zb, ya, yb, eave) => {
        const len = Math.hypot(zb - za, yb - ya);
        const g = grp(roofX, 0, (ya + yb) / 2, (za + zb) / 2);
        g.rotation.x = -Math.atan2(yb - ya, zb - za);
        box(g, L + 2 * o, 0.05, len, roofM, 0, 0, 0);
        box(g, L + 2 * o, 0.12, 0.04, fasciaM, 0, -0.03, eave * len / 2);
        return g;
      };
      plane(-W / 2 - o, zc + 0.1, yB(-W / 2 - o), yB(zc + 0.1), -1);
      plane(zc, W / 2 + o, yF(zc), yF(W / 2 + o), 1);
      // clerestory infill
      {
        const g = grp(roofX, 0, 0, zc + 0.02);
        box(g, L, topF - yB(zc) - 0.02, 0.04, outM, 0, (topF + yB(zc)) / 2 - 0.02, 0);
      }
      for (const sx of [-1, 1]) {
        const g = grp(roofX, sx * (L / 2 - IN), 0, 0, -Math.PI / 2);
        shapeMesh(g, [[-W / 2, TOP], [W / 2, TOP], [W / 2, yF(W / 2) - 0.02], [zc, topF - 0.02], [zc, yB(zc) - 0.02], [-W / 2, yB(-W / 2) - 0.02]], texMat(cladOpt.t, { ds: true }));
      }
    }

    // ================================================================ TERRACE
    const terraceOn = !cut && cfg.terrace && cfg.roof === 'flat';
    let canopy = null;
    if (terraceOn) {
      SEC = 'terrace';
      const tf = byId(C.TERRACE_FLOOR, cfg.terraceFloor);
      const deckM = texMat(tf.t, { r: 0.7 });
      const thick = cfg.terraceThick;
      const pp = thick ? 0.08 : 0.05, DY = TOP + 0.08;
      box(roofX, L, 0.06, W, deckM, 0, TOP + 0.05, 0);
      if (thick) for (const s of [-1, 1]) { box(roofX, L, 0.08, 0.08, frameM, 0, TOP + 0.04, s * (W / 2 - 0.04)); box(roofX, 0.08, 0.08, W, frameM, s * (L / 2 - 0.04), TOP + 0.04, 0); }
      // railing (gap on west side for stair arrival)
      const RH = 1.1, stairTopZ = W / 2 - 0.25 - 16 * 0.25;
      const gapZ = [stairTopZ - 1.0, stairTopZ];
      const li = L / 2 - 0.04, wi = W / 2 - 0.04;
      // the stair lands on the west end, or on the east end when a mirrored plan puts the entrance door on the west end
      const stairEast = entry.wall === 'end' && entry.side === 'west', ss = stairEast ? -1 : 1;
      const railSegs = [
        [[-li, -wi], [li, -wi]], [[ss * li, -wi], [ss * li, wi]], [[li, wi], [-li, wi]],
        [[-ss * li, wi], [-ss * li, gapZ[1]]], [[-ss * li, gapZ[0]], [-ss * li, -wi]],
      ];
      const balGeo = new T3.BoxGeometry(0.02, RH - 0.08, 0.02);
      const bal = [];
      for (const [[ax, az], [bx, bz]] of railSegs) {
        const len = Math.hypot(bx - ax, bz - az);
        const dx = (bx - ax) / len, dz = (bz - az) / len;
        const mx = ax + dx * len / 2, mz = az + dz * len / 2;
        const g = grp(roofX, mx, DY, mz, Math.atan2(-dz, dx));
        box(g, len, pp, pp, frameM, 0, RH, 0);
        box(g, len, 0.03, 0.03, frameM, 0, 0.08, 0);
        const np = Math.max(1, Math.round(len / 1.5));
        for (let i = 0; i <= np; i++) box(g, pp, RH, pp, frameM, -len / 2 + (i * len) / np, RH / 2, 0);
        for (let x = -len / 2 + 0.12; x < len / 2 - 0.05; x += 0.12) {
          const v = new T3.Vector3(x, (RH + 0.08) / 2, 0).applyAxisAngle(new T3.Vector3(0, 1, 0), g.rotation.y).add(g.position);
          bal.push(v);
        }
      }
      const im = new T3.InstancedMesh(balGeo, frameM, bal.length);
      const m4 = new T3.Matrix4();
      bal.forEach((v, i) => { m4.makeTranslation(v.x, v.y, v.z); im.setMatrixAt(i, m4); });
      tag(im, { sec: 'terrace' });
      roofX.add(im);
      // external stair along the west end (mirrored to the east end when needed), rising toward -Z
      const stairG = grp(roofX); if (stairEast) stairG.scale.x = -1;
      const n = 16, rise = DY / n, go = 0.25, sxc = -L / 2 - 0.55, zBottom = W / 2 - 0.25;
      const stepM = texMat({ k: 'checker', c: shade(frameC, 0.15) }, { m: 0.4 });
      for (let i = 0; i < n; i++) box(stairG, 0.9, 0.04, go + 0.02, stepM, sxc, (i + 1) * rise - 0.02, zBottom - (i + 0.5) * go);
      const run = n * go, sl = Math.hypot(run, DY), sa = Math.atan2(DY, run);
      // stringers: sloped steel beams under both edges of the treads (rising toward -Z)
      for (const dx of [-0.47, 0.47]) {
        const g = grp(stairG, sxc + dx, DY / 2 - 0.08, zBottom - run / 2);
        g.rotation.x = sa;
        box(g, 0.05, 0.2, sl, frameM, 0, 0, 0);
      }
      // handrail on the open outer side: vertical posts standing on the treads, sloped top rail + mid rail
      const hx = sxc - 0.45;
      const tread = (i) => ({ z: zBottom - (i + 0.5) * go, y: (i + 1) * rise });
      [0, 3, 6, 9, 12, n - 1].forEach((i) => { const t = tread(i); box(stairG, 0.04, RH, 0.04, frameM, hx, t.y + RH / 2, t.z); });
      {
        const t0 = tread(0), t1 = tread(n - 1), len = Math.hypot(t0.z - t1.z, t1.y - t0.y);
        for (const [hgt, th] of [[RH, pp], [RH * 0.5, 0.03]]) {
          const g = grp(stairG, hx, (t0.y + t1.y) / 2 + hgt, (t0.z + t1.z) / 2);
          g.rotation.x = sa;
          box(g, th, th, len, frameM, 0, 0, 0);
        }
      }
      // landing with legs and a guard rail on its outer side and far end
      box(stairG, 0.9, 0.06, 1.0, stepM, sxc, DY - 0.03, stairTopZ - 0.5);
      for (const dz of [-0.95, -0.05]) box(stairG, 0.08, DY, 0.08, frameM, sxc - 0.42, DY / 2, stairTopZ + dz);
      box(stairG, 0.08, DY, 0.08, frameM, sxc + 0.42, DY / 2, stairTopZ - 0.95);
      const lz0 = stairTopZ - 0.98, lz1 = stairTopZ - 0.02;
      for (const z of [lz0, lz1]) box(stairG, 0.04, RH, 0.04, frameM, hx, DY + RH / 2, z);
      box(stairG, 0.04, RH, 0.04, frameM, sxc + 0.43, DY + RH / 2, lz0);
      box(stairG, pp, pp, lz1 - lz0, frameM, hx, DY + RH, (lz0 + lz1) / 2);
      box(stairG, 0.03, 0.03, lz1 - lz0, frameM, hx, DY + RH * 0.5, (lz0 + lz1) / 2);
      box(stairG, 0.9, pp, pp, frameM, sxc, DY + RH, lz0);
      box(stairG, 0.9, 0.03, 0.03, frameM, sxc, DY + RH * 0.5, lz0);
      // canopy (terrace roof)
      if (cfg.terraceRoof) {
        const cx0 = L >= 6 ? 0 : -L / 2 + 0.3, cx1 = L / 2;
        // mono-pitch canopy: high at the front, falling ~5 deg to the back so snow and rain run off (gutter on the low edge)
        const chF = 2.75, chB = 2.2, cw = cx1 - cx0, cxm = (cx0 + cx1) / 2, span = W + 0.3;
        const pitch = Math.atan((chF - chB) / span), hAt = (z) => chB + ((z + span / 2) / span) * (chF - chB);
        const posts = [[cx0 + 0.1, -W / 2 + 0.15], [cx1 - 0.1, -W / 2 + 0.15], [cx0 + 0.1, W / 2 - 0.15], [cx1 - 0.1, W / 2 - 0.15]];
        posts.forEach(([x, z]) => box(roofX, pp + 0.02, hAt(z), pp + 0.02, frameM, x, DY + hAt(z) / 2, z));
        const cg = grp(roofX, cxm, DY + (chF + chB) / 2, 0);
        cg.rotation.x = -pitch;
        const sl = span / Math.cos(pitch);
        box(cg, cw + 0.3, 0.12, sl, roofM, 0, 0.06, 0);
        for (const sz of [-1, 1]) box(cg, cw + 0.34, 0.16, 0.04, frameM, 0, 0.04, sz * (sl / 2 + 0.02));
        for (const sx of [-1, 1]) box(cg, 0.04, 0.16, sl + 0.08, frameM, sx * (cw / 2 + 0.17), 0.04, 0);
        box(cg, cw + 0.3, 0.1, 0.12, frameM, 0, 0.0, -sl / 2 - 0.1); // gutter on the low (back) edge
        { // downpipes from the gutter down the back wall to the ground
          const gy = DY + chB - 0.05, y0 = -(opt.plinth || 0);
          for (const x of [cx0 + 0.3, cx1 - 0.3]) box(roofX, 0.07, gy - y0, 0.07, frameM, x, (gy + y0) / 2, -span / 2 - 0.12);
        }
        canopy = { x0: cx0, x1: cx1, g: cg, cxm, len: sl };
      }
    }

    // ================================================================ SOLAR
    if (!cut && cfg.solar) {
      SEC = 'outdoor';
      const pm = texMat({ k: 'cells' }, { uv01: true, r: 0.25, m: 0.4 });
      const pw = 1.05, pl = 1.72;
      const panel = (g, x, y, z) => box(g, pw - 0.03, 0.035, pl - 0.03, [chromeM, chromeM, pm, darkM, chromeM, chromeM], x, y, z, { uv01: true });
      if (canopy) {
        const cols = Math.floor((canopy.x1 - canopy.x0) / pw), rows = Math.floor((canopy.len - 0.2) / pl);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) panel(canopy.g, canopy.x0 - canopy.cxm + (i + 0.5) * ((canopy.x1 - canopy.x0) / cols), 0.16, -((rows * pl) / 2) + (j + 0.5) * pl);
      } else if (cfg.roof === 'flat') {
        const cols = Math.floor((L - 0.5) / pw), rows = Math.max(1, Math.floor((W - 0.8) / 2.05));
        for (let j = 0; j < rows; j++) {
          const zc = -((rows - 1) * 2.05) / 2 + j * 2.05;
          for (let i = 0; i < cols; i++) {
            const x = -((cols - 1) * pw) / 2 + i * pw;
            const g = grp(roofX, x, TOP + 0.32, zc);
            g.rotation.x = 0.21;
            panel(g, 0, 0, 0);
            box(roofX, 0.04, 0.42, 0.04, chromeM, x, TOP + 0.2, zc - 0.7);
            box(roofX, 0.04, 0.12, 0.04, chromeM, x, TOP + 0.08, zc + 0.7);
          }
        }
      } else {
        // flush on the front-facing slope
        const isGable = cfg.roof === 'gable';
        const ang = Math.atan(isGable ? G.s : SL.sF);
        const zStart = isGable ? 0.25 : SL.zc + 0.2, zEnd = W / 2 - 0.15;
        const run = (zEnd - zStart) / Math.cos(ang);
        const rows = Math.max(1, Math.floor(run / pl)), cols = Math.floor((L - 0.3) / pw);
        const y0 = isGable ? G.y(zStart) : SL.yF(zStart);
        const g = grp(roofX, 0, y0 + 0.06, zStart);
        g.rotation.x = ang;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) panel(g, -((cols - 1) * pw) / 2 + i * pw, 0, (j + 0.5) * pl);
      }
      // inverter / battery box on the back wall
      box(roofX, 0.55, 0.75, 0.2, whiteM, -L / 2 + 1.0, 1.35, -W / 2 - 0.1);
      box(roofX, 0.2, 0.06, 0.01, stdMat('#38d07a', { em: '#38d07a', ei: 1 }), -L / 2 + 1.0, 1.55, -W / 2 - 0.205, { noShadow: true });
    }

    // ================================================================ OUTDOOR LIGHTS
    if (cfg.outdoorLights) {
      SEC = 'outdoor';
      const lampBody = stdMat(frameC === '#e4e3de' ? '#3a3b3e' : '#e8e8e4', { r: 0.4, m: 0.3 });
      const sconce = (x, y, z, ry) => {
        const g = grp(roofX, x, y, z, ry);
        box(g, 0.12, 0.26, 0.09, lampBody, 0, 0, 0.045);
        box(g, 0.1, 0.02, 0.07, shared.lamp, 0, -0.13, 0.05, { noShadow: true });
        const pl = new T3.PointLight('#ffcf8f', 0, 4.5, 2);
        pl.position.set(0, -0.2, 0.3);
        g.add(pl);
        lights.outside.push(pl);
      };
      sconce(L / 2, 2.35, -1.05, Math.PI / 2);
      sconce(L / 2, 2.35, 1.05, Math.PI / 2);
      const nfl = Math.max(2, Math.round(L / 3));
      for (let i = 0; i < nfl; i++) {
        if (curtainFront) break;
        sconce(-L / 2 + ((i + 0.5) * L) / nfl + 0.6, 2.35, W / 2, 0);
      }
      sconce(-L / 2, 2.35, W / 2 - 1.0, -Math.PI / 2);
    }

    // ================================================================ GROUND TERRACE (deck, p.67): front / side / L
    const GY = -(opt.plinth || 0); // ground level in house coordinates (house stands on the plinth)
    const DD = 2.0;                // deck depth
    const deckKind = cut ? 'none' : cfg.deck;
    const decks = [];
    if (deckKind === 'front' || deckKind === 'L') decks.push({ k: 'front', x0: -L / 2, x1: L / 2 + (deckKind === 'L' ? DD : 0), z0: W / 2, z1: W / 2 + DD });
    if (deckKind === 'side' || deckKind === 'L') decks.push({ k: 'side', x0: L / 2, x1: L / 2 + DD, z0: -W / 2, z1: W / 2 });
    if (decks.length) {
      SEC = 'terrace';
      const tf = byId(C.TERRACE_FLOOR, cfg.terraceFloor);
      const deckM = texMat(tf.t, { r: 0.7 });
      const pp = cfg.terraceThick ? 0.08 : 0.06, RH = 1.0, top = F;
      const stepX = entry.wall === 'front' ? entry.x : 0;
      const railSeg = (ax, az, bx, bz) => {
        const len = Math.hypot(bx - ax, bz - az); if (len < 0.2) return;
        const dx = (bx - ax) / len, dz = (bz - az) / len;
        const g = grp(roofX, ax + dx * len / 2, top, az + dz * len / 2, Math.atan2(-dz, dx));
        box(g, len, 0.05, pp, frameM, 0, RH, 0);
        box(g, len, 0.03, 0.03, frameM, 0, 0.1, 0);
        const np = Math.max(1, Math.round(len / 1.5));
        for (let i = 0; i <= np; i++) box(g, pp, RH, pp, frameM, -len / 2 + (i * len) / np, RH / 2, 0);
        const nb = Math.floor(len / 0.12);
        const im = new T3.InstancedMesh(new T3.BoxGeometry(0.02, RH - 0.12, 0.02), frameM, nb);
        const m4 = new T3.Matrix4();
        for (let i = 0; i < nb; i++) { m4.makeTranslation(-len / 2 + 0.06 + i * 0.12, (RH + 0.1) / 2, 0); im.setMatrixAt(i, m4); }
        tag(im, { sec: 'terrace' }); g.add(im);
      };
      const steps = (cx, cz, alongX, outward) => { // 3 steps from deck level down to the ground
        const n = 3, rise = (top - GY) / n, go = 0.3;
        for (let i = 0; i < n; i++) {
          const h = top - GY - (i + 1) * rise + rise, off = (i + 0.5) * go * outward;
          if (alongX) box(roofX, 1.4, 0.05, go, deckM, cx, GY + h - 0.025, cz + off);
          else box(roofX, go, 0.05, 1.4, deckM, cx + off, GY + h - 0.025, cz);
          if (alongX) box(roofX, 1.4, h - 0.05, 0.04, frameM, cx, GY + (h - 0.05) / 2, cz + off + outward * go / 2);
          else box(roofX, 0.04, h - 0.05, 1.4, frameM, cx + off + outward * go / 2, GY + (h - 0.05) / 2, cz);
        }
      };
      decks.forEach((d) => {
        const w = d.x1 - d.x0, dp = d.z1 - d.z0, cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
        box(roofX, w, 0.05, dp, deckM, cx, top - 0.025, cz);                       // deck boards
        // steel frame under the boards: edge beams on all four sides, legs about every 2 m along every edge
        const ex0 = d.x0 + pp / 2, ex1 = d.x1 - pp / 2, ez0 = d.z0 + pp / 2, ez1 = d.z1 - pp / 2;
        box(roofX, w, 0.12, pp, frameM, cx, top - 0.11, ez0);
        box(roofX, w, 0.12, pp, frameM, cx, top - 0.11, ez1);
        box(roofX, pp, 0.12, dp - 2 * pp, frameM, ex0, top - 0.11, cz);
        box(roofX, pp, 0.12, dp - 2 * pp, frameM, ex1, top - 0.11, cz);
        const legH = top - GY - 0.05, legY = (top + GY - 0.05) / 2;
        const legs = (ax, az, bx, bz, ends) => {
          const k = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
          for (let i = ends ? 0 : 1; i <= (ends ? k : k - 1); i++) box(roofX, pp, legH, pp, frameM, ax + ((bx - ax) * i) / k, legY, az + ((bz - az) * i) / k);
        };
        legs(ex0, ez0, ex1, ez0, true); legs(ex0, ez1, ex1, ez1, true); // corners included once
        legs(ex0, ez0, ex0, ez1, false); legs(ex1, ez0, ex1, ez1, false);
        if (d.k === 'front') {
          const gx0 = stepX - 0.75, gx1 = stepX + 0.75;
          railSeg(d.x0, d.z1, gx0, d.z1); railSeg(gx1, d.z1, d.x1, d.z1);
          railSeg(d.x0, d.z0 + 0.1, d.x0, d.z1);
          if (deckKind !== 'L') railSeg(d.x1, d.z0 + 0.1, d.x1, d.z1);
          steps(stepX, d.z1, true, 1);
        } else {
          railSeg(d.x1, d.z0, d.x1, -0.75); railSeg(d.x1, 0.75, d.x1, d.z1);
          railSeg(d.x0 + 0.1, d.z0, d.x1, d.z0);
          if (deckKind !== 'L') railSeg(d.x0 + 0.1, d.z1, d.x1, d.z1);
          steps(d.x1, 0, false, 1);
        }
        if (cfg.deckRoof) { // canopy on posts, slight fall away from the house
          const o2 = 0.2, ry = TOP - 0.02;
          // in the L-shape the front canopy covers the corner, so the side canopy stops at the front wall line (no overlap)
          const rx0 = d.x0 - (d.k === 'front' ? o2 : 0), rx1 = d.x1 + o2, rz0 = d.z0 - (d.k === 'side' ? o2 : 0);
          const rz1 = d.k === 'side' && deckKind === 'L' ? d.z1 : d.z1 + o2;
          box(roofX, rx1 - rx0, 0.06, rz1 - rz0, roofM, (rx0 + rx1) / 2, ry + 0.04, (rz0 + rz1) / 2);
          if (d.k === 'front') box(roofX, rx1 - rx0, 0.16, 0.05, frameM, (rx0 + rx1) / 2, ry, rz1); // fascia along the outer edge
          else box(roofX, 0.05, 0.16, rz1 - rz0, frameM, rx1, ry, (rz0 + rz1) / 2);
          const outer = d.k === 'front' ? [[d.x0, d.z1], [d.x1, d.z1]] : [[d.x1, d.z0], [d.x1, d.z1]];
          const n = Math.max(2, Math.round((d.k === 'front' ? w : dp) / 2.6) + 1);
          for (let i = 0; i < n; i++) {
            const t = i / (n - 1), px = outer[0][0] + (outer[1][0] - outer[0][0]) * t, pz = outer[0][1] + (outer[1][1] - outer[0][1]) * t;
            box(roofX, pp + 0.02, ry - top, pp + 0.02, frameM, px - Math.sign(px) * 0.04, (ry + top) / 2, pz - (d.k === 'front' ? 0.04 : 0));
          }
        }
      });
    }

    // ================================================================ OUTDOOR KITCHEN & POOL (one connected yard in front of the house)
    const ok = byId(C.OUTDOOR_KITCHEN, cfg.outdoorKitchen);
    const pool = byId(C.POOLS, cfg.pool);
    const frontDeck = deckKind === 'front' || deckKind === 'L';
    const yz0 = W / 2 + (frontDeck ? DD + 0.9 : 2.1); // start of the yard: a clear walkway / patio strip in front of the house
    let yard = null;
    const growYard = (ax, az, bx, bz) => {
      yard = yard ? { x0: Math.min(yard.x0, ax), z0: Math.min(yard.z0, az), x1: Math.max(yard.x1, bx), z1: Math.max(yard.z1, bz) } : { x0: ax, z0: az, x1: bx, z1: bz };
    };
    let nextX = -L / 2 + 0.2, okZ1 = yz0;
    if (ok.id !== 'none') {
      SEC = 'outdoor';
      const len = ok.len;
      // p.77-78: 80x80 columns, 18 mm floor platform, back wall with shelves + hood, base cabinets, lift-up front canopy on struts.
      // Stands at the west end of the yard, side-on to the house; the open (working) side faces east over the patio and pool.
      const g = grp(outside, nextX + 0.5, 0, yz0 + len / 2);
      g.rotation.y = -Math.PI / 2; // local -Z (open side) -> world +X, length runs away from the house
      const ssM = stdMat('#c4c8cc', { r: 0.25, m: 0.9 });
      const wallOpt = byId(C.OK_WALL, cfg.okWall);
      const wpcM = texMat(Object.assign({}, wallOpt.t));
      // finish: standard (anthracite steel + stainless top), match the indoor kitchen, or custom fronts / worktop
      const fin = cfg.okFinish;
      const cabOpt = fin === 'match' ? (C.CAB_FINISH.find((o2) => o2.id === cfg.cabFinish) || C.CAB_FINISH[0]) : fin === 'custom' ? byId(C.OK_CAB, cfg.okCab) : null;
      const okCabM = cabOpt && cabOpt.id !== 'ok-anth' ? texMat(Object.assign({}, cabOpt.t, { tile: 1.2 }), { r: cabOpt.gloss ? 0.15 : 0.55, m: 0 }) : stdMat('#3a3d42', { r: 0.5, m: 0.3 });
      const topOpt = fin === 'match' ? byId(C.COUNTER[cfg.counterType], cfg.counter) : fin === 'custom' ? byId(C.OK_TOP, cfg.okTop) : null;
      const okTopM = topOpt && !topOpt.steel ? texMat(Object.assign({}, topOpt.t, { tile: 1.2 }), { r: 0.25, m: 0 }) : ssM;
      const frOpt = byId(C.OK_FRAME, cfg.okFrame);
      const kFrameM = frOpt.id === 'okf-house' ? frameM : stdMat(frOpt.t.c, { r: 0.5, m: 0.3 });
      const col = 0.08, H2 = 2.35, Dk = 1.0;
      box(g, len, 0.06, Dk, texMat({ k: 'planks', c: '#7a5236', tile: 2.4, pbr: 'deck' }), 0, 0.03, 0);       // 18 mm floor on joists
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, col, H2, col, kFrameM, sx * (len / 2 - col / 2), H2 / 2, sz * (Dk / 2 - col / 2));
      box(g, len, 0.1, Dk, kFrameM, 0, H2 - 0.05, 0);                                                              // roof frame
      box(g, len - 0.1, 0.03, Dk - 0.1, roofM, 0, H2 + 0.015, 0);
      box(g, len - 2 * col, H2 - 0.16, 0.05, wpcM, 0, (H2 - 0.1) / 2 + 0.03, Dk / 2 - 0.05);                     // back wall
      for (const sx of [-1, 1]) box(g, 0.05, H2 - 0.16, Dk - 2 * col, wpcM, sx * (len / 2 - 0.05), (H2 - 0.1) / 2 + 0.03, 0);
      const cz = Dk / 2 - 0.36;
      box(g, len - 0.2, 0.84, 0.6, okCabM, 0, 0.48, cz);                                                          // base cabinets
      const nD = Math.max(2, Math.round((len - 0.2) / 0.55));
      for (let i = 1; i < nD; i++) box(g, 0.004, 0.76, 0.004, darkM, -len / 2 + 0.1 + (i * (len - 0.2)) / nD, 0.48, cz - 0.302, { noShadow: true });
      box(g, len - 0.16, 0.04, 0.64, okTopM, 0, 0.92, cz);                                                        // worktop
      box(g, 0.8, 0.08, 0.52, ssM, -len / 2 + 0.75, 0.98, cz);                                                    // grill
      box(g, 0.8, 0.35, 0.05, ssM, -len / 2 + 0.75, 1.13, cz + 0.24);
      for (let i = 0; i < 9; i++) box(g, 0.01, 0.012, 0.46, darkM, -len / 2 + 0.39 + i * 0.09, 1.025, cz);
      box(g, 0.9, 0.45, 0.45, ssM, -len / 2 + 0.75, 2.0, Dk / 2 - 0.3);                                           // range hood
      box(g, 0.25, 0.1, 0.25, ssM, -len / 2 + 0.75, 2.27, Dk / 2 - 0.3);
      box(g, 0.5, 0.01, 0.38, stdMat('#9aa1a7', { r: 0.2, m: 0.9 }), 0.35, 0.945, cz, { noShadow: true });      // sink
      cyl(g, 0.012, 0.012, 0.3, ssM, 0.35, 1.09, cz + 0.22, { seg: 10 });
      box(g, 0.55, 0.7, 0.02, stdMat('#1d2024', { r: 0.1, m: 0.3 }), len / 2 - 0.55, 0.44, cz - 0.31);            // drinks fridge glass door
      if (ok.id === 'pro') box(g, 0.6, 0.84, 0.02, ssM, len / 2 - 1.25, 0.48, cz - 0.31);
      for (let i = 0; i < 2; i++) box(g, len * 0.4, 0.03, 0.22, wpcM, len * 0.15, 1.55 + i * 0.35, Dk / 2 - 0.17);  // wall shelves
      box(g, len - 0.3, 0.015, 0.03, shared.led, 0, H2 - 0.13, -Dk / 2 + 0.12, { noShadow: true });
      { // lift-up front canopy (gas-strut flap) - open position
        const fg = grp(g, 0, H2 - 0.05, -Dk / 2);
        fg.rotation.x = 1.15; // flap lifted up and out
        box(fg, len - 0.05, 0.05, 1.1, roofM, 0, 0, -0.55);
        box(fg, len - 0.05, 0.08, 0.06, kFrameM, 0, -0.04, -1.08);
        // gas struts: from the side posts (~1.35 m) up to a point 0.6 m along the lifted flap (p.78 photo)
        const fy = H2 - 0.05 + 0.6 * Math.sin(1.15), fz = -Dk / 2 - 0.6 * Math.cos(1.15);
        const ay = 1.35, az = -Dk / 2 + 0.06, dy = fy - ay, dz = fz - az;
        for (const sx of [-1, 1]) {
          cyl(g, 0.014, 0.014, Math.hypot(dy, dz), ssM, sx * (len / 2 - 0.1), (ay + fy) / 2, (az + fz) / 2, { seg: 8, rx: Math.atan2(dz, dy) });
          box(g, 0.05, 0.05, 0.05, darkM, sx * (len / 2 - 0.1), ay, az);
        }
        box(g, len - 0.3, 0.015, 0.03, shared.led, 0, H2 + 0.18, -Dk / 2 - 0.55, { noShadow: true });
      }
      growYard(nextX - 0.1, yz0 - 0.1, nextX + 2.4, yz0 + len + 0.1); // includes the working area in front of the open side
      okZ1 = yz0 + len;
      nextX += 1.0 + 2.5; // 2.5 m clear working / dining space between the kitchen and the pool
    }
    if (pool.id !== 'none') {
      SEC = 'outdoor';
      const len = pool.len, pw = 2.2, ph = 1.5, t = 0.12;
      // side by side with the kitchen if it fits within ~the house length, otherwise a second row behind the kitchen
      const stairL = pool.steps ? 1.55 : 0;
      const secondRow = ok.id !== 'none' && nextX + len + stairL > L / 2 + 4;
      const startX = secondRow ? -L / 2 + 0.2 : nextX;
      const pz = secondRow ? okZ1 + 1.2 + pw / 2 : yz0 + Math.max(0.2 + pw / 2, ok.id !== 'none' ? (okZ1 - yz0) / 2 : 0), px = startX + len / 2;
      nextX = startX;
      const g = grp(outside, px, 0, pz);
      // p.79: galvanised steel frame with WPC slat cladding, acrylic window along the long side,
      // wide WPC coping, internal entry steps + bench at one end, PVC liner, LED lights, external timber steps (QG-02/03)
      const wpcM = texMat({ k: 'flute', c: '#7b6a5c' });   // taupe WPC slat cladding (p.79)
      const copeM = texMat({ k: 'planks', c: '#c7b192', tile: 2.4, pbr: 'deck' }); // light sand coping
      const linerM = stdMat('#3d8fc9', { r: 0.35 });
      const steelM = stdMat('#25272a', { r: 0.5, m: 0.4 });
      const ix = len / 2 - t, iz = pw / 2 - t;
      box(g, len, ph, t, wpcM, 0, ph / 2, -pw / 2 + t / 2);                     // plain wall (house side)
      for (const sx of [-1, 1]) box(g, t, ph, pw - 2 * t, wpcM, sx * (len / 2 - t / 2), ph / 2, 0);
      const winLen = Math.max(1.5, len - 1.6);
      const fg = grp(g, 0, 0, pw / 2 - t / 2);                                  // window wall: long acrylic window facing the garden / viewer (p.79)
      wallMesh(fg, len, ph, t, [{ u: 0, w: winLen, y0: 0.35, h: 0.85 }], wpcM);
      box(fg, winLen, 0.85, 0.04, stdMat('#8fd3ec', { op: 0.42, r: 0.04, m: 0.1 }), 0, 0.35 + 0.425, 0, { noShadow: true });
      box(fg, winLen + 0.06, 0.04, t + 0.01, steelM, 0, 0.35, 0); box(fg, winLen + 0.06, 0.04, t + 0.01, steelM, 0, 1.2, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.1, ph + 0.02, 0.1, steelM, sx * (len / 2 - 0.05), (ph + 0.02) / 2, sz * (pw / 2 - 0.05)); // corner posts
      // liner (inside faces) + floor
      box(g, len - 2 * t, 0.04, pw - 2 * t, linerM, 0, 0.1, 0);
      box(g, len - 2 * t, ph - 0.25, 0.01, linerM, 0, ph / 2, -(iz - 0.005), { noShadow: true });
      for (const sx of [-1, 1]) box(g, 0.01, ph - 0.25, pw - 2 * t, linerM, sx * (ix - 0.005), ph / 2, 0, { noShadow: true });
      // internal entry steps across the full width at the east end (under the external stair), like the p.79 renders
      const stepM = stdMat('#6fb6e0', { r: 0.4 });
      for (let i = 0; i < 3; i++) {
        const top = ph - 0.25 - (i + 1) * 0.3;
        box(g, 0.34, top - 0.12, pw - 2 * t, stepM, ix - 0.17 - i * 0.34, 0.12 + (top - 0.12) / 2, 0);
      }
      // seat ledge along the house-side wall
      box(g, len - 2 * t - 1.1, 0.5, 0.36, stepM, -0.55, 0.12 + 0.25, -iz + 0.18);
      // wide WPC coping deck around the top
      const cw = 0.3;
      box(g, len + 0.2, 0.05, cw, copeM, 0, ph + 0.025, pw / 2 - cw / 2 + 0.1);
      box(g, len + 0.2, 0.05, cw, copeM, 0, ph + 0.025, -pw / 2 + cw / 2 - 0.1);
      for (const sx of [-1, 1]) box(g, cw, 0.05, pw + 0.2, copeM, sx * (len / 2 - cw / 2 + 0.1), ph + 0.025, 0);
      box(g, len - 2 * t, 0.02, pw - 2 * t, shared.water, 0, ph - 0.15, 0, { noShadow: true });
      const ledC = ['#ff5fa2', '#7fe1ff', '#ff5fa2', '#7fe1ff'];
      for (let i = 0; i < pool.leds; i++) box(g, 0.14, 0.14, 0.012, stdMat(ledC[i % 4], { em: ledC[i % 4], ei: 1.6 }), -len / 2 + ((i + 0.5) * len) / pool.leds, 0.85, -(iz - 0.012), { noShadow: true });
      if (pool.steps) { // QG-02/03 "steps included": solid stepped block against the east end, clad like the pool, timber treads
        const n = 5, rise = (ph + 0.05) / n, go = 0.3, sw = 1.1;
        for (let i = 0; i < n; i++) { // i = 0 lowest / outermost
          const hTop = rise * (i + 1), xc = len / 2 + (n - 1 - i) * go + go / 2;
          box(g, go, hTop - 0.04, sw, wpcM, xc, (hTop - 0.04) / 2, 0);
          box(g, go + 0.03, 0.04, sw + 0.04, copeM, xc + 0.015, hTop - 0.02, 0);
        }
        for (const sz of [-1, 1]) box(g, n * go, 0.04, 0.04, steelM, len / 2 + (n * go) / 2, 0.02, sz * (sw / 2 + 0.01)); // base trim
      }
      growYard(startX - 0.1, pz - pw / 2 - 0.1, startX + len + stairL + 0.1, pz + pw / 2 + 0.1);
    }

    root.traverse((o2) => { if (o2.isMesh && !o2.userData.sec) o2.userData.sec = 'model'; });
    return { root, core, wingB, wingF, inner, roofX, outside, lights, L, W, D, c, cut, setFold, frameMat: structM, yard, decks };
  }

  function disposeTree(obj) {
    obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }

  CHZ.house = { build, disposeTree, shared, stdMat, texMat, pbrMaterial, SETS, planarUV, setQuality, get quality() { return Q; } };
})(window.CHZ);
