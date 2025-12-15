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
   HEADER SHOW / HIDE (scroll up = show, scroll down = hide)
======================================================= */

function initHeaderScroll() {
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");
  if (!header) return;

  function applyHidden(isHidden) {
    header.classList.toggle("header-hidden", isHidden);
    if (listToggle) {
      listToggle.classList.toggle("header-hidden", isHidden);
    }
  }

  let lastY = window.scrollY;

  // 초기 상태
  applyHidden(lastY > 10);

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    if (y > lastY + 2) {
      applyHidden(true);   // ↓ 스크롤
    } else if (y < lastY - 2) {
      applyHidden(false);  // ↑ 스크롤
    }

    lastY = y;
  });
}

/* =======================================================
   VIDEO FADE
======================================================= */

function initVideoFade() {
  const iframe = document.querySelector(".hero-video iframe");
  if (!iframe) return;
  iframe.style.opacity = 0;
  setTimeout(() => {
    iframe.style.transition = "opacity .8s ease";
    iframe.style.opacity = 1;
  }, 200);
}

/* =======================================================
   IMAGE SLIDER
======================================================= */

function initImageSlider() {
  const images = [
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_01.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_02.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_03.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_04.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/still%2Clifegoeson/G_25SP_JungS_Image_05.jpg"
  ];

  const stillFrame = document.querySelector(".still-frame");
  const left = document.querySelector(".slider-btn.left");
  const right = document.querySelector(".slider-btn.right");
  const page = document.querySelector(".page-indicator");
  if (!stillFrame || !left || !right || !page) return;

  let idx = 0;
  const img = document.createElement("img");
  stillFrame.appendChild(img);

  function render() {
    img.src = images[idx];
    page.textContent = `${idx + 1} / ${images.length}`;
  }

  left.onclick = () => { idx = (idx - 1 + images.length) % images.length; render(); };
  right.onclick = () => { idx = (idx + 1) % images.length; render(); };

  render();
}
