/* 2D floor plan (architectural drawing) rendered as SVG from the shared layout engine (layout.js).
 * Plan coordinates: SVG x = model X (east end on the right), SVG y = model Z (front wall at the bottom). Units: metres.
 * Also renders small plan thumbnails for the floor-plan picker.
 */
(function (CHZ) {
  'use strict';
  const n = (v) => +(+v).toFixed(3);
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const mm = (m) => Math.round(m * 1000).toLocaleString('en-US').replace(/,/g, ' ');

  function render(cfg, opts) {
    opts = Object.assign({ furniture: true, dims: true, fold: true }, opts || {});
    const Y = CHZ.layout(cfg);
    const { L, W, c, D, PT, P, x0, x1, z0, z1, zB, zF, baths, bedrooms, kitchens, hWalls, vWalls, entry, frontXs, backXs, winW, bathW, bathE, furniture, rooms, hall, back, front } = Y;
    const s = [];
    const rect = (x, y, w, h, cls) => s.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" class="${cls}"/>`);
    const line = (xa, ya, xb, yb, cls) => s.push(`<line x1="${n(xa)}" y1="${n(ya)}" x2="${n(xb)}" y2="${n(yb)}" class="${cls}"/>`);
    const text = (x, y, t, cls, anchor, rot) => s.push(`<text x="${n(x)}" y="${n(y)}" class="${cls}" text-anchor="${anchor || 'middle'}"${rot ? ` transform="rotate(${rot} ${n(x)} ${n(y)})"` : ''}>${esc(t)}</text>`);
    const path = (d, cls) => s.push(`<path d="${d}" class="${cls}"/>`);
    const circ = (x, y, r, cls) => s.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" class="${cls}"/>`);

    const padL = 1.7, padT = 1.5, padR = 1.9, padB = 2.1;
    const vb = [-L / 2 - padL, -W / 2 - padT, L + padL + padR, W + padT + padB];
    s.push(`<defs>
      <pattern id="pl-hatch" width="0.07" height="0.07" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.07" class="pl-hatchline"/></pattern>
      <pattern id="pl-grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><path d="M0.5 0H0V0.5" class="pl-gridline"/></pattern>
      <pattern id="pl-tile" width="0.3" height="0.3" patternUnits="userSpaceOnUse"><path d="M0.3 0H0V0.3" class="pl-tileline"/></pattern>
    </defs>`);
    rect(vb[0], vb[1], vb[2], vb[3], 'pl-paper');
    rect(vb[0], vb[1], vb[2], vb[3], 'pl-grid');

    // ---- floors
    rect(x0, z0, x1 - x0, z1 - z0, 'pl-floor');
    baths.forEach((b) => rect(b.x0, b.z0, b.x1 - b.x0, b.z1 - b.z0, 'pl-wet'));

    // ---- fold lines (core module)
    if (opts.fold) {
      for (const sg of [-1, 1]) line(-L / 2 - 0.5, sg * c, L / 2 + 0.5, sg * c, 'pl-fold');
      text(-L / 2 - 0.55, -c + 0.05, 'FOLD', 'pl-tag', 'end');
      text(-L / 2 - 0.55, c + 0.05, 'FOLD', 'pl-tag', 'end');
      text(-L / 2 - 0.55, 0.05, 'CORE ' + mm(2 * c), 'pl-tag', 'end');
    }

    // ---- exterior sandwich wall
    s.push(`<path d="M${n(-L / 2)} ${n(-W / 2)}h${n(L)}v${n(W)}h${n(-L)}Z M${n(x0)} ${n(z0)}V${n(z1)}H${n(x1)}V${n(z0)}Z" fill-rule="evenodd" class="pl-wall"/>`);
    for (const sx of [-1, 1]) for (const zz of [-(W / 2 - P / 2), -(c - P / 2), c - P / 2, W / 2 - P / 2]) rect(sx * (L / 2 - P / 2) - P / 2, zz - P / 2, P, P, 'pl-post');

    // ---- openings
    const glazeH = (xc, w, za, zb, sash) => {
      rect(xc - w / 2, Math.min(za, zb), w, Math.abs(zb - za), 'pl-gap');
      line(xc - w / 2, za, xc + w / 2, za, 'pl-win'); line(xc - w / 2, zb, xc + w / 2, zb, 'pl-win');
      line(xc - w / 2, (za + zb) / 2, xc + w / 2, (za + zb) / 2, 'pl-glass');
      line(xc - w / 2, za, xc - w / 2, zb, 'pl-win'); line(xc + w / 2, za, xc + w / 2, zb, 'pl-win');
      if (sash) line(xc, za, xc, zb, 'pl-win');
    };
    const glazeV = (zc, w, xa, xb, sash) => {
      rect(Math.min(xa, xb), zc - w / 2, Math.abs(xb - xa), w, 'pl-gap');
      line(xa, zc - w / 2, xa, zc + w / 2, 'pl-win'); line(xb, zc - w / 2, xb, zc + w / 2, 'pl-win');
      line((xa + xb) / 2, zc - w / 2, (xa + xb) / 2, zc + w / 2, 'pl-glass');
      line(xa, zc - w / 2, xb, zc - w / 2, 'pl-win'); line(xa, zc + w / 2, xb, zc + w / 2, 'pl-win');
      if (sash) line(xa, zc, xb, zc, 'pl-win');
    };
    const sashed = cfg.winType === 'double' || cfg.winType === 'sliding' || cfg.winType === 'outward';
    const curtainFront = cfg.curtain === 'front' || cfg.curtain === 'both';
    const curtainEnd = cfg.curtain === 'end' || cfg.curtain === 'both';
    const entW = cfg.entrance === 'steel' ? 1.0 : 1.7;
    if (curtainFront) {
      const len = L - 2 * P, nb = Math.max(1, Math.round(len / 1.05));
      glazeH(0, len, z1, W / 2, false);
      for (let i = 1; i < nb; i++) { const xx = -len / 2 + (i * len) / nb; line(xx, z1, xx, W / 2, 'pl-win'); }
    }
    // drawn panorama glass spans + glass doors on the long walls (same rules as the 3D model)
    const GATE_W = 1.7;
    const longWall = (which, xsAll, za, zb) => {
      const spans = (cfg.glassSpans || []).filter((q) => q.w === which), gates = (cfg.gates || []).filter((q) => q.w === which);
      const inSpan = (x, pad) => spans.some((q) => x > q.a - pad && x < q.b + pad);
      if (!(which === 'front' && curtainFront)) {
        xsAll.filter((x) => !inSpan(x, winW / 2 + 0.1) && !gates.some((q) => Math.abs(q.x - x) < GATE_W / 2 + winW / 2 + 0.1)).forEach((x) => glazeH(x, winW, za, zb, sashed));
        spans.forEach((q) => {
          glazeH((q.a + q.b) / 2, q.b - q.a, za, zb, false);
          const nb = Math.max(1, Math.round((q.b - q.a) / 1.05));
          for (let i = 1; i < nb; i++) { const xx = q.a + (i * (q.b - q.a)) / nb; line(xx, za, xx, zb, 'pl-win'); }
          s.push(`<rect x="${n(q.a)}" y="${n(Math.min(za, zb) - 0.05)}" width="${n(q.b - q.a)}" height="${n(Math.abs(zb - za) + 0.1)}" class="pl-span" data-span="${which}|${n(q.a)}"/>`);
        });
      }
      const inward = which === 'front' ? -1 : 1, wallIn = which === 'front' ? za : zb;
      gates.forEach((q) => {
        rect(q.x - GATE_W / 2, Math.min(za, zb), GATE_W, Math.abs(zb - za), 'pl-gap');
        leafPair([q.x - GATE_W / 2, wallIn], [1, 0], [0, inward], GATE_W / 2, inward < 0 ? 1 : 0);
        leafPair([q.x + GATE_W / 2, wallIn], [-1, 0], [0, inward], GATE_W / 2, inward < 0 ? 0 : 1);
        s.push(`<rect x="${n(q.x - GATE_W / 2)}" y="${n(Math.min(za, zb) - 0.05)}" width="${n(GATE_W)}" height="${n(Math.abs(zb - za) + 0.1)}" class="pl-gatemark"/>`);
      });
    };
    longWall('front', curtainFront ? [] : frontXs, z1, W / 2);
    longWall('back', backXs, -W / 2, z0);
    // end walls: three panels each (back wing, core, front wing). Default window per panel, unless the panel has
    // drawn panorama glass or a drawn glass door (same rules as the 3D model).
    const wingW = Math.min(winW, D - P - 0.4);
    const panels = CHZ.endPanels(cfg);
    const endDrawn = [];
    for (const which of ['west', 'east']) {
      const isE = which === 'east', xa = isE ? x1 : -L / 2, xb = isE ? L / 2 : x0, wallIn = isE ? x1 : x0, inward = isE ? -1 : 1;
      panels.forEach((pn) => {
        const entryEnd = which === (entry.side || 'east');
        const coreDoor = pn.kind === 'core' && entryEnd && entry.wall === 'end';
        const bathHere = pn.kind === 'core' && (isE ? bathE : bathW);
        if (entryEnd && curtainEnd) { if (!coreDoor) glazeV(pn.mid, pn.z1 - pn.z0, xa, xb, false); return; }
        const spans = bathHere ? [] : (cfg.glassSpans || []).filter((q) => q.w === which)
          .map((q) => ({ a: Math.max(q.a, pn.z0 + 0.03), b: Math.min(q.b, pn.z1 - 0.03) })).filter((q) => q.b - q.a >= 0.4);
        const gate = bathHere || coreDoor ? null : (cfg.gates || []).find((q) => q.w === which && q.x > pn.z0 && q.x < pn.z1);
        if (spans.length || gate) {
          spans.forEach((q) => {
            glazeV((q.a + q.b) / 2, q.b - q.a, xa, xb, false);
            s.push(`<rect x="${n(Math.min(xa, xb) - 0.05)}" y="${n(q.a)}" width="${n(Math.abs(xb - xa) + 0.1)}" height="${n(q.b - q.a)}" class="pl-span"/>`);
          });
          if (gate) endDrawn.push({ z: pn.mid, xa, xb, wallIn, inward });
          return;
        }
        if (coreDoor) return; // entrance drawn below
        if (pn.kind === 'core') { if (bathHere) glazeV((zB + zF) / 2, 0.5, xa, xb, false); else glazeV(0, Math.min(winW, pn.z1 - pn.z0 - 0.4), xa, xb, sashed); }
        else glazeV(pn.mid, wingW, xa, xb, sashed);
      });
    }
    endDrawn.forEach((g) => { // glass double door centred in an end panel, leaves open inward
      const hw = 0.85, s1 = g.inward < 0 ? 1 : 0;
      rect(Math.min(g.xa, g.xb), g.z - hw, Math.abs(g.xb - g.xa), 2 * hw, 'pl-gap');
      leafPair([g.wallIn, g.z - hw], [0, 1], [g.inward, 0], hw, s1);
      leafPair([g.wallIn, g.z + hw], [0, -1], [g.inward, 0], hw, 1 - s1);
      s.push(`<rect x="${n(Math.min(g.xa, g.xb) - 0.05)}" y="${n(g.z - hw)}" width="${n(Math.abs(g.xb - g.xa) + 0.1)}" height="${n(2 * hw)}" class="pl-gatemark"/>`);
    });

    // entrance (double door, leaves open inward)
    function leafPair(hinge, along, inward, lw, sweep) { // generic leaf + swing arc (hoisted)
      const [hx, hz] = hinge, [ax, az] = along, [ix, iz] = inward;
      line(hx, hz, hx + ix * lw, hz + iz * lw, 'pl-door');
      path(`M${n(hx + ix * lw)} ${n(hz + iz * lw)} A${n(lw)} ${n(lw)} 0 0 ${sweep} ${n(hx + ax * lw)} ${n(hz + az * lw)}`, 'pl-swing');
    };
    if (entry.wall === 'end') { // end entrance: east end, or west end on a mirrored plan
      const es = entry.side === 'west' ? -1 : 1, xi = es > 0 ? x1 : x0, sw0 = es > 0 ? 1 : 0;
      rect(Math.min(xi, es * L / 2), -entW / 2, Math.abs(es * L / 2 - xi), entW, 'pl-gap');
      if (cfg.entrance === 'steel') leafPair([xi, -entW / 2 + 0.05], [0, 1], [-es, 0], entW - 0.1, sw0);
      else { leafPair([xi, -entW / 2], [0, 1], [-es, 0], entW / 2, sw0); leafPair([xi, entW / 2], [0, -1], [-es, 0], entW / 2, 1 - sw0); }
      path(`M${n(es * (L / 2 + 1.15))} 0H${n(es * (L / 2 + 0.3))}M${n(es * (L / 2 + 0.5))} -0.16L${n(es * (L / 2 + 0.3))} 0L${n(es * (L / 2 + 0.5))} 0.16`, 'pl-arrow');
      text(es * (L / 2 + 0.72), -0.25, 'ENTRANCE', 'pl-tag');
    } else {
      const ex = entry.x;
      rect(ex - entW / 2, z1, entW, W / 2 - z1, 'pl-gap');
      if (cfg.entrance === 'steel') leafPair([ex - entW / 2 + 0.05, z1], [1, 0], [0, -1], entW - 0.1, 1);
      else { leafPair([ex - entW / 2, z1], [1, 0], [0, -1], entW / 2, 1); leafPair([ex + entW / 2, z1], [-1, 0], [0, -1], entW / 2, 0); }
      path(`M${n(ex)} ${n(W / 2 + 1.0)}V${n(W / 2 + 0.3)}M${n(ex - 0.16)} ${n(W / 2 + 0.5)}L${n(ex)} ${n(W / 2 + 0.3)}L${n(ex + 0.16)} ${n(W / 2 + 0.5)}`, 'pl-arrow');
      text(ex + 0.25, W / 2 + 0.75, 'ENTRANCE', 'pl-tag', 'start');
    }

    // ---- partitions (+ door gaps)
    hWalls.forEach((ln) => ln.segs.forEach(([a, b]) => {
      rect(a - PT / 2, ln.at - PT / 2, b - a + PT, PT, 'pl-part');
      ln.gaps.filter((g) => g.at > a && g.at < b).forEach((g) => rect(g.at - g.w / 2, ln.at - PT / 2 - 0.01, g.w, PT + 0.02, 'pl-gapin'));
    }));
    vWalls.forEach((ln) => ln.segs.forEach(([a, b]) => {
      rect(ln.at - PT / 2, a, PT, b - a, 'pl-part');
      ln.gaps.filter((g) => g.at > a && g.at < b).forEach((g) => rect(ln.at - PT / 2 - 0.01, g.at - g.w / 2, PT + 0.02, g.w, 'pl-gapin'));
    }));
    (Y.doors || []).forEach((d) => { // room doors: generated or edited; into = swing side
      const w = d.w - 0.02, fl = d.hinge === -1;
      if (d.o === 'h') {
        const sw = d.into < 0 ? 1 : 0;
        if (!fl) leafPair([d.p - w / 2, d.at], [1, 0], [0, d.into], w, sw); else leafPair([d.p + w / 2, d.at], [-1, 0], [0, d.into], w, 1 - sw);
      } else {
        const sw = d.into > 0 ? 0 : 1;
        if (!fl) leafPair([d.at, d.p + w / 2], [0, -1], [d.into, 0], w, sw); else leafPair([d.at, d.p - w / 2], [0, 1], [d.into, 0], w, 1 - sw);
      }
    });
    baths.forEach((b) => { // opens out into the hall
      const out = (b.side === 'W' ? 1 : -1) * (b.door.swing === -1 ? -1 : 1), w = 0.7, sw = out > 0 ? 0 : 1;
      if (b.door.hinge !== -1) leafPair([b.inner, b.door.z + w / 2], [0, -1], [out, 0], w, sw);
      else leafPair([b.inner, b.door.z - w / 2], [0, 1], [out, 0], w, 1 - sw);
    });

    // ---- bathroom fixtures (always drawn: fixed installation)
    baths.forEach((b) => {
      const sgn = b.side === 'W' ? 1 : -1, ox = b.side === 'W' ? x0 : x1, at = (d) => ox + sgn * d;
      const nz = zB + PT / 2, sz = zF - PT / 2;
      const sx0 = Math.min(at(0), at(0.8));
      rect(sx0, nz, 0.8, sz - nz, 'pl-fix pl-tilefill');
      line(sx0, nz, sx0 + 0.8, sz, 'pl-thin'); line(sx0 + 0.8, nz, sx0, sz, 'pl-thin');
      circ(at(0.4), (nz + sz) / 2, 0.04, 'pl-fix');
      const scr = cfg.wetDry === 'door' ? 0.45 : 0.62;
      line(at(0.82), nz, at(0.82), nz + (sz - nz) * scr, 'pl-glassline');
      if (cfg.wetDry === 'door') line(at(0.82), sz, at(0.82 + 0.3), sz - 0.45, 'pl-glassline');
      const tx = at(1.24);
      rect(tx - 0.2, nz, 0.4, cfg.smartToilet ? 0.12 : 0.18, 'pl-fix');
      s.push(`<ellipse cx="${n(tx)}" cy="${n(nz + 0.42)}" rx="0.18" ry="0.24" class="pl-fix"/>`);
      const avail = b.len - PT / 2 - 0.86 - 0.05, vw = Math.max(0.4, Math.min(cfg.vanityW / 100, avail));
      const vx0 = Math.min(at(0.86), at(0.86 + vw));
      rect(vx0, sz - 0.46, vw, 0.46, 'pl-fix');
      s.push(`<ellipse cx="${n(vx0 + vw / 2)}" cy="${n(sz - 0.24)}" rx="${n(Math.min(0.2, vw / 2 - 0.06))}" ry="0.14" class="pl-fix"/>`);
    });
    // ---- kitchens (fixed)
    kitchens.forEach((k) => {
      const { kx, rx, kLen, aZa, aZb, kRet } = k, zd = k.zd || 1;
      rect(kx, Math.min(aZa, aZb), kLen, 0.6, 'pl-fix pl-counter');
      rect(rx, Math.min(aZb, aZb + zd * kRet), 0.6, kRet, 'pl-fix pl-counter');
      const sy = zd > 0 ? aZa + 0.1 : aZa - 0.5;
      const dbl = cfg.sink.indexOf('double') >= 0, sw = dbl ? 0.75 : 0.6, sx = k.sinkAt(sw);
      if (dbl) { rect(sx - sw / 2 + 0.03, sy, sw / 2 - 0.05, 0.4, 'pl-fix'); rect(sx + 0.02, sy, sw / 2 - 0.05, 0.4, 'pl-fix'); }
      else rect(sx - sw / 2 + 0.05, sy, sw - 0.1, 0.4, 'pl-fix');
      const hz = aZb + zd * kRet / 2;
      for (const dx of [-0.13, 0.13]) for (const dz of [-0.13, 0.13]) circ(rx + 0.3 + dx, hz + dz, 0.09, 'pl-fix');
      if (cfg.kitchenCab === 'up') rect(kx + 0.02, zd > 0 ? aZa + 0.02 : aZa - 0.34, kLen - 0.04, 0.32, 'pl-overhead');
    });
    // ---- furniture
    if (opts.furniture) {
      bedrooms.forEach((r) => {
        const { cx, bw, headZ, dir } = r.bed;
        const zA = headZ + dir * 0.02, zBb = headZ + dir * 2.08;
        rect(cx - bw / 2 - 0.04, Math.min(zA, zBb), bw + 0.08, 2.06, 'pl-furn');
        for (const sg of [-1, 1]) rect(cx + sg * bw / 4 - (bw / 2 - 0.12) / 2, Math.min(headZ + dir * 0.1, headZ + dir * 0.42), bw / 2 - 0.12, 0.32, 'pl-furn');
        line(cx - bw / 2 - 0.04, headZ + dir * 0.75, cx + bw / 2 + 0.04, headZ + dir * 0.75, 'pl-thin');
        if (r.bed.stands[0]) rect(cx - bw / 2 - 0.49, Math.min(headZ, headZ + dir * 0.39), 0.42, 0.38, 'pl-furn');
        if (r.bed.stands[1]) rect(cx + bw / 2 + 0.07, Math.min(headZ, headZ + dir * 0.39), 0.42, 0.38, 'pl-furn');
      });
      const so = furniture.sofa;
      if (so) {
        rect(so.cx - so.w / 2, so.cz - so.d / 2, so.w, so.d, 'pl-furn');
        if (!so.chair) {
          rect(so.cx - so.w / 2, so.back > 0 ? so.cz - so.d / 2 : so.cz + so.d / 2 - 0.2, so.w, 0.2, 'pl-furn');
          rect(so.cx - 0.45, so.cz + so.back * 1.0 - 0.25, 0.9, 0.5, 'pl-furn');
        }
      }
      const di = furniture.dining;
      if (di) {
        rect(di.cx - di.w / 2, di.cz - di.d / 2, di.w, di.d, 'pl-furn');
        for (const sg of [-1, 1]) for (const t of [-0.45, 0, 0.45]) rect(di.cx + sg * 0.62 - 0.21, di.cz + t - 0.21, 0.42, 0.42, 'pl-furn');
      }
    }

    // ---- room labels (follow edited walls: enclosed rooms are measured from the actual walls)
    (Y.edited ? CHZ.roomLabels(cfg) : rooms).forEach((r) => {
      const w = r.x1 - r.x0, d = r.z1 - r.z0, small = r.kind === 'bath' || r.kind === 'kitchen';
      const area = r.area != null ? r.area : w * d;
      let cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      if (r.own) { cx = r.cx; cz = r.cz; }
      if (r.kind === 'bedroom' && !r.own) cz = r.z0 < 0 ? r.z1 - 0.25 : r.z0 + 0.35;
      if (r.kind === 'bedroom' && r.own) cz = r.z0 < 0 ? r.z1 - 0.25 : r.z0 + 0.35;
      if (r.kind === 'bath') { const b = baths.find((bb) => bb.name === r.name) || baths[0]; cx = b.side === 'W' ? x0 + 0.82 + (b.len - 0.82) / 2 : x1 - 0.82 - (b.len - 0.82) / 2; cz = (zB + zF) / 2; }
      if (r.kind === 'kitchen') { cx = r.x0 + Math.min(1.0, w / 2) + 0.4; cz = r.z0 < 0 ? r.z1 - 1.15 : r.z0 + 1.15; }
      text(cx, cz - (small ? 0.06 : 0.1), r.name.toUpperCase(), small ? 'pl-room pl-room-s' : 'pl-room');
      const dimsTxt = r.kind === 'bath' ? '  ·  ' + w.toFixed(2) + ' × ' + d.toFixed(2) : small ? '' : '  ·  ' + w.toFixed(2) + ' × ' + d.toFixed(2);
      text(cx, cz + (small ? 0.12 : 0.16), area.toFixed(1) + ' m²' + dimsTxt, 'pl-sub');
    });
    if (hall.x1 - hall.x0 > 1) text((hall.x0 + hall.x1) / 2, (zB + zF) / 2 + 0.05, 'HALL', 'pl-tag');

    // ---- dimensions
    if (opts.dims) {
      const dimH = (xa, xb, y, label) => {
        line(xa, y, xb, y, 'pl-dim');
        for (const xx of [xa, xb]) { line(xx - 0.06, y + 0.06, xx + 0.06, y - 0.06, 'pl-dimtick'); line(xx, y - 0.12, xx, y + 0.12, 'pl-dim'); }
        text((xa + xb) / 2, y - 0.07, label, 'pl-dimtext');
      };
      const dimV = (za, zb, x, label) => {
        line(x, za, x, zb, 'pl-dim');
        for (const zz of [za, zb]) { line(x - 0.06, zz + 0.06, x + 0.06, zz - 0.06, 'pl-dimtick'); line(x - 0.12, zz, x + 0.12, zz, 'pl-dim'); }
        text(x + 0.08, (za + zb) / 2, label, 'pl-dimtext', 'middle', 90);
      };
      dimH(-L / 2, L / 2, -W / 2 - 0.95, mm(L));
      // chains split at the real partitions of each band (follow wall edits and the bathroom length)
      const SP = CHZ.bandSplits(Y);
      const chain = (xs, y) => { const pts = [-L / 2].concat(xs, [L / 2]); for (let i = 0; i < pts.length - 1; i++) dimH(pts[i], pts[i + 1], y, mm(pts[i + 1] - pts[i])); };
      if (SP.back.length) chain(SP.back, -W / 2 - 0.5);
      if (SP.front.length) chain(SP.front, W / 2 + 0.55);
      dimV(-W / 2, W / 2, L / 2 + 1.55, mm(W));
      dimV(-W / 2, -c, L / 2 + 1.2, mm(D)); dimV(-c, c, L / 2 + 1.2, mm(2 * c)); dimV(c, W / 2, L / 2 + 1.2, mm(D));
    }

    // ---- room check overlay (rooms without a door / window), and editable walls in Advanced mode
    if (opts.editWalls && cfg.edit) cfg.edit.walls.forEach((wl) => {
      if (wl.o === 'h') line(wl.a, wl.at, wl.b, wl.at, 'pl-edit-wall'); else line(wl.at, wl.a, wl.at, wl.b, 'pl-edit-wall');
    });
    if (opts.editWalls) baths.forEach((b) => line(b.inner, zB, b.inner, zF, 'pl-edit-wall')); // bathroom: inner wall resizes, door slides
    if (opts.editWalls) { // door option markers: a small arrow on the swing side of each door (click for hinge / swing options)
      const mark = (x, z, dx, dz, attr) => {
        const ang = Math.atan2(dz, dx) * 180 / Math.PI;
        s.push(`<g class="pl-dmark" ${attr} transform="translate(${n(x)} ${n(z)})"><circle r="0.17"/><path d="M-0.07 -0.06 L0.06 0 L-0.07 0.06" transform="rotate(${n(ang)})"/></g>`);
      };
      (Y.doors || []).forEach((d, i) => {
        if (d.o === 'h') mark(d.p, d.at + d.into * 0.32, 0, d.into, `data-dmark="${i}"`);
        else mark(d.at + d.into * 0.32, d.p, d.into, 0, `data-dmark="${i}"`);
      });
      baths.forEach((b) => { const out = (b.side === 'W' ? 1 : -1) * (b.door.swing === -1 ? -1 : 1); mark(b.inner + out * 0.32, b.door.z, out, 0, `data-dmark-bath="${b.side}"`); });
    }
    (opts.issues || []).forEach((is, i) => {
      is.rects.forEach(([x, z, w, h]) => s.push(`<rect x="${n(x)}" y="${n(z)}" width="${n(w + 0.002)}" height="${n(h + 0.002)}" class="pl-iss-${is.sev}"/>`));
    });
    (opts.issues || []).forEach((is, i) => {
      const dx = (opts.issues.slice(0, i).filter((q) => Math.hypot(q.x - is.x, q.z - is.z) < 0.3).length) * 0.42;
      s.push(`<circle cx="${n(is.x + dx)}" cy="${n(is.z)}" r="0.19" class="pl-iss-pin${is.sev === 'warn' ? ' warn' : ''}"/><text x="${n(is.x + dx)}" y="${n(is.z)}" class="pl-iss-t">${i + 1}</text>`);
    });

    // ---- north arrow, scale bar, title block
    const by = W / 2 + 1.05;
    {
      const ax = -L / 2 - 0.9, ay = -W / 2 - 0.6;
      path(`M${n(ax)} ${n(ay - 0.32)} L${n(ax + 0.16)} ${n(ay + 0.16)} L${n(ax)} ${n(ay + 0.06)} L${n(ax - 0.16)} ${n(ay + 0.16)} Z`, 'pl-north');
      text(ax, ay - 0.4, 'N', 'pl-tag');
      for (let i = 0; i < 4; i++) rect(-L / 2 + i * 0.5, by, 0.5, 0.08, i % 2 ? 'pl-scale1' : 'pl-scale0');
      text(-L / 2, by + 0.3, '0', 'pl-tag', 'start'); text(-L / 2 + 1, by + 0.3, '1', 'pl-tag'); text(-L / 2 + 2, by + 0.3, '2 m', 'pl-tag');
    }
    {
      const sz2 = CHZ.sizeOf(cfg), tw = Math.min(5.4, L + 1.2), tx = L / 2 + padR - 0.15 - tw, ty = by - 0.1;
      rect(tx, ty, tw, 0.95, 'pl-title');
      line(tx, ty + 0.42, tx + tw, ty + 0.42, 'pl-thin');
      text(tx + 0.15, ty + 0.3, 'CONTAINER HAZ · ' + sz2.name.toUpperCase() + ' EXPANDABLE', 'pl-ttl', 'start');
      text(tx + 0.15, ty + 0.66, Y.plan.name + ' (catalog ' + Y.plan.page + ') · ' + (L * W).toFixed(1) + ' m² · inner height 2.40 m', 'pl-sub', 'start');
      text(tx + 0.15, ty + 0.86, 'Dimensions in mm · bathrooms in the core module · walls ' + cfg.panelThk + ' mm sandwich panel', 'pl-sub', 'start');
    }

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(n).join(' ')}" class="plan-svg" role="img" aria-label="Floor plan of the ${esc(CHZ.sizeOf(cfg).name)} house, ${esc(Y.plan.name)}">${s.join('')}</svg>`, vb };
  }

  // small schematic thumbnail of a catalog plan (for the floor-plan picker)
  const thumbCache = new Map();
  function thumb(sizeId, planId, mirror) {
    const key = sizeId + '|' + planId + (mirror ? '|m' : '');
    if (thumbCache.has(key)) return thumbCache.get(key);
    const Y = CHZ.layout({ size: sizeId, layout: planId, panelThk: 75, winType: 'hanging', mirror: !!mirror });
    const { L, W, x0, x1, z0, z1, zB, zF, baths, bedrooms, kitchens, hWalls, vWalls, entry } = Y;
    const s = [];
    const r = (x, y, w, h, cls) => s.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" class="${cls}"/>`);
    r(-L / 2, -W / 2, L, W, 'th-wall');
    r(x0, z0, x1 - x0, z1 - z0, 'th-open');
    bedrooms.forEach((b) => r(b.x0, b.z0, b.x1 - b.x0, b.z1 - b.z0, 'th-bed'));
    kitchens.forEach((k) => r(k.kx, (k.zd || 1) > 0 ? k.z0 : k.z1 - 0.65, Math.min(2.0, k.x1 - k.x0), 0.65, 'th-kit'));
    baths.forEach((b) => r(b.x0, b.z0, b.x1 - b.x0, b.z1 - b.z0, 'th-bath'));
    hWalls.forEach((ln) => ln.segs.forEach(([a, b]) => r(a, ln.at - 0.06, b - a, 0.12, 'th-line')));
    vWalls.forEach((ln) => ln.segs.forEach(([a, b]) => r(ln.at - 0.06, a, 0.12, b - a, 'th-line')));
    if (entry.wall === 'end') r((entry.side === 'west' ? -1 : 1) * L / 2 - 0.25, -0.8, 0.5, 1.6, 'th-door'); else r(entry.x - 0.8, W / 2 - 0.25, 1.6, 0.5, 'th-door');
    const svg = `<svg viewBox="${n(-L / 2 - 0.3)} ${n(-W / 2 - 0.3)} ${n(L + 0.6)} ${n(W + 0.6)}" class="th-svg" aria-hidden="true">${s.join('')}</svg>`;
    thumbCache.set(key, svg);
    return svg;
  }

  CHZ.plan = { render, thumb };
})(window.CHZ);
