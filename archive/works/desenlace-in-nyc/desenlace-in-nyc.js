const strip = document.querySelector(".media-strip");

strip.addEventListener("wheel", (e) => {
  e.preventDefault();
  strip.scrollLeft += e.deltaY;
}, { passive: false });
