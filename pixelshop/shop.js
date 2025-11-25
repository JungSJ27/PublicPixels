// Shop.js — 중앙 정렬 필터바, 카드 그리드, 좌정렬 자동 토글, 쿼리 동기화
const DATA_URL = "./shop.json";

const els = {
  grid:  document.getElementById("grid"),
  empty: document.getElementById("empty"),
  q:     document.getElementById("q"),
  type:  document.getElementById("type"),
  color: document.getElementById("color"),
  price: document.getElementById("price"),
  sort:  document.getElementById("sort"),
  tpl:   document.getElementById("card-tpl"),
  clear: document.getElementById("btn-clear"),
  bar:   document.getElementById("bar"),
};

let ITEMS = [];
let VIEW  = [];

// ⬇️ 파일 맨 위 유틸들 근처(ready/init 위)에 배치
const clearFilters = () => {
  if (els.q)     els.q.value = "";
  if (els.type)  els.type.value = "";
  if (els.color) els.color.value = "";
  if (els.price) els.price.value = "";
  if (els.sort)  els.sort.value = "new";
  history.replaceState(null, "", location.pathname);
  render();
  els.q?.focus();
};

ready(init);

function ready(fn){
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}

async function init(){
  try{
    ITEMS = await fetchJSON(DATA_URL);
  }catch(e){
    console.error(e);
    if (els.empty){
      els.empty.hidden = false;
      els.empty.textContent = "Failed to load Shop.json";
    }
    return;
  }
  buildOptionsFromData(ITEMS);

  bindUI();

  if (els.clear && typeof clearFilters === "function") {
    els.clear.addEventListener("click", clearFilters);
    els.clear.addEventListener("keydown", (e)=>{
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        clearFilters();
      }
  });
}

  hydrateFromQuery();
  render();
  autoJustifyGrid();
  ensureFilterStart();

  // 창 크기 변경 시 재계산
  window.addEventListener("resize", debounce(()=>{
    autoJustifyGrid();
    ensureFilterStart();
  }, 120));

  /* 여기 추가 */
  window.addEventListener("orientationchange", () => {
    setTimeout(ensureFilterStart, 60);   // 레이아웃 안정화 후 좌측으로 스냅
  });

  /* bfcache 복귀 시 보정도 함께 */
  window.addEventListener("pageshow", () => {
    document.dispatchEvent(new Event("productsRendered"));
    ensureFilterStart();
  });
}

async function fetchJSON(url){
  const res = await fetch(url, { cache:"no-store" });
  if (!res.ok) throw new Error(res.status + " " + res.statusText);
  return res.json();
}

function bindUI(){
  const rerender = () => { render(); pushQuery(); };
  els.q?.addEventListener("input", debounce(rerender, 120));
  ["type","color","price","sort"].forEach(id => els[id]?.addEventListener("change", rerender));
}

