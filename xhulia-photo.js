const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fans = document.querySelectorAll("[data-xhulia-photo-fan]");

function mountPhotoFan(fan) {
  const stage = fan.querySelector("[data-xh-stage]");
  if (!stage) return;

  const images = [...fan.querySelectorAll(".xh-photo-card img")];
  const preloads = new Map();
  let pointerActive = false;
  let focusActive = false;
  let manualState = null;

  function isExpanded() {
    return manualState === null ? pointerActive || focusActive : manualState;
  }

  function preload(url) {
    if (!url) return Promise.resolve(false);
    if (!preloads.has(url)) {
      preloads.set(url, new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = url;
      }));
    }
    return preloads.get(url);
  }

  async function setImageState(image, expanded) {
    const defaultSource = image.dataset.defaultSrc;
    const expandedSource = image.dataset.expandedSrc;
    const nextSource = expanded && expandedSource ? expandedSource : defaultSource;
    if (!nextSource || image.dataset.renderSource === nextSource) return;

    if (expanded && expandedSource && !(await preload(expandedSource))) return;
    if (expanded !== isExpanded()) return;

    image.dataset.renderSource = nextSource;
    image.src = nextSource;
  }

  function update() {
    const expanded = isExpanded();
    fan.classList.toggle("is-expanded", expanded);
    stage.setAttribute("aria-pressed", String(expanded));
    images.forEach((image) => setImageState(image, expanded));
  }

  function reveal() {
    if (fan.classList.contains("is-visible")) return;
    fan.classList.add("is-visible");
    if (reducedMotion) {
      fan.classList.add("is-settled");
      return;
    }

    requestAnimationFrame(() => {
      window.setTimeout(() => fan.classList.add("is-settled"), 400);
    });
  }

  images.forEach((image) => {
    image.dataset.renderSource = image.getAttribute("src");
    image.addEventListener("error", () => {
      if (image.dataset.renderSource === image.dataset.expandedSrc) {
        image.dataset.renderSource = image.dataset.defaultSrc;
        image.src = image.dataset.defaultSrc;
      }
    });
  });

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
