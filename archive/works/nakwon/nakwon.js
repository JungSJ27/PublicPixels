/* =========================
   HEADER
========================= */
(function () {
  const body = document.body;
  const zoneDesktop = document.querySelector(".header-hover-zone");
  const zoneMobile = document.querySelector(".mobile-header-zone");
  const header = document.querySelector("header");

  let hideTimer = null;

  function revealFor(ms = 3000) {
    clearTimeout(hideTimer);
    body.classList.add("header-reveal");

    hideTimer = setTimeout(() => {
      body.classList.remove("header-reveal");
    }, ms);
  }

  /* 모바일 판별: hover 없는 환경 */
  const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  /* ==========================
     📱 MOBILE
  ========================== */
  if (isMobile) {
    body.classList.remove("header-reveal");

    const onTopTap = (e) => {
      revealFor(3000);
    };

    /* 상단 터치 존 */
    zoneMobile?.addEventListener("touchstart", onTopTap, {
      passive: true,
    });

    /* 헤더 자체 터치해도 유지 */
    header?.addEventListener("touchstart", onTopTap, {
      passive: true,
    });

    return;
  }

  /* ==========================
     🖥 DESKTOP
  ========================== */
  if (!zoneDesktop) return;

  function show() {
    clearTimeout(hideTimer);
    body.classList.add("header-reveal");
  }

  function hide(delay = 500) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      body.classList.remove("header-reveal");
    }, delay);
  }

  zoneDesktop.addEventListener("mouseenter", show);
  zoneDesktop.addEventListener("mouseleave", () => hide(500));
  header?.addEventListener("mouseenter", show);
  header?.addEventListener("mouseleave", () => hide(500));
})();




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

/* OPEN */
stillFrame.addEventListener("click", () => {
  popup.classList.add("show");
  popupImg.src = images[current];
  document.body.classList.add("popup-open"); // ⭐ header 숨김
});

/* CLOSE (X 버튼) */
popupClose.addEventListener("click", () => {
  closePopup();
});

/* LEFT / RIGHT */
document.querySelector(".popup-arrow.left").addEventListener("click", () => {
  current = (current - 1 + images.length) % images.length;
  popupImg.src = images[current];
});

document.querySelector(".popup-arrow.right").addEventListener("click", () => {
  current = (current + 1) % images.length;
  popupImg.src = images[current];
});

/* ESC 키로 닫기 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && popup.classList.contains("show")) {
    closePopup();
  }
});

/* 공통 닫기 함수 */
function closePopup() {
  popup.classList.remove("show");
  document.body.classList.remove("popup-open"); // ⭐ 꼭 필요
}


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