function render(){
  const q = (els.q?.value || "").trim().toLowerCase();
  const type = els.type?.value || "";
  const color = (els.color?.value || "").toLowerCase();
  const price = els.price?.value || "";
  const sort = els.sort?.value || "new";

  const [lo, hi] = price ? price.split("-").map(n=>parseFloat(n)) : [null, null];

  VIEW = ITEMS.filter(a=>{
    if (q){
      const hay = [a.title, a.id, a.category, a.color].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (type && (a.category || "") !== type) return false;
    if (color && (String(a.color || "").toLowerCase() !== color)) return false;
    if (price){
      const p = Number(a.price || 0);
      if (lo!=null && p < lo) return false;
      if (hi!=null && p > hi) return false;
    }
    return true;
  });

  VIEW.sort((A,B)=>{
    switch (sort){
      case "price-asc":  return (A.price||0) - (B.price||0);
      case "price-desc": return (B.price||0) - (A.price||0);
      case "az":         return (A.title||"").localeCompare(B.title||"");
      case "new":
      default:           return dateKey(B) - dateKey(A) || (A.title||"").localeCompare(B.title||"");
    }
  });

  els.grid?.replaceChildren();
  if (!VIEW.length){
    els.empty.hidden = false;
    document.dispatchEvent(new Event("productsRendered"));
    autoJustifyGrid();
    return;
  }
  els.empty.hidden = true;

  const frag = document.createDocumentFragment();
  VIEW.forEach((a,i)=>{
    const el = card(a);
    el.style.setProperty("--i", i);
    frag.appendChild(el);
  });
  els.grid?.appendChild(frag);

  // 하트 주입 트리거
  document.dispatchEvent(new Event("productsRendered"));

  // 카드가 적을 때 좌정렬 전환
  autoJustifyGrid();
}

function card(a){
  const el = els.tpl.content.firstElementChild.cloneNode(true);

  el.dataset.id    = a.id;
  el.dataset.price = String(a.price || 0);
  el.dataset.cat   = a.category || "";

  const link  = el.querySelector(".card__media");
  const img   = el.querySelector(".card__img");
  const title = el.querySelector(".card__title");
  const price = el.querySelector(".card__price");

  if (link)  link.href = a.href || "#";
  if (img){
    img.src = a.thumb?.src || a.image || "";
    img.alt = a.thumb?.alt || a.title || "";
  }
  if (title) title.textContent = a.title || "";
  if (price) price.textContent = toUSD(a.price);

  return el;
}

function ensureFilterStart(){
  const bar = els.bar;
  if (!bar) return;
  // 강제 좌측 정렬
  bar.scrollLeft = 0;
  // 스냅 포인트가 있을 때 첫 요소로 살짝 당겨주기
  const first = bar.querySelector(":scope > *");
  if (first) first.scrollIntoView({ inline: "start", block: "nearest" });
}


/* ===== 좌정렬 자동 토글 (Artworks 느낌) =====
   규칙: 그리드 내부 남는 공간이 "카드 최소폭 + 칼럼 간격" 이상이면 .grid-left 부여
*/
function autoJustifyGrid(){
  const grid = document.getElementById('grid');
  if (!grid) return;

  const root  = getComputedStyle(document.documentElement);
  const minW  = parseFloat(root.getPropertyValue('--tile-min')) || 220;
  const maxW  = parseFloat(root.getPropertyValue('--tile-max')) || 320;
  const gap   = parseFloat(getComputedStyle(grid).gap) || 0;

  const w   = grid.clientWidth;
  const n   = grid.children.length;
  if (!n || !w){ grid.classList.remove('grid-left'); return; }

  // 현재 화면에서 "최대폭 카드" 기준으로 들어갈 수 있는 칼럼 수
  const cols = Math.min(n, Math.max(1, Math.floor((w + gap) / (maxW + gap))));
  const used = cols * maxW + (cols - 1) * gap;
  const leftover = w - used;

  // 남는 공간이 "최소 카드폭 + gap" 이상이면 왼쪽 정렬
  grid.classList.toggle('grid-left', leftover >= (minW + gap)*1.5);
}


/* utils */
function dateKey(a){
  const t = Date.parse(a.created || "") || 0;
  return Number.isFinite(t) ? t : 0;
}
function toUSD(n){
  const v = Number(n||0);
  return isFinite(v) ? `$ ${v.toFixed(2)}` : "$ 0.00";
}
function debounce(fn, ms){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), ms);
  };
}

/* URL 쿼리 동기화 */
function pushQuery(){
  const p = new URLSearchParams();
  const q = (els.q?.value || "").trim(); if (q) p.set("q", q);
  if (els.type?.value)  p.set("type", els.type.value);
  if (els.color?.value) p.set("color", els.color.value);
  if (els.price?.value) p.set("price", els.price.value);
  if (els.sort?.value)  p.set("sort", els.sort.value);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `${location.pathname}?${qs}` : location.pathname);
}
function hydrateFromQuery(){
  const p = new URLSearchParams(location.search);
  if (p.get("q")     && els.q)     els.q.value = p.get("q");
  if (p.get("type")  && els.type)  els.type.value = p.get("type");
  if (p.get("color") && els.color) els.color.value = p.get("color");
  if (p.get("price") && els.price) els.price.value = p.get("price");
  if (p.get("sort")  && els.sort)  els.sort.value = p.get("sort");
}

/* ===== JSON 기반 옵션 빌드 (대소문자 보존, 중복은 대소문자 무시) ===== */

// 보기용 포맷(원문 보존이 목적이라 trim만)
function toTitle(s){
  return String(s || "").trim();
}

// 첫 등장한 표기를 보존하면서(Blue, Silver 등) 대소문자 무시 중복 제거 + 알파 정렬
function uniqueSortedPreserveCase(arr){
  const seen = new Map(); // key: lowercased, value: first-seen original
  for (const raw of arr){
    const v = String(raw || "").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) seen.set(k, v);
  }
  // 정렬은 대소문자 무시해서 자연스럽게
  return [...seen.values()].sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:"base"}));
}

function populateSelect(sel, allLabel, values){
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = allLabel;
  sel.appendChild(optAll);

  values.forEach(v=>{
    const o = document.createElement("option");
    o.value = v;                 // 원문 그대로 value 보존
    o.textContent = toTitle(v);  // 표시도 원문 그대로
    sel.appendChild(o);
  });

  if ([...sel.options].some(o=>o.value === prev)) sel.value = prev;
  else sel.value = "";
}

function buildOptionsFromData(items){
  // type은 type 우선, 없으면 category
  const types  = uniqueSortedPreserveCase(items.map(x => x.type || x.category || ""));
  const colors = uniqueSortedPreserveCase(items.map(x => x.color));

  populateSelect(els.type,  "All types",  types);
  populateSelect(els.color, "All colors", colors);
  // price, sort는 고정 옵션 유지
}
