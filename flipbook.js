/* PDF page images retain their original order and proportions.
   Desktop: animated spreads. Mobile: swipe between full pages.
   Each publication keeps its original PDF link as a no-JavaScript fallback. */
(function () {
  "use strict";
  document.querySelectorAll(".publication-pdf").forEach(function (details) {
    details.addEventListener("toggle", function () {
      var frame = details.querySelector("iframe[data-pdf-src]");
      if (details.open && frame && !frame.hasAttribute("src")) frame.src = frame.dataset.pdfSrc;
    });
  });
  document.querySelectorAll("[data-flipbooks]").forEach(function (wrap, wrapIndex) {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var books = Array.prototype.slice.call(wrap.querySelectorAll("[data-flipbook]"));

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function manifest(b) {
    var src = b.getAttribute("data-src").replace(/\/$/, "");
    return fetch(src + "/pages.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (!j || !j.pages || !j.pages.length) throw 0;
      return { el: b, title: b.getAttribute("data-title") || "Booklet", pdf: b.getAttribute("data-pdf") || "", pages: j.pages.map(function (p) { return src + "/" + p; }) };
    });
  }

  function mount(info) {
    var host = info.el, pages = info.pages.slice();
    var total = pages.length;
    if (pages.length % 2) pages.push(null);
    var n = pages.length, leaves = n / 2, cur = 0, mode = "", ratio = 0.707, drag = null;
    host.innerHTML = ""; host.classList.add("fb"); host.setAttribute("role", "region"); host.setAttribute("aria-roledescription", "book"); host.setAttribute("aria-label", info.title); host.tabIndex = 0;
    var view = el("div", "fb-view"), bar = el("div", "fb-bar");
    var prev = el("button", "fb-btn", "←"), next = el("button", "fb-btn", "→"), label = el("span", "fb-label"); label.setAttribute("aria-live", "polite");
    prev.type = next.type = "button"; prev.setAttribute("aria-label", "Previous pages"); next.setAttribute("aria-label", "Next pages");
    bar.appendChild(prev); bar.appendChild(label); bar.appendChild(next);
    if (info.pdf) { var a = el("a", "fb-pdf", "PDF ↗"); a.href = info.pdf; a.target = "_blank"; a.rel = "noopener"; bar.appendChild(a); }
    host.appendChild(view); host.appendChild(bar);
    var tools = el("div", "fb-tools"), pickerLabel = el("label", "fb-picker", "Go to page "), picker = el("select"), zoom = el("button", "fb-zoom", "Enlarge page"), zoomImage = new Image();
    picker.setAttribute("aria-label", "Page in " + info.title);
    for (var page = 1; page <= total; page++) { var option = el("option", "", String(page)); option.value = page - 1; picker.appendChild(option); }
    pickerLabel.appendChild(picker); tools.appendChild(pickerLabel);
    zoom.type = "button"; zoom.setAttribute("data-enlarge", ""); zoomImage.hidden = true; zoom.appendChild(zoomImage); tools.appendChild(zoom); host.appendChild(tools);
    function selectPage(index) { picker.value = index; zoomImage.src = pages[index]; zoomImage.alt = "Page " + (index + 1) + " of " + info.title; }

    var book, leafEls = [], strip, loaded = {};
    function img(i) { var im = new Image(); im.alt = "Page " + (i + 1) + " of " + info.title; im.draggable = false; im.decoding = "async"; im.loading = "lazy"; im.dataset.i = i; return im; }
    function load(i) { if (i < 0 || i >= n || !pages[i] || loaded[i]) return; loaded[i] = 1; var im = host.querySelector('img[data-i="' + i + '"]'); if (im) im.src = pages[i]; }
    function loadAround() { if (mode === "book") for (var k = cur - 2; k <= cur + 2; k++) { load(2 * k - 1); load(2 * k); load(2 * k + 1); } else for (var j = 0; j < n; j++) load(j); }

    function sizeBook() {
      var avail = host.clientWidth, spread = Math.min(avail, 1000), pw = Math.floor(spread / 2), ph = Math.round(pw / ratio);
      var maxH = Math.max(320, window.innerHeight * 0.78);
      if (ph > maxH) { ph = Math.round(maxH); pw = Math.round(ph * ratio); }
      book.style.width = pw * 2 + "px"; book.style.height = ph + "px"; book.style.setProperty("--pw", pw + "px");
      view.style.height = ph + 36 + "px"; render();
    }
    function render() {
      if (mode === "book") {
        leafEls.forEach(function (lf, i) { var f = i < cur; lf.classList.toggle("is-flipped", f); if (!lf.classList.contains("is-turning")) lf.style.zIndex = f ? i + 1 : leaves - i; });
        var pw = parseFloat(book.style.getPropertyValue("--pw")) || 0;
        book.style.transform = "translateX(" + (cur === 0 ? -pw / 2 : cur === leaves ? pw / 2 : 0) + "px)";
        label.textContent = cur === 0 ? "Cover · " + total + " pages" : cur === leaves ? "Page " + total + " of " + total : "Pages " + (2 * cur) + "–" + Math.min(2 * cur + 1,total) + " of " + total;
        prev.disabled = cur === 0; next.disabled = cur === leaves; loadAround();
        selectPage(Math.min(cur * 2,total - 1));
      } else {
        var idx = Math.min(total - 1, Math.round(strip.scrollLeft / step()));
        label.textContent = "Page " + (idx + 1) + " of " + total; prev.disabled = idx === 0; next.disabled = idx >= total - 1;
        selectPage(idx);
      }
    }
    function step() { return strip.children.length > 1 ? strip.children[1].offsetLeft - strip.children[0].offsetLeft : strip.clientWidth || 1; }
    function turn(dir) {
      if (mode !== "book") { strip.scrollBy({ left: dir * step(), behavior: reduce ? "auto" : "smooth" }); return; }
      var to = Math.max(0, Math.min(leaves, cur + dir)); if (to === cur) return;
      var lf = leafEls[dir > 0 ? cur : cur - 1];
      lf.classList.add("is-turning"); lf.style.zIndex = leaves + 5;
      setTimeout(function () { lf.classList.remove("is-turning"); render(); }, reduce ? 0 : 900);
      cur = to; render();
    }
    function build() {
      if (!host.clientWidth) return;
      var selected = Number(picker.value) || 0;
      var want = host.clientWidth < 700 ? "strip" : "book"; if (want === mode) return; mode = want;
      view.innerHTML = ""; leafEls = []; loaded = {};
      if (mode === "book") {
        var stage = el("div", "fb-stage"); book = el("div", "fb-book"); stage.appendChild(book); view.appendChild(stage); view.classList.remove("is-strip");
        for (var i = 0; i < leaves; i++) {
          var lf = el("div", "fb-leaf"), fr = el("div", "fb-face fb-front"), bk = el("div", "fb-face fb-back");
          if (pages[2 * i]) fr.appendChild(img(2 * i)); if (pages[2 * i + 1]) bk.appendChild(img(2 * i + 1));
          lf.appendChild(fr); lf.appendChild(bk); book.appendChild(lf); leafEls.push(lf);
        }
        stage.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, t: Date.now() }; });
        stage.addEventListener("pointerup", function (e) {
          if (!drag) return; var dx = e.clientX - drag.x; drag = null;
          if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1);
          else if (Math.abs(dx) < 10) { var r = book.getBoundingClientRect(); turn(e.clientX < r.left + r.width / 2 ? -1 : 1); }
        });
        stage.addEventListener("pointercancel", function () { drag = null; });
        cur = Math.floor((selected + 1) / 2); sizeBook();
      } else {
        strip = el("div", "fb-strip"); view.classList.add("is-strip"); view.style.height = "";
        pages.forEach(function (p, i) { if (!p) return; var s = el("div", "fb-slide"); s.appendChild(img(i)); strip.appendChild(s); });
        view.appendChild(strip); strip.addEventListener("scroll", function () { render(); }, { passive: true });
        loadAround(); strip.scrollLeft = selected * step(); render();
      }
      loadAround();
    }
    prev.addEventListener("click", function () { turn(-1); }); next.addEventListener("click", function () { turn(1); });
    picker.addEventListener("change", function () {
      var selected = Number(picker.value);
      if (mode === "book") { cur = Math.floor((selected + 1) / 2); render(); selectPage(selected); }
      else strip.scrollTo({ left: selected * step(), behavior: "instant" });
    });
    host.addEventListener("keydown", function (e) { if (e.target === picker) return; if (e.key === "ArrowRight") { e.preventDefault(); turn(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); } });
    var rz = 0; window.addEventListener("resize", function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        if (!host.clientWidth) return;                                  /* hidden tab */
        var want = host.clientWidth < 700 ? "strip" : "book";
        if (want !== mode) { mode = ""; build(); } else if (mode === "book") sizeBook();
      }, 150);
    });
    var first = new Image();
    first.onload = function () { ratio = first.naturalWidth / first.naturalHeight || ratio; build(); };
    first.onerror = function () { build(); };
    first.src = pages[0];
    if (window.ResizeObserver) new ResizeObserver(function () {
      if (!host.clientWidth) return;
      var want = host.clientWidth < 700 ? "strip" : "book";
      if (want !== mode) build(); else if (mode === "book") sizeBook();
    }).observe(host);
    host._fbReady = true;
  }

  Promise.all(books.map(function (b) { return manifest(b).catch(function () { return null; }); })).then(function (list) {
    list = list.filter(Boolean);
    if (!list.length) return;
    wrap.hidden = false;
    if (list.length > 1) {
      var tabs = el("div", "fb-tabs"); tabs.setAttribute("role", "tablist");
      list.forEach(function (info, i) {
        var t = el("button", "fb-tab", info.title); t.type = "button"; t.setAttribute("role", "tab");
        t.addEventListener("click", function () { list.forEach(function (x, j) { x.el.hidden = j !== i; }); tabs.querySelectorAll(".fb-tab").forEach(function (b, j) { b.setAttribute("aria-selected", String(j === i)); }); window.dispatchEvent(new Event("resize")); });
        tabs.appendChild(t);
      });
      wrap.querySelector(".lab-head").insertAdjacentElement("afterend", tabs);
      list.forEach(function (x, j) { x.el.hidden = j !== 0; }); tabs.firstChild.setAttribute("aria-selected", "true");
    }
    list.forEach(mount);
  });
  });
})();
