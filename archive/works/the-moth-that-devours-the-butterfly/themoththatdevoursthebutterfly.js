/* =======================================================
   Header show and hide
======================================================= */
(function () {
  function getHeaderEl() {
    return (
      document.querySelector("header.pp-header") ||
      document.querySelector(".pp-header") ||
      document.querySelector("header")
    );
  }

  function initHeaderScroll() {
    const header = getHeaderEl();
    const listToggle = document.querySelector(".list-toggle");
    if (!header) return false;

    function applyHidden(isHidden) {
      if (isHidden) {
        header.classList.add("header-hidden");
        if (listToggle) listToggle.classList.add("header-hidden");
      } else {
        header.classList.remove("header-hidden");
        if (listToggle) listToggle.classList.remove("header-hidden");
      }
    }

    let lastY = window.scrollY;

    if (window.scrollY > 10) applyHidden(true);
    else applyHidden(false);

    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;

        if (y < 10) {
          applyHidden(false);
          lastY = y;
          return;
        }

        if (y < lastY - 2) applyHidden(false);
        else if (y > lastY + 2) applyHidden(true);

        lastY = y;
      },
      { passive: true }
    );

    return true;
  }

  window.addEventListener("DOMContentLoaded", () => {
    if (initHeaderScroll()) return;

    let tries = 0;
    const maxTries = 60;

    const t = setInterval(() => {
      tries += 1;
      if (initHeaderScroll() || tries >= maxTries) clearInterval(t);
    }, 50);
  });
})();

/* =======================================================
   Lightbox popup for images
======================================================= */
(function () {
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  window.addEventListener("DOMContentLoaded", () => {
    const buttons = qsa(".image-row .img-btn");
    const lightbox = qs("#lightbox");
    const imgEl = qs("#lightboxImg");
    if (!buttons.length || !lightbox || !imgEl) return;

    const sources = buttons
      .map((btn) => btn.querySelector("img"))
      .filter(Boolean)
      .map((img) => ({ src: img.currentSrc || img.src, alt: img.alt || "" }));

    let index = 0;
    let lastFocus = null;

    function openAt(i) {
      index = (i + sources.length) % sources.length;
      const item = sources[index];
      imgEl.src = item.src;
      imgEl.alt = item.alt;

      lastFocus = document.activeElement;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      imgEl.src = "";
      document.body.style.overflow = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    function prev() { openAt(index - 1); }
    function next() { openAt(index + 1); }

    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => openAt(i));
    });

    lightbox.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close) close();
    });

    const prevBtn = qs(".lightbox-nav.prev");
    const nextBtn = qs(".lightbox-nav.next");
    const closeBtn = qs(".lightbox-close");

    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);
    if (closeBtn) closeBtn.addEventListener("click", close);

    window.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });
  });
})();
