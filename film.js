/* Keep screenings user-controlled and the shoot diary accessible. */
(function () {
  "use strict";
  var videos = Array.from(document.querySelectorAll("video[data-project-film]"));
  function pauseAll(except) {
    videos.forEach(function (video) { if (video !== except) video.pause(); });
  }
  videos.forEach(function (video) {
    video.addEventListener("play", function () { pauseAll(video); });
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pauseAll();
  });
  function openLinkedSection() {
    var target = document.getElementById(location.hash.slice(1));
    if (!target || !target.closest(".case-overview")) return;
    requestAnimationFrame(function () { target.scrollIntoView({block:"start", behavior:"instant"}); });
  }
  openLinkedSection();
  window.addEventListener("hashchange", openLinkedSection);
  var diary = document.querySelector("[data-shoot-diary]");
  if (!diary) return;
  var slides = Array.from(diary.querySelectorAll("[data-slide]"));
  var thumbs = Array.from(diary.querySelectorAll("[data-photo-index]"));
  var chapters = Array.from(diary.querySelectorAll("[data-chapter-index]"));
  var status = diary.querySelector("[data-photo-status]");
  var current = 0;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) { slide.hidden = i !== current; });
    thumbs.forEach(function (thumb, i) { thumb.setAttribute("aria-pressed", String(i === current)); });
    chapters.forEach(function (chapter) {
      chapter.setAttribute("aria-pressed", String(chapter.textContent === slides[current].dataset.chapter));
    });
    status.textContent = String(current + 1).padStart(2, "0") + " / " + slides.length + " · " + slides[current].dataset.chapter;
    var strip = diary.querySelector(".diary-thumbs");
    var thumb = thumbs[current];
    strip.scrollLeft = thumb.offsetLeft - strip.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
  }
  diary.querySelector("[data-photo-prev]").addEventListener("click", function () { show(current - 1); });
  diary.querySelector("[data-photo-next]").addEventListener("click", function () { show(current + 1); });
  thumbs.forEach(function (thumb) { thumb.addEventListener("click", function () { show(Number(thumb.dataset.photoIndex)); }); });
  chapters.forEach(function (chapter) { chapter.addEventListener("click", function () { show(Number(chapter.dataset.chapterIndex)); }); });
  diary.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault(); show(current + (event.key === "ArrowRight" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault(); show(event.key === "Home" ? 0 : slides.length - 1);
    }
  });
  var stage = diary.querySelector(".diary-stage"), start = null, swiped = false;
  stage.addEventListener("pointerdown", function (event) { start = {x:event.clientX, y:event.clientY}; swiped = false; });
  stage.addEventListener("pointerup", function (event) {
    if (!start) return;
    var dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true; show(current + (dx < 0 ? 1 : -1));
    }
    start = null;
  });
  stage.addEventListener("pointercancel", function () { start = null; });
  stage.addEventListener("click", function (event) {
    if (swiped) { event.preventDefault(); event.stopPropagation(); swiped = false; }
  }, true);
  show(0);
})();
