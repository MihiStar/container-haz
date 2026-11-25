// Language layer: English is the source language; Hungarian comes from js/i18n-hu.js.
// Text on screen (HTML, SVG plan labels, toasts, dialogs, tooltips) is translated as it appears, so the app code stays English.
// Lookup order: exact text → the same text with numbers as {0}, {1}… → regex patterns. Hungarian numbers use a decimal comma.
(function () {
  const CHZ = (window.CHZ = window.CHZ || {});
  const KEY = 'chz.lang.v1';
  let lang = 'en';
  try { lang = localStorage.getItem(KEY) || 'en'; } catch (e) { /* storage blocked */ }
  if (lang !== 'hu') lang = 'en';

  const pack = () => CHZ.i18nHU || { dict: {}, pats: [] };
  const missing = new Set();
  let collect = false;

  const huNum = (s) => s.replace(/(\d)\.(\d)/g, '$1,$2');
  const NUMERIC = /^[\d\s.,×x·:;/%+\-–−=()°]*(m²|m³|m|mm|cm|kg|kW|kWh|W|W\/m²K|W\/mK|ft|°C|h|db|pcs)?[\d\s.,×x·:;/%+\-–−=()°]*$/;
  const NUM = /\d+(?:\.\d+)?/g;

  function trCore(core) {
    const P = pack(), D = P.dict;
    core = core.replace(/[   ]/g, ' '); // no-break / thin spaces (e.g. "11 800") count as plain spaces
    if (Object.prototype.hasOwnProperty.call(D, core)) return D[core];
    if (/\d/.test(core)) {
      const nums = [];
      const k = core.replace(NUM, (m) => { nums.push(m); return '{' + (nums.length - 1) + '}'; });
      if (Object.prototype.hasOwnProperty.call(D, k)) return D[k].replace(/\{(\d+)\}/g, (m, i) => huNum(nums[+i] || ''));
      if (NUMERIC.test(core)) return huNum(core);
    }
    for (const [re, fn] of P.pats) {
      const m = core.match(re);
      if (m) { const r = fn(m, t); if (r != null) return r; }
    }
    return null;
  }
  // translate one string (keeps leading / trailing spaces)
  function t(s) {
    if (lang !== 'hu' || s == null) return s;
    s = String(s);
    const core = s.trim();
    if (!core || !/[A-Za-z]/.test(core)) return /\d\.\d/.test(core) ? s.replace(core, huNum(core)) : s;
    let r = trCore(core);
    if (r == null) { if (collect) missing.add(core); return s; }
    let lead = s.slice(0, s.indexOf(core)), trail = s.slice(s.indexOf(core) + core.length);
    if (r.charAt(0) === '\u0008') { r = r.slice(1); lead = ''; } // translation glues to the previous fragment (Hungarian word order)
    return lead + r + trail;
  }
  // translate a multi-line block (copied text): whole line first, then its parts
  function block(text) {
    if (lang !== 'hu') return text;
    return String(text).split('\n').map((line) => {
      const m = line.match(/^(\s*(?:[-*#>]+\s+|\d+\.\s+)?)(.*)$/);
      const lead = m[1], body = m[2];
      if (!body.trim()) return line;
      const whole = trCore(body.trim());
      if (whole != null) return lead + whole;
      return lead + body.split(/( · | — |: |\*\*)/).map((part) => (/^( · | — |: |\*\*)$/.test(part) ? part : t(part))).join('');
    }).join('\n');
  }

  // ---- DOM: translate text nodes and a few attributes, remembering the English original
  const ORIG = new WeakMap(), WROTE = new WeakMap(), AORIG = new WeakMap();
  const ATTRS = ['title', 'aria-label', 'placeholder'];
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1, TITLE: 1 }; // the tab title is handled by doTitle()
  const skipEl = (el) => !el || SKIP[el.nodeName] || (el.closest && el.closest('[data-noi18n]'));
  function doText(node) {
    const el = node.parentNode;
    if (!el || skipEl(el)) return;
    const cur = node.nodeValue;
    let o = ORIG.get(node);
    if (o === undefined || WROTE.get(node) !== cur) { o = cur; ORIG.set(node, o); }
    const want = t(o);
    if (want !== cur) node.nodeValue = want;
    WROTE.set(node, want);
  }
  function doAttrs(el) {
    if (!el.getAttribute || skipEl(el)) return;
    let rec = AORIG.get(el);
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const cur = el.getAttribute(a);
      if (!rec) { rec = {}; AORIG.set(el, rec); }
      let r = rec[a];
      if (!r || r.w !== cur) r = rec[a] = { o: cur, w: cur };
      const want = t(r.o);
      if (want !== cur) el.setAttribute(a, want);
      r.w = want;
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (skipEl(root)) return; doAttrs(root); }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n = tw.nextNode();
    while (n) { if (n.nodeType === 3) doText(n); else doAttrs(n); n = tw.nextNode(); }
  }
  let titleO = null;
  function doTitle() { if (titleO == null) titleO = document.title; document.title = t(titleO); }

  let obs = null;
  function start() {
    doTitle(); walk(document.body);
    document.documentElement.lang = lang;
    obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    syncButton();
  }
  function syncButton() {
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  function setLang(l) {
    lang = l === 'hu' ? 'hu' : 'en';
    try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
    document.documentElement.lang = lang;
    walk(document.body); doTitle(); syncButton();
    window.dispatchEvent(new CustomEvent('chz-lang', { detail: lang }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  CHZ.i18n = {
    t, block, setLang,
    get lang() { return lang; },
    // harvest helpers (development): CHZ.i18n.collect(true) … CHZ.i18n.missing()
    collect(on) { collect = !!on; if (on) missing.clear(); walk(document.body); },
    missing() { return [...missing].sort(); },
    refresh() { walk(document.body); doTitle(); },
  };
})();
