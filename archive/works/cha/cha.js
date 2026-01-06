// cha.js
const BASE = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/cha/";

/* ===============================
   DATA
================================ */
const patterns = Array.from({ length: 18 }, (_, i) => ({ id: i + 1 }));

function imgUrl(id){
  return `${BASE}cha${id}.png`;
}

/* ===============================
   DOM
================================ */
const track = document.getElementById("patternTrack");
const viewport = document.getElementById("patternViewport");

/* modal dom
   HTML에서 id를 바꾸지 않았다면 sazModal 그대로 사용
   만약 HTML에서 id="chaModal"로 바꿨으면 아래 줄도 chaModal로 바꿔 */
const modal = document.getElementById("chaModal");

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

  // ✅ size 클래스 제거 (모든 타일 동일 크기)
  btn.className = "tile";

  btn.dataset.index = String(index);

  const img = document.createElement("img");
  img.loading = "lazy";

  // ✅ alt saz -> cha
  img.alt = `cha${item.id}`;

  img.src = imgUrl(item.id);
  img.draggable = false;

  btn.appendChild(img);
  btn.addEventListener("click", () => openMixModal(index));
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
   MIX MODAL LOGIC (single pattern)
================================ */

let current = 0;

function clampIndex(i){
  const n = patterns.length;
  return (i % n + n) % n;
}

function syncMix(){
  if (!modal) return;

  const main = patterns[current];
  if (!main) return;

  // 선택된 한 장만 표시
  if (mixMainImg){
    mixMainImg.src = imgUrl(main.id);
    mixMainImg.alt = `cha${main.id}`;
  }

  // 기존 3분할용 이미지 비우기
  if (mixTopImg){
    mixTopImg.src = "";
    mixTopImg.alt = "";
  }
  if (mixBottomImg){
    mixBottomImg.src = "";
    mixBottomImg.alt = "";
  }

  // 타이틀도 심플하게
  if (mixTitle){
    mixTitle.textContent = `cha${main.id}`;
  }
}

function openMixModal(index){
  if (!modal) return;
  current = clampIndex(index);
  syncMix();
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeMixModal(){
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

/* buttons */
if (modalPrev){
  modalPrev.addEventListener("click", () => {
    current = clampIndex(current - 1);
    syncMix();
  });
}

if (modalNext){
  modalNext.addEventListener("click", () => {
    current = clampIndex(current + 1);
    syncMix();
  });
}

/* backdrop + close */
if (modal){
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.close === "1") closeMixModal();
  });
}

/* keyboard */
document.addEventListener("keydown", (e) => {
  if (!modal || !modal.classList.contains("show")) return;

  if (e.key === "Escape") closeMixModal();
  if (e.key === "ArrowLeft" && modalPrev) modalPrev.click();
  if (e.key === "ArrowRight" && modalNext) modalNext.click();
});
