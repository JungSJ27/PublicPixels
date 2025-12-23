/* =======================================================
   ALL IN ONE – FINAL STABLE JS
======================================================= */

document.addEventListener("DOMContentLoaded", () => {


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



 /* =====================================
   HERO STRIP (TOP DRAWINGS)
===================================== */
const heroTrack = document.getElementById("hero-track");

if (heroTrack) {
  const HERO_ITEMS = [
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/sea.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/fish.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/bubble.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/seaflower.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/coral.jpg"
  ];

  // strip 생성
  HERO_ITEMS.forEach((src) => {
    const li = document.createElement("li");
    li.className = "s3-item";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "All in One drawing";

    li.appendChild(img);
    heroTrack.appendChild(li);
  });

  /* =====================================
     HERO STRIP POPUP
  ===================================== */
  const heroImgs = heroTrack.querySelectorAll("img");
  const popup = document.getElementById("popup");
  const popupImg = document.getElementById("popup-img");
  const closeBtn = document.querySelector(".popup-close");
  const leftBtn = document.querySelector(".popup-arrow.left");
  const rightBtn = document.querySelector(".popup-arrow.right");

  let heroIndex = 0;
  const heroSources = Array.from(heroImgs).map(img => img.src);

  // 공통 닫기
  function closeHeroPopup() {
    popup.classList.remove("show");
    document.body.classList.remove("popup-open");
  }

  // OPEN
  heroImgs.forEach((img, index) => {
    img.addEventListener("click", () => {
      heroIndex = index;
      popupImg.src = heroSources[heroIndex];
      popup.classList.add("show");
      document.body.classList.add("popup-open");
    });
  });

  // BACKGROUND CLICK → CLOSE
  popup.addEventListener("click", () => {
    closeHeroPopup();
  });

  // 내부 클릭은 닫히지 않게
  popupImg.addEventListener("click", (e) => e.stopPropagation());
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeHeroPopup();
  });

  // LEFT / RIGHT
  leftBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    heroIndex = (heroIndex - 1 + heroSources.length) % heroSources.length;
    popupImg.src = heroSources[heroIndex];
  });

  rightBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    heroIndex = (heroIndex + 1) % heroSources.length;
    popupImg.src = heroSources[heroIndex];
  });

  // ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("show")) {
      closeHeroPopup();
    }
  });
}


  /* =====================================
     STILLS SLIDER (EXHIBITION)
  ===================================== */
  const images = [
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/allinone.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_7878.png",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_7876.png",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_7879.png",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_8024.png"
  ];

  const stillFrame = document.querySelector(".still-frame");
  const pageText = document.querySelector(".page-indicator");

  if (stillFrame && pageText) {
    let current = 0;
    const img = document.createElement("img");
    stillFrame.appendChild(img);

    const render = () => {
      img.src = images[current];
      pageText.textContent = `${current + 1} / ${images.length}`;
    };

    document.querySelector(".slider-btn.left")?.addEventListener("click", () => {
      current = (current - 1 + images.length) % images.length;
      render();
    });

    document.querySelector(".slider-btn.right")?.addEventListener("click", () => {
      current = (current + 1) % images.length;
      render();
    });

    render();
  }

});
