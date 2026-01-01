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


// thisisnotabutterfly.js

(function () {
  let flipped = false;

  const $ = (id) => document.getElementById(id);

  function syncFlip() {
    const flipMain = $("flipMain");
    const flipModal = $("flipModal");
    if (flipMain) flipMain.classList.toggle("is-flipped", flipped);
    if (flipModal) flipModal.classList.toggle("is-flipped", flipped);
  }

  function toggleFlip() {
    flipped = !flipped;
    syncFlip();
  }

  function openModal() {
    const modal = $("modal");
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    syncFlip();
  }

  function closeModal() {
    const modal = $("modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  function bindDirect() {
    const swapBtn = $("swapBtn");
    const swapBtnModal = $("swapBtnModal");
    const openPopup = $("openPopup");
    const closeBtn = $("closeModal");
    const backdrop = $("modalBackdrop");

    if (swapBtn) {
      swapBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFlip();
      });
    }

    if (swapBtnModal) {
      swapBtnModal.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFlip();
      });
    }

    if (openPopup) {
      openPopup.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => closeModal());
    }
  }

  // 캡처 단계에서 먼저 잡아서, 어떤 레이어가 있어도 swap이 먹게
  function bindCaptureDelegation() {
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        const modalSwap = t && t.closest && t.closest("#swapBtnModal");
        if (modalSwap) {
          e.preventDefault();
          e.stopPropagation();
          toggleFlip();
          return;
        }

        const mainSwap = t && t.closest && t.closest("#swapBtn");
        if (mainSwap) {
          e.preventDefault();
          e.stopPropagation();
          toggleFlip();
        }
      },
      true
    );
  }

  function init() {
    syncFlip();
    bindDirect();
    bindCaptureDelegation();

    window.addEventListener("keydown", (e) => {
      const modal = $("modal");
      if (e.key === "Escape" && modal && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
