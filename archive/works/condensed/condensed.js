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

/* ===============================================
   CONDENSED PAGE – INFO MODAL
   Desktop: hover
   Mobile: tap toggle
=============================================== */

document.addEventListener("DOMContentLoaded", () => {
  const imageStage = document.querySelector(".image-stage");
  const modal = document.getElementById("fullscreenModal");
  const bg = modal?.querySelector(".fullscreen-bg");

  if (!imageStage || !modal || !bg) return;

  const isTouch =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  let isOpen = false;
  let hoverTimer = null;

  function openModal() {
    if (isOpen) return;
    modal.classList.add("show");
    isOpen = true;
  }

  function closeModal() {
    if (!isOpen) return;
    modal.classList.remove("show");
    isOpen = false;
  }

  function toggleModal() {
    isOpen ? closeModal() : openModal();
  }

  /* ===============================
     DESKTOP – HOVER
  =============================== */
  if (!isTouch) {
    imageStage.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(openModal, 60);
    });

    imageStage.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(closeModal, 60);
    });
  }

  /* ===============================
     MOBILE – TAP TOGGLE
  =============================== */
  if (isTouch) {
    imageStage.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleModal();
    });

    // 배경 탭 시 닫기
    bg.addEventListener("click", () => {
      closeModal();
    });

    // 내용 영역 탭은 닫히지 않게
    modal
      .querySelector(".fullscreen-content")
      .addEventListener("click", (e) => {
        e.stopPropagation();
      });
  }

  /* ===============================
     ESC (desktop)
  =============================== */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeModal();
    }
  });
});
