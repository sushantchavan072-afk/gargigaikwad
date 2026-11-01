const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fans = document.querySelectorAll("[data-gargi-photo-fan]");

function mountPhotoFan(fan) {
  const stage = fan.querySelector("[data-photo-stage]");
  if (!stage) return;

  let pointerActive = false;
  let focusActive = false;
  let manualState = null;

  function isExpanded() {
    return manualState === null ? pointerActive || focusActive : manualState;
  }

  function update() {
    const expanded = isExpanded();
    fan.classList.toggle("is-expanded", expanded);
    stage.setAttribute("aria-pressed", String(expanded));
  }

  function reveal() {
    if (fan.classList.contains("is-visible")) return;
    fan.classList.add("is-visible");
    fan.classList.remove("is-pending");
    if (reducedMotion) {
      fan.classList.add("is-settled");
      return;
    }

    window.setTimeout(() => fan.classList.add("is-settled"), 400);
  }

  stage.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    pointerActive = true;
    manualState = null;
    reveal();
    update();
  });

  stage.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    pointerActive = false;
    manualState = null;
    update();
  });

  stage.addEventListener("focus", () => {
    focusActive = true;
    manualState = null;
    reveal();
    update();
  });

  stage.addEventListener("blur", () => {
    focusActive = false;
    manualState = null;
    update();
  });

  stage.addEventListener("click", (event) => {
    if (event.detail !== 0 && window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    manualState = !isExpanded();
    reveal();
    update();
  });

  stage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      manualState = !isExpanded();
      reveal();
      update();
    } else if (event.key === "Escape") {
      manualState = false;
      update();
    }
  });

  if (reducedMotion) {
    fan.classList.add("is-visible", "is-settled");
  } else if ("IntersectionObserver" in window) {
    fan.classList.add("is-pending");
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        reveal();
        observer.disconnect();
      }
    }, { threshold: 0.28 });
    observer.observe(fan);
  } else {
    reveal();
  }
}

fans.forEach(mountPhotoFan);
