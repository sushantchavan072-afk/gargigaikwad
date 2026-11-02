/* compare.js — B4 before/after slider.  Markup (hidden automatically if either image is missing):
   <section class="cmp-section" data-optional>
     <div data-compare data-before="assets/x-sketch.jpg" data-after="assets/x.jpg" data-before-label="Pencil sketch" data-after-label="Final"></div>
   </section>
   Drag, click, or use ← → / Home / End on the handle. */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  Array.prototype.slice.call(document.querySelectorAll("[data-compare]")).forEach(function (root) {
    var holder = root.closest("[data-optional]") || root;
    function load(src) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src; }); }
    Promise.all([load(root.dataset.before), load(root.dataset.after)]).then(function (ims) {
      var b = ims[0], a = ims[1];
      root.classList.add("cmp"); root.style.aspectRatio = a.naturalWidth + " / " + a.naturalHeight; root.style.setProperty("--pos", "50%");
      root.innerHTML = '<img class="cmp-a" alt="' + (root.dataset.afterLabel || "After") + '" draggable="false" src="' + a.src + '">' +
        '<div class="cmp-b"><img alt="' + (root.dataset.beforeLabel || "Before") + '" draggable="false" src="' + b.src + '"></div>' +
        '<span class="cmp-tag cmp-tag-b">' + (root.dataset.beforeLabel || "Before") + '</span><span class="cmp-tag cmp-tag-a">' + (root.dataset.afterLabel || "After") + '</span>' +
        '<div class="cmp-handle" role="slider" tabindex="0" aria-label="Reveal ' + (root.dataset.beforeLabel || "before") + ' and ' + (root.dataset.afterLabel || "after") + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><span aria-hidden="true">↔</span></div>';
      var h = root.querySelector(".cmp-handle"), pos = 50, dragging = false;
      function set(p) { pos = Math.max(0, Math.min(100, p)); root.style.setProperty("--pos", pos + "%"); h.setAttribute("aria-valuenow", Math.round(pos)); }
      function fromEvent(e) { var r = root.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
      root.addEventListener("pointerdown", function (e) { dragging = true; root.setPointerCapture(e.pointerId); root.classList.add("is-drag"); fromEvent(e); });
      root.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
      var end = function () { dragging = false; root.classList.remove("is-drag"); };
      root.addEventListener("pointerup", end); root.addEventListener("pointercancel", end);
      h.addEventListener("keydown", function (e) {
        var k = e.key; if (k === "ArrowLeft") set(pos - 4); else if (k === "ArrowRight") set(pos + 4); else if (k === "Home") set(0); else if (k === "End") set(100); else return; e.preventDefault();
      });
      if (!reduce && "IntersectionObserver" in window) {                       /* one small hint sweep when it first scrolls into view */
        var io = new IntersectionObserver(function (en) {
          if (!en.some(function (x) { return x.isIntersecting; })) return; io.disconnect();
          var t0 = performance.now(); (function tick(t) { var k = (t - t0) / 1400; if (k >= 1 || dragging) { if (!dragging) set(50); return; } set(50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k)); requestAnimationFrame(tick); })(t0);
        }, { threshold: 0.6 }); io.observe(root);
      }
    }).catch(function () { holder.remove(); });
  });
})();
