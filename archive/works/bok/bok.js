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

// bok.js
const TOP_IMAGES = [
  // 너 이미지로 바꿔줘
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/tiger.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/map.png"
];

const STRIP_IMAGES = [
  // 스와이프 가로 4장
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/tiger1.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/tiger2.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/tiger4.png"
];

const PATTERN_IMAGES = [
  // 3줄 3열 9장
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp1.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp8.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp9.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp3.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp2.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp7.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp6.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp5.png",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/bok/bokp4.png"
];

// 캡션 3개
const CAPTIONS = [
  "K-Toile de Jouy",
  "Bok tiger",
  "Saekdong Palette"
];

function setTopImages(){
  const img1 = document.getElementById("topImg1");
  const img2 = document.getElementById("topImg2");
  if (img1) img1.src = TOP_IMAGES[0];
  if (img2) img2.src = TOP_IMAGES[1];
}

function buildStrip(){
  const track = document.getElementById("stripTrack");
  if (!track) return;

  track.innerHTML = "";
  STRIP_IMAGES.forEach((src, i) => {
    const fig = document.createElement("figure");
    fig.className = "strip-item";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `strip image ${i + 1}`;
    img.loading = "lazy";
    img.decoding = "async";

    fig.appendChild(img);
    track.appendChild(fig);
  });
}

function buildPatternGrid(){
  const grid = document.getElementById("patternGrid");
  if (!grid) return;

  grid.innerHTML = "";
  PATTERN_IMAGES.slice(0, 9).forEach((src, i) => {
    const fig = document.createElement("figure");
    fig.className = "pattern-cell";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `pattern image ${i + 1}`;
    img.loading = "lazy";
    img.decoding = "async";

    fig.appendChild(img);
    grid.appendChild(fig);
  });
}

function setCaptions(){
  const c1 = document.querySelector("#cap1 .cap-text");
  const c2 = document.querySelector("#cap2 .cap-text");
  const c3 = document.querySelector("#cap3 .cap-text");

  if (c1) c1.textContent = CAPTIONS[0] ?? "";
  if (c2) c2.textContent = CAPTIONS[1] ?? "";
  if (c3) c3.textContent = CAPTIONS[2] ?? "";
}

function hookCarouselControls(){
  const viewport = document.getElementById("stripViewport");
  const track = document.getElementById("stripTrack");
  const prev = document.getElementById("stripPrev");
  const next = document.getElementById("stripNext");
  if (!viewport || !track) return;

  const getStep = () => {
    const first = track.querySelector(".strip-item");
    if (!first) return Math.max(240, viewport.clientWidth * 0.8);
    const rect = first.getBoundingClientRect();
    const gap = 16;
    return rect.width + gap;
  };

  const scrollByStep = (dir) => {
    viewport.scrollBy({ left: dir * getStep(), behavior: "smooth" });
  };

  if (prev) prev.addEventListener("click", () => scrollByStep(-1));
  if (next) next.addEventListener("click", () => scrollByStep(1));

  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") scrollByStep(-1);
    if (e.key === "ArrowRight") scrollByStep(1);
  });

  // 마우스 드래그 스크롤
  let isDown = false;
  let startX = 0;
  let startScroll = 0;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
  });

  window.addEventListener("mouseup", () => { isDown = false; });

  window.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    viewport.scrollLeft = startScroll - dx;
  });

  // 터치 스와이프는 기본 스크롤로 충분
}

function init(){
  setTopImages();
  buildStrip();
  buildPatternGrid();
  setCaptions();
  hookCarouselControls();
}

document.addEventListener("DOMContentLoaded", init);
