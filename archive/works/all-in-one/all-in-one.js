/* =======================================================
   ALL IN ONE – FINAL STABLE JS
======================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     OPTIONAL INIT CALLS
     (이 함수들이 다른 파일에 있을 때만 실행)
  ======================================================= */
  requestAnimationFrame(() => {
    if (typeof initHeaderScroll === "function") initHeaderScroll();
  });

  if (typeof initVideoFade === "function") initVideoFade();
  if (typeof initImageSlider === "function") initImageSlider();


  /* =======================================================
     HEADER SHOW / HIDE  (scroll up = show, scroll down = hide)
  ======================================================= */

  window.addEventListener("load", () => {
    const header =
      document.querySelector("header.pp-header") ||
      document.querySelector(".pp-header") ||
      document.querySelector("header");

    const listToggle = document.querySelector(".list-toggle");
    if (!header) return;

    function applyHidden(isHidden) {
      header.classList.toggle("header-hidden", isHidden);
      // listToggle은 숨기지 말기 (항상 클릭 가능)
    }


    let lastY = window.scrollY;

    if (window.scrollY > 10) applyHidden(true);
    else applyHidden(false);

    window.addEventListener("scroll", () => {
      const y = window.scrollY;

      if (y < 10) {
        applyHidden(false);
        lastY = y;
        return;
      }

      if (y < lastY - 2) applyHidden(false);
      else if (y > lastY + 2) applyHidden(true);

      lastY = y;
    });
  });


  /* =======================================================
     POPUP SHARED
  ======================================================= */

  const popup = document.getElementById("popup");
  const popupImg = document.getElementById("popup-img");
  const popupClose = document.querySelector(".popup-close");
  const popupLeft = document.querySelector(".popup-arrow.left");
  const popupRight = document.querySelector(".popup-arrow.right");

  // popup이 없는 페이지에서도 JS가 안 터지게
  if (!popup || !popupImg) return;

  let activeSources = [];
  let activeIndex = 0;

  function isPopupOpen() {
    return popup.classList.contains("show");
  }

  function openPopup(sources, index) {
    activeSources = sources;
    activeIndex = index;

    popup.classList.add("show");
    document.body.classList.add("popup-open");
    popupImg.src = activeSources[activeIndex];
  }

  function closePopup() {
    popup.classList.remove("show");
    document.body.classList.remove("popup-open");
    popupImg.src = "";
  }

  function stepPopup(dir) {
    if (!activeSources.length) return;
    activeIndex = (activeIndex + dir + activeSources.length) % activeSources.length;
    popupImg.src = activeSources[activeIndex];
  }

  popupClose?.addEventListener("click", (e) => {
    e.stopPropagation();
    closePopup();
  });

  popupLeft?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepPopup(-1);
  });

  popupRight?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepPopup(1);
  });

  // 배경 클릭 닫기 (UI 클릭 제외)
  popup.addEventListener("click", (e) => {
    const clickedImage = e.target.closest("#popup-img");
    const clickedArrow = e.target.closest(".popup-arrow");
    const clickedClose = e.target.closest(".popup-close");
    if (clickedImage || clickedArrow || clickedClose) return;
    closePopup();
  });

  document.addEventListener("keydown", (e) => {
    if (!isPopupOpen()) return;

    if (e.key === "Escape") closePopup();
    if (e.key === "ArrowLeft") stepPopup(-1);
    if (e.key === "ArrowRight") stepPopup(1);
  });

  // 팝업 스와이프는 popup에서 한 번만
  let popupStartX = 0;
  popup.addEventListener("touchstart", (e) => {
    popupStartX = e.touches[0].clientX;
  }, { passive: true });

  popup.addEventListener("touchend", (e) => {
    if (!isPopupOpen()) return;

    const diff = e.changedTouches[0].clientX - popupStartX;
    if (diff > 50) stepPopup(-1);
    else if (diff < -50) stepPopup(1);
  }, { passive: true });


  /* =======================================================
     HERO STRIP
  ======================================================= */

  const heroTrack = document.getElementById("hero-track");
  const HERO_ITEMS = [
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/sea.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/fish.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/bubble.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/seaflower.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/coral.jpg"
  ];

  if (heroTrack) {
    HERO_ITEMS.forEach((src) => {
      const li = document.createElement("li");
      li.className = "s3-item";
      const img = document.createElement("img");
      img.src = src;
      img.alt = "All in One drawing";
      li.appendChild(img);
      heroTrack.appendChild(li);
    });

    const heroImgs = Array.from(heroTrack.querySelectorAll("img"));
    const heroSources = heroImgs.map(img => img.src);

    heroImgs.forEach((img, index) => {
      img.addEventListener("click", () => openPopup(heroSources, index));
    });
  }


  /* =======================================================
     STILLS SLIDER
  ======================================================= */

  const stillSources = [
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/allinone.jpg",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_7878.png",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_7876.png",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_7879.png",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/all-in-one/IMG_8024.png"
  ];

  const stillFrame = document.querySelector(".still-frame");
  const pageText = document.querySelector(".page-indicator");
  const sliderLeftBtn = document.querySelector(".slider-btn.left");
  const sliderRightBtn = document.querySelector(".slider-btn.right");

  if (stillFrame && pageText) {
    let current = 0;
    let suppressPopupOpenOnce = false;

    const displayImg = document.createElement("img");
    stillFrame.appendChild(displayImg);

    function renderSlider() {
      displayImg.src = stillSources[current];
      pageText.textContent = `${current + 1} / ${stillSources.length}`;
    }

    function stepSlider(dir) {
      current = (current + dir + stillSources.length) % stillSources.length;
      renderSlider();
    }

    sliderLeftBtn?.addEventListener("click", () => stepSlider(-1));
    sliderRightBtn?.addEventListener("click", () => stepSlider(1));

    stillFrame.addEventListener("click", () => {
      if (suppressPopupOpenOnce) return;
      openPopup(stillSources, current);
    });

    // 슬라이더 스와이프
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

      if (diff > 50) stepSlider(-1);
      else if (diff < -50) stepSlider(1);

      if (sliderDidSwipe) {
        suppressPopupOpenOnce = true;
        setTimeout(() => suppressPopupOpenOnce = false, 250);
      }
    }, { passive: true });

    // 팝업에서 좌우 이동 시 슬라이더도 따라가기 (stillSources가 active일 때만)
    popupLeft?.addEventListener("click", () => {
      if (activeSources !== stillSources) return;
      stepSlider(-1);
      activeIndex = current;
      popupImg.src = stillSources[current];
    });

    popupRight?.addEventListener("click", () => {
      if (activeSources !== stillSources) return;
      stepSlider(1);
      activeIndex = current;
      popupImg.src = stillSources[current];
    });

    // 키보드 이동도 동기화
    document.addEventListener("keydown", (e) => {
      if (!isPopupOpen()) return;
      if (activeSources !== stillSources) return;

      if (e.key === "ArrowLeft") {
        stepSlider(-1);
        activeIndex = current;
        popupImg.src = stillSources[current];
      } else if (e.key === "ArrowRight") {
        stepSlider(1);
        activeIndex = current;
        popupImg.src = stillSources[current];
      }
    });

    renderSlider();
  }

});
