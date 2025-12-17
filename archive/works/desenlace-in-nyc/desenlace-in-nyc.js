const lightbox = document.getElementById("lightbox");
const content = lightbox.querySelector(".lightbox-content");
const boxes = Array.from(document.querySelectorAll(".box"));

const prevBtn = document.querySelector(".lb-arrow.left");
const nextBtn = document.querySelector(".lb-arrow.right");

let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  content.innerHTML = "";

  const el = boxes[currentIndex];

  if (el.tagName === "IMG") {
    const img = document.createElement("img");
    img.src = el.src;
    content.appendChild(img);
  }

  if (el.tagName === "VIDEO") {
    const video = document.createElement("video");
    video.src = el.src;
    video.controls = true;
    video.autoplay = true;
    video.muted = false;
    content.appendChild(video);
  }

  lightbox.classList.add("active");
}

function closeLightbox() {
  content.innerHTML = "";
  lightbox.classList.remove("active");
}

function showNext() {
  openLightbox((currentIndex + 1) % boxes.length);
}

function showPrev() {
  openLightbox(
    (currentIndex - 1 + boxes.length) % boxes.length
  );
}

// box 클릭
boxes.forEach((box, i) => {
  box.addEventListener("click", () => openLightbox(i));
});

// 화살표 클릭
nextBtn.addEventListener("click", e => {
  e.stopPropagation();
  showNext();
});

prevBtn.addEventListener("click", e => {
  e.stopPropagation();
  showPrev();
});

// 배경 클릭 닫기
lightbox.addEventListener("click", closeLightbox);

// 키보드 컨트롤
document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("active")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrev();
});

const closeBtn = document.querySelector(".lb-close");

closeBtn.addEventListener("click", e => {
  e.stopPropagation();
  closeLightbox();
});
