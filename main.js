/* Portfolio behaviour (one file, every page):
   scroll progress · nav hide/show · falling-tag physics · scroll-linked card media · footer eyes + name fit
   reveal-on-scroll · copy email · work filters · lens strip · draggable playground */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- full-site interactive dot field ---------- */
  (function interactiveDots() {
    var canvas = document.createElement("canvas"), ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;
    canvas.id = "interactive-dots"; canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);
    var w = 0, h = 0, dpr = 1, px = -1000, py = -1000, raf = 0;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    function draw() {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      var dark = document.documentElement.dataset.theme === "dark", step = 25, radius = 148;
      for (var y = 12; y < h + step; y += step) for (var x = 12; x < w + step; x += step) {
        var dist = Math.hypot(x - px, y - py), near = Math.max(0, 1 - dist / radius);
        var size = .7 + near * 1.65, alpha = (dark ? .10 : .075) + near * .3;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = dark ? "rgba(244,244,245," + alpha + ")" : "rgba(24,24,27," + alpha + ")";
        ctx.fill();
      }
      raf = 0;
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
    window.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; px = e.clientX; py = e.clientY; schedule(); }, { passive: true });
    window.addEventListener("pointerdown", function (e) { if (e.pointerType !== "touch") return; px = e.clientX; py = e.clientY; schedule(); window.setTimeout(function () { px = py = -1000; schedule(); }, 900); }, { passive: true });
    window.addEventListener("pointerout", function (e) { if (!e.relatedTarget) { px = py = -1000; schedule(); } });
    window.addEventListener("resize", resize);
    window.addEventListener("gargi-themechange", schedule);
    resize();
  })();

  /* ---------- smooth direction-aware arrow cursor (fine pointers only) ---------- */
  (function smoothArrowCursor() {
    if (!window.matchMedia || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    var cursor = document.createElement("div");
    cursor.id = "smooth-arrow-cursor"; cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<svg viewBox="0 0 28 30"><path d="M2 1.5 4 27l7-8 5 9 4-2-5-9 10-1.5Z"/></svg>';
    document.body.appendChild(cursor);
    document.documentElement.classList.add("smooth-cursor-active");
    var tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, active = false, raf = 0;
    function move(e) { tx = e.clientX; ty = e.clientY; if (!active) { x = tx; y = ty; active = true; cursor.classList.add("visible"); } if (!raf) raf = requestAnimationFrame(step); }
    function step() {
      var dx = tx - x, dy = ty - y;
      if (reduce) { x = tx; y = ty; } else { x += dx * .24; y += dy * .24; }
      vx = dx; vy = dy;
      var angle = (Math.atan2(vy, vx) * 180 / Math.PI) + 132;
      cursor.style.transform = "translate3d(" + (x - 2) + "px," + (y - 2) + "px,0) rotate(" + angle + "deg)";
      if (Math.abs(dx) + Math.abs(dy) > .15) raf = requestAnimationFrame(step); else raf = 0;
    }
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", function (e) { cursor.classList.toggle("hover", !!e.target.closest("a,button,[role='button']")); });
    document.addEventListener("pointerout", function (e) { if (!e.relatedTarget) cursor.classList.remove("visible"); });
  })();

  /* ---------- footer eyes follow the pointer and blink ---------- */
  var footerEyes = $$(".footer-eyes");
  if (footerEyes.length) window.addEventListener("pointermove", function (e) {
    footerEyes.forEach(function (eyes) {
      var r = eyes.getBoundingClientRect();
      eyes.style.setProperty("--pupil-x", clamp((e.clientX - (r.left + r.width / 2)) / 22, -8, 8) + "px");
      eyes.style.setProperty("--pupil-y", clamp((e.clientY - (r.top + r.height / 2)) / 26, -5, 5) + "px");
    });
  }, { passive: true });

  /* ---------- Playground: unfoldable paper print and click-wheel iPod ---------- */
  (function playgroundExtras() {
    var paper = $("#paperReveal"), paperButton = paper && $(".paper-trigger", paper);
    if (paperButton) {
      paperButton.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
      paperButton.addEventListener("click", function () {
        var open = paper.classList.toggle("revealed");
        paperButton.setAttribute("aria-expanded", open ? "true" : "false");
        paperButton.setAttribute("aria-label", open ? "Crumple the photograph again" : "Unfold the crumpled paper photograph");
      });
    }

    var ipod = $("#ipodWidget"); if (!ipod) return;
    var names = ["Soft Focus", "Paper Planes", "Golden Hour", "Night Walk"];
    var patterns = [
      [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 440, 523.25],
      [392, 493.88, 587.33, 659.25, 587.33, 493.88, 440, 392],
      [440, 554.37, 659.25, 880, 659.25, 587.33, 493.88, 440],
      [349.23, 440, 523.25, 587.33, 523.25, 440, 392, 349.23]
    ];
    var selected = 0, playing = false, screen = "now-playing", step = 0, elapsed = 0;
    var audio = null, master = null, tuneTimer = 0, clockTimer = 0;
    var title = $("[data-ipod-title]", ipod), time = $("[data-ipod-time]", ipod), progress = $("[data-ipod-progress]", ipod), playButton = $("[data-ipod='play']", ipod);
    function drawPlayer() {
      ipod.dataset.screen = screen;
      title.textContent = names[selected];
      time.textContent = Math.floor(elapsed / 60) + ":" + ("0" + elapsed % 60).slice(-2);
      progress.style.width = clamp(elapsed / 120 * 100, 0, 100) + "%";
      playButton.textContent = playing ? "Ⅱ" : "▶︎";
      playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
      playButton.setAttribute("aria-pressed", playing ? "true" : "false");
      $$(".ipod-menu-list li", ipod).forEach(function (row, i) {
        row.classList.toggle("selected", i === selected); row.textContent = names[i];
      });
    }
    function audioEngine() {
      if (audio) return true;
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      audio = new AudioContext(); master = audio.createGain(); master.gain.value = .13; master.connect(audio.destination); return true;
    }
    function note(frequency, duration) {
      if (!audio || !master) return;
      var osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
      osc.type = "triangle"; osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.075, now + .035); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + duration + .02);
    }
    function tick() {
      var tune = patterns[selected]; note(tune[step % tune.length], .34);
      if (step % 4 === 0) note(tune[(step + 3) % tune.length] / 2, .56);
      step++;
    }
    function setPlaying(on) {
      if (on === playing) return;
      if (on) {
        if (!audioEngine()) return;
        audio.resume(); master.gain.setTargetAtTime(.13, audio.currentTime, .06); playing = true; tick(); tuneTimer = window.setInterval(tick, 420);
        clockTimer = window.setInterval(function () { elapsed = (elapsed + 1) % 120; drawPlayer(); }, 1000);
      } else {
        playing = false; window.clearInterval(tuneTimer); window.clearInterval(clockTimer);
        if (audio && master) master.gain.setTargetAtTime(.0001, audio.currentTime, .06);
      }
      drawPlayer();
    }
    function changeTrack(direction) { selected = (selected + direction + names.length) % names.length; step = 0; elapsed = 0; drawPlayer(); if (playing) tick(); }
    ipod.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    ipod.addEventListener("click", function (e) {
      var row = e.target.closest(".ipod-menu-list li");
      if (row) { selected = $$(".ipod-menu-list li", ipod).indexOf(row); screen = "now-playing"; elapsed = 0; drawPlayer(); return; }
      var control = e.target.closest("[data-ipod]"); if (!control) return;
      var action = control.getAttribute("data-ipod");
      if (action === "menu") { screen = screen === "menu" ? "now-playing" : "menu"; drawPlayer(); }
      else if (action === "previous") changeTrack(-1);
      else if (action === "next") changeTrack(1);
      else if (action === "play") setPlaying(!playing);
      else if (action === "select") {
        if (screen === "menu") { screen = "now-playing"; elapsed = 0; drawPlayer(); }
        else { screen = "menu"; drawPlayer(); }
      }
    });
    var wheel = $(".ipod-wheel", ipod), startAngle = null;
    wheel.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      try { wheel.setPointerCapture(e.pointerId); } catch (err) {}
      var r = wheel.getBoundingClientRect(); startAngle = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    });
    wheel.addEventListener("pointerup", function (e) {
      if (startAngle === null) return;
      var r = wheel.getBoundingClientRect(), end = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
      var delta = Math.atan2(Math.sin(end - startAngle), Math.cos(end - startAngle));
      if (Math.abs(delta) > .22) changeTrack(delta > 0 ? 1 : -1);
      startAngle = null;
    });
    wheel.addEventListener("pointercancel", function () { startAngle = null; });
    drawPlayer();
  })();

  /* ---------- persistent light/dark theme, toggled from the navbar smiley ---------- */
  var themeToggle = $(".nav-logo");
  if (themeToggle) {
    var themeAnimating = false;
    function playThemeReveal(nextTheme) {
      if (reduce) { syncTheme(nextTheme, true); themeAnimating = false; return; }
      var oldReveal = $(".theme-reveal"); if (oldReveal) oldReveal.remove();
      var rect = themeToggle.getBoundingClientRect(), ox = rect.left + rect.width / 2, oy = rect.top + rect.height / 2;
      var radius = Math.ceil(Math.max(Math.hypot(ox, oy), Math.hypot(window.innerWidth - ox, oy), Math.hypot(ox, window.innerHeight - oy), Math.hypot(window.innerWidth - ox, window.innerHeight - oy)) + 8);
      var overlay = document.createElement("div"); overlay.className = "theme-reveal"; overlay.setAttribute("aria-hidden", "true");
      overlay.style.background = nextTheme === "dark" ? "#111113" : "#fafafa";
      overlay.style.clipPath = "circle(0px at " + ox + "px " + oy + "px)";
      document.body.appendChild(overlay);
      var complete = false;
      function finish() {
        if (complete) return; complete = true; syncTheme(nextTheme, true);
        if (overlay.animate) {
          var fade = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: "ease-out", fill: "forwards" });
          var cleaned = false;
          function cleanup() { if (cleaned) return; cleaned = true; overlay.remove(); themeAnimating = false; }
          fade.onfinish = cleanup;
          window.setTimeout(cleanup, 380);
        } else { overlay.remove(); themeAnimating = false; }
      }
      if (overlay.animate) {
        var wipe = overlay.animate([{ clipPath: "circle(0px at " + ox + "px " + oy + "px)" }, { clipPath: "circle(" + radius + "px at " + ox + "px " + oy + "px)" }], { duration: 760, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });
        wipe.onfinish = finish;
      } else { overlay.style.clipPath = "circle(" + radius + "px at " + ox + "px " + oy + "px)"; window.setTimeout(finish, 800); }
      window.setTimeout(finish, 980);
    }
    function syncTheme(theme, persist) {
      if (theme === "dark") document.documentElement.dataset.theme = "dark";
      else delete document.documentElement.dataset.theme;
      var dark = theme === "dark", label = dark ? "Switch to light mode" : "Switch to dark mode";
      themeToggle.setAttribute("aria-label", label);
      themeToggle.setAttribute("title", label);
      themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
      var themeColor = $("meta[name='theme-color']");
      if (themeColor) themeColor.setAttribute("content", dark ? "#111113" : "#fafafa");
      window.dispatchEvent(new Event("gargi-themechange"));
      if (persist) try { localStorage.setItem("gargi-theme", dark ? "dark" : "light"); } catch (e) {}
    }
    syncTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);
    themeToggle.addEventListener("click", function () {
      if (themeAnimating) return;
      var previousTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      var nextTheme = previousTheme === "dark" ? "light" : "dark";
      themeAnimating = true;
      playThemeReveal(nextTheme);
    });
  }

  /* ---------- scroll progress bar, nav hide/show, card media drift ---------- */
  var bar = $(".progress"), nav = $("#nav"), lastY = window.scrollY || 0;
  var stack = $(".stack"), cards = $$(".card");
  var ticking = false;
  var lockScroll = function (on) { document.documentElement.style.overflow = on ? "hidden" : ""; };

  /* Card media strips glide on their own (slow, eased ping-pong); scrolling nudges them a little further.
     They never pause, hover included. Only on-screen cards are touched, and measurements are cached
     so the per-frame work is just one style write per visible card. */
  var SPEED = 24; /* px per second */
  var live = [];
  cards.forEach(function (card, i) {
    var strip = $(".strip", card), track = $(".track", card);
    if (strip && track) live.push({ card: card, strip: strip, track: track, i: i, on: false, overflow: 0, nat: 0, h: 0, sticky: false });
  });
  function measure() {
    live.forEach(function (c) {
      c.overflow = Math.max(0, c.track.scrollWidth - c.strip.clientWidth);
      c.sticky = getComputedStyle(c.card).position === "sticky"; c.h = c.card.offsetHeight;
      c.nat = c.sticky && stack ? stack.offsetTop + c.i * c.h : c.card.offsetTop;
    });
  }
  if (live.length && "IntersectionObserver" in window) {
    var cardIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { for (var k = 0; k < live.length; k++) if (live[k].card === e.target) live[k].on = e.isIntersecting; });
    }, { rootMargin: "120px 0px" });
    live.forEach(function (c) { cardIO.observe(c.card); });
  } else live.forEach(function (c) { c.on = true; });
  var t0 = performance.now(), lastMeasure = -9999;
  function drift(now) {
    now = now || performance.now();
    if (now - lastMeasure > 900) { measure(); lastMeasure = now; }      /* cheap re-measure: images/fonts/resize all settle here */
    var vh = window.innerHeight, sy = window.scrollY, t = (now - t0) / 1000;
    for (var k = 0; k < live.length; k++) {
      var c = live[k]; if (!c.on || !c.overflow) continue;
      var p = clamp((sy - (c.nat - vh)) / (vh + c.h), 0, 1);
      var phase = reduce ? p : (t * SPEED / c.overflow) / 2 + c.i * 0.37 + p * 0.35;   /* one back-and-forth = overflow*2 / SPEED seconds */
      var tri = Math.abs(((phase % 1) + 1) % 1 * 2 - 1);                                /* 0..1..0 */
      c.track.style.setProperty("--x", (-c.overflow * (0.5 - 0.5 * Math.cos(Math.PI * tri))).toFixed(1));
    }
  }
  if (live.length && !reduce) (function loop(now) { if (!document.hidden) drift(now); requestAnimationFrame(loop); })();
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (nav) {
      if (y < 80) nav.classList.remove("hide");
      else if (y - lastY > 6) nav.classList.add("hide");
      else if (lastY - y > 6) nav.classList.remove("hide");
    }
    lastY = y;
    if (reduce && live.length) { measure(); drift(); }
    ticking = false;
  }
  if (!document.body.classList.contains("pg")) {
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener("resize", function () { lastMeasure = -9999; onScroll(); });
    onScroll();
  }

  /* ---------- hero: once the words have risen, stop clipping so italic overhangs ("feel") are never cut ---------- */
  var h1 = $(".hero h1");
  if (h1) setTimeout(function () { h1.classList.add("done"); }, reduce ? 0 : 2300);

  /* ---------- fit the giant footer name to the container ---------- */
  var big = $(".bigname");
  function fit() {
    if (!big) return;
    var par = big.parentElement, cs = getComputedStyle(par);
    var avail = par.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    big.style.fontSize = "100px";
    var w = big.getBoundingClientRect().width || 1;
    big.style.fontSize = Math.min(260, (100 * avail) / w) + "px";
  }
  if (big) { fit(); window.addEventListener("resize", fit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); }

  /* ---------- reveal on scroll ---------- */
  var rv = $$("[data-reveal]");
  if ("IntersectionObserver" in window && rv.length) {
    var revealIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { revealIO.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* ---------- copy email ---------- */
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var txt = btn.getAttribute("data-copy"), label = btn.querySelector(".lbl");
      var done = function () { if (!label) return; var o = label.textContent; label.textContent = "Copied!"; setTimeout(function () { label.textContent = o; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
      else { var t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(t); done(); }
    });
  });

  /* ---------- work page filters ---------- */
  $$(".chip-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-f");
      $$(".chip-btn").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      $$("#wgrid .wcard").forEach(function (c) { c.classList.toggle("hidden", f !== "All" && c.getAttribute("data-cat") !== f); });
    });
  });

  /* ---------- drag the Work project rail with a mouse; touch uses native swipe ---------- */
  (function dragWorkRail() {
    var rail = $("#wgrid"); if (!rail) return;
    var drag = null, suppressClick = false;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, left: rail.scrollLeft, moved: false };
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) { drag.moved = true; rail.classList.add("dragging"); }
      if (drag.moved) { rail.scrollLeft = drag.left - dx; e.preventDefault(); }
    });
    function finish(e) {
      if (!drag || e.pointerId !== drag.id) return;
      suppressClick = drag.moved; drag = null; rail.classList.remove("dragging");
      if (rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
      if (suppressClick) setTimeout(function () { suppressClick = false; }, 0);
    }
    rail.addEventListener("pointerup", finish);
    rail.addEventListener("pointercancel", finish);
    rail.addEventListener("click", function (e) {
      if (!suppressClick) return;
      e.preventDefault(); e.stopPropagation(); suppressClick = false;
    }, true);
    rail.addEventListener("dragstart", function (e) { e.preventDefault(); });
  })();

  /* ---------- photo strip: hide the section until photos exist ---------- */
  var lens = $("#lens");
  if (lens) setTimeout(function () { if (!$(".lensfig", lens)) lens.style.display = "none"; }, 2500);

  /* ---------- project gallery: hide until extra photos exist ---------- */
  var gallery = $("#gallery");
  if (gallery) setTimeout(function () { if (!$(".gal .frame", gallery)) gallery.style.display = "none"; }, 2500);

  /* ============================================================
     ABOUT: kinetic photo stack. Drag the top card (throw it left/right),
     arrows, fan view, shuffle, tap a card to open it large.
     ============================================================ */
  (function kineticStack() {
    var root = $("#kps"); if (!root) return;
    var stage = $(".kps-stage", root), deck = $(".kps-deck", root), box = $(".kps-lightbox", root);
    var cards = [], mode = "stack", busy = false, drag = null, moved = false, hint = $(".kps-hint", root);
    var ROT = [12, 10, 6, 0, -5, -9, -12];

    function layout() {
      var n = cards.length, mid = (n - 1) / 2;
      var m = /matrix\(([-\d.]+)/.exec(getComputedStyle(deck).transform), sc = m ? parseFloat(m[1]) || 1 : 1;
      var maxSlot = Math.max(1, Math.ceil(n / 2));
      var angle = 12 * Math.PI / 180;
      var rotatedWidth = deck.offsetWidth * Math.cos(angle) + deck.offsetHeight * Math.sin(angle);
      var avail = Math.max(0, stage.clientWidth / sc - rotatedWidth - 32);
      var step = n > 1 ? clamp(avail / maxSlot, 0, 104) : 0;
      cards.forEach(function (c, i) {
        var slot = i === 0 ? 0 : Math.ceil(i / 2) * (i % 2 ? -1 : 1);
        c.style.zIndex = n - i;
        c.style.setProperty("--sx", (i * 5) + "px"); c.style.setProperty("--sy", (i * 5) + "px");
        c.style.setProperty("--sr", (ROT[i % ROT.length]) + "deg");
        c.style.setProperty("--fx", (slot * step).toFixed(1) + "px");
        c.style.setProperty("--fy", (Math.abs(slot) * 18).toFixed(1) + "px");
        c.style.setProperty("--fr", (slot * Math.min(5, 28 / Math.max(1, mid))).toFixed(2) + "deg");
        c.tabIndex = i === 0 || mode === "fan" ? 0 : -1;
        c.style.transform = "";
      });
    }
    function setMode(m) {
      mode = m; stage.classList.toggle("stack", m === "stack"); stage.classList.toggle("fan", m === "fan");
      $$("[data-mode]", root).forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-mode") === m); });
      if (hint) hint.textContent = m === "fan" ? "Tap a card to open it" : "Drag a card, tap to open";
      layout();
    }
    function rotate() { cards.push(cards.shift()); }
    function throwTop(dir, done) {
      if (busy || mode === "fan" || !cards.length) return;
      busy = true; var top = cards[0];
      top.classList.remove("dragging"); top.style.transform = "";
      top.classList.add("thrown-" + dir);
      setTimeout(function () {
        top.classList.remove("thrown-" + dir); rotate(); layout();
        top.classList.add("arrive"); setTimeout(function () { top.classList.remove("arrive"); }, 420);
        busy = false; if (done) done();
      }, 340);
    }
    function shuffle() {
      if (busy || cards.length < 2) return;
      var btn = $(".kps-shuffle", root); btn.disabled = true;
      var wait = mode === "fan" ? 430 : 0; setMode("stack");
      setTimeout(function () { throwTop("right", function () { setTimeout(function () { throwTop("left", function () { btn.disabled = false; }); }, 100); }); }, wait);
    }
    function open(c) {
      var img = $("img", box);
      img.src = c.getAttribute("data-src"); img.alt = c.getAttribute("data-title");
      $("figcaption b", box).textContent = c.getAttribute("data-title");
      $("figcaption span", box).textContent = c.getAttribute("data-place");
      $("figcaption em", box).textContent = c.getAttribute("data-year");
      box.hidden = false; lockScroll(true); $(".kps-close", box).focus();
    }
    function close() { box.hidden = true; lockScroll(false); }

    function down(e) {
      var c = e.target.closest(".kps-card"); if (!c || mode !== "stack" || busy || c !== cards[0]) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      c.setPointerCapture(e.pointerId); drag = { c: c, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; moved = false; c.classList.add("dragging");
    }
    function move(e) {
      if (!drag) return;
      drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y;
      if (Math.abs(drag.dx) + Math.abs(drag.dy) > 7) moved = true;
      drag.c.style.transform = "translate3d(" + drag.dx + "px," + drag.dy + "px,0) rotate(" + (drag.dx * 0.045) + "deg)";
    }
    function cancel() {
      if (!drag) return; var d = drag; drag = null; d.c.classList.remove("dragging"); d.c.style.transform = "";
    }
    function up() {
      if (!drag) return; var d = drag; drag = null; d.c.classList.remove("dragging");
      if (Math.abs(d.dx) > 92) throwTop(d.dx > 0 ? "right" : "left");
      else { d.c.style.transform = ""; if (!moved) open(d.c); }
    }

    function init() {
      cards = $$(".kps-card", deck);
      cards.slice(7).forEach(function (c) { c.remove(); });
      cards = cards.slice(0, 7);
      if (!cards.length) { root.style.display = "none"; return; }
      deck.addEventListener("pointerdown", down); deck.addEventListener("pointermove", move);
      deck.addEventListener("pointerup", up); deck.addEventListener("pointercancel", cancel);
      deck.addEventListener("click", function (e) { var c = e.target.closest(".kps-card"); if (c && mode === "fan") open(c); });
      deck.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); throwTop("right"); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); throwTop("left"); }
        else if ((e.key === "Enter" || e.key === " ") && mode === "stack" && e.target === cards[0]) { e.preventDefault(); open(cards[0]); }
      });
      $$("[data-mode]", root).forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); }); });
      $$("[data-dir]", root).forEach(function (b) { b.addEventListener("click", function () { throwTop(b.getAttribute("data-dir")); }); });
      $(".kps-shuffle", root).addEventListener("click", shuffle);
      $(".kps-close", box).addEventListener("click", close);
      box.addEventListener("click", function (e) { if (e.target === box) close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
      window.addEventListener("resize", layout);
      document.body.appendChild(box);                  /* lightbox lives on <body> so nothing can clip it */
      layout();
      /* Open the closed stack into a balanced fan once the images are ready. */
      if (reduce) { setMode("fan"); return; }
      setTimeout(function () {
        cards.forEach(function (c, i) { c.style.setProperty("--td", (i * 55) + "ms"); });
        setMode("fan");
        setTimeout(function () { cards.forEach(function (c) { c.style.removeProperty("--td"); }); }, 1100);
      }, 650);
    }
    // wait until every image has loaded or failed (failed optional cards remove themselves), then start
    if (document.readyState === "complete") init(); else window.addEventListener("load", init);
  })();

  /* ---------- Esc = back on detail pages ---------- */
  var backLink = $(".back");
  if (backLink) window.addEventListener("keydown", function (e) { if (e.key === "Escape") window.location.href = backLink.getAttribute("href"); });

  /* ============================================================
     HERO: tags fall in and pile up (Matter.js). Drag any tag.
     ============================================================ */
  (function tags() {
    var hero = $("#hero"), box = $("#tags");
    if (!hero || !box) return;
    var els = $$(".tag", box).filter(function (t) { return t.offsetWidth > 0; });   /* skip tags hidden on small screens */
    if (reduce || !window.Matter) { document.body.classList.add("no-physics"); return; }
    var M = Matter, Engine = M.Engine, Bodies = M.Bodies, Body = M.Body, Composite = M.Composite, Constraint = M.Constraint;
    var engine = Engine.create(); engine.gravity.y = 1.15;
    var floorY = 0, W = 0, H = 0, walls = [], items = [], drag = null, started = false, raf = 0, last = 0, acc = 0, visible = true;

    function measure() { var r = box.getBoundingClientRect(); W = r.width; H = r.height; }
    function buildWalls() {
      walls.forEach(function (w) { Composite.remove(engine.world, w); });
      var t = 300;
      /* floor = the bottom edge of the browser window on first load, so the pile rests right on it (over the 'Projects' label) */
      var floor = Math.min(H, window.innerHeight - (hero.getBoundingClientRect().top + window.scrollY)) - 2;
      floorY = floor;
      walls = [
        Bodies.rectangle(W / 2, floor + t / 2, W * 3, t, { isStatic: true, friction: 0.6 }),
        Bodies.rectangle(-t / 2, H / 2 - 600, t, H * 4, { isStatic: true }),
        Bodies.rectangle(W + t / 2, H / 2 - 600, t, H * 4, { isStatic: true })
      ];
      Composite.add(engine.world, walls);
      /* on resize, lift any tag that ended up under the new floor */
      items.forEach(function (it) {
        var lim = floorY - it.h;
        if (it.body.position.y > lim) { Body.setPosition(it.body, { x: Math.min(Math.max(it.body.position.x, it.w / 2), W - it.w / 2), y: lim }); Body.setVelocity(it.body, { x: 0, y: 0 }); }
      });
    }
    function spawn() {
      var small = W < 810;
      els.forEach(function (el, i) {
        var w = el.offsetWidth, h = el.offsetHeight, round = el.classList.contains("round");
        var x = W * (small ? 0.18 : 0.14) + Math.random() * W * (small ? 0.64 : 0.72);
        var y = -80 - i * (small ? 90 : 100) - Math.random() * 120;
        var opts = { restitution: 0.28, friction: 0.55, frictionAir: 0.012, density: 0.002, angle: (Math.random() - 0.5) * 1.6 };
        var body = round ? Bodies.circle(x, y, w / 2, opts) : Bodies.rectangle(x, y, w, h, Object.assign({ chamfer: { radius: h / 2 } }, opts));
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: 0 });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
        Composite.add(engine.world, body);
        items.push({ el: el, body: body, w: w, h: h });
      });
    }
    function render() {
      items.forEach(function (it) {
        var b = it.body;
        it.el.style.transform = "translate3d(" + (b.position.x - it.w / 2).toFixed(1) + "px," + (b.position.y - it.h / 2).toFixed(1) + "px,0) rotate(" + b.angle.toFixed(3) + "rad)";
        if (!it.el.classList.contains("on")) it.el.classList.add("on");
      });
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(48, t - (last || t)); last = t; acc += dt;
      var step = 1000 / 60, n = 0;
      while (acc >= step && n < 3) { Engine.update(engine, step); acc -= step; n++; }
      render();
    }
    function run() { if (!raf && visible && !document.hidden) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    function start() {
      if (started) return; started = true;
      measure(); buildWalls(); spawn(); render(); run(); hero.classList.add("pile");
    }
    // wait for fonts so tag sizes are correct, then start shortly after the heading begins to appear
    var go = function () { setTimeout(start, reduce ? 0 : 1100); };   /* let the headline finish rising first */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();

    var rz = 0; window.addEventListener("resize", function () { if (!started || rz) return; rz = requestAnimationFrame(function () { rz = 0; measure(); buildWalls(); }); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : run(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? run() : stop(); }).observe(hero);

    /* drag tags with a soft spring */
    box.addEventListener("pointerdown", function (e) {
      var el = e.target.closest(".tag"); if (!el || !started) return;
      var it = items.filter(function (i) { return i.el === el; })[0]; if (!it) return;
      var r = box.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      var c = Constraint.create({ pointA: { x: px, y: py }, bodyB: it.body, pointB: { x: px - it.body.position.x, y: py - it.body.position.y }, stiffness: 0.16, damping: 0.14, length: 0 });
      Composite.add(engine.world, c); drag = { c: c, el: el, r: r };
      el.classList.add("drag"); try { el.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault();
    });
    box.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var r = box.getBoundingClientRect();
      drag.c.pointA.x = e.clientX - r.left; drag.c.pointA.y = e.clientY - r.top;
    });
    var release = function () { if (!drag) return; Composite.remove(engine.world, drag.c); drag.el.classList.remove("drag"); drag = null; };
    box.addEventListener("pointerup", release); box.addEventListener("pointercancel", release);
  })();

  /* ============================================================
     PLAYGROUND: drag the canvas; every card can be moved on its own.
     A click (without dragging) opens the card.
     ============================================================ */
  var view = $(".pg-view");
  if (view) {
    var canvas = $(".pg-canvas", view), hint = $(".pg-hint");
    var x = 0, y = 0, vx = 0, vy = 0, dragging = false, lx = 0, ly = 0, raf = 0, W = 3200, H = 2200;
    var gone = function () { if (hint) hint.classList.add("gone"); };
    var render = function () {
      x = clamp(x, -W / 2, W / 2); y = clamp(y, -H / 2, H / 2);
      canvas.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      view.style.setProperty("--px", x + "px"); view.style.setProperty("--py", y + "px");
    };
    var glide = function () {
      if (dragging) return;
      x += vx; y += vy; vx *= 0.93; vy *= 0.93; render();
      if (Math.abs(vx) + Math.abs(vy) > 0.2) raf = requestAnimationFrame(glide);
    };
    var z = 10;
    $$(".pg-item", view).forEach(function (it) {
      var on = false, moved = 0, sx = 0, sy = 0, ox = 0, oy = 0;
      it.addEventListener("pointerdown", function (e) {
        e.stopPropagation(); on = true; moved = 0; sx = e.clientX; sy = e.clientY;
        ox = parseFloat(it.style.left) || 0; oy = parseFloat(it.style.top) || 0;
        it.style.zIndex = ++z; it.setPointerCapture(e.pointerId);
      });
      it.addEventListener("pointermove", function (e) {
        if (!on) return;
        var dx = e.clientX - sx, dy = e.clientY - sy; moved = Math.max(moved, Math.hypot(dx, dy));
        if (moved > 5) { it.classList.add("lift"); gone(); }
        if (moved > 5) { it.style.left = ox + dx + "px"; it.style.top = oy + dy + "px"; }
      });
      var end = function () { on = false; it.classList.remove("lift"); };
      it.addEventListener("pointerup", end); it.addEventListener("pointercancel", end);
      it.addEventListener("click", function (e) { if (moved > 5) { e.preventDefault(); moved = 0; } });
      it.addEventListener("dragstart", function (e) { e.preventDefault(); });
    });
    view.addEventListener("pointerdown", function (e) {
      if ((view.getAttribute("data-mode") || "move") !== "move") return;
      dragging = true; lx = e.clientX; ly = e.clientY; vx = vy = 0; cancelAnimationFrame(raf);
      view.classList.add("drag"); view.setPointerCapture(e.pointerId);
    });
    view.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      x += dx; y += dy; vx = dx; vy = dy; render(); gone();
    });
    var up = function () { if (!dragging) return; dragging = false; view.classList.remove("drag"); raf = requestAnimationFrame(glide); };
    view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);
    view.addEventListener("wheel", function (e) { e.preventDefault(); x -= e.deltaX; y -= e.deltaY; render(); gone(); }, { passive: false });
    window.addEventListener("keydown", function (e) {
      var k = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[e.key];
      if (k) { x += k[0]; y += k[1]; render(); gone(); }
    });
    window.addEventListener("resize", render);
    render();

    /* ============================================================
       PLAYGROUND TOYS: doodle pen (incl. rainbow), sticker stamps with
       googly eyes, confetti, and emote rain you can throw around.
       Doodles + stickers are remembered in this browser only.
       ============================================================ */
    (function toys() {
      var tb = $(".pg-toy"); if (!tb) return;
      var NS = "http://www.w3.org/2000/svg", INK = "#18181b";
      var ink = $("#pgInk"), layer = $("#pgStickers"), fx = $("#pgFx"), grid = $("#pgGrid"), hintEl = $("#pgHint");
      var rnd = function (a, b) { return a + Math.random() * (b - a); };
      var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
      var S = 'stroke="#18181b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
      var EMOTES = [
        ["smiley", '<circle cx="32" cy="32" r="26" fill="#fdcf00" ' + S + '/><ellipse cx="23" cy="26" rx="3" ry="4.5" fill="#18181b"/><ellipse cx="41" cy="26" rx="3" ry="4.5" fill="#18181b"/><path d="M19 38c3 8 8 10 13 10s10-2 13-10" fill="none" ' + S + '/>'],
        ["cool", '<circle cx="32" cy="32" r="26" fill="#fdcf00" ' + S + '/><path d="M12 24h40v6c0 5-4 8-9 8s-8-3-9-7h-4c-1 4-4 7-9 7s-9-3-9-8z" fill="#18181b"/><path d="M20 45c4 5 8 6 12 6s8-1 12-6" fill="none" ' + S + '/>'],
        ["tongue", '<circle cx="32" cy="32" r="26" fill="#ffd0e0" ' + S + '/><path d="M18 22l9 4-9 4" fill="none" ' + S + '/><circle cx="43" cy="27" r="3.4" fill="#18181b"/><path d="M20 39c8 6 16 6 24 0" fill="none" ' + S + '/><path d="M28 43v6c0 4 8 4 8 0v-8" fill="#ff6b8b" ' + S + '/>'],
        ["heart", '<path d="M32 55C9 39 5 26 11 18c6-8 17-6 21 3 4-9 15-11 21-3 6 8 2 21-21 37z" fill="#ff4d6d" ' + S + '/><path d="M18 22c2-3 6-3 8-1" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>'],
        ["star", '<path d="M32 5l8 18 19 2-14 13 4 19-17-10-17 10 4-19L5 25l19-2z" fill="#ff894a" ' + S + '/>'],
        ["flower", '<g ' + S + ' fill="#ffb3d1"><circle cx="32" cy="15" r="11"/><circle cx="48" cy="27" r="11"/><circle cx="42" cy="46" r="11"/><circle cx="22" cy="46" r="11"/><circle cx="16" cy="27" r="11"/></g><circle cx="32" cy="32" r="9" fill="#fdcf00" ' + S + '/>'],
        ["sparkle", '<path d="M32 4C34 22 42 30 60 32 42 34 34 42 32 60 30 42 22 34 4 32 22 30 30 22 32 4z" fill="#b79cff" ' + S + '/>'],
        ["eyes", '<g class="geye"><circle cx="19" cy="32" r="15" fill="#fff" ' + S + '/><circle class="pupil" cx="19" cy="32" r="6.5" fill="#18181b"/></g><g class="geye"><circle cx="45" cy="32" r="15" fill="#fff" ' + S + '/><circle class="pupil" cx="45" cy="32" r="6.5" fill="#18181b"/></g>'],
        ["bolt", '<path d="M38 3L13 36h16l-4 25 26-35H35z" fill="#fdcf00" ' + S + '/>'],
        ["cloud", '<path d="M18 48a12 12 0 0 1-1-24 15 15 0 0 1 29 3 10 10 0 0 1 0 21z" fill="#a3d9ff" ' + S + '/><circle cx="26" cy="36" r="2.3" fill="#18181b"/><circle cx="38" cy="36" r="2.3" fill="#18181b"/><path d="M28 42c3 3 5 3 8 0" fill="none" ' + S + '/>'],
        ["sun", '<g stroke="#18181b" stroke-width="3" stroke-linecap="round"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M52 12l-6 6M18 46l-6 6"/></g><circle cx="32" cy="32" r="13" fill="#fdcf00" ' + S + '/>'],
        ["crown", '<path d="M8 48L5 20l15 13 12-19 12 19 15-13-3 28z" fill="#fdcf00" ' + S + '/><circle cx="32" cy="38" r="3.2" fill="#ff4d6d"/><circle cx="18" cy="40" r="2.4" fill="#5b6ee1"/><circle cx="46" cy="40" r="2.4" fill="#5adba5"/>'],
        ["woah", '<path d="M8 12h48a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H30l-12 12v-12H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" fill="#fff" ' + S + '/><text x="32" y="35" text-anchor="middle" font-family="Geist Mono,monospace" font-weight="700" font-size="17" fill="#18181b">woah!</text>'],
        ["squiggle", '<path d="M5 34c5-18 11-18 14 0s9 18 14 0 9-18 14 0 6 10 12 4" fill="none" stroke="#5b6ee1" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'],
        ["spiral", '<path d="M32 32c0-4 6-4 6 0 0 8-12 8-12 0 0-12 18-12 18 0 0 16-24 16-24 0 0-20 30-20 30 0" fill="none" stroke="#ff6a13" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'],
        ["arrow", '<path d="M8 46C18 14 42 12 54 34" fill="none" ' + S + '/><path d="M44 33l11 2-3-11" fill="none" ' + S + '/>'],
        ["scribble", '<path d="M5 42c10-12 14 6 24-4s16-12 30-2" fill="none" stroke="#fdcf00" stroke-width="7" stroke-linecap="round"/><path d="M8 52c14-4 30-4 48 0" fill="none" stroke="#18181b" stroke-width="3" stroke-linecap="round"/>']
      ];
      var BY = {}; EMOTES.forEach(function (e) { BY[e[0]] = e[1]; });
      var svgOf = function (k) { return '<svg viewBox="0 0 64 64" aria-hidden="true">' + (BY[k] || BY.smiley) + "</svg>"; };
      var CONF = ["#fdcf00", "#ff6a13", "#ff4d6d", "#5b6ee1", "#22b07d", "#b79cff", "#a3d9ff"];

      /* ---- state ---- */
      var mode = "move", color = "#18181b", size = 8, stampKind = "smiley";
      var hist = [], store = { ink: [], stk: [] }, KEY = "gg-playground-v1";
      var vwc = function (e) { var r = view.getBoundingClientRect(); return [e.clientX - r.width / 2 - x, e.clientY - r.height / 2 - y]; };

      /* ---- sticker tray ---- */
      EMOTES.forEach(function (e) {
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-k", e[0]); b.setAttribute("aria-label", e[0]);
        b.innerHTML = svgOf(e[0]); if (e[0] === stampKind) b.className = "on"; grid.appendChild(b);
      });

      /* ---- persistence (safe: only plain numbers/strings are ever read back) ---- */
      function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (err) {} }
      function load() {
        var raw = null; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) {}
        if (!raw) return;
        (raw.ink || []).slice(0, 200).forEach(function (s) { if (s && typeof s.c === "string" && Array.isArray(s.p) && s.p.length) buildStroke(s, true); });
        (raw.stk || []).slice(0, 300).forEach(function (s) { if (s && BY[s.k] && isFinite(s.x) && isFinite(s.y)) addSticker(s.k, +s.x, +s.y, +s.r || 0, +s.s || 1, false, true); });
      }

      /* ---- pen ---- */
      var pathD = function (p) {
        if (p.length < 2) return "M" + p[0][0] + " " + p[0][1] + "l.1 0";
        var d = "M" + p[0][0] + " " + p[0][1];
        for (var i = 1; i < p.length - 1; i++) d += "Q" + p[i][0] + " " + p[i][1] + " " + (p[i][0] + p[i + 1][0]) / 2 + " " + (p[i][1] + p[i + 1][1]) / 2;
        var l = p[p.length - 1]; return d + "L" + l[0] + " " + l[1];
      };
      var seg = function (g, a, b, w, hue) {
        var el = document.createElementNS(NS, "path"); el.setAttribute("d", "M" + a[0] + " " + a[1] + "L" + b[0] + " " + b[1]);
        el.setAttribute("stroke", "hsl(" + hue % 360 + ",92%,58%)"); el.setAttribute("stroke-width", w); g.appendChild(el);
      };
      function buildStroke(s, restore) {
        var g = document.createElementNS(NS, "g"); g.setAttribute("class", "stroke"); g.setAttribute("fill", "none");
        g.setAttribute("stroke-linecap", "round"); g.setAttribute("stroke-linejoin", "round");
        var w = clamp(+s.w || 8, 2, 40), pts = s.p.map(function (q) { return [+q[0] || 0, +q[1] || 0]; });
        if (s.c === "rainbow") {
          if (pts.length < 2) seg(g, pts[0], [pts[0][0] + .1, pts[0][1]], w, 0);
          for (var i = 1; i < pts.length; i++) seg(g, pts[i - 1], pts[i], w, i * 9);
        } else {
          var path = document.createElementNS(NS, "path"); path.setAttribute("d", pathD(pts));
          path.setAttribute("stroke", /^#[0-9a-f]{6}$/i.test(s.c) ? s.c : INK); path.setAttribute("stroke-width", w); g.appendChild(path);
        }
        ink.appendChild(g); if (restore) { hist.push({ type: "ink", el: g, data: s }); store.ink.push(s); } return g;
      }
      var cur = null;
      function penDown(e) {
        var p = vwc(e); cur = { c: color, w: size, p: [p] };
        var g = document.createElementNS(NS, "g"); g.setAttribute("fill", "none"); g.setAttribute("stroke-linecap", "round"); g.setAttribute("stroke-linejoin", "round");
        cur.g = g;
        if (color === "rainbow") seg(g, p, [p[0] + .1, p[1]], size, 0);
        else { var path = document.createElementNS(NS, "path"); path.setAttribute("stroke", color); path.setAttribute("stroke-width", size); path.setAttribute("d", pathD([p])); g.appendChild(path); cur.path = path; }
        ink.appendChild(g); view.setPointerCapture(e.pointerId); gone();
      }
      function penMove(e) {
        if (!cur) return; var p = vwc(e), l = cur.p[cur.p.length - 1];
        if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 2.5) return;
        cur.p.push(p);
        if (cur.c === "rainbow") seg(cur.g, l, p, cur.w, (cur.p.length - 1) * 9); else cur.path.setAttribute("d", pathD(cur.p));
      }
      function penUp() {
        if (!cur) return; var s = { c: cur.c, w: cur.w, p: cur.p.map(function (q) { return [Math.round(q[0]), Math.round(q[1])]; }) };
        hist.push({ type: "ink", el: cur.g, data: s }); store.ink.push(s);
        var n = 0, i = store.ink.length; while (i-- > 0) { n += store.ink[i].p.length; if (n > 9000) { store.ink.splice(0, i + 1); break; } }
        cur = null; save();
      }

      /* ---- stickers + confetti ---- */
      function burst(cx, cy, n) {
        for (var i = 0; i < (n || 12); i++) (function () {
          var p = document.createElement("i"), a = rnd(0, 6.283), d = rnd(36, 110), s = rnd(6, 12);
          p.className = "pg-conf"; p.style.cssText = "left:" + cx + "px;top:" + cy + "px;width:" + s + "px;height:" + s + "px;background:" + pick(CONF) + ";border-radius:" + (Math.random() < .5 ? "50%" : "2px");
          fx.appendChild(p);
          var an = p.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(calc(-50% + " + Math.cos(a) * d + "px),calc(-50% + " + (Math.sin(a) * d + 24) + "px)) rotate(" + rnd(-260, 260) + "deg) scale(.3)", opacity: 0 }], { duration: rnd(550, 950), easing: "cubic-bezier(.15,.75,.3,1)" });
          an.onfinish = function () { p.remove(); };
        })();
      }
      function addSticker(k, wx, wy, r, s, pop, restore) {
        var el = document.createElement("div"); el.className = "pg-sticker" + (pop ? " pop" : ""); el.setAttribute("data-k", k);
        el.style.left = wx + "px"; el.style.top = wy + "px"; el.style.setProperty("--r", r + "deg"); el.style.setProperty("--s", s);
        el.innerHTML = svgOf(k); layer.appendChild(el);
        var rec = { k: k, x: wx, y: wy, r: r, s: s }; store.stk.push(rec); hist.push({ type: "stk", el: el, rec: rec });
        el._rec = rec; return el;
      }
      var lastStamp = null, stamping = false;
      function stampAt(e) {
        var p = vwc(e); addSticker(stampKind, Math.round(p[0]), Math.round(p[1]), Math.round(rnd(-16, 16)), +rnd(.85, 1.3).toFixed(2), true);
        burst(e.clientX, e.clientY, 10); lastStamp = [e.clientX, e.clientY]; save();
      }
      function undo() {
        var h = hist.pop(); if (!h) return;
        if (h.type === "ink") { h.el.remove(); var i = store.ink.indexOf(h.data); if (i > -1) store.ink.splice(i, 1); }
        else { h.el.remove(); var j = store.stk.indexOf(h.rec); if (j > -1) store.stk.splice(j, 1); }
        save();
      }
      function clearAll() {
        while (ink.firstChild) ink.removeChild(ink.firstChild); layer.innerHTML = ""; hist = []; store = { ink: [], stk: [] }; save(); stopRain();
      }

      /* ---- drag stickers in Move mode (tap = boing, double-tap = pop away) ---- */
      layer.addEventListener("pointerdown", function (e) {
        var el = e.target.closest(".pg-sticker"); if (!el || mode !== "move") return;
        e.stopPropagation(); var rec = el._rec, sx = e.clientX, sy = e.clientY, ox = rec.x, oy = rec.y, moved = 0;
        el.setPointerCapture(e.pointerId); el.classList.add("lift"); el.style.zIndex = ++z;
        var mv = function (ev) { var dx = ev.clientX - sx, dy = ev.clientY - sy; moved = Math.max(moved, Math.hypot(dx, dy)); if (moved > 4) { rec.x = ox + dx; rec.y = oy + dy; el.style.left = rec.x + "px"; el.style.top = rec.y + "px"; } };
        var upf = function (ev) {
          el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", upf); el.removeEventListener("pointercancel", upf); el.classList.remove("lift");
          if (moved <= 4) { el.classList.remove("boing"); void el.offsetWidth; el.classList.add("boing"); burst(ev.clientX, ev.clientY, 6); } else { rec.x = Math.round(rec.x); rec.y = Math.round(rec.y); save(); }
        };
        el.addEventListener("pointermove", mv); el.addEventListener("pointerup", upf); el.addEventListener("pointercancel", upf);
      });
      layer.addEventListener("dblclick", function (e) {
        var el = e.target.closest(".pg-sticker"); if (!el) return;
        var i = hist.findIndex(function (h) { return h.el === el; }); if (i > -1) { var h = hist.splice(i, 1)[0]; var j = store.stk.indexOf(h.rec); if (j > -1) store.stk.splice(j, 1); }
        burst(e.clientX, e.clientY, 14); el.classList.add("out"); setTimeout(function () { el.remove(); }, 220); save();
      });

      /* googly eyes follow the pointer, wherever the eyes are (placed or raining) */
      window.addEventListener("pointermove", function (e) {
        var ps = document.querySelectorAll(".pupil"); if (!ps.length) return;
        for (var i = 0; i < ps.length; i++) {
          var p = ps[i], w = p.previousElementSibling, r = w.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, m = Math.min(7, d / 12);
          p.style.transform = "translate(" + dx / d * m + "px," + dy / d * m + "px)";
        }
      }, { passive: true });

      /* ---- view pointer routing by mode ---- */
      view.addEventListener("pointerdown", function (e) {
        if (mode !== "move") e.preventDefault();
        if (mode === "pen") penDown(e);
        else if (mode === "stamp") { stamping = true; view.setPointerCapture(e.pointerId); gone(); stampAt(e); }
      });
      view.addEventListener("pointermove", function (e) {
        if (mode === "pen") penMove(e);
        else if (mode === "stamp") {
          ghost(e);
          if (stamping && lastStamp && Math.hypot(e.clientX - lastStamp[0], e.clientY - lastStamp[1]) > 78) stampAt(e);
        }
      });
      var endTool = function () { if (mode === "pen") penUp(); stamping = false; };
      view.addEventListener("pointerup", endTool); view.addEventListener("pointercancel", endTool);
      view.addEventListener("pointerleave", function () { if (gh) gh.style.opacity = 0; });

      /* a little preview of the chosen sticker follows the mouse in stamp mode */
      var gh = document.createElement("div"); gh.className = "pg-ghost"; fx.appendChild(gh);
      function ghost(e) { if (e.pointerType === "touch") return; gh.style.opacity = .55; gh.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%)"; }
      function paintGhost() { gh.innerHTML = svgOf(stampKind); }

      /* ---- emote rain (physics) ---- */
      var rain = null;
      function stopRain() {
        if (!rain) return; cancelAnimationFrame(rain.raf); clearTimeout(rain.t1); clearTimeout(rain.t2); rain.timers.forEach(clearTimeout);
        rain.items.forEach(function (it) { it.el.remove(); }); rain = null; setBtn("rain", false);
      }
      function startRain() {
        if (!window.Matter) return; stopRain();
        var M = Matter, Engine = M.Engine, Bodies = M.Bodies, Body = M.Body, Composite = M.Composite, Constraint = M.Constraint;
        var eng = Engine.create(); eng.gravity.y = 1.05;
        var w = window.innerWidth, h = window.innerHeight, floor = h - 92, small = w < 700, t = 400;
        Composite.add(eng.world, [Bodies.rectangle(w / 2, floor + t / 2, w * 3, t, { isStatic: true, friction: .5 }), Bodies.rectangle(-t / 2, h / 2, t, h * 4, { isStatic: true }), Bodies.rectangle(w + t / 2, h / 2, t, h * 4, { isStatic: true })]);
        rain = { eng: eng, items: [], timers: [], raf: 0, last: 0, acc: 0 };
        var N = small ? 26 : 44;
        for (var i = 0; i < N; i++) rain.timers.push(setTimeout(function () {
          if (!rain) return;
          var k = pick(EMOTES.slice(0, 13))[0], sz = rnd(small ? 46 : 54, small ? 66 : 84), el = document.createElement("div");
          el.className = "pg-rain"; el.style.width = el.style.height = sz + "px"; el.innerHTML = svgOf(k); fx.appendChild(el);
          var b = Bodies.circle(rnd(sz, w - sz), -sz, sz * .46, { restitution: .55, friction: .25, frictionAir: .004, density: .002, angle: rnd(-1, 1) });
          Body.setAngularVelocity(b, rnd(-.1, .1)); Composite.add(eng.world, b);
          var it = { el: el, b: b, sz: sz }; rain.items.push(it);
          var cons = null;
          el.addEventListener("pointerdown", function (e) {
            e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add("lift");
            cons = Constraint.create({ pointA: { x: e.clientX, y: e.clientY }, bodyB: b, pointB: { x: e.clientX - b.position.x, y: e.clientY - b.position.y }, stiffness: .14, damping: .12, length: 0 });
            Composite.add(eng.world, cons);
          });
          el.addEventListener("pointermove", function (e) { if (cons) { cons.pointA.x = e.clientX; cons.pointA.y = e.clientY; } });
          var rel = function () { if (cons) { Composite.remove(eng.world, cons); cons = null; } el.classList.remove("lift"); };
          el.addEventListener("pointerup", rel); el.addEventListener("pointercancel", rel);
        }, i * 110));
        var step = function (tm) {
          if (!rain) return; rain.raf = requestAnimationFrame(step);
          var dt = Math.min(48, tm - (rain.last || tm)); rain.last = tm; rain.acc += dt; var n = 0;
          while (rain.acc >= 1000 / 60 && n < 3) { Engine.update(eng, 1000 / 60); rain.acc -= 1000 / 60; n++; }
          rain.items.forEach(function (it) { it.el.style.transform = "translate3d(" + (it.b.position.x - it.sz / 2).toFixed(1) + "px," + (it.b.position.y - it.sz / 2).toFixed(1) + "px,0) rotate(" + it.b.angle.toFixed(3) + "rad)"; });
        };
        rain.raf = requestAnimationFrame(step); setBtn("rain", true);
        rain.t1 = setTimeout(function () { if (rain) rain.items.forEach(function (it) { it.el.classList.add("fade"); }); }, 24000);
        rain.t2 = setTimeout(stopRain, 25000);
      }

      /* ---- toolbar ---- */
      var pops = { pen: $("#popPen"), stamp: $("#popStk") };
      function setBtn(name, on) { var b = $('[data-act="' + name + '"],[data-tool="' + name + '"]', tb); if (b) b.setAttribute("aria-pressed", on ? "true" : "false"); }
      function openPop(name) { Object.keys(pops).forEach(function (k) { pops[k].classList.toggle("on", k === name); }); }
      function setMode(m) {
        mode = m; view.setAttribute("data-mode", m);
        ["move", "pen", "stamp"].forEach(function (k) { setBtn(k, k === m); });
        if (m !== "stamp") gh.style.opacity = 0; if (m === "stamp") paintGhost();
        if (hintEl) $("span", hintEl).textContent = m === "pen" ? "Draw anywhere, even over the cards" : m === "stamp" ? "Tap to stamp, drag to scatter a trail" : "Drag to move around. Try the pen, stickers and rain below";
      }
      tb.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-tool")) {
          var t = b.getAttribute("data-tool");
          if (t === "move") { setMode("move"); openPop(null); }
          else if (mode === t) openPop(pops[t].classList.contains("on") ? null : t);
          else { setMode(t); openPop(t); }
        } else if (b.hasAttribute("data-act")) {
          var a = b.getAttribute("data-act");
          if (a === "undo") undo(); else if (a === "clear") { if (!hist.length && !rain || window.confirm("Clear all doodles and stickers?")) clearAll(); }
          else if (a === "rain") { if (rain) stopRain(); else { openPop(null); startRain(); } }
        } else if (b.hasAttribute("data-c")) {
          color = b.getAttribute("data-c"); $$(".sw", tb).forEach(function (s) { s.classList.toggle("on", s === b); });
        } else if (b.hasAttribute("data-w")) {
          size = +b.getAttribute("data-w"); $$("[data-w]", tb).forEach(function (s) { s.classList.toggle("on", s === b); });
        } else if (b.hasAttribute("data-k")) {
          stampKind = b.getAttribute("data-k"); $$("#pgGrid button").forEach(function (s) { s.classList.toggle("on", s === b); }); paintGhost(); openPop(null);
        }
      });
      document.addEventListener("pointerdown", function (e) { if (!tb.contains(e.target)) openPop(null); });
      window.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { setMode("move"); openPop(null); stopRain(); }
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      });
      setMode("move"); load();
    })();

  }
})();
