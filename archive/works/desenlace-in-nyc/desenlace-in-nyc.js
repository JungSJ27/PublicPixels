/* =======================================================
   HEADER SHOW / HIDE
   - vertical scroll (window)
   - horizontal scroll (mediaViewport)
======================================================= */

(function initHeaderScroll() {
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");
  const mediaViewport = document.getElementById("mediaViewport");

  // headerLoader로 아직 안 들어왔으면 재시도
  if (!header) {
    requestAnimationFrame(initHeaderScroll);
    return;
  }

  function applyHidden(isHidden) {
    header.classList.toggle("header-hidden", isHidden);
    if (listToggle) {
      listToggle.classList.toggle("header-hidden", isHidden);
    }
  }

  /* ===============================
     VERTICAL SCROLL
  =============================== */

  let lastY = window.scrollY;

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    if (y > lastY + 2) applyHidden(true);
    if (y < lastY - 2) applyHidden(false);

    lastY = y;
  });

  /* ===============================
     HORIZONTAL SCROLL (MEDIA)
  =============================== */

  if (mediaViewport) {
    let lastX = mediaViewport.scrollLeft;

    mediaViewport.addEventListener("scroll", () => {
      const x = mediaViewport.scrollLeft;

      if (x > lastX + 2) applyHidden(true);
      if (x < lastX - 2) applyHidden(false);

      lastX = x;
    });
  }
})();
