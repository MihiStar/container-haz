/* Floor plans: catalog presets (PDF p.5-9) + one layout engine shared by the 3D model (house.js) and the 2D plan (plan.js).
 *
 * Every catalog plan uses the same grid across the width:
 *   back band  (bedrooms / open)       - back wing + a strip of the core
 *   core strip (bathrooms only here)   - centre of the core module: all plumbing stays in the part that does not fold
 *   front band (bedroom / kitchen / open)
 * Along the length each band is split into cells. Widths are in metres measured from the west outer wall, as dimensioned
 * in the catalog (e.g. 3790 / 3700 / 3700); a cell without a width takes the rest.
 * Coordinates: metres, X along the length (+X = east end), Z across (+Z = front), origin at the centre.
 */
(function (CHZ) {
  'use strict';
  const IN = 0.03, PT = 0.06, P = 0.16;

  // mk(id, size, name, catalog page, back cells, core bathrooms [side, length], front cells, entrance)
  // entrance: 'end' = double door in the east end of the core; {front: 0..1} = double door in the front long wall
  const mk = (id, size, name, page, back, baths, front, entry) => ({ id, size, name, page, back, baths, front, entry: entry || 'end' });
  const shell = (size, page) => mk(size.replace('ft', '') + '-shell', size, 'Open shell', page, [['open']], [], [['open']], 'end');
  const PLANS = [
    mk('10-1b', '10ft', '1 bedroom', 'p.5', [['bed']], [['W', 1.8]], [['kitchen']]),
    shell('10ft', 'p.5'),
    mk('15-1b', '15ft', '1 bedroom', 'p.5', [['bed']], [['W', 2.2]], [['kitchen']]),
    shell('15ft', 'p.5'),
    mk('20-1b', '20ft', '1 bedroom + living', 'p.6', [['bed', 3.0], ['open']], [['W', 2.2]], [['kitchen', 2.08], ['open']]),
    mk('20-2b', '20ft', '2 bedrooms', 'p.6', [['bed', 3.02], ['bed']], [['W', 2.2]], [['kitchen', 2.08], ['open']]),
    mk('20-2b-w', '20ft', '2 bedrooms, west wing', 'p.9', [['bed', 3.0], ['open']], [['W', 2.2]], [['bed', 3.0], ['kitchen']]),
    mk('20-3b', '20ft', '3 bedrooms', 'p.6', [['bed', 3.13], ['bed']], [['W', 2.2]], [['bed', 3.13], ['kitchen']]),
    mk('20-4b', '20ft', '4 bedrooms', 'p.6', [['bed', 3.13], ['bed']], [['W', 2.2]], [['bed', 3.13], ['bed']]),
    mk('20-2b2ba', '20ft', '2 bedrooms, 2 baths', 'p.6', [['bed', 2.69], ['bed']], [['W', 1.6], ['E', 1.6]], [['kitchen', 2.1], ['open']], { front: 0.62 }),
    shell('20ft', 'p.6'),
    mk('30-1b', '30ft', '1 bedroom + lounge', 'p.7', [['bed', 4.17], ['open']], [['W', 2.5]], [['kitchen', 2.38], ['open']]),
    mk('30-2b', '30ft', '2 bedrooms', 'p.7', [['bed', 4.17], ['bed']], [['W', 2.5]], [['kitchen', 2.38], ['open']]),
    mk('30-2b-w', '30ft', '2 bedrooms, west wing', 'p.7', [['bed', 4.17], ['open']], [['W', 2.5]], [['bed', 4.17], ['kitchen', 2.38], ['open']]),
    mk('30-3b', '30ft', '3 bedrooms', 'p.7', [['bed', 4.17], ['bed']], [['W', 2.5]], [['bed', 4.17], ['kitchen', 2.38], ['open']]),
    mk('30-3b-row', '30ft', '3 bedrooms in a row', 'p.7', [['bed', 3.39], ['bed', 2.45], ['bed']], [['W', 2.5]], [['kitchen', 2.2], ['open']]),
    mk('30-2b2ba', '30ft', '2 bedrooms, 2 baths', 'p.7', [['bed', 4.17], ['bed']], [['W', 2.5], ['E', 2.2]], [['kitchen', 2.4], ['open']], { front: 0.5 }),
    shell('30ft', 'p.7'),
    mk('40-1b', '40ft', '1 bedroom + open plan', 'p.8', [['bed', 4.9], ['open']], [['W', 2.8]], [['kitchen', 2.02], ['open']]),
    mk('40-2b', '40ft', '2 bedrooms', 'p.8', [['bed', 5.62], ['bed']], [['W', 2.8]], [['kitchen', 2.02], ['open']]),
    mk('40-2b-w', '40ft', '2 bedrooms, west wing', 'p.8', [['bed', 4.9], ['open']], [['W', 2.2]], [['bed', 4.9], ['kitchen', 2.4], ['open']]),
    mk('40-3b', '40ft', '3 bedrooms', 'p.8', [['bed', 3.79], ['bed', 3.7], ['bed']], [['W', 2.8]], [['kitchen', 2.02], ['open']]),
    mk('40-4b', '40ft', '4 bedrooms', 'supplier plan', [['bed', 3.79], ['bed', 3.7], ['bed']], [['W', 2.4]], [['bed', 3.79], ['kitchen', 2.4], ['open']]),
    mk('40-3b2ba', '40ft', '3 bedrooms, 2 baths', 'p.8', [['bed', 3.79], ['open', 3.4], ['bed']], [['W', 2.8], ['E', 2.2]], [['kitchen', 3.79], ['open', 3.4], ['bed']], { front: 0.5 }),
    mk('40-2b-m', '40ft', '2 bedrooms + lounge', 'p.8', [['bed', 3.79], ['open', 3.4], ['bed']], [['W', 2.8]], [['kitchen', 3.79], ['open']], { front: 0.5 }),
    shell('40ft', 'p.8'),
  ];
  const PLAN_BY = {};
  PLANS.forEach((p) => {
    p.beds = p.back.concat(p.front).filter((c) => c[0] === 'bed').length;
    p.bathsN = p.baths.length;
    PLAN_BY[p.id] = p;
  });
  const plansFor = (sizeId) => PLANS.filter((p) => p.size === sizeId);

  // merge intervals on a wall line, keeping door gaps
  function addLine(map, key, a, b, gap) {
    if (!map[key]) map[key] = { segs: [], gaps: [] };
    map[key].segs.push([Math.min(a, b), Math.max(a, b)]);
    if (gap) map[key].gaps.push(gap);
  }
  function mergeLines(map) {
    return Object.keys(map).map((k) => {
      const segs = map[k].segs.sort((p, q) => p[0] - q[0]);
      const out = [];
      segs.forEach((s) => { const l = out[out.length - 1]; if (l && s[0] <= l[1] + 0.02) l[1] = Math.max(l[1], s[1]); else out.push(s.slice()); });
      return { at: +k, segs: out, gaps: map[k].gaps };
    });
  }

  function layout(cfg) {
    const size = CHZ.sizeOf(cfg);
    const plan = PLAN_BY[cfg.layout] || plansFor(size.id)[0];
    const L = size.L, W = size.W, c = CHZ.CORE_W / 2, D = W / 2 - c;
    const T = cfg.panelThk / 1000 + 0.01;
    const winW = { strip: 0.5, double: 1.2, sliding: 1.2 }[cfg.winType] || 0.93;
    const x0 = -L / 2 + IN + T, x1 = L / 2 - IN - T, z0 = -W / 2 + IN + T, z1 = W / 2 - IN - T;
    const wide = W > 6.5;
    const zB = -W / 2 + (wide ? 2.64 : 2.425);   // back band / core strip line (catalog 2425 / 2640)
    const zF = W / 2 - (wide ? 2.58 : 2.35);     // core strip / front band line (catalog 2350 / 2580)

    // ---- cells along a band
    const split = (list) => {
      const fixed = list.reduce((a, cl) => a + (cl[1] || 0), 0), rest = list.filter((cl) => !cl[1]).length;
      const scale = fixed > L - 0.6 * rest - 0.3 ? (L - 0.6 * rest - 0.3) / fixed : 1;
      const restW = rest ? (L - fixed * scale) / rest : 0;
      let xa = -L / 2;
      return list.map((cl) => {
        const w = cl[1] ? cl[1] * scale : restW;
        const r = { type: cl[0], x0: Math.max(x0, xa), x1: Math.min(x1, xa + w) };
        xa += w;
        return r;
      });
    };
    // mirrored plan: the rooms of the back and front bands swap sides (front <-> back).
    // The entrance door, the bathroom end and the roof-terrace stair stay where they are.
    const mirror = !!cfg.mirror;
    const back = split(mirror ? plan.front : plan.back).map((cl) => Object.assign(cl, { band: 'back', z0, z1: zB }));
    const front = split(mirror ? plan.back : plan.front).map((cl) => Object.assign(cl, { band: 'front', z0: zF, z1 }));
    // bathrooms stay in the core strip (shipping); Advanced edits may change their length and slide the door
    const E0 = editOf(cfg);
    const baths = plan.baths.map(([side, len], i) => {
      const maxL = bathMaxLen(x1 - x0, plan.baths.length);
      const eb = E0 && Array.isArray(E0.baths) ? E0.baths.find((q) => q.side === side) : null;
      const bl = eb ? Math.max(BATH_MIN, Math.min(maxL, +eb.len || len)) : Math.min(len, maxL);
      const bx0 = side === 'W' ? x0 : x1 - bl, bx1 = side === 'W' ? x0 + bl : x1;
      const inner = side === 'W' ? bx1 : bx0;
      const dz = eb && eb.doorZ != null ? Math.max(zB + 0.45, Math.min(zF - 0.45, +eb.doorZ)) : (zB + zF) / 2;
      return { side, x0: bx0, x1: bx1, z0: zB, z1: zF, len: bl, maxLen: maxL, inner, door: { x: inner, z: dz, w: 0.72, swing: eb && eb.swing === -1 ? -1 : 1, hinge: eb && eb.hinge === -1 ? -1 : 1 }, name: plan.baths.length > 1 ? 'Bathroom ' + (i + 1) : 'Bathroom' };
    });
    const inBath = (x) => baths.some((b) => x > b.x0 - 0.45 && x < b.x1 + 0.45);

    // ---- bedrooms: door on the side that opens to the hall (never into a bathroom), bed away from the door
    let bn = 0;
    const bedrooms = back.concat(front).filter((cl) => cl.type === 'bed').map((cl) => {
      const w = cl.x1 - cl.x0, lineZ = cl.band === 'back' ? zB : zF;
      const east = cl.x1 - 0.6, westD = cl.x0 + 0.6;
      let dx = !inBath(east) ? east : !inBath(westD) ? westD : east;
      if (cl.x1 >= x1 - 0.01 && !inBath(westD)) dx = westD; // end rooms: door toward the house middle
      const doorEast = dx > (cl.x0 + cl.x1) / 2;
      const bw = w >= 2.8 ? 1.5 : 1.2, off = Math.max(bw / 2 + 0.1, (w - 1.0) / 2);
      const cx = doorEast ? cl.x0 + off : cl.x1 - off;
      const dir = cl.band === 'back' ? 1 : -1;
      return Object.assign(cl, { name: '', door: { x: dx, z: lineZ, w: 0.82, into: -dir, hingeEast: !doorEast }, bed: { cx, bw, headZ: cl.band === 'back' ? z0 : z1, dir } });
    });
    bedrooms.sort((a, b) => (a.band === b.band ? a.x0 - b.x0 : a.band === 'back' ? -1 : 1)).forEach((r) => { r.name = bedrooms.length > 1 ? 'Bedroom ' + (++bn) : 'Bedroom'; });

    // kitchens: counter run along the core line + return toward the outer wall. zd = +1 in the front band, -1 in the back band (mirrored)
    const kitchens = back.concat(front).filter((cl) => cl.type === 'kitchen').map((cl) => {
      const zd = cl.band === 'front' ? 1 : -1;
      const kLen = Math.min(2.0, cl.x1 - cl.x0 - 0.3), aZa = zd > 0 ? zF + PT / 2 + 0.005 : zB - PT / 2 - 0.005, aZb = aZa + zd * 0.6;
      const kRet = Math.max(0.6, Math.min(1.15, (zd > 0 ? z1 - aZb : aZb - z0) - 0.45));
      const kx = cl.x0 + (cl.x0 > x0 + 0.05 ? PT / 2 : 0), rx = kx;
      const sinkAt = (sw) => kx + Math.min(kLen / 2 + 0.25, kLen - sw / 2 - 0.05);
      return Object.assign(cl, { kLen, aZa, aZb, kRet, kx, rx, zd, flip: false, sinkAt });
    });

    // ---- walls (merged per line) + doors
    const H = {}, V = {};
    bedrooms.forEach((r) => {
      addLine(H, r.door.z.toFixed(3), r.x0, r.x1, { at: r.door.x, w: r.door.w });
      const za = r.band === 'back' ? z0 : zF, zb = r.band === 'back' ? zB : z1;
      if (r.x0 > x0 + 0.05) addLine(V, r.x0.toFixed(3), za, zb);
      if (r.x1 < x1 - 0.05) addLine(V, r.x1.toFixed(3), za, zb);
    });
    baths.forEach((b) => {
      addLine(H, zB.toFixed(3), b.x0, b.x1);
      addLine(H, zF.toFixed(3), b.x0, b.x1);
      addLine(V, b.inner.toFixed(3), zB, zF, { at: b.door.z, w: 0.72 });
    });
    let hWalls = mergeLines(H), vWalls = mergeLines(V);
    // interior doors (room doors; bathroom doors are handled with the bathrooms). into = swing direction (+/-1 along the normal)
    let doors = bedrooms.map((r) => ({ o: 'h', at: r.door.z, p: r.door.x, w: r.door.w, into: r.band === 'back' ? -1 : 1 }));

    // ---- windows and entrance
    const entry = plan.entry === 'end' ? { wall: 'end', side: 'east' } : { wall: 'front', x: -L / 2 + plan.entry.front * L, w: 1.6 };
    const winsFor = (cells) => {
      const out = [];
      cells.forEach((cl) => {
        const w = cl.x1 - cl.x0, n = cl.type === 'open' && w > 4.4 ? 2 : 1;
        for (let i = 0; i < n; i++) out.push(cl.x0 + ((i + 0.5) * w) / n);
      });
      return out;
    };
    let frontXs = winsFor(front);
    if (entry.wall === 'front') frontXs = frontXs.filter((x) => Math.abs(x - entry.x) > entry.w / 2 + winW / 2 + 0.25);
    let backXs = winsFor(back);

    // ---- advanced edits from the 2D plan: custom partitions, room doors and long-wall windows replace the generated ones.
    // Bathroom walls stay generated (the bathroom must stay in the core module).
    const E = editOf(cfg);
    if (E) {
      const H2 = {}, V2 = {};
      baths.forEach((b) => {
        addLine(H2, zB.toFixed(3), b.x0, b.x1);
        addLine(H2, zF.toFixed(3), b.x0, b.x1);
        addLine(V2, b.inner.toFixed(3), zB, zF, { at: b.door.z, w: 0.72 });
      });
      E.walls.forEach((wl) => addLine(wl.o === 'h' ? H2 : V2, (+wl.at).toFixed(3), wl.a, wl.b));
      E.doors.forEach((d) => { const m = d.o === 'h' ? H2 : V2, k = (+d.at).toFixed(3); if (m[k]) m[k].gaps.push({ at: d.p, w: d.w }); });
      hWalls = mergeLines(H2); vWalls = mergeLines(V2);
      doors = E.doors.map((d) => Object.assign({}, d));
      frontXs = E.wins.front.slice();
      if (entry.wall === 'front') frontXs = frontXs.filter((x) => Math.abs(x - entry.x) > entry.w / 2 + winW / 2 + 0.05);
      backXs = E.wins.back.slice();
    }
    const bathW = baths.find((b) => b.side === 'W'), bathE = baths.find((b) => b.side === 'E');

    // ---- living area (largest open cell, front band preferred) for sofa / dining
    const opens = front.filter((cl) => cl.type === 'open');
    const backOpen = back.filter((cl) => cl.type === 'open');
    const livingCell = (opens.length ? opens : backOpen).slice().sort((a, b) => (b.x1 - b.x0) - (a.x1 - a.x0))[0] || null;
    let furniture = { sofa: null, dining: null };
    if (livingCell) {
      const lw = livingCell.x1 - livingCell.x0, isFront = livingCell.band === 'front';
      const wallZ = isFront ? z1 : z0, dz = isFront ? -1 : 1;
      let sofaRight = true;
      if (entry.wall === 'front' && isFront && entry.x > (livingCell.x0 + livingCell.x1) / 2) sofaRight = false;
      if (lw >= 2.6) {
        const sx = sofaRight ? livingCell.x1 - 1.35 : livingCell.x0 + 1.35;
        furniture.sofa = { cx: sx, cz: wallZ + dz * 0.45, w: 2.2, d: 0.85, back: dz };
        if (lw >= 4.6) furniture.dining = { cx: sofaRight ? livingCell.x0 + 1.2 : livingCell.x1 - 1.2, cz: (livingCell.z0 + livingCell.z1) / 2 + dz * -0.1, w: 0.8, d: 1.6 };
      } else furniture.sofa = { cx: (livingCell.x0 + livingCell.x1) / 2, cz: wallZ + dz * 0.45, w: 0.8, d: 0.8, back: dz, chair: true };
    }

    // ---- drawn glass doors: keep beds, sofa and dining out of each door's swing / walk-in zone
    bedrooms.forEach((r) => { r.bed.stands = [true, true]; });
    const gateZones = gateZonesOf(cfg, { L, W, x0, x1, z0, z1 });
    const hits = (a, b) => gateZones.some((g) => a.x0 < g.x1 && a.x1 > g.x0 && a.z0 < g.z1 && a.z1 > g.z0);
    let bedLost = false;
    if (gateZones.length) {
      bedrooms.forEach((r) => {
        const { bw, headZ, dir } = r.bed;
        const zA = Math.min(headZ, headZ + dir * 2.1), zBb = Math.max(headZ, headZ + dir * 2.1);
        const body = (cx) => ({ x0: cx - bw / 2 - 0.04, x1: cx + bw / 2 + 0.04, z0: zA, z1: zBb });
        const cands = [r.bed.cx, r.x0 + bw / 2 + 0.1, r.x1 - bw / 2 - 0.1, (r.x0 + r.x1) / 2];
        const cx = cands.find((q) => !hits(body(q)));
        if (cx == null) { bedLost = true; return; }
        r.bed.cx = cx;
        const sz0 = Math.min(headZ, headZ + dir * 0.4), sz1 = Math.max(headZ, headZ + dir * 0.4);
        r.bed.stands = [
          cx - bw / 2 - 0.5 > r.x0 && !hits({ x0: cx - bw / 2 - 0.5, x1: cx - bw / 2, z0: sz0, z1: sz1 }),
          cx + bw / 2 + 0.5 < r.x1 && !hits({ x0: cx + bw / 2, x1: cx + bw / 2 + 0.5, z0: sz0, z1: sz1 }),
        ];
      });
      const lc = livingCell;
      if (lc && furniture.sofa) {
        const so = furniture.sofa, hw = so.w / 2 + 0.05;
        const zs = [so.cz - so.back * 0.45, so.cz + so.back * (so.chair ? 0.45 : 1.3)];
        const fp = (cx) => ({ x0: cx - Math.max(hw, 0.5), x1: cx + Math.max(hw, 0.5), z0: Math.min(...zs), z1: Math.max(...zs) });
        const cands = [so.cx, lc.x0 + lc.x1 - so.cx, lc.x1 - hw - 0.1, lc.x0 + hw + 0.1];
        for (let x = lc.x0 + hw + 0.1; x <= lc.x1 - hw - 0.1; x += 0.1) cands.push(x);
        const cx = cands.find((q) => q - hw >= lc.x0 - 0.01 && q + hw <= lc.x1 + 0.01 && !hits(fp(q)));
        furniture.sofa = cx == null ? null : Object.assign({}, so, { cx });
      }
      if (lc && furniture.dining) {
        const di = furniture.dining, so = furniture.sofa;
        const fp = (cx) => ({ x0: cx - 0.85, x1: cx + 0.85, z0: di.cz - 0.82, z1: di.cz + 0.82 });
        const free = (cx) => cx - 0.85 >= lc.x0 && cx + 0.85 <= lc.x1 && !hits(fp(cx)) && (!so || Math.abs(cx - so.cx) > so.w / 2 + 0.95);
        const cands = [];
        for (let x = lc.x0 + 0.9; x <= lc.x1 - 0.9; x += 0.1) cands.push(x);
        cands.sort((p, q) => Math.abs(p - di.cx) - Math.abs(q - di.cx));
        const cx = free(di.cx) ? di.cx : cands.find(free);
        furniture.dining = cx == null ? null : Object.assign({}, di, { cx });
      }
    }

    // ---- room labels
    const rooms = [];
    bedrooms.forEach((r) => rooms.push({ kind: 'bedroom', name: r.name, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }));
    baths.forEach((b) => rooms.push({ kind: 'bath', name: b.name, x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }));
    kitchens.forEach((k) => rooms.push({ kind: 'kitchen', name: 'Kitchen', x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1 }));
    back.concat(front).filter((cl) => cl.type === 'open').forEach((cl) => rooms.push({ kind: 'living', name: cl === livingCell ? (plan.id.endsWith('shell') ? 'Open space' : 'Living') : 'Living', x0: cl.x0, x1: cl.x1, z0: cl.z0, z1: cl.z1, main: cl === livingCell }));
    const hallX0 = bathW ? bathW.x1 : x0, hallX1 = bathE ? bathE.x0 : x1;

    return {
      plan, mirror, L, W, c, D, T, IN, PT, P, winW, x0, x1, z0, z1, zB, zF,
      back, front, baths, bedrooms, kitchens, hWalls, vWalls, entry, frontXs, backXs, bathW, bathE,
      livingCell, furniture, rooms, hall: { x0: hallX0, x1: hallX1, z0: zB, z1: zF },
      beds: plan.beds, bedLost, doors, edited: !!E,
    };
  }

  const BATH_MIN = 1.6; // shower + toilet + a small vanity
  const bathMaxLen = (innerL, n) => (innerL / (n + 0.4));
  // ---- advanced edit model: { v: 1, walls: [{o:'h'|'v', at, a, b}], doors: [{o, at, p, w, into}], wins: {front: [x], back: [x]} }
  function editOf(cfg) {
    const E = cfg.edit;
    if (!E || E.v !== 1 || !Array.isArray(E.walls) || !Array.isArray(E.doors) || !E.wins) return null;
    return E;
  }
  // copy the generated partitions / room doors / windows of the current plan into an editable model
  function editSnapshot(cfg) {
    const Y = layout(Object.assign({}, cfg, { edit: null }));
    const walls = [], key = new Set();
    const add = (o, at, a, b) => { const k = o + (+at).toFixed(3) + '|' + (+a).toFixed(3) + '|' + (+b).toFixed(3); if (!key.has(k)) { key.add(k); walls.push({ o, at: +(+at).toFixed(3), a: +(+a).toFixed(3), b: +(+b).toFixed(3) }); } };
    Y.bedrooms.forEach((r) => {
      add('h', r.door.z, r.x0, r.x1);
      const za = r.band === 'back' ? Y.z0 : Y.zF, zb = r.band === 'back' ? Y.zB : Y.z1;
      if (r.x0 > Y.x0 + 0.05) add('v', r.x0, za, zb);
      if (r.x1 < Y.x1 - 0.05) add('v', r.x1, za, zb);
    });
    return {
      v: 1, walls,
      baths: Y.baths.map((b) => ({ side: b.side, len: +b.len.toFixed(3), doorZ: +b.door.z.toFixed(3), swing: b.door.swing, hinge: b.door.hinge })),
      doors: Y.doors.map((d) => ({ o: d.o, at: +(+d.at).toFixed(3), p: +(+d.p).toFixed(3), w: d.w, into: d.into, hinge: d.hinge === -1 ? -1 : 1 })),
      wins: { front: Y.frontXs.map((x) => +x.toFixed(3)), back: Y.backXs.map((x) => +x.toFixed(3)) },
    };
  }

  // ---- outer openings (windows, glass, doors) per wall, using the same rules as the 3D model and the plan
  // long walls: a / b along X; end walls: a / b along Z
  function outerOpenings(cfg, Y) {
    const out = [], GW = 0.85;
    const curtainFront = cfg.curtain === 'front' || cfg.curtain === 'both', curtainEnd = cfg.curtain === 'end' || cfg.curtain === 'both';
    const spansOf = (w) => (cfg.glassSpans || []).filter((q) => q.w === w), gatesOf = (w) => (cfg.gates || []).filter((q) => q.w === w);
    ['front', 'back'].forEach((w) => {
      const spans = spansOf(w), gates = gatesOf(w);
      if (w === 'front' && Y.entry.wall === 'front') out.push({ wall: w, a: Y.entry.x - 0.8, b: Y.entry.x + 0.8, kind: 'door' });
      gates.forEach((q) => out.push({ wall: w, a: q.x - GW, b: q.x + GW, kind: 'door' }));
      if (w === 'front' && curtainFront) { out.push({ wall: w, a: -Y.L / 2, b: Y.L / 2, kind: 'win' }); return; }
      spans.forEach((q) => out.push({ wall: w, a: q.a, b: q.b, kind: 'win' }));
      const inSpan = (x, pad) => spans.some((q) => x > q.a - pad && x < q.b + pad);
      (w === 'front' ? Y.frontXs : Y.backXs).filter((x) => !inSpan(x, Y.winW / 2 + 0.1) && !gates.some((q) => Math.abs(q.x - x) < GW + Y.winW / 2 + 0.1))
        .forEach((x) => out.push({ wall: w, a: x - Y.winW / 2, b: x + Y.winW / 2, kind: 'win' }));
    });
    ['east', 'west'].forEach((w) => {
      const entryEnd = w === (Y.entry.side || 'east');
      endPanels(cfg).forEach((pn) => {
        const coreDoor = pn.kind === 'core' && entryEnd && Y.entry.wall === 'end';
        const bathHere = pn.kind === 'core' && (w === 'east' ? Y.bathE : Y.bathW);
        if (coreDoor) out.push({ wall: w, a: -0.85, b: 0.85, kind: 'door' });
        if (entryEnd && curtainEnd) { out.push({ wall: w, a: pn.z0, b: pn.z1, kind: 'win' }); return; }
        const spans = bathHere ? [] : spansOf(w).map((q) => ({ a: Math.max(q.a, pn.z0), b: Math.min(q.b, pn.z1) })).filter((q) => q.b - q.a >= 0.4);
        const gate = bathHere || coreDoor ? null : gatesOf(w).find((q) => q.x > pn.z0 && q.x < pn.z1);
        if (spans.length || gate) {
          spans.forEach((q) => out.push({ wall: w, a: q.a, b: q.b, kind: 'win' }));
          if (gate) out.push({ wall: w, a: pn.mid - GW, b: pn.mid + GW, kind: 'door' });
          return;
        }
        if (coreDoor) return;
        if (pn.kind === 'core') {
          if (bathHere) out.push({ wall: w, a: (Y.zB + Y.zF) / 2 - 0.25, b: (Y.zB + Y.zF) / 2 + 0.25, kind: 'win' });
          else out.push({ wall: w, a: -0.45, b: 0.45, kind: 'win' });
        } else if (pn.z1 - pn.z0 > 1.3) out.push({ wall: w, a: pn.mid - 0.45, b: pn.mid + 0.45, kind: 'win' });
      });
    });
    // glass doors also bring daylight: the drawn glass doors always, the main entrance unless it is the steel door
    out.slice().forEach((o) => { if (o.kind === 'door' && (cfg.entrance !== 'steel' || (cfg.gates || []).some((q) => q.w === o.wall && Math.abs(q.x - (o.a + o.b) / 2) < 0.05))) out.push(Object.assign({}, o, { kind: 'win' })); });
    return out;
  }

  // ---- room check for the 2D plan: every enclosed space needs a door (and must connect to the entrance), living spaces need a window.
  // Rooms are found by flood-filling a 10 cm grid between the walls, so it also works for edited plans.
  function analyseRooms(cfg) {
    const Y = layout(cfg), G = 0.1, PT = Y.PT;
    const nx = Math.max(1, Math.round((Y.x1 - Y.x0) / G)), nz = Math.max(1, Math.round((Y.z1 - Y.z0) / G));
    const gx = (Y.x1 - Y.x0) / nx, gz = (Y.z1 - Y.z0) / nz;
    const cx = (i) => Y.x0 + (i + 0.5) * gx, cz = (j) => Y.z0 + (j + 0.5) * gz;
    const cell = new Int32Array(nx * nz); // 0 free, -1 wall, -2 door
    const mark = (ln, o) => ln.segs.forEach(([a, b]) => {
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const along = o === 'h' ? cx(i) : cz(j), across = o === 'h' ? cz(j) : cx(i);
        if (Math.abs(across - ln.at) > PT / 2 + 0.04 || along < a - PT / 2 || along > b + PT / 2) continue;
        const k = j * nx + i;
        const isDoor = ln.gaps.some((g) => g.at > a && g.at < b && Math.abs(along - g.at) < g.w / 2);
        if (isDoor) { if (cell[k] !== -1) cell[k] = -2; } else cell[k] = -1;
      }
    });
    Y.hWalls.forEach((ln) => mark(ln, 'h'));
    Y.vWalls.forEach((ln) => mark(ln, 'v'));
    // regions
    const reg = new Int32Array(nx * nz).fill(-1), regions = [];
    for (let s = 0; s < nx * nz; s++) {
      if (cell[s] !== 0 || reg[s] >= 0) continue;
      const id = regions.length, R = { id, cells: [], doorNb: new Set(), sx: 0, sz: 0 };
      const st = [s]; reg[s] = id;
      while (st.length) {
        const k = st.pop(), i = k % nx, j = (k - i) / nx;
        R.cells.push(k); R.sx += cx(i); R.sz += cz(j);
        [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].forEach(([a, b]) => {
          if (a < 0 || b < 0 || a >= nx || b >= nz) return;
          const q = b * nx + a;
          if (cell[q] === -2) R.doorNb.add(q);
          else if (cell[q] === 0 && reg[q] < 0) { reg[q] = id; st.push(q); }
        });
      }
      regions.push(R);
    }
    // door cells -> the regions they connect (flood within the door cells)
    const doorReg = new Map();
    regions.forEach((R) => R.doorNb.forEach((q) => { if (!doorReg.has(q)) doorReg.set(q, new Set()); doorReg.get(q).add(R.id); }));
    const doorGroup = new Int32Array(nx * nz).fill(-1); const links = [];
    for (let s = 0; s < nx * nz; s++) {
      if (cell[s] !== -2 || doorGroup[s] >= 0) continue;
      const gid = links.length, set = new Set(), st = [s]; doorGroup[s] = gid;
      while (st.length) {
        const k = st.pop(); (doorReg.get(k) || new Set()).forEach((r) => set.add(r));
        const i = k % nx, j = (k - i) / nx;
        [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].forEach(([a, b]) => {
          if (a < 0 || b < 0 || a >= nx || b >= nz) return;
          const q = b * nx + a; if (cell[q] === -2 && doorGroup[q] < 0) { doorGroup[q] = gid; st.push(q); }
        });
      }
      links.push([...set]);
    }
    // outer openings touched by each region
    const ops = outerOpenings(cfg, Y);
    const hitOp = (wall, v, kind) => ops.some((o) => o.wall === wall && o.kind === kind && v >= o.a - 0.02 && v <= o.b + 0.02);
    regions.forEach((R) => {
      R.area = R.cells.length * gx * gz; R.x = R.sx / R.cells.length; R.z = R.sz / R.cells.length;
      R.bx0 = Infinity; R.bx1 = -Infinity; R.bz0 = Infinity; R.bz1 = -Infinity;
      R.cells.forEach((k) => { const i = k % nx, j = (k - i) / nx; R.bx0 = Math.min(R.bx0, Y.x0 + i * gx); R.bx1 = Math.max(R.bx1, Y.x0 + (i + 1) * gx); R.bz0 = Math.min(R.bz0, Y.z0 + j * gz); R.bz1 = Math.max(R.bz1, Y.z0 + (j + 1) * gz); });
      R.win = false; R.outDoor = false;
      R.cells.forEach((k) => {
        const i = k % nx, j = (k - i) / nx, x = cx(i), z = cz(j);
        const touch = [];
        if (j === 0) touch.push(['back', x]); if (j === nz - 1) touch.push(['front', x]);
        if (i === 0) touch.push(['west', z]); if (i === nx - 1) touch.push(['east', z]);
        touch.forEach(([w, v]) => { if (hitOp(w, v, 'win')) R.win = true; if (hitOp(w, v, 'door')) R.outDoor = true; });
      });
      const room = Y.rooms.find((r) => R.x >= r.x0 && R.x <= r.x1 && R.z >= r.z0 && R.z <= r.z1) || (R.z > Y.zB && R.z < Y.zF ? { kind: 'hall', name: 'Hall' } : null);
      R.kind = room ? room.kind : 'room'; R.name = room ? room.name : 'Room';
    });
    // which regions can be reached from an entrance
    const reach = new Set(regions.filter((R) => R.outDoor).map((R) => R.id));
    let grew = true;
    while (grew) { grew = false; links.forEach((ids) => { if (ids.some((r) => reach.has(r))) ids.forEach((r) => { if (!reach.has(r)) { reach.add(r); grew = true; } }); }); }
    const regAt = (x, z) => {
      const i = Math.floor((x - Y.x0) / gx), j = Math.floor((z - Y.z0) / gz);
      if (i < 0 || j < 0 || i >= nx || j >= nz) return null;
      const r = reg[j * nx + i]; return r >= 0 ? regions[r] : null;
    };
    return { Y, regions, reach, nx, nz, gx, gz, regAt };
  }

  // room check for the 2D plan: every enclosed space needs a door (and must connect to the entrance), living spaces need a window
  function roomIssues(cfg) {
    const { Y, regions, reach, nx, gx, gz } = analyseRooms(cfg);
    const issues = [];
    const names = {};
    regions.filter((R) => R.area >= 0.6).forEach((R) => {
      const nm = R.name + (R.area < 2.2 && R.kind !== 'bath' ? ' (small space)' : '');
      names[nm] = (names[nm] || 0) + 1;
      const label = nm + ' · ' + R.area.toFixed(1) + ' m²';
      const hasDoor = R.outDoor || R.doorNb.size > 0;
      const rects = rowRuns(R, nx, gx, gz, Y.x0, Y.z0);
      if (!hasDoor) issues.push({ sev: 'error', msg: label + ' has no door or entrance.', x: R.x, z: R.z, rects });
      else if (!reach.has(R.id)) issues.push({ sev: 'error', msg: label + ' cannot be reached from the entrance.', x: R.x, z: R.z, rects });
      if (!R.win && R.kind !== 'bath' && R.area >= 2.2) issues.push({ sev: 'warn', msg: label + ' has no window or glass.', x: R.x, z: R.z, rects });
    });
    return issues;
  }
  // room labels that follow the real walls: a room that is its own enclosed space gets that space's area and size;
  // rooms sharing one open space (living / kitchen / hall) keep their catalog cell. New enclosed spaces get "Room".
  function roomLabels(cfg) {
    const { Y, regions, regAt } = analyseRooms(cfg);
    const byReg = new Map();
    Y.rooms.forEach((r) => {
      const R = regAt((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2);
      const key = R ? R.id : 'none-' + r.name;
      if (!byReg.has(key)) byReg.set(key, { R, rooms: [] });
      byReg.get(key).rooms.push(r);
    });
    const out = [];
    byReg.forEach(({ R, rooms }) => {
      if (R && rooms.length === 1) {
        const r = rooms[0];
        out.push(Object.assign({}, r, { x0: R.bx0, x1: R.bx1, z0: R.bz0, z1: R.bz1, area: R.area, cx: R.x, cz: R.z, own: true }));
      } else rooms.forEach((r) => out.push(Object.assign({}, r, { area: (r.x1 - r.x0) * (r.z1 - r.z0) })));
    });
    const used = new Set([...byReg.values()].map((v) => v.R && v.R.id));
    let n = 0;
    regions.filter((R) => !used.has(R.id) && R.area >= 1.0).forEach((R) => {
      const inCore = R.z > Y.zB && R.z < Y.zF;
      if (inCore && R.area > 3 && !R.doorNb.size) return; // the hall strip (open to the rooms around it)
      out.push({ kind: 'room', name: 'Room ' + (++n), x0: R.bx0, x1: R.bx1, z0: R.bz0, z1: R.bz1, area: R.area, cx: R.x, cz: R.z, own: true });
    });
    return out;
  }
  // partition positions along each band, for the plan's dimension chains
  function bandSplits(Y) {
    const along = (za, zb) => [...new Set(Y.vWalls.filter((v) => v.segs.some(([a, b]) => a < zb - 0.15 && b > za + 0.15)).map((v) => +v.at.toFixed(3)))]
      .filter((x) => x > -Y.L / 2 + 0.3 && x < Y.L / 2 - 0.3).sort((a, b) => a - b);
    return { back: along(Y.z0, Y.zB), core: along(Y.zB, Y.zF), front: along(Y.zF, Y.z1) };
  }
  CHZ.roomLabels = roomLabels;
  CHZ.bandSplits = bandSplits;

  function rowRuns(R, nx, gx, gz, X0, Z0) {
    const rows = new Map();
    R.cells.forEach((k) => { const i = k % nx, j = (k - i) / nx; if (!rows.has(j)) rows.set(j, []); rows.get(j).push(i); });
    const out = [];
    rows.forEach((is, j) => {
      is.sort((a, b) => a - b);
      let s = is[0], p = is[0];
      for (let t = 1; t <= is.length; t++) {
        if (t < is.length && is[t] === p + 1) { p = is[t]; continue; }
        out.push([X0 + s * gx, Z0 + j * gz, (p - s + 1) * gx, gz]);
        if (t < is.length) { s = is[t]; p = is[t]; }
      }
    });
    return out;
  }
  CHZ.editSnapshot = editSnapshot;
  CHZ.roomIssues = roomIssues;
  CHZ.outerOpenings = outerOpenings;

  // clearance zone inside the house for every drawn glass door (door width + 0.1 each side, 1.0 m deep)
  const GATE_HALF = 0.85;
  function gateZonesOf(cfg, g) {
    return (cfg.gates || []).map((q) => {
      const a = q.x - GATE_HALF - 0.1, b = q.x + GATE_HALF + 0.1;
      if (q.w === 'back') return { x0: a, x1: b, z0: g.z0 - 0.1, z1: g.z0 + 1.0 };
      if (q.w === 'front') return { x0: a, x1: b, z0: g.z1 - 1.0, z1: g.z1 + 0.1 };
      if (q.w === 'west') return { x0: g.x0 - 0.1, x1: g.x0 + 1.0, z0: a, z1: b };
      if (q.w === 'east') return { x0: g.x1 - 1.0, x1: g.x1 + 0.1, z0: a, z1: b };
      return null;
    }).filter(Boolean);
  }

  // Is a glass door at x on wall w possible? Returns a reason string, or '' when it fits.
  // Checks the corner posts, the main entrance, other drawn doors, interior partitions meeting the wall,
  // the kitchen counters, the bathroom core panels, and that every bed still fits beside the door.
  function gateProblem(cfg, w, x, ignore) {
    const others = (cfg.gates || []).filter((q) => q !== ignore);
    const Y = layout(Object.assign({}, cfg, { gates: others }));
    const isEnd = w === 'east' || w === 'west';
    if (isEnd) {
      const pn = endPanels(cfg).find((p) => x >= p.z0 - 0.05 && x <= p.z1 + 0.05);
      if (!pn) return 'Click inside one of the three end-wall panels.';
      if (drawBlocked(cfg)(w, x)) return 'Not possible here: this core panel holds the bathroom or the main entrance.';
      if (others.some((q) => q.w === w && q.x >= pn.z0 && q.x <= pn.z1)) return 'This panel already has a glass door.';
      const kAtEnd = Y.kitchens.some((k) => w === 'west' && k.x0 <= Y.x0 + 0.05 && pn.mid * k.zd > 0);
      if (kAtEnd && pn.kind === 'wing') return 'Not possible here: the kitchen counter and tall cabinet stand against this panel.';
    } else {
      if (Math.abs(x) > Y.L / 2 - 1.05) return 'Too close to the corner post.';
      if (others.some((q) => q.w === w && Math.abs(q.x - x) < 1.8)) return 'Too close to another glass door.';
      if (w === 'front' && Y.entry.wall === 'front' && Math.abs(Y.entry.x - x) < GATE_HALF + Y.entry.w / 2 + 0.15) return 'Too close to the main entrance.';
      const zw = w === 'back' ? Y.z0 : Y.z1;
      const part = Y.vWalls.find((v) => v.segs.some((sg) => Math.abs(sg[0] - zw) < 0.08 || Math.abs(sg[1] - zw) < 0.08) && Math.abs(v.at - x) < GATE_HALF + 0.12);
      if (part) return 'An interior wall meets the outer wall here.';
      {
        const k = Y.kitchens.find((kk) => (w === 'front' ? kk.zd > 0 : kk.zd < 0) && x + GATE_HALF + 0.1 > kk.rx - 0.05 && x - GATE_HALF - 0.1 < kk.rx + 0.65);
        if (k) return 'The kitchen counter and tall cabinet are in the way.';
      }
    }
    const Y2 = layout(Object.assign({}, cfg, { gates: others.concat([{ w, x }]) }));
    if (Y2.bedLost) return 'Not enough room beside the bed for a 1.7 m door.';
    return '';
  }
  // nearest spot to x on wall w where a glass door fits (long walls slide up to 1.5 m; end walls use the panel centre)
  function gateSnap(cfg, w, x, ignore) {
    if (w === 'east' || w === 'west') {
      const pn = endPanels(cfg).find((p) => x >= p.z0 - 0.1 && x <= p.z1 + 0.1);
      if (!pn) return { x: null, why: 'Click inside one of the three end-wall panels.' };
      const why = gateProblem(cfg, w, pn.mid, ignore);
      return why ? { x: null, why } : { x: pn.mid };
    }
    const first = gateProblem(cfg, w, x, ignore);
    if (!first) return { x };
    for (let d = 0.05; d <= 1.5; d += 0.05) {
      for (const s of [-1, 1]) {
        const q = Math.round((x + s * d) * 20) / 20;
        if (!gateProblem(cfg, w, q, ignore)) return { x: q, moved: true };
      }
    }
    return { x: null, why: first };
  }
  CHZ.gateProblem = gateProblem;
  CHZ.gateSnap = gateSnap;

  // end walls are three panels each (back wing, core, front wing) between the frame posts
  function endPanels(cfg) {
    const s = CHZ.sizeOf(cfg), W = s.W, c = CHZ.CORE_W / 2, D = W / 2 - c;
    return [
      { kind: 'wing', z0: -W / 2 + P, z1: -c, mid: -(c + (D - P) / 2) },
      { kind: 'core', z0: -c + P, z1: c - P, mid: 0 },
      { kind: 'wing', z0: c, z1: W / 2 - P, mid: c + (D - P) / 2 },
    ];
  }
  // where glass doors may not go: the core panel at a bathroom end, and the core panel that holds the main entrance
  function drawBlocked(cfg) {
    const Y = layout(cfg);
    return (w, x) => {
      if (w !== 'east' && w !== 'west') return false;
      const pnl = endPanels(cfg).find((p) => x >= p.z0 - 0.05 && x <= p.z1 + 0.05);
      if (!pnl || pnl.kind !== 'core') return false;
      const endEntry = Y.entry.wall === 'end' && Y.entry.side === w;
      if (w === 'west' && (Y.bathW || endEntry)) return true;
      if (w === 'east' && (Y.bathE || endEntry)) return true;
      return false;
    };
  }
  CHZ.endPanels = endPanels;
  CHZ.drawBlocked = drawBlocked;

  // name / bedroom count lookup used by the summary, spec sheet and benefits (replaces the old generic layouts)
  CHZ.LAYOUTS = {};
  PLANS.forEach((p) => { CHZ.LAYOUTS[p.id] = { name: p.name, beds: p.beds, baths: p.bathsN, page: p.page }; });
  CHZ.PLANS = PLANS;
  CHZ.PLAN_BY = PLAN_BY;
  CHZ.plansFor = plansFor;
  CHZ.layout = layout;
})(window.CHZ);
