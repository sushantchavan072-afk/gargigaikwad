/* taks-lab.js — B1 type tester + B2 glyph explorer (Taks page).
   Needs the font file  fonts/Taks.woff2 | Taks.otf | Taks.ttf  — if none loads, the whole section removes itself.
   Glyph explorer lists only characters the font really contains (detected by comparing fallback widths),
   and draws REAL metrics measured from the font (advance, bounding box, baseline) — nothing is guessed. */
(function () {
  "use strict";
  var lab = document.querySelector("[data-lab]");
  if (!lab) return;
  var FAMILY = "Taks";
  var FILES = ["fonts/Taks.woff2", "fonts/Taks.otf", "fonts/Taks.ttf"];
  var $ = function (s, r) { return (r || lab).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || lab).querySelectorAll(s)); };
  var t = function (k, en) { return window.GG ? window.GG.t(k, en) : en; };

  function loadFont(i) {
    if (i >= FILES.length) return Promise.reject(new Error("no Taks font file"));
    var ff = new FontFace(FAMILY, "url(" + FILES[i] + ")");
    return ff.load().then(function (f) { document.fonts.add(f); return f; }).catch(function () { return loadFont(i + 1); });
  }

  var cv = document.createElement("canvas").getContext("2d");
  function has(ch) {                                    /* glyph exists in Taks ⇔ width is the same whatever the fallback is */
    cv.font = '64px "' + FAMILY + '", serif'; var a = cv.measureText(ch).width;
    cv.font = '64px "' + FAMILY + '", monospace'; var b = cv.measureText(ch).width;
    return Math.abs(a - b) < 0.01;
  }

  var SETS = [
    ["Devanagari", "अ आ इ ई उ ऊ ए ऐ ओ औ क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह ळ क्ष ज्ञ ० १ २ ३ ४ ५ ६ ७ ८ ९".split(" ")],
    ["Latin", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("")]
  ];
  var SAMPLES = ["तक्ष", "गार्गी", "Gargi", "Taks", "Pune", "महाराष्ट्र", "Sharp edges", "ABC abc 123"];

  function init() {
    var out = $(".lab-out"), size = $(".lab-size"), track = $(".lab-track"), chips = $(".lab-chips"), grid = $(".lab-grid"), tabs = $(".lab-tabs"), detail = $(".lab-detail");

    /* ---- tester ---- */
    var okSamples = SAMPLES.filter(function (s) { return Array.from(s).every(function (c) { return c === " " || has(c); }); });
    var start = okSamples[0] || "";
    size.value = Math.round(Math.max(64, Math.min(150, window.innerWidth * 0.11)));
    function applyStyle() { out.style.fontSize = size.value + "px"; out.style.letterSpacing = track.value + "em"; $(".lab-size-val").textContent = size.value + "px"; }
    applyStyle(); size.addEventListener("input", applyStyle); track.addEventListener("input", applyStyle);
    out.textContent = start;
    out.addEventListener("paste", function (e) { e.preventDefault(); var tx = (e.clipboardData || window.clipboardData).getData("text").replace(/\s+/g, " "); document.execCommand("insertText", false, tx); });
    okSamples.forEach(function (s) {
      var b = document.createElement("button"); b.type = "button"; b.className = "lab-chip"; b.textContent = s; b.style.fontFamily = '"' + FAMILY + '", var(--sans)';
      b.addEventListener("click", function () { out.textContent = s; out.focus(); });
      chips.appendChild(b);
    });
    if (!okSamples.length) chips.remove();

    /* ---- glyph explorer ---- */
    var sets = SETS.map(function (s) { return [s[0], s[1].filter(has)]; }).filter(function (s) { return s[1].length; });
    if (!sets.length) { $(".lab-glyphs").remove(); return; }
    var sel = null;
    function metricsSVG(ch) {
      var W = 340, H = 340, S = 200;
      cv.font = S + 'px "' + FAMILY + '"'; var m = cv.measureText(ch);
      var h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      if (h > H * 0.62) { S = Math.floor(S * (H * 0.62) / h); cv.font = S + 'px "' + FAMILY + '"'; m = cv.measureText(ch); }
      var adv = m.width, L = m.actualBoundingBoxLeft, R = m.actualBoundingBoxRight, A = m.actualBoundingBoxAscent, D = m.actualBoundingBoxDescent;
      var base = H * 0.64, x0 = (W - adv) / 2, pm = function (v) { return Math.round(v / S * 1000); };
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Glyph ' + ch + ' with its measured metrics">' +
        '<line class="g-base" x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '"/>' +
        '<line class="g-adv" x1="' + x0 + '" x2="' + x0 + '" y1="26" y2="' + (H - 26) + '"/><line class="g-adv" x1="' + (x0 + adv) + '" x2="' + (x0 + adv) + '" y1="26" y2="' + (H - 26) + '"/>' +
        '<rect class="g-box" x="' + (x0 - L) + '" y="' + (base - A) + '" width="' + (L + R) + '" height="' + (A + D) + '"/>' +
        '<text class="g-glyph" x="' + x0 + '" y="' + base + '" font-size="' + S + '">' + ch + '</text>' +
        '<text class="g-lab" x="8" y="' + (base - 6) + '">baseline</text>' +
        '<text class="g-lab" x="' + (x0 + 5) + '" y="22">advance ' + pm(adv) + '‰</text>' +
        '<text class="g-lab g-lab-box" x="' + (x0 - L) + '" y="' + (base - A - 6) + '">box ' + pm(L + R) + '×' + pm(A + D) + '‰</text></svg>';
    }
    function select(ch) {
      sel = ch;
      var cps = Array.from(ch).map(function (c) { return "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"); }).join(" ");
      detail.innerHTML = metricsSVG(ch) + '<p class="lab-cp">' + cps + '<small>‰ = thousandths of the font size</small></p>';
      $$(".lab-g", grid).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.ch === ch)); });
    }
    function fill(i) {
      grid.innerHTML = "";
      sets[i][1].forEach(function (ch) {
        var b = document.createElement("button"); b.type = "button"; b.className = "lab-g"; b.textContent = ch; b.dataset.ch = ch;
        b.setAttribute("aria-label", "Glyph " + ch); b.setAttribute("aria-pressed", "false");
        b.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") select(ch); });
        b.addEventListener("focus", function () { select(ch); });
        b.addEventListener("click", function () { select(ch); });
        grid.appendChild(b);
      });
      $$(".lab-tab", tabs).forEach(function (b, j) { b.setAttribute("aria-selected", String(j === i)); });
      select(sets[i][1][0]);
    }
    tabs.innerHTML = "";
    if (sets.length > 1) sets.forEach(function (s, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "lab-tab"; b.setAttribute("role", "tab"); b.textContent = s[0] + " · " + s[1].length;
      b.addEventListener("click", function () { fill(i); }); tabs.appendChild(b);
    }); else tabs.remove();
    fill(0);
  }

  loadFont(0).then(function () {
    return document.fonts.load('64px "' + FAMILY + '"', "Aअ");
  }).then(function () { init(); lab.hidden = false; lab.classList.add("is-ready"); document.dispatchEvent(new CustomEvent("gg:lab-ready")); })
    .catch(function () { lab.remove(); });
})();
