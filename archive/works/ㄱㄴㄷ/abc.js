/* =======================================================
   MOBILE HEADER SHOW / HIDE (STABLE VERSION)
   - Mobile only
   - Desktop always visible
======================================================= */

function initHeaderScroll() {
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");
  if (!header) return;

  let lastY = window.scrollY;
  let isBound = false;

  function applyHidden(hidden) {
    if (hidden) {
      header.classList.add("header-hidden");
      if (listToggle) listToggle.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
      if (listToggle) listToggle.classList.remove("header-hidden");
    }
  }

  function onScroll() {
    const y = window.scrollY;

    // 최상단에서는 항상 보이게
    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    if (y > lastY + 5) {
      applyHidden(true);   // scroll down
    } else if (y < lastY - 5) {
      applyHidden(false);  // scroll up
    }

    lastY = y;
  }

  function updateMode() {
    const isMobile = window.innerWidth <= 1000;

    if (isMobile && !isBound) {
      lastY = window.scrollY;
      window.addEventListener("scroll", onScroll, { passive: true });
      isBound = true;
    }

    if (!isMobile && isBound) {
      window.removeEventListener("scroll", onScroll);
      applyHidden(false); // 데스크탑에서는 항상 보임
      isBound = false;
    }
  }

  updateMode();
  window.addEventListener("resize", updateMode);
}

/* =======================================================
   PAGE INIT
======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    initHeaderScroll();
  });

  if (typeof initVideoFade === "function") initVideoFade();
  if (typeof initImageSlider === "function") initImageSlider();
});


/* =====================================
   PHOTO COUNTER (image-based, precise)
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  const leftPanel = document.querySelector(".left-panel");
  const images = Array.from(document.querySelectorAll(".image-track img"));
  const counter = document.querySelector(".photo-counter");

  if (!leftPanel || !counter || images.length === 0) return;

  const total = images.length;

  function updateCounter() {
    const panelRect = leftPanel.getBoundingClientRect();

    let bestRect = null;
    let bestVisibleWidth = 0;
    let bestIndex = 0;

    // 현재 가장 많이 보이는 이미지 찾기
    images.forEach((img, index) => {
      const rect = img.getBoundingClientRect();

      const visibleLeft = Math.max(rect.left, panelRect.left);
      const visibleRight = Math.min(rect.right, panelRect.right);
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);

      if (visibleWidth > bestVisibleWidth) {
        bestVisibleWidth = visibleWidth;
        bestRect = rect;
        bestIndex = index;
      }
    });

    if (!bestRect) return;

    // 텍스트 업데이트
    counter.textContent = `${bestIndex + 1} / ${total}`;

    // 위치: 현재 이미지 오른쪽 하단
    const x = bestRect.right - 16;
    const y = bestRect.bottom - 12;

    counter.style.left = `${x}px`;
    counter.style.top = `${y}px`;

    // ⭐ left-panel 영역을 벗어나면 숨김
    if (
      x < panelRect.left ||
      x > panelRect.right ||
      y < panelRect.top ||
      y > panelRect.bottom
    ) {
      counter.style.opacity = "0";
    } else {
      counter.style.opacity = "1";
    }
  }

  leftPanel.addEventListener("scroll", () => {
    requestAnimationFrame(updateCounter);
  });

  window.addEventListener("resize", updateCounter);

  // 초기 실행
  updateCounter();
});
