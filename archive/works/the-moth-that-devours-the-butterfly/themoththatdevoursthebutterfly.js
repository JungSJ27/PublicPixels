/* =======================================================
   HARD FIX LIST TOGGLE CLICK
   always on top, never hidden, capture click
======================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const listToggle = document.querySelector(".list-toggle");
  if (!listToggle) return;

  // 혹시 header 안으로 들어가 있으면 body로 빼기
  if (listToggle.closest("header")) document.body.appendChild(listToggle);

  // 최상단 고정
  Object.assign(listToggle.style, {
    position: "fixed",
    top: "3px",
    right: "16px",
    width: "44px",
    height: "44px",
    zIndex: "999999",
    pointerEvents: "auto"
  });

  // 어떤 코드가 header-hidden 붙여도 무력화
  const killHidden = () => listToggle.classList.remove("header-hidden");
  killHidden();

  // 스크롤 중 토글될 수 있어서 한번 더 안전장치
  window.addEventListener("scroll", killHidden, { passive: true });

  // 클릭 캡처로 무조건 이동
  listToggle.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const href = listToggle.getAttribute("href") || "/archive/";
      window.location.href = href;
    },
    true
  );
});


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

 