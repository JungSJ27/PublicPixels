const slider = document.getElementById("slider");
const indicator = document.getElementById("sliderIndicator");

let index = 0;
const totalSlides = slider.children.length;

function updateIndicator() {
  indicator.textContent = `${index + 1} / ${totalSlides}`;
}

function nextSlide() {
  index = (index + 1) % totalSlides;
  slider.scrollTo({
    left: slider.clientWidth * index,
    behavior: "smooth"
  });
  updateIndicator();
}

function prevSlide() {
  index = (index - 1 + totalSlides) % totalSlides;
  slider.scrollTo({
    left: slider.clientWidth * index,
    behavior: "smooth"
  });
  updateIndicator();
}

// Swipe detection (mobile)
let startX = 0;

slider.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

slider.addEventListener("touchend", (e) => {
  let endX = e.changedTouches[0].clientX;
  if (endX < startX - 50) nextSlide();
  if (endX > startX + 50) prevSlide();
});

// Click to slide (desktop)
slider.addEventListener("click", () => nextSlide());

updateIndicator();
