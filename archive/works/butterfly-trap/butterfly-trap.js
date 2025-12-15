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
   VIDEO FADE-IN
======================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.querySelector("iframe");
  if (!iframe) return;

  iframe.setAttribute("allow", "autoplay");
  iframe.style.opacity = 0;

  setTimeout(() => {
    iframe.style.transition = "opacity 0.8s ease";
    iframe.style.opacity = 1;
  }, 200);
});

/* IMAGE SLIDER + FULLSCREEN VIEWER */

const images = [
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_01.jpg",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_02.jpg",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_03.jpg",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_04.jpg",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_05.jpg"
];

let current = 0;

const stillFrame = document.querySelector(".still-frame");
const displayImg = document.createElement("img");
stillFrame.appendChild(displayImg);

const pageText = document.querySelector(".page-indicator");

/* initial render */
function render() {
  displayImg.src = images[current];
  pageText.textContent = `${current + 1} / ${images.length}`;
}

document.querySelector(".slider-btn.left").addEventListener("click", () => {
  current = (current - 1 + images.length) % images.length;
  render();
});

document.querySelector(".slider-btn.right").addEventListener("click", () => {
  current = (current + 1) % images.length;
  render();
});

/* click → fullscreen */
const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const popupClose = document.querySelector(".popup-close");

stillFrame.addEventListener("click", () => {
  popup.classList.add("show");
  popupImg.src = images[current];
});

/* popup close */
popupClose.addEventListener("click", () => {
  popup.classList.remove("show");
});

/* popup arrows */
document.querySelector(".popup-arrow.left").addEventListener("click", () => {
  current = (current - 1 + images.length) % images.length;
  popupImg.src = images[current];
});

document.querySelector(".popup-arrow.right").addEventListener("click", () => {
  current = (current + 1) % images.length;
  popupImg.src = images[current];
});

/* ESC key closes popup */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") popup.classList.remove("show");
});

/* touch swipe for mobile */
let startX = 0;

popup.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

popup.addEventListener("touchend", (e) => {
  let diff = e.changedTouches[0].clientX - startX;

  if (diff > 50) {
    current = (current - 1 + images.length) % images.length;
  } else if (diff < -50) {
    current = (current + 1) % images.length;
  }

  popupImg.src = images[current];
});

/* run initial */
render();
