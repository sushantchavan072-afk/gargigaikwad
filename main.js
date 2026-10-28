/* Portfolio behaviour (one file, every page):
   scroll progress · nav hide/show · falling-tag physics · scroll-linked card media · footer eyes + name fit
   reveal-on-scroll · copy email · work filters · lens strip · draggable playground */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress bar, nav hide/show, card media drift ---------- */
  var bar = $(".progress"), nav = $("#nav"), lastY = window.scrollY || 0;
  var stack = $(".stack"), cards = $$(".card");
  var ticking = false;
  /* media strips drift on their own (ping-pong, eased), and scrolling nudges them further.
     They never pause, hover included. Only cards on screen are animated. */
  var onScreen = new Set(), SPEED = 38; /* px per second */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target); }); }, { rootMargin: "100px 0px" });
    cards.forEach(function (c) { io.observe(c); });
  } else { cards.forEach(function (c) { onScreen.add(c); }); }
  var t0 = performance.now();
  function drift(now) {
    if (!cards.length) return;
    var vh = window.innerHeight, sy = window.scrollY, t = ((now || performance.now()) - t0) / 1000;
    cards.forEach(function (card, i) {
      if (!onScreen.has(card)) return;
      var strip = $(".strip", card), track = $(".track", card);
      if (!strip || !track) return;
      var overflow = Math.max(0, track.scrollWidth - strip.clientWidth);
      if (!overflow) return;
      var sticky = getComputedStyle(card).position === "sticky";
      var h = card.offsetHeight;
      var nat = sticky ? stack.offsetTop + i * h : card.offsetTop;
      var p = clamp((sy - (nat - vh)) / (vh + h), 0, 1);
      var phase = reduce ? p : (t * SPEED / overflow) / 2 + i * 0.37 + p * 0.5;   /* one back-and-forth = overflow*2 / SPEED seconds */
      var tri = Math.abs(((phase % 1) + 1) % 1 * 2 - 1);                          /* 0..1..0 triangle */
      var e = 0.5 - 0.5 * Math.cos(Math.PI * tri);                                /* ease the turn-arounds */
      track.style.setProperty("--x", (-overflow * e).toFixed(1));
    });
  }
  if (!reduce) (function loop(now) { drift(now); requestAnimationFrame(loop); })();
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (nav) {
      if (y < 80) nav.classList.remove("hide");
      else if (y - lastY > 6) nav.classList.add("hide");
      else if (lastY - y > 6) nav.classList.remove("hide");
    }
    lastY = y;
    if (reduce) drift();
    ticking = false;
  }
  if (!document.body.classList.contains("pg")) {
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  /* ---------- footer eyes follow the cursor ---------- */
  var eyes = $$(".eye");
  if (eyes.length) {
    window.addEventListener("pointermove", function (e) {
      eyes.forEach(function (eye) {
        var r = eye.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, m = Math.min(11, d / 14);
        eye.firstElementChild.style.transform = "translate(" + (dx / d) * m * 0.8 + "px," + (dy / d) * m + "px)";
      });
    }, { passive: true });
  }

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
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
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
    var ROT = [-2.5, 2.2, -1.4, 3.5, -3];

    function layout() {
      var n = cards.length, mid = (n - 1) / 2;
      var m = /matrix\(([-\d.]+)/.exec(getComputedStyle(deck).transform), sc = m ? parseFloat(m[1]) || 1 : 1;
      var avail = Math.max(0, stage.clientWidth / sc - deck.offsetWidth - 150), step = n > 1 ? clamp(avail / (n - 1), 26, 104) : 0;
      cards.forEach(function (c, i) {
        c.style.zIndex = n - i;
        c.style.setProperty("--sx", (i * 5) + "px"); c.style.setProperty("--sy", (i * 5) + "px");
        c.style.setProperty("--sr", (ROT[i % ROT.length]) + "deg");
        c.style.setProperty("--fx", ((i - mid) * step).toFixed(1) + "px");
        c.style.setProperty("--fy", (Math.abs(i - mid) * 18).toFixed(1) + "px");
        c.style.setProperty("--fr", ((i - mid) * Math.min(5, 28 / Math.max(1, mid))).toFixed(2) + "deg");
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
      box.hidden = false; $(".kps-close", box).focus();
    }
    function close() { box.hidden = true; }

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
      cards = $$(".kps-card", deck); if (!cards.length) { root.style.display = "none"; return; }
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
      /* intro: the closed stack opens up into the fan once the page has loaded */
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
    var els = $$(".tag", box);
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
      measure(); buildWalls(); spawn(); render(); run();
    }
    // wait for fonts so tag sizes are correct, then start shortly after the heading begins to appear
    var go = function () { setTimeout(start, 450); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();

    window.addEventListener("resize", function () { if (!started) return; measure(); buildWalls(); });
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
    var hintText = $(".pg-hint-text", hint), mode = "pan", sticker = "✨", ink = $(".pg-ink", view), drawing = false, activeStroke = null;
    var gone = function () { if (hint) hint.classList.add("gone"); };
    var instruction = function (message) {
      if (hintText) hintText.textContent = message;
      if (hint) hint.classList.remove("gone");
    };
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
    var items = $$(".pg-item", view), original = items.map(function (it) {
      return { left: it.style.left, top: it.style.top, rotation: it.style.getPropertyValue("--r") };
    });
    var remix = $(".pg-remix"), reset = $(".pg-reset"), hideButton = $(".pg-hide"), marksHidden = false;
    if (remix) remix.addEventListener("click", function () {
      var slots = [], columns = 4, rows = Math.ceil(items.length / columns);
      for (var row = 0; row < rows; row++) for (var col = 0; col < columns; col++) {
        slots.push({ x: (col - (columns - 1) / 2) * window.innerWidth * .22 + (Math.random() - .5) * 42,
          y: (row - (rows - 1) / 2) * window.innerHeight * .26 + (Math.random() - .5) * 34 });
      }
      for (var i = slots.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), swap = slots[i]; slots[i] = slots[j]; slots[j] = swap;
      }
      items.forEach(function (it, i) {
        it.style.left = slots[i].x + "px"; it.style.top = slots[i].y + "px";
        it.style.setProperty("--r", (Math.random() * 10 - 5).toFixed(1) + "deg");
      });
      x = 0; y = 0; vx = vy = 0; cancelAnimationFrame(raf); render(); gone();
    });
    if (reset) reset.addEventListener("click", function () {
      items.forEach(function (it, i) {
        it.style.left = original[i].left; it.style.top = original[i].top;
        it.style.setProperty("--r", original[i].rotation);
      });
      x = y = vx = vy = 0; cancelAnimationFrame(raf); render(); gone();
    });
    if (hideButton) hideButton.addEventListener("click", function () {
      marksHidden = !marksHidden; canvas.classList.toggle("marks-hidden", marksHidden);
      hideButton.setAttribute("aria-pressed", marksHidden ? "true" : "false");
      hideButton.setAttribute("aria-label", marksHidden ? "Show stickers and doodles" : "Hide stickers and doodles");
      hideButton.title = marksHidden ? "Show stickers and doodles" : "Hide stickers and doodles";
    });
    var stickerButtons = $$(".pg-sticker");
    var doodleButton = $(".pg-doodle"), clearButton = $(".pg-clear");
    var setMode = function (next) {
      mode = next;
      view.classList.toggle("doodle-mode", mode === "doodle");
      view.classList.toggle("sticker-mode", mode === "sticker");
      if (doodleButton) { doodleButton.classList.toggle("active", mode === "doodle"); doodleButton.setAttribute("aria-pressed", mode === "doodle" ? "true" : "false"); }
      stickerButtons.forEach(function (button) {
        var active = mode === "sticker" && button.getAttribute("data-emoji") === sticker;
        button.classList.toggle("active", active); button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      instruction(mode === "doodle" ? "Draw on the board · tap Draw to move" : mode === "sticker" ? "Tap the board to stamp · tap again to move" : "Drag, draw or stamp");
    };
    stickerButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        var emoji = button.getAttribute("data-emoji"), next = mode === "sticker" && sticker === emoji ? "pan" : "sticker";
        sticker = emoji; setMode(next);
      });
    });
    if (doodleButton) doodleButton.addEventListener("click", function () { setMode(mode === "doodle" ? "pan" : "doodle"); });
    if (clearButton) clearButton.addEventListener("click", function () {
      if (ink) ink.replaceChildren(); $$(".pg-stamp", canvas).forEach(function (stamp) { stamp.remove(); });
      marksHidden = false; canvas.classList.remove("marks-hidden");
      if (hideButton) { hideButton.setAttribute("aria-pressed", "false"); hideButton.setAttribute("aria-label", "Hide stickers and doodles"); hideButton.title = "Hide stickers and doodles"; }
      gone();
    });
    var pointInCanvas = function (e) {
      var r = view.getBoundingClientRect();
      return { x: e.clientX - r.left - r.width / 2 - x, y: e.clientY - r.top - r.height / 2 - y };
    };
    var drawPoint = function (e, move) {
      var r = view.getBoundingClientRect(), p = { x: e.clientX - r.left - x, y: e.clientY - r.top - y };
      if (move) activeStroke.setAttribute("d", activeStroke.getAttribute("d") + " L" + p.x.toFixed(1) + " " + p.y.toFixed(1));
      else {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path"), colors = ["#ff6f91", "#168bff", "#f0a000", "#8b5cf6", "#20a47a"];
        path.setAttribute("d", "M" + p.x.toFixed(1) + " " + p.y.toFixed(1));
        path.setAttribute("stroke", colors[Math.floor(Math.random() * colors.length)]); path.setAttribute("stroke-width", "6");
        ink.appendChild(path); activeStroke = path;
      }
    };
    view.addEventListener("pointerdown", function (e) {
      if (mode === "pan") return;
      e.preventDefault(); e.stopImmediatePropagation(); view.setPointerCapture(e.pointerId); gone();
      if (mode === "sticker") {
        var p = pointInCanvas(e), stamp = document.createElement("span");
        stamp.className = "pg-stamp"; stamp.setAttribute("aria-hidden", "true"); stamp.textContent = sticker;
        stamp.style.left = p.x + "px"; stamp.style.top = p.y + "px"; stamp.style.zIndex = ++z;
        stamp.style.setProperty("--sr", (Math.random() * 30 - 15).toFixed(1) + "deg"); canvas.appendChild(stamp);
      } else { drawing = true; drawPoint(e, false); }
    }, true);
    view.addEventListener("pointermove", function (e) { if (drawing && activeStroke) drawPoint(e, true); }, true);
    var finishDraw = function () { drawing = false; activeStroke = null; };
    view.addEventListener("pointerup", finishDraw, true); view.addEventListener("pointercancel", finishDraw, true);
    var z = 10;
    items.forEach(function (it) {
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
  }
})();
