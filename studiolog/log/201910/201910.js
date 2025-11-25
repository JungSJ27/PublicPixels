document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("slider");
  const indicatorEl = document.getElementById("sliderIndicator");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let slides = [];
  let currentIndex = 0;

  // ---------------------------------------------
// 슬라이드 구성
// ---------------------------------------------
function buildSlides(files) {
  if (!slider) return;

  slider.innerHTML = "";

  // 이미지 DOM 생성
  files.forEach((file) => {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.innerHTML = `<img src="${file}" alt="">`;
    slider.appendChild(slide);
  });

  slides = Array.from(slider.children);
  currentIndex = 0;

  updateIndicator();
  updatePosition(false); // 처음 로딩 시 부드럽지 않게 정확히 위치 고정
}


// ---------------------------------------------
// 페이지 인디케이터 업데이트
// ---------------------------------------------
function updateIndicator() {
  if (!indicatorEl) return;

  if (!slides.length) {
    indicatorEl.textContent = "0 / 0";
  } else {
    indicatorEl.textContent = `${currentIndex + 1} / ${slides.length}`;
  }
}


// ---------------------------------------------
// 슬라이더 위치 업데이트
// ---------------------------------------------
function updatePosition(smooth = true) {
  if (!slider || !slides.length) return;

  const w = slider.clientWidth; // 현재 화면 너비 기준 슬라이드 너비
  const left = w * currentIndex;

  slider.scrollTo({
    left,
    behavior: smooth ? "smooth" : "auto"
  });
}


// ---------------------------------------------
// 다음 슬라이드
// ---------------------------------------------
function goNext() {
  if (!slides.length) return;
  currentIndex = (currentIndex + 1) % slides.length;
  updatePosition();
  updateIndicator();
}


// ---------------------------------------------
// 이전 슬라이드
// ---------------------------------------------
function goPrev() {
  if (!slides.length) return;
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  updatePosition();
  updateIndicator();
}


// ---------------------------------------------
// 화면 리사이즈 시 슬라이드 위치 자동 재정렬
// ---------------------------------------------
window.addEventListener("resize", () => {
  // 약간의 딜레이를 주어 레이아웃이 안정된 뒤 계산되도록
  setTimeout(() => updatePosition(false), 50);
});

  // ---------------------------------------------
  // 버튼 이벤트
  // ---------------------------------------------
  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);

  // 이미지 클릭하면 다음 슬라이드
  slider.addEventListener("click", goNext);

  // 스와이프
  let startX = 0;
  slider.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });
  slider.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    if (endX < startX - 50) goNext();
    if (endX > startX + 50) goPrev();
  });

  // ---------------------------------------------
  // JSON 로드
  // ---------------------------------------------

  fetch("201910images.json")
    .then((res) => res.json())
    .then((files) => {
      if (!Array.isArray(files) || !files.length) {
        buildSlides(fallbackImages);
        return;
      }

      const sorted = files.slice().sort((a, b) => {
        const na = parseInt(String(a).match(/(\d+)(?!.*\d)/)?.[1] || "0", 10);
        const nb = parseInt(String(b).match(/(\d+)(?!.*\d)/)?.[1] || "0", 10);
        return na - nb;
      });

      buildSlides(sorted);
    })
    .catch(() => buildSlides(fallbackImages));

  updateIndicator();
});
