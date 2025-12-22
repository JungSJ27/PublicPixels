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

window.addEventListener("load", () => {
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");
  if (!header) return;

  let lastY = window.scrollY;

  function toggle(hidden) {
    header.style.opacity = hidden ? 0 : 1;
    if (listToggle) listToggle.style.opacity = hidden ? 0 : 1;
  }

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    if (y < 10) {
      toggle(false);
    } else if (y > lastY) {
      toggle(true);
    } else {
      toggle(false);
    }

    lastY = y;
  });
});

function initTopSlider() {
  const slides = document.querySelectorAll(".slide");
  const prev = document.querySelector(".slider-arrow.prev");
  const next = document.querySelector(".slider-arrow.next");

  if (!slides.length) return;

  let index = 0;

  function show(i) {
    slides.forEach((s) => s.classList.remove("active"));
    slides[i].classList.add("active");
  }

  prev.addEventListener("click", () => {
    index = (index - 1 + slides.length) % slides.length;
    show(index);
  });

  next.addEventListener("click", () => {
    index = (index + 1) % slides.length;
    show(index);
  });
}

window.addEventListener("DOMContentLoaded", initTopSlider);

