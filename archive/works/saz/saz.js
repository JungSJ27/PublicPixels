// saz.js
const BASE = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/saz/";

const patterns = [
  // 1 motif 1 and 3 variations
  { id: 1, group: "motif 1", size: "size-xl" },
  { id: 2, group: "motif 1 var", size: "size-md" },
  { id: 3, group: "motif 1 var", size: "size-md" },
  { id: 4, group: "motif 1 var", size: "size-tall" },

  // 1 2
  { id: 5, group: "motif 1 2", size: "size-lg" },

  // solids 2
  { id: 6, group: "solid", size: "size-wide" },
  { id: 7, group: "solid", size: "size-wide" },

  // geometric 5
  { id: 8, group: "geometric", size: "size-md" },
  { id: 9, group: "geometric", size: "size-md" },
  { id: 10, group: "geometric", size: "size-md" },
  { id: 11, group: "geometric", size: "size-md" },
  { id: 12, group: "geometric", size: "size-tall" },

  // butterfly 2
  { id: 13, group: "butterfly", size: "size-lg" },
  { id: 14, group: "butterfly", size: "size-md" },

  // flower 1 and 3 variations
  { id: 15, group: "flower", size: "size-lg" },
  { id: 16, group: "flower var", size: "size-md" },
  { id: 17, group: "flower var", size: "size-md" },
  { id: 18, group: "flower var", size: "size-wide" }
];

const track = document.getElementById("patternTrack");
const viewport = document.getElementById("patternViewport");

function imgUrl(id){
  return `${BASE}saz${id}.png`;
}

function makeTile(item, index){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `tile ${item.size}`;
  btn.dataset.index = String(index);

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = `saz${item.id}`;
  img.src = imgUrl(item.id);

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = `saz${item.id}`;

  btn.appendChild(img);
  btn.appendChild(tag);

  btn.addEventListener("click", () => openModal(index));
  return btn;
}

function render(){
  track.innerHTML = "";
  patterns.forEach((p, i) => track.appendChild(makeTile(p, i)));
}
render();

/* hide header icons robustly, if the header HTML changes */
function removeHeaderActions(){
  const header = document.querySelector("header");
  if (!header) return;

  const killers = [
    ".search-icon",
    ".shop-toggle",
    "a[href*='cart']",
    "a[href*='Cart']",
    "a[href*='search']",
    "button[aria-label*='Search']",
    "button[aria-label*='Cart']"
  ];

  killers.forEach((sel) => {
    header.querySelectorAll(sel).forEach((el) => {
      el.style.display = "none";
    });
  });
}
window.addEventListener("load", removeHeaderActions);

/* wheel to horizontal scroll */
function wheelToHorizontal(e){
  if (!viewport) return;

  const absY = Math.abs(e.deltaY);
  const absX = Math.abs(e.deltaX);

  if (absY > absX) {
    e.preventDefault();
    viewport.scrollLeft += e.deltaY;
  }
}
viewport.addEventListener("wheel", wheelToHorizontal, { passive: false });

/* drag to scroll */
let isDown = false;
let startX = 0;
let startLeft = 0;

viewport.addEventListener("mousedown", (e) => {
  isDown = true;
  startX = e.clientX;
  startLeft = viewport.scrollLeft;
});

window.addEventListener("mouseup", () => { isDown = false; });

window.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  const dx = e.clientX - startX;
  viewport.scrollLeft = startLeft - dx;
});

/* keyboard accessibility for list toggle */
const listToggle = document.querySelector(".list-toggle");
if (listToggle) {
  listToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") listToggle.click();
  });
}

/* modal */
const modal = document.getElementById("sazModal");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalSub = document.getElementById("modalSub");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");

let current = 0;

function openModal(index){
  current = index;
  syncModal();
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function syncModal(){
  const item = patterns[current];
  modalImg.src = imgUrl(item.id);
  modalImg.alt = `saz${item.id}`;
  modalTitle.textContent = `saz${item.id}`;
  modalSub.textContent = item.group;
}

modalPrev.addEventListener("click", () => {
  current = (current - 1 + patterns.length) % patterns.length;
  syncModal();
});

modalNext.addEventListener("click", () => {
  current = (current + 1) % patterns.length;
  syncModal();
});

modal.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.dataset.close === "1") closeModal();
});

document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("show")) return;

  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft") modalPrev.click();
  if (e.key === "ArrowRight") modalNext.click();
});
