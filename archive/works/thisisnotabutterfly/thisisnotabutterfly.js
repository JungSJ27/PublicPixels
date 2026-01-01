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
