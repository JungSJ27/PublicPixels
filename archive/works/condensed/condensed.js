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

  if (!imageStage || !modal) return;

  const isTouch =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  let isOpen = false;

  function setModal(open) {
    isOpen = open;
    modal.classList.toggle("show", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
  }

  function toggleModal() {
    setModal(!isOpen);
  }

  /* ===============================
     DESKTOP – HOVER
  =============================== */
  if (!isTouch) {
    imageStage.addEventListener("mouseenter", () => setModal(true));
    imageStage.addEventListener("mouseleave", () => setModal(false));
  }

  /* ===============================
   MOBILE – TAP OPEN / CLOSE
   (desktop behavior untouched)
  ================================ */
  if (isTouch) {
    // 사진 터치 → 모달 열기
    imageStage.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        setModal(true);
      },
      { passive: false }
    );

    // 모달 배경 터치 → 닫기
    const bg = modal.querySelector(".fullscreen-bg");
    if (bg) {
      bg.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          setModal(false);
        },
        { passive: false }
      );
    }
  }
});

