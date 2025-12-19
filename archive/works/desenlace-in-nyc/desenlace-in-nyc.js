(() => {
  /* =====================================================
     HORIZONTAL MEDIA STAGE
  ===================================================== */

  const viewport = document.getElementById("mediaViewport");
  const scaler = document.getElementById("mediaScaler");
  const canvas = document.getElementById("mediaCanvas");

  if (viewport && scaler && canvas) {
    function scaleCanvasToViewportHeight() {
      const canvasW = canvas.offsetWidth;
      const canvasH = canvas.offsetHeight;
      const vh = viewport.clientHeight;
      const scale = vh / canvasH;

      scaler.style.width = Math.ceil(canvasW * scale) + "px";
      scaler.style.height = Math.ceil(canvasH * scale) + "px";
      canvas.style.transform = `scale(${scale})`;
    }

    function wheelToHorizontal(e) {
      if (viewport.scrollWidth <= viewport.clientWidth) return;
      if (e.shiftKey) return;

      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      if (delta !== 0) {
        e.preventDefault();
        viewport.scrollLeft += delta;
      }
    }

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    viewport.addEventListener("pointerdown", e => {
      isDown = true;
      startX = e.clientX;
      startScrollLeft = viewport.scrollLeft;
    });

    viewport.addEventListener("pointermove", e => {
      if (!isDown) return;
      viewport.scrollLeft = startScrollLeft - (e.clientX - startX);
    });

    window.addEventListener("pointerup", () => {
      isDown = false;
    });

    window.addEventListener("load", scaleCanvasToViewportHeight);
    window.addEventListener("resize", scaleCanvasToViewportHeight);
    viewport.addEventListener("wheel", wheelToHorizontal, { passive: false });
  }

  /* =====================================================
     BOX VIDEO AUTOPLAY
  ===================================================== */

  document.querySelectorAll(".box video").forEach(video => {
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;
    video.play().catch(() => {});
  });

  /* =====================================================
     MEDIA MODAL
  ===================================================== */

  const modal = document.getElementById("mediaModal");
  const modalBg = document.getElementById("mediaModalBg");
  const modalClose = document.getElementById("mediaModalClose");
  const modalPrev = document.getElementById("mediaModalPrev");
  const modalNext = document.getElementById("mediaModalNext");
  const modalImage = document.getElementById("mediaModalImage");
  const modalVideo = document.getElementById("mediaModalVideo");
  const modalContent = document.querySelector(".modal-content");

  const mediaBoxes = Array.from(document.querySelectorAll(".box[data-src]"));
  let currentIndex = 0;

  function openModal(index) {
    const box = mediaBoxes[index];
    if (!box) return;

    currentIndex = index;

    const type = box.dataset.type;
    const src = box.dataset.src;

    modalImage.classList.add("hidden");
    modalVideo.classList.add("hidden");
    modalVideo.pause();
    modalVideo.removeAttribute("src");

    if (type === "image") {
      modalImage.src = src;
      modalImage.classList.remove("hidden");
    }

    if (type === "video") {
      modalVideo.src = src;
      modalVideo.load();
      modalVideo.currentTime = 0;
      modalVideo.muted = false;
      modalVideo.classList.remove("hidden");
      modalVideo.play().catch(() => {});
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.add("hidden");
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    document.body.style.overflow = "";
  }

  function showPrev() {
    currentIndex =
      (currentIndex - 1 + mediaBoxes.length) % mediaBoxes.length;
    openModal(currentIndex);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % mediaBoxes.length;
    openModal(currentIndex);
  }

  mediaBoxes.forEach((box, i) => {
    box.addEventListener("click", () => openModal(i));
  });

  modalBg?.addEventListener("click", closeModal);
  modalClose?.addEventListener("click", closeModal);
  modalPrev?.addEventListener("click", showPrev);
  modalNext?.addEventListener("click", showNext);

  window.addEventListener("keydown", e => {
    if (modal.classList.contains("hidden")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
  });

  /* =====================================================
     TOUCH SWIPE (MOBILE MODAL)
  ===================================================== */

  let touchStartX = 0;
  const SWIPE_THRESHOLD = 50;

  modalContent?.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
  });

  modalContent?.addEventListener("touchend", e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > SWIPE_THRESHOLD) showNext();
    if (diff < -SWIPE_THRESHOLD) showPrev();
  });

  /* =====================================================
     HEADER SHOW / HIDE (SAFE + INCLUDE-AWARE)
     vertical: window
     horizontal: mediaViewport
  ===================================================== */

  (function initHeaderScroll() {
    const mediaViewport = document.getElementById("mediaViewport");

    function getHeader() {
      return (
        document.querySelector("header.pp-header") ||
        document.querySelector(".pp-header") ||
        document.querySelector("header")
      );
    }

    function bindHeader() {
      const header = getHeader();
      const listToggle = document.querySelector(".list-toggle");

      if (!header) return false;

      const applyHidden = hidden => {
        header.classList.toggle("header-hidden", hidden);
        if (listToggle) {
          listToggle.classList.toggle("header-hidden", hidden);
        }
      };

      let lastY = window.scrollY;
      let lastX = mediaViewport ? mediaViewport.scrollLeft : 0;

      if (lastY < 10) applyHidden(false);

      window.addEventListener(
        "scroll",
        () => {
          const y = window.scrollY;

          if (y < 10) {
            applyHidden(false);
            lastY = y;
            return;
          }

          if (y > lastY + 2) applyHidden(true);
          else if (y < lastY - 2) applyHidden(false);

          lastY = y;
        },
        { passive: true }
      );

      if (mediaViewport) {
        mediaViewport.addEventListener(
          "scroll",
          () => {
            const x = mediaViewport.scrollLeft;

            if (x > lastX + 2) applyHidden(true);
            else if (x < lastX - 2) applyHidden(false);

            lastX = x;
          },
          { passive: true }
        );
      }

      return true;
    }

    if (bindHeader()) return;

    let tries = 0;
    const maxTries = 120;

    const retry = () => {
      tries += 1;
      if (bindHeader()) return;
      if (tries < maxTries) requestAnimationFrame(retry);
    };

    requestAnimationFrame(retry);
  })();
})();
