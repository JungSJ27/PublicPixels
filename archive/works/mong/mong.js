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

// mong.js

const BASE_URL =
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/mong/";

const TOTAL_IMAGES = 9;

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("mongPattern");
  if (!grid) return;

  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const div = document.createElement("div");
    div.className = "mong_tile";

    const img = document.createElement("img");
    img.src = `${BASE_URL}mong${i}.png`;
    img.alt = `Mong pattern ${i}`;
    img.loading = "lazy";
    img.decoding = "async";

    div.appendChild(img);
    grid.appendChild(div);
  }
});
