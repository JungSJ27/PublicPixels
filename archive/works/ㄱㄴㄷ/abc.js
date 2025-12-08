/* WAIT FOR headerLoader TO FINISH */
document.addEventListener("DOMContentLoaded", () => {

  const waitHeader = setInterval(() => {
    const header = document.querySelector("header");
    if (!header) return;

    clearInterval(waitHeader);
    initHeaderScroll(header);
    initLightbox();
  }, 30);

});


/* -------------------------------
   HEADER SCROLL BEHAVIOR
-------------------------------- */
function initHeaderScroll(header) {
  const listToggle = document.querySelector(".list-toggle");
  let lastY = window.scrollY;

  function toggle(hide) {
    header.classList.toggle("header-hidden", hide);
    listToggle.classList.toggle("header-hidden", hide);
  }

  if (window.scrollY > 10) toggle(true);

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    if (y < 10) {
      toggle(false);
      lastY = y;
      return;
    }

    if (y < lastY) toggle(false);
    else toggle(true);

    lastY = y;
  });
}


/* -------------------------------
   LIGHTBOX
-------------------------------- */
function initLightbox() {
  const img = document.querySelector(".main-img");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  img.addEventListener("click", () => {
    lightboxImg.src = img.src;
    lightbox.classList.add("active");
  });

  lightbox.addEventListener("click", () => {
    lightbox.classList.remove("active");
  });
}
