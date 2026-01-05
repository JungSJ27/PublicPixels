/* =======================================================
   PAGE INIT
======================================================= */

window.addEventListener("DOMContentLoaded", () => {
  // headerLoader가 header를 DOM에 넣은 다음 프레임에 실행
  requestAnimationFrame(() => {
    initHeaderScroll();
  });

  initVideoFade();
  initImageSlider();
});

/* =======================================================
   HEADER SHOW / HIDE  (scroll up = show, scroll down = hide)
======================================================= */

window.addEventListener("load", () => {
  // headerLoader로 include된 헤더 잡기
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");
  const listToggle = document.querySelector(".list-toggle");

  if (!header) return;

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

  // 첫 로딩 시 상태
  if (window.scrollY > 10) applyHidden(true);
  else applyHidden(false);

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    // 맨 위 근처면 항상 보이게
    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    // 스크롤 방향에 따라 토글
    if (y < lastY - 2) {
      // 위로 스크롤 = 보이기
      applyHidden(false);
    } else if (y > lastY + 2) {
      // 아래로 스크롤 = 숨기기
      applyHidden(true);
    }

    lastY = y;
  });
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
