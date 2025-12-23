/* =======================================================
   PAGE INIT
======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initInfoModal();
});

/* =======================================================
   HEADER SHOW / HIDE
   scroll down → hide
   scroll up   → show
======================================================= */

function initHeaderScroll() {
  // headerLoader로 삽입된 헤더 대응
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");

  if (!header) return;

  let lastY = window.scrollY;

  function applyHidden(hidden) {
    header.classList.toggle("header-hidden", hidden);
    if (listToggle) {
      listToggle.classList.toggle("header-hidden", hidden);
    }
  }

  // 초기 상태
  applyHidden(window.scrollY > 10);

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    // 맨 위 근처면 항상 보이기
    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    // 방향 판별
    if (y > lastY + 2) {
      applyHidden(true);   // 아래 → 숨김
    } else if (y < lastY - 2) {
      applyHidden(false);  // 위 → 표시
    }

    lastY = y;
  });
}

/* =======================================================
   INFO MODAL
   Desktop: hover
   Mobile: tap toggle (scroll-safe)
======================================================= */

function initInfoModal() {
  const imageStage = document.querySelector(".image-stage");
  const modal = document.getElementById("fullscreenModal");

  if (!imageStage || !modal) return;

  const isTouch =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  let isOpen = false;

  function setModal(open) {
    isOpen = open;
    modal.classList.toggle("show", open);
    modal.setAttribute("aria-hidden", String(!open));
  }

  /* ===============================
     DESKTOP – HOVER
  =============================== */

  if (!isTouch) {
    imageStage.addEventListener("mouseenter", () => setModal(true));
    imageStage.addEventListener("mouseleave", () => setModal(false));
    return;
  }

  /* ===============================
     MOBILE – TAP TOGGLE
     (scroll-safe)
  =============================== */

  let startX = 0;
  let startY = 0;
  let moved = false;

  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;

      startX = t.clientX;
      startY = t.clientY;
      moved = false;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;

      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);

      if (dx > 8 || dy > 8) moved = true;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (moved) return;

      const target = e.target;

      // 헤더 & 리스트 버튼은 항상 클릭 허용
      if (
        target.closest("header") ||
        target.closest(".list-toggle")
      ) {
        return;
      }

      // 닫혀있을 때: 이미지 터치만 열기
      if (!isOpen) {
        if (target.closest(".image-stage")) {
          setModal(true);
        }
        return;
      }

      // 열려있을 때: 링크는 예외
      if (target.closest("a")) return;

      setModal(false);
    },
    { passive: true }
  );
}
