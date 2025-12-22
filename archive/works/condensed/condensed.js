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
   Mobile: tap toggle (scroll safe)
=============================================== */
document.addEventListener("DOMContentLoaded", () => {
  const imageStage = document.querySelector(".image-stage");
  const modal = document.getElementById("fullscreenModal");
  if (!imageStage || !modal) return;

  const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  let isOpen = false;

  function setModal(open) {
    isOpen = open;
    modal.classList.toggle("show", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
  }

  /* DESKTOP – HOVER 유지 */
  if (!isTouch) {
    imageStage.addEventListener("mouseenter", () => setModal(true));
    imageStage.addEventListener("mouseleave", () => setModal(false));
    return;
  }

  /* MOBILE – TAP OPEN and TAP CLOSE, SCROLL SAFE */
  let sx = 0, sy = 0, moved = false;

  document.addEventListener("touchstart", (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    sx = t.clientX;
    sy = t.clientY;
    moved = false;
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - sx);
    const dy = Math.abs(t.clientY - sy);
    if (dx > 8 || dy > 8) moved = true;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (moved) return;

    const target = e.target;

    /* 헤더나 리스트 버튼은 항상 클릭 가능 */
    if (target.closest("header") || target.closest(".list-toggle")) return;

    /* 모달이 닫혀있을 때는 사진 터치만 열기 */
    if (!isOpen) {
      if (target.closest(".image-stage")) setModal(true);
      return;
    }

    /* 모달이 열려있을 때는 탭이면 닫기
       링크는 예외로 두고 싶으면 아래 한 줄 유지
    */
    if (target.closest("a")) return;

    setModal(false);
  }, { passive: true });
});


