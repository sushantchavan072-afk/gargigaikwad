/* extras.js — global add-on features (v12). Loaded on every page (defer). Does not touch main.js.
   A1 smart cursor + click-to-enlarge · A2 paper-wipe page transitions · A3 smiley eyes + "gargi" rain ·
   A4 "Right now" card · A5 EN/मराठी toggle · A6 reactive headline · A7 case-study side index
   Exposes window.GG = { lang(), t(key, fallbackEn), split(el) } for page modules.  See PREP-AND-CHANGELOG.md. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var fine = mq("(hover: hover) and (pointer: fine)");
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; }

  var GG = window.GG = { lang: function () { return curLang; }, t: function (key, en) { return curLang === "mr" && dict && dict[key] ? dict[key] : en; }, split: function () { } };
  var dict = (window.GG_I18N || {}).mr, curLang = "en";

  /* ================= A2: paper-wipe page transitions ================= */
  (function wipe() {
    if (root.classList.contains("wipe-in")) {                                  /* arriving: sheets are covering → slide them away */
      var done = false;
      var run = function () {
        if (done) return; done = true;
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          root.classList.add("wipe-reveal");
          setTimeout(function () { root.classList.remove("wipe-in", "wipe-reveal"); }, 1000);
        }); });
      };
      if (d.readyState === "complete") run(); else { window.addEventListener("load", run); setTimeout(run, 1200); }
    }
    window.addEventListener("pageshow", function (e) { if (e.persisted) root.classList.remove("wipe-go", "wipe-in", "wipe-reveal"); });
    if (reduce) return;
    d.addEventListener("click", function (e) {                                  /* leaving */
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || !/(\.html|\/)$/.test(u.pathname)) return;
      if (u.pathname === location.pathname && u.search === location.search) return;   /* same page / #hash */
      e.preventDefault();
      try { sessionStorage.setItem("gg-wipe", "1"); } catch (x) { }
      root.classList.add("wipe-go");
      setTimeout(function () { location.href = u.href; }, 560);
    });
  })();

  /* ================= A1: smart cursor + click-to-enlarge ================= */
  (function cursor() {
    var box = d.createElement("div");                                           /* lightbox (works for touch too) */
    box.className = "gg-lightbox"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Enlarged image");
    box.innerHTML = '<img alt=""><button type="button" aria-label="Close">×</button>';
    d.body.appendChild(box);
    var bigImg = $("img", box);
    function openBox(src, alt) { bigImg.src = src; bigImg.alt = alt || ""; box.classList.add("is-open"); }
    function closeBox() { box.classList.remove("is-open"); }
    box.addEventListener("click", closeBox);
    window.addEventListener("keydown", function (e) {                          /* capture: beat main.js "Esc = back" */
      if (e.key === "Escape" && box.classList.contains("is-open")) { e.stopImmediatePropagation(); e.preventDefault(); closeBox(); }
    }, true);
    d.addEventListener("click", function (e) {
      var img = e.target.closest && e.target.closest(".cs-hero img, .gal img");
      if (img && !img.closest("a") && img.currentSrc) openBox(img.currentSrc, img.alt);
    });

    if (!fine) return;
    var el = d.createElement("div"), lab = d.createElement("span");
    el.className = "gg-cursor"; el.setAttribute("aria-hidden", "true"); lab.className = "gg-cursor-label"; el.appendChild(lab); d.body.appendChild(el);
    var LABELS = { zoom: "+", view: "View", open: "Open", drag: "Drag", play: "▶" };
    var AUTO = [[".pg-item", "open"], [".tag", "drag"], [".cs-hero img, .gal img", "zoom"], [".wcard, .card-head a, .card .btn-dark", "view"], [".about-top h1, .cs-top h1", "type"]];
    var x = -100, y = -100, cx = -100, cy = -100, raf = 0, on = false, cur = "";
    function loop() {
      cx += (x - cx) * (reduce ? 1 : 0.2); cy += (y - cy) * (reduce ? 1 : 0.2);
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf = (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) ? requestAnimationFrame(loop) : 0;
    }
    function kindOf(t) {
      if (!t || !t.closest) return "";
      var h = t.closest("[data-cursor]"); if (h) return h.getAttribute("data-cursor");
      for (var i = 0; i < AUTO.length; i++) if (t.closest(AUTO[i][0])) return AUTO[i][1];
      return "";
    }
    d.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; cx = x; cy = y; el.classList.add("is-on"); }
      if (!raf) raf = requestAnimationFrame(loop);
      var k = kindOf(e.target);
      if (k !== cur) {
        cur = k;
        el.classList.toggle("is-ring", k === "type");                           /* headlines: open yellow ring, so the letters stay visible */
        if (k && LABELS[k]) { lab.textContent = LABELS[k]; el.classList.add("has-label"); }
        else el.classList.remove("has-label");
      }
    }, { passive: true });
    d.addEventListener("pointerdown", function () { el.classList.add("is-down"); });
    d.addEventListener("pointerup", function () { el.classList.remove("is-down"); });
    root.addEventListener("mouseleave", function () { on = false; el.classList.remove("is-on"); });
  })();

  /* ================= A3: smiley eyes follow the pointer + type "gargi" for a letter rain ================= */
  (function smiley() {
    var logo = $(".nav-logo");
    if (logo && fine && !reduce) {
      var px = 0, py = 0, pending = false;
      var upd = function () {
        pending = false;
        var r = logo.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), dist = Math.hypot(dx, dy) || 1, k = Math.min(dist / 220, 1) * 1.9;
        logo.style.setProperty("--eye-x", (dx / dist * k).toFixed(2) + "px");
        logo.style.setProperty("--eye-y", (dy / dist * k).toFixed(2) + "px");
      };
      d.addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; if (!pending) { pending = true; requestAnimationFrame(upd); } }, { passive: true });
      logo.addEventListener("pointerenter", function () { logo.classList.add("is-wink"); setTimeout(function () { logo.classList.remove("is-wink"); }, 520); });
    }
    var toastEl = null, toastT = 0;
    function toast(msg) {
      if (!toastEl) { toastEl = d.createElement("div"); toastEl.className = "gg-toast"; toastEl.setAttribute("role", "status"); d.body.appendChild(toastEl); }
      toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
    }
    function rain() {
      toast("hi Gargi ✿");
      if (reduce) return;
      var set = "gargiGARGIAaतक्षगार्गी".match(/[A-Za-z]|[ऀ-ॿ][ा-्]?/g) || ["g"];
      for (var i = 0; i < 44; i++) {
        var s = d.createElement("span"), big = 30 + Math.random() * 74;
        s.className = "gg-rain" + (Math.random() < 0.22 ? " is-y" : "");
        s.textContent = set[Math.floor(Math.random() * set.length)];
        s.style.left = (Math.random() * 100) + "vw"; s.style.fontSize = big + "px";
        s.style.setProperty("--t", (2.2 + Math.random() * 1.8).toFixed(2) + "s"); s.style.setProperty("--d", (Math.random() * 0.9).toFixed(2) + "s");
        s.style.setProperty("--dx", ((Math.random() - 0.5) * 160).toFixed(0) + "px"); s.style.setProperty("--r", ((Math.random() - 0.5) * 540).toFixed(0) + "deg");
        s.setAttribute("aria-hidden", "true");
        s.addEventListener("animationend", function () { this.remove(); });
        d.body.appendChild(s);
      }
    }
    var buf = "";
    window.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
      var t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      buf = (buf + e.key.toLowerCase()).slice(-5);
      if (buf === "gargi") { buf = ""; rain(); }
    });
  })();

  /* ================= A5: EN / मराठी toggle (runs before the headline splitter so it can keep the originals) ================= */
  (function lang() {
    var nodes = $$("[data-i18n]");
    if (!dict || !nodes.length) return;
    nodes.forEach(function (n) { n.setAttribute("data-i18n-en", n.innerHTML); });
    var btn = d.createElement("button");
    btn.type = "button"; btn.className = "nav-lang glass";
    var mail = $(".nav-mail"); if (mail && mail.parentNode) mail.parentNode.insertBefore(btn, mail); else return;
    function apply(l, silent) {
      curLang = l; root.lang = l === "mr" ? "mr" : "en";
      nodes.forEach(function (n) {
        var key = n.getAttribute("data-i18n");
        n.innerHTML = (l === "mr" && dict[key]) ? dict[key] : n.getAttribute("data-i18n-en");
        if (n.hasAttribute("data-gg-split")) { n.removeAttribute("data-gg-done"); n.removeAttribute("aria-label"); GG.split(n); }
      });
      btn.textContent = l === "mr" ? "EN" : "म";
      btn.setAttribute("aria-label", l === "mr" ? "Switch to English" : "मराठीत बघा (switch to Marathi)");
      btn.title = l === "mr" ? "English" : "मराठी";
      btn.setAttribute("aria-pressed", String(l === "mr"));
      d.dispatchEvent(new CustomEvent("gg:lang", { detail: l }));
      if (!silent) store("gg-lang", l);
    }
    btn.addEventListener("click", function () { apply(curLang === "mr" ? "en" : "mr"); });
    apply(store("gg-lang") === "mr" ? "mr" : "en", true);
  })();

  /* ================= A6: reactive headline (letters near the cursor lift and flip upright <-> italic) ================= */
  (function headline() {
    var heads = [];
    function lock(h) { $$(".gg-l", h).forEach(function (s) { s.style.width = ""; }); $$(".gg-l", h).forEach(function (s) { s.style.width = s.getBoundingClientRect().width + "px"; }); }
    GG.split = function (el) {
      if (!fine || reduce || !el || el.hasAttribute("data-gg-done") || root.lang === "mr") return;   /* Devanagari stays whole: splitting would break its joined letters */
      var label = el.textContent.replace(/\s+/g, " ").trim();
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var frag = d.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function (tok) {
              if (!tok) return;
              if (/^\s+$/.test(tok)) { frag.appendChild(d.createTextNode(" ")); return; }
              var w = d.createElement("span"); w.className = "gg-w"; w.setAttribute("aria-hidden", "true");
              Array.from(tok).forEach(function (ch) { var s = d.createElement("span"); s.className = "gg-l"; s.textContent = ch; w.appendChild(s); });
              frag.appendChild(w);
            });
            c.parentNode.replaceChild(frag, c);
          } else if (c.nodeType === 1 && c.tagName !== "BR") walk(c);
        });
      })(el);
      el.setAttribute("aria-label", label); el.setAttribute("data-gg-done", "1");
      if (heads.indexOf(el) < 0) heads.push(el);
      var fix = function () { lock(el); };
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(fix); else fix();
    };
    if (!fine || reduce) return;
    $$(".about-top h1, .cs-top h1.display").forEach(function (h) { h.setAttribute("data-gg-split", ""); GG.split(h); });
    if (!heads.length) return;
    var mx = -999, my = -999, pend = false;
    function frame() {
      pend = false;
      heads.forEach(function (h) {
        var hr = h.getBoundingClientRect();
        var near = my > hr.top - 160 && my < hr.bottom + 160;
        $$(".gg-l", h).forEach(function (s) {
          var p = 0;
          if (near) { var r = s.getBoundingClientRect(), dist = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)); p = Math.pow(clamp(1 - dist / 130, 0, 1), 1.3); }
          var prev = +(s.getAttribute("data-p") || 0);
          if (Math.abs(p - prev) > 0.03 || (p === 0 && prev !== 0)) { s.setAttribute("data-p", p.toFixed(2)); s.style.setProperty("--p", p.toFixed(2)); s.classList.toggle("is-flip", p > 0.45); }
        });
      });
    }
    d.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; if (!pend) { pend = true; requestAnimationFrame(frame); } }, { passive: true });
    root.addEventListener("mouseleave", function () { mx = my = -999; if (!pend) { pend = true; requestAnimationFrame(frame); } });
    var rz = 0; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { heads.forEach(lock); }, 160); });
  })();

  /* ================= A4: "Right now" card (live Pune time) ================= */
  (function now() {
    var cards = $$("[data-now]"); if (!cards.length) return;
    var tf, hf;
    try {
      tf = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
      hf = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    } catch (e) { return; }
    function tick() {
      var nowD = new Date(), h = parseInt(hf.format(nowD), 10) % 24, awake = h >= 8 && h < 23;
      cards.forEach(function (c) {
        var tEl = $("[data-now-time]", c), sEl = $("[data-now-state]", c);
        if (tEl) tEl.textContent = tf.format(nowD).toUpperCase();
        c.setAttribute("data-awake", awake ? "yes" : "no");
        if (sEl) sEl.textContent = GG.t(awake ? "now.awake" : "now.asleep", awake ? "Probably awake and designing" : "Probably asleep — email still works");
      });
    }
    tick(); setInterval(tick, 20000); d.addEventListener("gg:lang", tick);
  })();

  /* ================= A7: case-study side index ================= */
  (function sideIndex() {
    if (!$(".cs-top")) return;
    var defs = [["Overview", ".cs-top"], ["Intro", ".intro"], ["The story", ".trio"], ["Work", ".panels"], ["Gallery", "#gallery"], ["Next", ".next-case"]];
    var items = [];
    defs.forEach(function (df) { var el = $(df[1]); if (el) items.push({ label: df[0], el: el }); });
    if (items.length < 3) return;
    var nav = d.createElement("nav"); nav.className = "cs-index"; nav.setAttribute("aria-label", "On this page");
    items.forEach(function (it, i) {
      var a = d.createElement("a"); a.href = "#"; a.innerHTML = "<span>" + it.label + "</span>"; it.a = a;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (i === 0) window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        else it.el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
      nav.appendChild(a);
    });
    d.body.appendChild(nav); root.classList.add("has-cs-index");
    var pend = false;
    function spy() {
      pend = false;
      var line = window.innerHeight * 0.4, active = 0;
      items.forEach(function (it, i) { if (it.el.getBoundingClientRect().top <= line) active = i; });
      items.forEach(function (it, i) { it.a.classList.toggle("is-active", i === active); if (i === active) it.a.setAttribute("aria-current", "true"); else it.a.removeAttribute("aria-current"); });
      var y = window.scrollY, end = y + window.innerHeight > d.documentElement.scrollHeight - 420;
      nav.classList.toggle("is-on", y > 240 && !end);
    }
    window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener("resize", spy); spy();
  })();
})();
