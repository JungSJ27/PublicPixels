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
   Lightbox popup for images, butterfly trap behavior
======================================================= */
(function () {
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  window.addEventListener("DOMContentLoaded", () => {
    const buttons = qsa(".image-row .img-btn");
    const lightbox = qs("#lightbox");
    const imgEl = qs("#lightboxImg");
    const prevBtn = qs(".lightbox-nav.prev");
    const nextBtn = qs(".lightbox-nav.next");
    const closeBtn = qs(".lightbox-close");

    if (!buttons.length || !lightbox || !imgEl) return;

    const sources = buttons
      .map((btn) => btn.querySelector("img"))
      .filter(Boolean)
      .map((img) => ({ src: img.currentSrc || img.src, alt: img.alt || "" }));

    let index = 0;
    let lastFocus = null;

    function isOpen() {
      return lightbox.classList.contains("is-open");
    }

    function render() {
      const item = sources[index];
      imgEl.src = item.src;
      imgEl.alt = item.alt;
    }

    function openAt(i) {
      index = (i + sources.length) % sources.length;
      render();

      lastFocus = document.activeElement;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("popup-open");
      document.body.style.overflow = "hidden";
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("popup-open");
      imgEl.src = "";
      document.body.style.overflow = "";

      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    function prev() {
      index = (index - 1 + sources.length) % sources.length;
      render();
    }

    function next() {
      index = (index + 1) % sources.length;
      render();
    }

    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => openAt(i));
    });

    prevBtn?.addEventListener("click", (e) => { e.stopPropagation(); prev(); });
    nextBtn?.addEventListener("click", (e) => { e.stopPropagation(); next(); });
    closeBtn?.addEventListener("click", (e) => { e.stopPropagation(); close(); });

    /* background click close, 이미지와 버튼 클릭은 제외 */
    lightbox.addEventListener("click", (e) => {
      const clickedImage = e.target.closest("#lightboxImg");
      const clickedArrow = e.target.closest(".lightbox-nav");
      const clickedClose = e.target.closest(".lightbox-close");
      if (clickedImage || clickedArrow || clickedClose) return;
      close();
    });

    window.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });

    /* swipe inside popup */
    let startX = 0;
    lightbox.addEventListener("touchstart", (e) => {
      if (!isOpen()) return;
      startX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener("touchend", (e) => {
      if (!isOpen()) return;
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 50) prev();
      else if (diff < -50) next();
    }, { passive: true });
  });
})();
