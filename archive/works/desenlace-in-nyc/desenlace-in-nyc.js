(() => {
  /* =====================================================
     HORIZONTAL MEDIA STAGE (기존 코드 유지)
  ===================================================== */

  const viewport = document.getElementById("mediaViewport");
  const scaler = document.getElementById("mediaScaler");
  const canvas = document.getElementById("mediaCanvas");

  if (!viewport || !scaler || !canvas) return;

  function scaleCanvasToViewportHeight() {
    const canvasW = canvas.offsetWidth;
    const canvasH = canvas.offsetHeight;

    const vh = viewport.clientHeight;
    const scale = vh / canvasH;

    const scaledW = Math.ceil(canvasW * scale);
    const scaledH = Math.ceil(canvasH * scale);

    scaler.style.width = scaledW + "px";
    scaler.style.height = scaledH + "px";
    canvas.style.transform = `scale(${scale})`;
  }

  function wheelToHorizontal(e) {
    const canScrollX = viewport.scrollWidth > viewport.clientWidth;
    if (!canScrollX) return;
    if (e.shiftKey) return;

    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0) {
      e.preventDefault();
      viewport.scrollLeft += delta;
    }
  }

  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  function onDown(e) {
    isDown = true;
    startX = e.clientX;
    startScrollLeft = viewport.scrollLeft;
  }

  function onMove(e) {
    if (!isDown) return;
    const dx = e.clientX - startX;
    viewport.scrollLeft = startScrollLeft - dx;
  }

  function onUp() {
    isDown = false;
  }

  window.addEventListener("load", scaleCanvasToViewportHeight);
  window.addEventListener("resize", scaleCanvasToViewportHeight);
  viewport.addEventListener("wheel", wheelToHorizontal, { passive: false });
  viewport.addEventListener("pointerdown", onDown);
  viewport.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);

  /* =====================================================
     BOX MEDIA (박스 안 자동재생 + 클리핑)
  ===================================================== */

  document.querySelectorAll(".box video").forEach(video => {
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;

    video.play().catch(() => {
      // autoplay 막혀도 무시
    });
  });

/* ===============================
   MEDIA MODAL LOGIC
================================ */

const modal = document.getElementById("mediaModal");
const modalBg = document.getElementById("mediaModalBg");
const modalClose = document.getElementById("mediaModalClose");
const modalPrev = document.getElementById("mediaModalPrev");
const modalNext = document.getElementById("mediaModalNext");

const modalImage = document.getElementById("mediaModalImage");
const modalVideo = document.getElementById("mediaModalVideo");

const mediaBoxes = Array.from(document.querySelectorAll(".box[data-src]"));
let currentIndex = 0;

/* 열기 */
function openModal(index) {
  const box = mediaBoxes[index];
  if (!box) return;

  currentIndex = index;

  const type = box.dataset.type;
  const src = box.dataset.src;

  // 초기화
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
    modalVideo.play().catch(() => {
      // autoplay 막혀도 무시
    });
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

/* 닫기 */
function closeModal() {
  modal.classList.add("hidden");
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  document.body.style.overflow = "";
}

/* 이전 / 다음 */
function showPrev() {
  currentIndex =
    (currentIndex - 1 + mediaBoxes.length) % mediaBoxes.length;
  openModal(currentIndex);
}

function showNext() {
  currentIndex =
    (currentIndex + 1) % mediaBoxes.length;
  openModal(currentIndex);
}

/* 이벤트 연결 */
mediaBoxes.forEach((box, index) => {
  box.addEventListener("click", () => openModal(index));
});

modalBg.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);
modalPrev.addEventListener("click", showPrev);
modalNext.addEventListener("click", showNext);

/* 키보드 */
window.addEventListener("keydown", e => {
  if (modal.classList.contains("hidden")) return;

  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "ArrowRight") showNext();
});

  /* =====================================================
     EVENTS
  ===================================================== */

  mediaBoxes.forEach((box, i) => {
    box.addEventListener("click", () => openModal(i));
  });

  modalBg.addEventListener("click", closeModal);
  modalClose.addEventListener("click", closeModal);
  modalPrev.addEventListener("click", showPrev);
  modalNext.addEventListener("click", showNext);

  window.addEventListener("keydown", e => {
    if (modal.classList.contains("hidden")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
  });
})();
