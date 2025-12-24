const card = document.getElementById("flipCard");
const lens = document.getElementById("magnifier");

let flipped = false;

/* ===============================
   FLIP TRIGGER
================================ */

card.addEventListener("click", () => {
  flipped = !flipped;
  card.classList.toggle("is-flipped", flipped);
});

/* ===============================
   MAGNIFIER (DESKTOP)
================================ */

card.addEventListener("mousemove", (e) => {
  if (window.innerWidth < 768) return;

  const activeImg = card.querySelector(
    flipped ? ".flip-back img" : ".flip-front img"
  );

  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  lens.style.opacity = 1;
  lens.style.left = `${x - 80}px`;
  lens.style.top  = `${y - 80}px`;

  const px = (x / rect.width) * 100;
  const py = (y / rect.height) * 100;

  lens.style.backgroundImage = `url(${activeImg.src})`;
  lens.style.backgroundPosition = `${px}% ${py}%`;
});

card.addEventListener("mouseleave", () => {
  lens.style.opacity = 0;
});
