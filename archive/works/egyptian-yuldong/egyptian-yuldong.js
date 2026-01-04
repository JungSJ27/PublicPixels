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

const EY13_URL =
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/egyptian-yuldong/EY13.png";

function buildTicker() {
  const inner = document.getElementById("eyTickerInner");
  if (!inner) return;

  inner.innerHTML = "";
  inner.classList.remove("is-running");

  const ticker = inner.parentElement;
  const tickerW = ticker.getBoundingClientRect().width;
  const tickerH = ticker.getBoundingClientRect().height;

  // Pattern image height matches ticker height
  // Create enough items to cover at least 2x width, then duplicate for seamless 50% loop
  const tempImg = new Image();
  tempImg.src = EY13_URL;

  tempImg.onload = () => {
    const aspect = tempImg.naturalWidth / tempImg.naturalHeight;
    const itemW = Math.ceil(tickerH * aspect);

    // How many items needed to cover one full track width
    const itemsForOneTrack = Math.max(2, Math.ceil(tickerW / itemW) + 2);

    // Build two identical tracks back to back
    const totalItems = itemsForOneTrack * 2;

    for (let i = 0; i < totalItems; i++) {
      const img = document.createElement("img");
      img.src = EY13_URL;
      img.alt = "";
      img.className = "ey-ticker-item";
      img.style.height = "100%";
      img.style.width = `${itemW}px`;
      inner.appendChild(img);
    }

    // Set duration based on total pixel distance so it feels consistent across screens
    const oneTrackDistance = itemsForOneTrack * itemW; // px
    const pxPerSec = 20; // speed
    const duration = Math.max(22, oneTrackDistance / pxPerSec);

    inner.style.animationDuration = `${duration}s`;
    inner.classList.add("is-running");
  };

  tempImg.onerror = () => {
    // If image fails, just stop silently
  };
}

window.addEventListener("load", buildTicker);

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildTicker, 200);
});
