/* scrub.js — C1 scroll-scrub film (Anjana page). A tall section; a sticky video whose currentTime follows scroll progress.
   Source: data-src (default assets/anjana-film-five-seconds.webm), falls back to the same name with .mp4. Neither loads → section removed.
   Tip: encode with a keyframe on every frame so scrubbing is smooth:  ffmpeg -i in.mov -an -g 1 -c:v libvpx-vp9 -b:v 1500k out.webm
   Reduced motion: plain video with controls (no scroll hijack). */
(function () {
  "use strict";
  var sec = document.querySelector("[data-scrub]");
  if (!sec) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var base = (sec.getAttribute("data-src") || "assets/anjana-film-five-seconds.webm"), cands = [base, base.replace(/\.webm$/, ".mp4")].filter(function (v, i, a) { return a.indexOf(v) === i; });
  var stick = sec.querySelector(".sc-stick"), bar = sec.querySelector(".sc-bar i"), hint = sec.querySelector(".sc-hint");
  var v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-label", "Anjana, five-second excerpt of the film");
  var target = 0, shown = 0, raf = 0, dur = 0;

  function tryLoad(i) {
    if (i >= cands.length) { sec.remove(); return; }
    var onOk = function () { v.removeEventListener("error", onBad); if (!v.duration || !isFinite(v.duration)) return onBad(); start(); };
    var onBad = function () { v.removeEventListener("loadedmetadata", onOk); v.removeEventListener("error", onBad); tryLoad(i + 1); };
    v.addEventListener("loadedmetadata", onOk, { once: true }); v.addEventListener("error", onBad, { once: true });
    v.src = cands[i]; v.load();
  }
  function progress() { var r = sec.getBoundingClientRect(), total = r.height - innerHeight; return total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 0; }
  function tick() {
    raf = 0; shown += (target - shown) * (reduce ? 1 : 0.18);
    if (Math.abs(target - shown) < 0.0005) shown = target;
    if (v.readyState >= 2 && Math.abs(v.currentTime - shown * dur) > 0.01) v.currentTime = shown * dur;
    bar.style.transform = "scaleX(" + shown.toFixed(4) + ")";
    if (hint) hint.classList.toggle("is-gone", target > 0.02);
    if (shown !== target) raf = requestAnimationFrame(tick);
  }
  function onScroll() { target = progress(); if (!raf) raf = requestAnimationFrame(tick); }
  function start() {
    dur = v.duration; stick.insertBefore(v, stick.firstChild); sec.hidden = false;
    if (reduce) { sec.classList.add("is-plain"); v.controls = true; v.muted = false; v.removeAttribute("muted"); return; }
    sec.style.height = Math.round(100 + Math.min(8, dur) * 50) + "vh";            /* ≈ 50vh of scrolling per second of film */
    addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); onScroll();
  }
  tryLoad(0);
})();
