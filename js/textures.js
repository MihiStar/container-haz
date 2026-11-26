/* Procedural material textures drawn on canvas. One descriptor drives both the 3D texture and the UI swatch.
 * Descriptor: { k: kind, c: base colour, ...kind params, tile: metres per texture repeat (default 1) }
 */
(function (CHZ) {
  'use strict';

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function draw(ctx, S, d) {
    const R = rng(hashStr(JSON.stringify(d)));
    const base = d.c || (d.cs && d.cs[0]) || '#888888';
    ctx.globalAlpha = 1;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    const px = S / 512;

    const noise = (n, a) => {
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = R() < 0.5 ? '#000' : '#fff';
        ctx.globalAlpha = a * R();
        const s = Math.max(1, px * (1 + R() * 2));
        ctx.fillRect(R() * S, R() * S, s, s);
      }
      ctx.globalAlpha = 1;
    };
    const ribs = (n, strength) => {
      const p = S / n;
      for (let i = 0; i < n; i++) {
        const x = i * p;
        const g = ctx.createLinearGradient(x, 0, x + p, 0);
        g.addColorStop(0, `rgba(0,0,0,${0.30 * strength})`);
        g.addColorStop(0.1, `rgba(255,255,255,${0.14 * strength})`);
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(0.88, `rgba(0,0,0,${0.06 * strength})`);
        g.addColorStop(1, `rgba(0,0,0,${0.22 * strength})`);
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, p, S);
      }
    };
    const grain = (col, count, horizontal, x0, y0, w, h) => {
      x0 = x0 || 0; y0 = y0 || 0; w = w || S; h = h || S;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      ctx.strokeStyle = col;
      for (let i = 0; i < count; i++) {
        ctx.globalAlpha = 0.06 + R() * 0.28;
        ctx.lineWidth = (0.5 + R() * 2.5) * px;
        const f = 1 + Math.floor(R() * 3), ph = R() * 6.28, amp = R() * S * 0.012;
        const off = horizontal ? y0 + R() * h : x0 + R() * w;
        for (const wrap of [0, -S, S]) {
          ctx.beginPath();
          for (let t = 0; t <= 32; t++) {
            const along = (horizontal ? x0 : y0) + (t / 32) * (horizontal ? w : h);
            const across = off + wrap + Math.sin((along / S) * Math.PI * 2 * f + ph) * amp;
            if (horizontal) { t ? ctx.lineTo(along, across) : ctx.moveTo(along, across); }
            else { t ? ctx.lineTo(across, along) : ctx.moveTo(across, along); }
          }
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };
    const blob = (cx, cy, r, col) => {
      ctx.fillStyle = col;
      for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {
        ctx.beginPath();
        const n = 9;
        const radii = [];
        const rr = rng(Math.floor(cx * 31 + cy * 17));
        for (let i = 0; i < n; i++) radii.push(r * (0.55 + rr() * 0.6));
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2, rad = radii[i % n];
          const x = cx + ox + Math.cos(a) * rad * 1.4, y = cy + oy + Math.sin(a) * rad;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath(); ctx.fill();
      }
    };

    switch (d.k) {
      case 'solid':
        noise(S * 3, 0.035);
        break;
      case 'concrete':
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = shade(base, (R() - 0.5) * 0.12); ctx.globalAlpha = 0.25;
          ctx.beginPath(); ctx.arc(R() * S, R() * S, S * (0.05 + R() * 0.15), 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1; noise(S * 10, 0.09);
        break;
      case 'rib':
        noise(S * 2, 0.03); ribs(8, 1);
        break;
      case 'wood':
        grain(d.g || shade(base, -0.4), Math.round(S * 0.3), !!d.h); // h: horizontal grain (carved metal panels)
        if (d.knots) {
          for (let i = 0; i < 2; i++) {
            const x = R() * S, y = R() * S;
            ctx.strokeStyle = d.g; ctx.lineWidth = 1.5 * px;
            for (let r = 2; r < 9; r++) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(x, y, r * 2.2 * px * (S / 512 > 0.5 ? 1 : 2), r * 5 * px, 0, 0, 7); ctx.stroke(); }
          }
          ctx.globalAlpha = 1;
        }
        if (d.boards) {
          const p = S / d.boards;
          for (let i = 0; i < d.boards; i++) {
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(i * p, 0, 2 * px + 1, S);
            ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(i * p + 3 * px, 0, 2 * px, S);
          }
        }
        if (d.rib) ribs(8, 0.8);
        break;
      case 'boards': { // flat WPC
        const n = 5, p = S / n;
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = shade(base, (R() - 0.5) * 0.12); ctx.fillRect(i * p, 0, p, S);
          grain(d.g || shade(base, -0.35), Math.round(S * 0.05), false, i * p, 0, p, S);
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(i * p, 0, Math.max(1, 3 * px), S);
        }
        break;
      }
      case 'flute': { // embossed / fluted WPC
        grain(shade(base, -0.3), Math.round(S * 0.12), false);
        const n = 7, p = S / n;
        for (let i = 0; i < n; i++) {
          const x = i * p, g = ctx.createLinearGradient(x, 0, x + p, 0);
          g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.12, 'rgba(0,0,0,0.15)');
          g.addColorStop(0.45, 'rgba(255,255,255,0.16)'); g.addColorStop(0.8, 'rgba(0,0,0,0.05)');
          g.addColorStop(1, 'rgba(0,0,0,0.4)');
          ctx.fillStyle = g; ctx.fillRect(x, 0, p, S);
        }
        break;
      }
      case 'camo':
        for (let ci = 1; ci < d.cs.length; ci++) for (let i = 0; i < 10; i++) blob(R() * S, R() * S, S * (0.05 + R() * 0.07), d.cs[ci]);
        ctx.fillStyle = d.cs[0]; ctx.globalAlpha = 0; // base already set by c
        ctx.globalAlpha = 1;
        if (d.rib) ribs(8, 0.7);
        break;
      case 'digicamo': {
        ctx.fillStyle = d.cs[0]; ctx.fillRect(0, 0, S, S);
        const n = 24, g = S / n;
        for (let ci = 1; ci < d.cs.length; ci++) {
          ctx.fillStyle = d.cs[ci];
          for (let k = 0; k < 9; k++) {
            let x = Math.floor(R() * n), y = Math.floor(R() * n);
            for (let s = 0; s < 22; s++) {
              ctx.fillRect(((x % n + n) % n) * g, ((y % n + n) % n) * g, g, g);
              if (R() < 0.5) x += R() < 0.5 ? 1 : -1; else y += R() < 0.5 ? 1 : -1;
            }
          }
        }
        if (d.rib) ribs(8, 0.6);
        break;
      }
      case 'stone': {
        ctx.fillStyle = shade(base, -0.55); ctx.fillRect(0, 0, S, S);
        let y = 0;
        while (y < S) {
          let h = S * (0.06 + R() * 0.06);
          if (y + h > S - S * 0.05) h = S - y;
          let x = -R() * S * 0.2;
          while (x < S) {
            const w = S * (0.14 + R() * 0.22);
            ctx.fillStyle = shade(base, (R() - 0.5) * 0.38);
            const gap = 3 * px;
            ctx.fillRect(x + gap, y + gap, w - gap * 2, h - gap * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + gap, y + gap, w - gap * 2, 2 * px);
            ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + gap, y + h - gap - 3 * px, w - gap * 2, 3 * px);
            x += w;
          }
          y += h;
        }
        noise(S * 6, 0.12);
        break;
      }
      case 'brick': {
        ctx.fillStyle = d.m || '#cfc6b8'; ctx.fillRect(0, 0, S, S);
        const rows = d.rows || 12, h = S / rows, w = S / (d.cols || 4), gap = 3 * px;
        for (let r = 0; r < rows; r++) {
          const off = r % 2 ? w / 2 : 0;
          for (let x = -w; x < S + w; x += w) {
            ctx.fillStyle = shade(base, (R() - 0.5) * 0.25);
            ctx.fillRect(x + off + gap, r * h + gap, w - gap * 2, h - gap * 2);
          }
        }
        noise(S * 6, 0.12);
        break;
      }
      case 'marble': {
        noise(S * 2, 0.03);
        ctx.strokeStyle = d.v || shade(base, -0.4);
        for (let i = 0; i < 9; i++) {
          let x = R() * S, y = R() * S, a = R() * 6.28;
          const wide = R() < 0.3;
          ctx.lineWidth = (wide ? 3 : 1) * px * (1 + R());
          ctx.globalAlpha = wide ? 0.18 : 0.35 + R() * 0.3;
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let s = 0; s < 40; s++) { a += (R() - 0.5) * 0.7; x += Math.cos(a) * S * 0.025; y += Math.sin(a) * S * 0.025; ctx.lineTo(x, y); }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'terrazzo': {
        const cs = d.cs || ['#777', '#aaa'];
        const n = d.fine ? 900 : 380;
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = cs[Math.floor(R() * cs.length)];
          const x = R() * S, y = R() * S, r = (d.fine ? 1 + R() * 2 : 2 + R() * 7) * px;
          ctx.beginPath();
          for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + R(); const rr = r * (0.6 + R() * 0.6); k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
          ctx.fill();
        }
        break;
      }
      case 'speck': { // sprayed / granite-like coating: base colour with fine dark and light grains
        const cs = d.cs || [shade(base, -0.35), shade(base, 0.35)];
        const n = Math.round(S * 14 * (d.n != null ? d.n : 0.6));
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = cs[i % cs.length]; ctx.globalAlpha = 0.35 + R() * 0.6;
          const r = (0.6 + R() * 1.8) * px;
          ctx.fillRect(R() * S, R() * S, r * (1 + R()), r * (1 + R()));
        }
        ctx.globalAlpha = 1; noise(S * 3, 0.06);
        break;
      }
      case 'fabric':
        for (let i = 0; i < S; i += Math.max(2, 2 * px)) {
          ctx.fillStyle = `rgba(0,0,0,${0.02 + R() * 0.04})`; ctx.fillRect(0, i, S, px);
          ctx.fillStyle = `rgba(255,255,255,${0.02 + R() * 0.05})`; ctx.fillRect(i, 0, px, S);
        }
        break;
      case 'travertine':
        for (let i = 0; i < 70; i++) {
          ctx.fillStyle = shade(base, (R() - 0.5) * 0.25); ctx.globalAlpha = 0.35;
          ctx.fillRect(0, R() * S, S, (1 + R() * 6) * px);
        }
        ctx.globalAlpha = 0.4; ctx.fillStyle = shade(base, -0.3);
        for (let i = 0; i < 120; i++) ctx.fillRect(R() * S, R() * S, (2 + R() * 6) * px, (1 + R() * 2) * px);
        ctx.globalAlpha = 1;
        break;
      case 'planks': { // floor boards, long side along U (x)
        const rows = Math.round((d.tile || 2.4) / 0.2), h = S / rows, l = S / 2;
        for (let r = 0; r < rows; r++) {
          const off = ((r * 7) % 6) / 6 * l;
          for (let x = -off; x < S; x += l) {
            const col = shade(base, (R() - 0.5) * 0.16);
            ctx.fillStyle = col; ctx.fillRect(x, r * h, l, h);
            grain(shade(base, -0.3), 5, true, Math.max(0, x), r * h, l, h);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(x, r * h, Math.max(1, px), h);
            ctx.fillRect(x, r * h, l, Math.max(1, px));
          }
        }
        break;
      }
      case 'herring': { // fishbone / chevron SPC
        const cols = 4, cw = S / cols, ph = S / 8;
        for (let c = 0; c < cols; c++) {
          const x0 = c * cw, up = c % 2 === 0;
          for (let y = -cw - ph; y < S + cw + ph; y += ph) {
            ctx.fillStyle = shade(base, (R() - 0.5) * 0.18);
            ctx.beginPath();
            if (up) { ctx.moveTo(x0, y); ctx.lineTo(x0 + cw, y - cw); ctx.lineTo(x0 + cw, y - cw + ph); ctx.lineTo(x0, y + ph); }
            else { ctx.moveTo(x0, y - cw); ctx.lineTo(x0 + cw, y); ctx.lineTo(x0 + cw, y + ph); ctx.lineTo(x0, y - cw + ph); }
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, px); ctx.stroke();
          }
        }
        break;
      }
      case 'checker': { // anti-slip plate
        noise(S * 4, 0.08);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        const g = S / 16;
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          ctx.save(); ctx.translate(x * g + g / 2, y * g + g / 2); ctx.rotate((x + y) % 2 ? 0.78 : -0.78);
          ctx.fillRect(-g * 0.35, -g * 0.08, g * 0.7, g * 0.16); ctx.restore();
        }
        break;
      }
      case 'cells': { // solar panel, used with default 0..1 UVs
        ctx.fillStyle = '#16233b'; ctx.fillRect(0, 0, S, S);
        const cx = 6, cy = 10;
        for (let i = 0; i < cx; i++) for (let j = 0; j < cy; j++) {
          const w = S / cx, h = S / cy;
          const g = ctx.createLinearGradient(i * w, j * h, (i + 1) * w, (j + 1) * h);
          g.addColorStop(0, '#22375e'); g.addColorStop(1, '#141f36');
          ctx.fillStyle = g; ctx.fillRect(i * w + 2 * px, j * h + 2 * px, w - 4 * px, h - 4 * px);
          ctx.fillStyle = 'rgba(200,210,230,0.25)';
          for (let k = 1; k < 4; k++) ctx.fillRect(i * w + (k * w) / 4, j * h, Math.max(1, px), h);
        }
        ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 8 * px; ctx.strokeRect(0, 0, S, S);
        break;
      }
      case 'grass':
        for (let i = 0; i < S * 14; i++) {
          ctx.fillStyle = shade(base, (R() - 0.5) * 0.35); ctx.globalAlpha = 0.5;
          ctx.fillRect(R() * S, R() * S, Math.max(1, px * 2), px * (3 + R() * 6));
        }
        ctx.globalAlpha = 1;
        break;
      case 'fluted': // fluted glass, alpha texture
        ctx.clearRect(0, 0, S, S);
        for (let x = 0; x < S; x += S / 24) {
          const g = ctx.createLinearGradient(x, 0, x + S / 24, 0);
          g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0.15)');
          ctx.fillStyle = g; ctx.fillRect(x, 0, S / 24, S);
        }
        break;
      default:
        noise(S * 2, 0.04);
    }

    if (d.gr) { // horizontal grooves of carved / grooved metal panels
      const p = S / d.gr, gw = Math.max(2, 4 * px);
      for (let i = 0; i < d.gr; i++) {
        const y = i * p;
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, y, S, gw);
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(0, y + gw, S, Math.max(1, 2 * px));
        if (d.gr > 4) { const g = ctx.createLinearGradient(0, y, 0, y + p); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.16)'); ctx.fillStyle = g; ctx.fillRect(0, y, S, p); }
      }
    }
    if (d.grid) { // tile joints (SPC wall boards with grout lines)
      ctx.globalAlpha = 1; ctx.fillStyle = d.grid;
      const w = Math.max(2, 4 * px);
      ctx.fillRect(0, S / 2 - w / 2, S, w); ctx.fillRect(S / 2 - w / 2, 0, w, S);
    }
    if (d.seam) { // vertical joint strips (interior panels)
      const tile = d.tile || 1, step = (d.seam.every / tile) * S;
      ctx.globalAlpha = 1; ctx.fillStyle = d.seam.c;
      for (let x = 0; x < S - 1; x += step) ctx.fillRect(x, 0, Math.max(2, 5 * px), S);
    }
  }

  const swatchCache = new Map();
  function swatchURL(d, size) {
    size = size || 96;
    const key = JSON.stringify(d) + size;
    if (swatchCache.has(key)) return swatchCache.get(key);
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    // draw at 256 then downscale so detail density matches the 3D texture
    const big = document.createElement('canvas');
    big.width = big.height = 256;
    draw(big.getContext('2d'), 256, d);
    const ctx = cv.getContext('2d');
    ctx.drawImage(big, 0, 0, size, size);
    const url = cv.toDataURL('image/png');
    swatchCache.set(key, url);
    return url;
  }

  function canvasFor(d, S) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = S || 512;
    draw(cv.getContext('2d'), cv.width, d);
    return cv;
  }

  CHZ.tex = { draw, swatchURL, canvasFor, shade, rng, hashStr };
})(window.CHZ);
