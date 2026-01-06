// saz.js
const BASE = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/saz/";

/* ===============================
   DATA
================================ */
const patterns = [
  { id: 7, group: "motif 1", size: "size-xl" },
  { id: 5, group: "motif 1 var", size: "size-md" },
  { id: 6, group: "motif 1 var", size: "size-md" },
  { id: 4, group: "motif 1 var", size: "size-tall" },

  { id: 2, group: "motif 1 2", size: "size-lg" },

  { id: 8, group: "geometric", size: "size-md" },
  { id: 9, group: "geometric", size: "size-md" },
  { id: 10, group: "geometric", size: "size-md" },
  { id: 11, group: "geometric", size: "size-md" },
  { id: 12, group: "geometric", size: "size-tall" },

  { id: 13, group: "butterfly", size: "size-lg" },
  { id: 14, group: "butterfly", size: "size-md" },

  { id: 15, group: "flower", size: "size-lg" },
  { id: 16, group: "flower var", size: "size-md" },
  { id: 17, group: "flower var", size: "size-md" },
  { id: 18, group: "flower var", size: "size-tall" }
];

function imgUrl(id){
  return `${BASE}saz${id}.png`;
}

function clampIndex(i){
  const n = patterns.length;
  return ((i % n) + n) % n;
}

/* ===============================
   DOM
================================ */
const track = document.getElementById("patternTrack");
const viewport = document.getElementById("patternViewport");

const modal = document.getElementById("sazModal");
const mixMainImg = document.getElementById("mixMainImg");
const mixTopImg = document.getElementById("mixTopImg");
const mixBottomImg = document.getElementById("mixBottomImg");
const mixTitle = document.getElementById("mixTitle");

const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");

/* ===============================
   RENDER TILES
================================ */
function makeTile(item, index){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `tile ${item.size}`;
  btn.dataset.index = String(index);

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = `saz${item.id}`;
  img.src = imgUrl(item.id);
  img.draggable = false;

  btn.appendChild(img);
  btn.addEventListener("click", () => openModal(index));
  return btn;
}

function render(){
  if (!track) return;
  track.innerHTML = "";
  patterns.forEach((p, i) => track.appendChild(makeTile(p, i)));
}
render();

/* ===============================
   HEADER CLEANUP + HEIGHT SYNC
================================ */
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

function syncHeaderHeight(){
  const header = document.querySelector("header");
  if(!header) return;
  const h = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--header-h", `${h}px`);
}

function waitForHeaderThenInit(){
  const header = document.querySelector("header");
  if (header){
    removeHeaderActions();
    syncHeaderHeight();

    if ("ResizeObserver" in window){
      const ro = new ResizeObserver(syncHeaderHeight);
      ro.observe(header);
    }
    return;
  }

  const t0 = performance.now();
  const timer = setInterval(() => {
    const h = document.querySelector("header");
    if (h){
      clearInterval(timer);
      removeHeaderActions();
      syncHeaderHeight();

      if ("ResizeObserver" in window){
        const ro = new ResizeObserver(syncHeaderHeight);
        ro.observe(h);
      }
    } else if (performance.now() - t0 > 2000){
      clearInterval(timer);
    }
  }, 60);
}

window.addEventListener("load", () => {
  waitForHeaderThenInit();
  window.addEventListener("resize", syncHeaderHeight);
});

/* ===============================
   SCROLL UX
================================ */
function wheelToHorizontal(e){
  if (!viewport) return;

  const absY = Math.abs(e.deltaY);
  const absX = Math.abs(e.deltaX);

  if (absY > absX){
    e.preventDefault();
    viewport.scrollLeft += e.deltaY;
  }
}

if (viewport){
  viewport.addEventListener("wheel", wheelToHorizontal, { passive: false });

  let isDown = false;
  let startX = 0;
  let startLeft = 0;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.clientX;
    startLeft = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    isDown = false;
    viewport.classList.remove("is-dragging");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const dx = e.clientX - startX;
    viewport.scrollLeft = startLeft - dx;
  });

  viewport.addEventListener("mouseleave", () => {
    isDown = false;
    viewport.classList.remove("is-dragging");
  });
}

/* list toggle keyboard */
const listToggle = document.querySelector(".list-toggle");
if (listToggle){
  listToggle.setAttribute("role", "button");
  listToggle.setAttribute("tabindex", "0");
  listToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") listToggle.click();
  });
}

/* ===============================
   MIX MODAL (3 patterns)
================================ */
let current = 0;
let randA = 0;
let randB = 0;

function pickTwoRandom(excludeIndex){
  const pool = [];
  for (let i = 0; i < patterns.length; i++){
    if (i !== excludeIndex) pool.push(i);
  }

  const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  const b = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  return [a, b];
}

function makeComboName(mainId, aId, bId){
  const w1 = ["Saz", "Turuqurie", "Ornament", "Rhythm", "Weave", "Tile", "Wall", "Mix"];
  const w2 = ["Echo", "Bloom", "Grid", "Stripe", "Pulse", "Garden", "Night", "Drift"];
  const A = w1[Math.floor(Math.random() * w1.length)];
  const B = w2[Math.floor(Math.random() * w2.length)];
  return `${A} ${B} saz${mainId} · saz${aId} · saz${bId}`;
}

function syncMix(){
  if (!mixMainImg || !mixTopImg || !mixBottomImg) return;

  const main = patterns[current];
  const top = patterns[randA];
  const bottom = patterns[randB];

  mixMainImg.src = imgUrl(main.id);
  mixMainImg.alt = `saz${main.id}`;

  mixTopImg.src = imgUrl(top.id);
  mixTopImg.alt = `saz${top.id}`;

  mixBottomImg.src = imgUrl(bottom.id);
  mixBottomImg.alt = `saz${bottom.id}`;

  if (mixTitle){
    mixTitle.textContent = makeComboName(main.id, top.id, bottom.id);
  }
}

function openModal(index){
  if (!modal) return;

  current = clampIndex(index);
  [randA, randB] = pickTwoRandom(current);
  syncMix();

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(){
  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

if (modalPrev){
  modalPrev.addEventListener("click", () => {
    current = clampIndex(current - 1);
    [randA, randB] = pickTwoRandom(current);
    syncMix();
  });
}

if (modalNext){
  modalNext.addEventListener("click", () => {
    current = clampIndex(current + 1);
    [randA, randB] = pickTwoRandom(current);
    syncMix();
  });
}

/* backdrop or close button */
if (modal){
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.close === "1") closeModal();
  });
}

/* keyboard */
document.addEventListener("keydown", (e) => {
  if (!modal || !modal.classList.contains("show")) return;

  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft" && modalPrev) modalPrev.click();
  if (e.key === "ArrowRight" && modalNext) modalNext.click();
});
