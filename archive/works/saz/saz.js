// saz.js
const BASE = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/saz/";

/* ===============================
   DATA
================================ */
const patterns = [
  { id: 7, group: "motif 1", size: "size-xl" },
  { id: 17, group: "motif 1 var", size: "size-md" },
  { id: 15, group: "motif 1 var", size: "size-md" },
  { id: 2, group: "motif 1 var", size: "size-tall" },

  { id: 14, group: "motif 1 2", size: "size-xl" },

  { id: 16, group: "geometric", size: "size-md" },
  { id: 9, group: "geometric", size: "size-md" },
  { id: 11, group: "geometric", size: "size-md" },
  { id: 4, group: "geometric", size: "size-tall" },
  { id: 10, group: "geometric", size: "size-tall" },
  { id: 12, group: "geometric", size: "size-tall" },

  { id: 13, group: "butterfly", size: "size-lg" },
  { id: 8, group: "butterfly", size: "size-md" },

  { id: 5, group: "flower", size: "size-lg" },
  { id: 3, group: "flower var", size: "size-md" },
  { id: 18, group: "flower var", size: "size-md" },
  { id: 1, group: "flower var", size: "size-tall" }
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

/* modal dom */
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
   MIX MODAL LOGIC (fortune title)
================================ */

let current = 0;
let randA = 0;
let randB = 0;

function pickTwoRandomIndices(excludeIndex){
  const pool = [];
  for (let i = 0; i < patterns.length; i++){
    if (i !== excludeIndex) pool.push(i);
  }

  // 안전장치: 패턴이 3개 미만이면 랜덤 두 개 못 뽑음
  if (pool.length < 2){
    return [excludeIndex, excludeIndex];
  }

  const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  const b = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  return [a, b];
}

function makeFortuneTitle(mainId, aId, bId){
  const badges = ["FORTUNE", "LUCK", "AURA", "OMEN", "TAROT", "ORACLE", "VIBE", "SIGN"];
  const moods = ["대길", "길", "중길", "소길", "상승", "호조", "재물", "연애", "영감", "집중", "전환", "확장"];
  const verbs = ["열리는", "끌리는", "번지는", "겹치는", "정렬되는", "흐르는", "반짝이는", "진입하는"];
  const nouns = ["패턴운", "색감운", "리듬운", "관계운", "작업운", "선택운", "공간운", "감각운"];
  const extras = [
    "오늘은 과감히",
    "지금은 믹스가 답",
    "왼쪽이 주인공",
    "대칭이 행운",
    "블루가 키 컬러",
    "텍스처가 승부",
    "반복이 안정",
    "변주가 포인트"
  ];

  const badge = badges[Math.floor(Math.random() * badges.length)];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const extra = extras[Math.floor(Math.random() * extras.length)];

  return {
    badge,
    text: `${mood} ${verb} ${noun} · ${extra}`
  };
}

function rollRandoms(){
  const [a, b] = pickTwoRandomIndices(current);
  randA = a;
  randB = b;
}

function syncMix(){
  if (!modal) return;

  const main = patterns[current];
  const top = patterns[randA];
  const bottom = patterns[randB];

  if (!main || !top || !bottom) return;

  if (mixMainImg){
    mixMainImg.src = imgUrl(main.id);
    mixMainImg.alt = `saz${main.id}`;
  }
  if (mixTopImg){
    mixTopImg.src = imgUrl(top.id);
    mixTopImg.alt = `saz${top.id}`;
  }
  if (mixBottomImg){
    mixBottomImg.src = imgUrl(bottom.id);
    mixBottomImg.alt = `saz${bottom.id}`;
  }

  if (mixTitle){
    const t = makeFortuneTitle(main.id, top.id, bottom.id);
    // CSS에서 .mix-badge 스타일 적용됨
    mixTitle.innerHTML = `<span class="mix-badge">${t.badge}</span>${t.text}`;
  }
}

function openMixModal(index){
  if (!modal) return;
  current = clampIndex(index);
  rollRandoms();
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
    rollRandoms();
    syncMix();
  });
}

if (modalNext){
  modalNext.addEventListener("click", () => {
    current = clampIndex(current + 1);
    rollRandoms();
    syncMix();
  });
}

/* backdrop + close
   data-close="1"이 backdrop, X버튼, Close버튼(있다면) 중 원하는 곳에 붙어있으면 닫힘 */
if (modal){
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    // backdrop 클릭 또는 닫기 요소 클릭
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
