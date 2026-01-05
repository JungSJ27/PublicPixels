// cha.js

/* 여기만 너 R2 경로랑 파일명으로 바꾸면 바로 뜸 */
const BASE = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/cha/";

const files = [
  "cha1.jpg",
  "cha2.jpg",
  "cha3.jpg",
  "cha4.jpg",
  "cha5.jpg",
  "cha6.jpg",
  "cha7.jpg",
  "cha8.jpg",
  "cha9.jpg",
  "cha10.jpg",
  "cha11.jpg",
  "cha12.jpg"
];

const patterns = files.map((name, i) => ({
  name,
  label: name.replace(/\.[a-z0-9]+$/i, ""),
  group: "pattern",
  index: i
}));

const track = document.getElementById("patternTrack");
const viewport = document.getElementById("patternViewport");
const statCount = document.getElementById("statCount");

function imgUrl(name){
  return `${BASE}${name}`;
}

function makeTile(item){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tile";
  btn.dataset.index = String(item.index);

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = item.label;
  img.src = imgUrl(item.name);

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = item.label;

  btn.appendChild(img);
  btn.appendChild(tag);

  btn.addEventListener("click", () => openModal(item.index));
  return btn;
}

function render(){
  track.innerHTML = "";
  patterns.forEach((p) => track.appendChild(makeTile(p)));
  if (statCount) statCount.textContent = `${patterns.length} tiles`;
}
render();

/* 헤더 액션 숨김 보강 */
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

/* keyboard for list toggle */
const listToggle = document.querySelector(".list-toggle");
if (listToggle) {
  listToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") listToggle.click();
  });
}

/* modal */
const modal = document.getElementById("chaModal");
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
  modalImg.src = imgUrl(item.name);
  modalImg.alt = item.label;
  modalTitle.textContent = item.label;
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
