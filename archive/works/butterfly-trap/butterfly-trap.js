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


/* =======================================================
   slider
======================================================= */

const images = [
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_1790.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_1791.JPG",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9778.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9781.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9860.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9861.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9862.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9875.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9881.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/butterfly-trap/IMG_9886.png"
];


let current = 0;
let suppressPopupOpenOnce = false;

/* ===============================================
   ELEMENTS
=============================================== */

const stillFrame = document.querySelector(".still-frame");
const pageText = document.querySelector(".page-indicator");

const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const popupClose = document.querySelector(".popup-close");

const sliderLeftBtn = document.querySelector(".slider-btn.left");
const sliderRightBtn = document.querySelector(".slider-btn.right");

const popupLeft = document.querySelector(".popup-arrow.left");
const popupRight = document.querySelector(".popup-arrow.right");

/* display img inside stillFrame */
const displayImg = document.createElement("img");
stillFrame.appendChild(displayImg);

/* ===============================================
   RENDER
=============================================== */

function renderSlider() {
  displayImg.src = images[current];
  pageText.textContent = `${current + 1} / ${images.length}`;
}

function isPopupOpen() {
  return popup.classList.contains("show");
}

function renderPopup() {
  if (!isPopupOpen()) return;
  popupImg.src = images[current];
}

/* ===============================================
   SLIDER BUTTONS
=============================================== */

sliderLeftBtn.addEventListener("click", () => {
  current = (current - 1 + images.length) % images.length;
  renderSlider();
});

sliderRightBtn.addEventListener("click", () => {
  current = (current + 1) % images.length;
  renderSlider();
});

/* ===============================================
   POPUP OPEN / CLOSE
=============================================== */

function openPopup() {
  popup.classList.add("show");
  document.body.classList.add("popup-open");
  popupImg.src = images[current];
}

function closePopup() {
  popup.classList.remove("show");
  document.body.classList.remove("popup-open");
  popupImg.src = "";
}

/* click to open */
stillFrame.addEventListener("click", () => {
  if (suppressPopupOpenOnce) return;
  openPopup();
});

/* close button */
popupClose.addEventListener("click", (e) => {
  e.stopPropagation();
  closePopup();
});

/* background click to close
   이미지, 화살표, 닫기 버튼만 제외하고 어디든 클릭하면 닫힘 */
popup.addEventListener("click", (e) => {
  const clickedImage = e.target.closest("#popup-img");
  const clickedArrow = e.target.closest(".popup-arrow");
  const clickedClose = e.target.closest(".popup-close");

  if (clickedImage || clickedArrow || clickedClose) return;

  closePopup();
});

/* ESC */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isPopupOpen()) closePopup();
});

/* ===============================================
   POPUP ARROWS
=============================================== */

popupLeft.addEventListener("click", (e) => {
  e.stopPropagation();
  current = (current - 1 + images.length) % images.length;
  renderSlider();
  renderPopup();
});

popupRight.addEventListener("click", (e) => {
  e.stopPropagation();
  current = (current + 1) % images.length;
  renderSlider();
  renderPopup();
});

/* ===============================================
   SWIPE ON SLIDER (mobile, without popup)
=============================================== */

let sliderStartX = 0;
let sliderDidSwipe = false;

stillFrame.addEventListener("touchstart", (e) => {
  sliderStartX = e.touches[0].clientX;
  sliderDidSwipe = false;
}, { passive: true });

stillFrame.addEventListener("touchmove", (e) => {
  const x = e.touches[0].clientX;
  if (Math.abs(x - sliderStartX) > 12) sliderDidSwipe = true;
}, { passive: true });

stillFrame.addEventListener("touchend", (e) => {
  const diff = e.changedTouches[0].clientX - sliderStartX;

  if (diff > 50) {
    current = (current - 1 + images.length) % images.length;
    renderSlider();
  } else if (diff < -50) {
    current = (current + 1) % images.length;
    renderSlider();
  }

  if (sliderDidSwipe) {
    suppressPopupOpenOnce = true;
    setTimeout(() => { suppressPopupOpenOnce = false; }, 250);
  }
}, { passive: true });

/* ===============================================
   SWIPE INSIDE POPUP
=============================================== */

let popupStartX = 0;

popup.addEventListener("touchstart", (e) => {
  popupStartX = e.touches[0].clientX;
}, { passive: true });

popup.addEventListener("touchend", (e) => {
  if (!isPopupOpen()) return;

  const diff = e.changedTouches[0].clientX - popupStartX;

  if (diff > 50) {
    current = (current - 1 + images.length) % images.length;
  } else if (diff < -50) {
    current = (current + 1) % images.length;
  } else {
    return;
  }

  renderSlider();
  renderPopup();
}, { passive: true });

/* ===============================================
   INIT
=============================================== */

renderSlider();
