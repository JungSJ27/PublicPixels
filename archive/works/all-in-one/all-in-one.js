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

/* ===============================================
   MOBILE SWIPE FOR TOP SLIDER
=============================================== */

function initSwipeSlider() {
  const track = document.querySelector(".slider-track");
  const slides = document.querySelectorAll(".slide");
  if (!track || slides.length === 0) return;

  let startX = 0;
  let endX = 0;
  let index = [...slides].findIndex(s => s.classList.contains("active"));
  if (index < 0) index = 0;

  function show(i) {
    slides.forEach(s => s.classList.remove("active"));
    slides[i].classList.add("active");
  }

  track.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  track.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) < 40) return; // 스와이프 최소 거리

    if (diff > 0) {
      // swipe right
      index = (index - 1 + slides.length) % slides.length;
    } else {
      // swipe left
      index = (index + 1) % slides.length;
    }
    show(index);
  });
}

window.addEventListener("DOMContentLoaded", initSwipeSlider);
