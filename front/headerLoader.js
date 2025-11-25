// /Front/headerLoader.js — header + cart panel robust boot (idempotent)
(function () {
  // ---------- tiny utils ----------
  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  async function fetchText(url) {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    return res.text();
  }

  // <head>에 CSS 중복 없이 보장
  function ensureCSS(href) {
    const abs = new URL(href, location.origin).href;
    if ([...document.styleSheets].some(s => s.href === abs)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  // keep your partial registry (dev fallback)
  window.PP_PARTIALS = Object.assign(window.PP_PARTIALS || {}, {
    cart: "/front/cartpanel.html",
  });

  // ---------- header height css var ----------
  function setHeaderVar() {
    const h = document.querySelector("body > header, body header")?.offsetHeight || 56;
    document.documentElement.style.setProperty("--header-h", h + "px");
  }
  function wireResizeFontEvents() {
    setHeaderVar();
    window.addEventListener("resize", setHeaderVar, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setHeaderVar).catch(() => {});
    }
    window.addEventListener("load", setHeaderVar, { passive: true });
  }


// ---------- make sure icons are self-owned (FA->SVG) ----------
function hardenHeaderIcons() {
  const si = document.querySelector("header .search-icon");
  if (!si) return;

  // SVG 자식은 이벤트 비활성화, 컨테이너만 활성
  si.querySelectorAll("svg, svg *").forEach(n => n.style.pointerEvents = "none");
  si.style.pointerEvents = "auto";

  // 접근성(역할/탭) 보강
  si.setAttribute("role", "button");
  si.setAttribute("tabindex", "0");
  si.setAttribute("aria-label", "Open search");
}

   // 검색 패널 모듈 로더
  async function loadSearchPanel(){
    try {
      // 스타일 보장
      ensureCSS("/front/search.css");
      // 모듈 로드
      const mod = await import("/front/search.js");
      if (mod?.ensureSearchPanel) mod.ensureSearchPanel();
    } catch (e) {
      console.error("Search panel boot failed:", e);
    }
  }

  // ---------- search bar ----------
function setupSearchBar() {
  const root = document;

  // 1 보장 마크업 생성
  let bar = root.getElementById("search-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "search-bar";
    bar.className = "search-bar hidden";
    bar.innerHTML = `
      <div class="search-input-wrapper">
        <input type="text" id="search-input" placeholder="Search through Public Pixels" />
        <span id="clear-search" class="clear-btn">×</span>
      </div>
      <div id="search-results" class="search-results"></div>
    `;
    document.body.appendChild(bar);
  }

  const input   = root.getElementById("search-input");
  const results = root.getElementById("search-results");

  // 2 아이콘 찾기
  const icon = root.querySelector('header .search-icon[data-open-search]')
            || root.querySelector('header .search-icon');
  if (!bar || !input || !results || !icon) return;

  // 3 백드롭 보장
  let backdrop = root.getElementById("search-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "search-backdrop";
    backdrop.className = "search-backdrop hidden";
    document.body.appendChild(backdrop);
  }

  // clear 버튼 보장
  let clear = root.getElementById("clear-search");
  if (!clear) {
    clear = root.createElement("span");
    clear.id = "clear-search";
    clear.className = "clear-btn";
    clear.textContent = "×";
    (bar.querySelector(".search-input-wrapper") || bar).appendChild(clear);
  }


  let currentIndex = -1;

  function showBackdrop() {
    backdrop.classList.remove("hidden");
    const top = getComputedStyle(document.documentElement).getPropertyValue("--header-h") || "56px";
    backdrop.style.top = top.trim();
    backdrop.style.height = `calc(100vh - ${top.trim()})`;
  }
  function hideBackdrop(){ backdrop.classList.add("hidden"); }
  function closeSearch(){ bar.classList.add("hidden"); results.innerHTML=""; hideBackdrop(); }

  function renderRecommendations(arr){
    currentIndex = -1;
    results.innerHTML = `<div class="search-results-grid">
      ${arr.map((d,i)=>`<div class="recommend-item" data-index="${i}" data-link="${d.link}">${d.title}</div>`).join("")}
    </div>`;
  }
  function renderResults(filtered){
    currentIndex = 0;
    results.innerHTML = `<div class="search-results-images">
      ${filtered.map((it,i)=>`
        <div class="search-card${i===0?" highlighted":""}">
          <img class="search-image" src="${it.image}" alt="${it.title}" />
          <div class="card-title">${it.title}</div>
        </div>`).join("")}
    </div>`;
  }

  function toggleSearch(){
    if (typeof window.closeCart === "function") window.closeCart();
    const willOpen = bar.classList.contains("hidden");
    if (willOpen){
      bar.classList.remove("hidden");
      input.value = ""; results.innerHTML = "";
      input.focus(); renderRecommendations(data); showBackdrop();
      const btn = document.querySelector("header .search-icon");
      if (btn) btn.setAttribute("aria-expanded","true");
      clear.setAttribute("role","button");
      clear.setAttribute("aria-label","Clear or close search");
      clear.tabIndex = 0;
      clear.style.display = "block";
    } else {
      closeSearch();
      const btn = document.querySelector("header .search-icon");
      if (btn) btn.setAttribute("aria-expanded","false");
    }
  }
  window.toggleSearch = toggleSearch;
  window.closeSearch  = closeSearch;

  // ✅ 단 하나의 위임 바인딩 (SVG/폰트 상관없이 항상 작동)
  if (!window.__ppSearchDelegated){
    window.__ppSearchDelegated = true;

    document.addEventListener("click", (e)=>{
      const btn = e.target.closest("header .search-icon");
      if (!btn) return;
      e.preventDefault();
      toggleSearch();
    }, { passive:false });

    document.addEventListener("keydown", (e)=>{
      const btn = e.target.closest("header .search-icon");
      if (!btn) return;
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        toggleSearch();
      }
    });
  }

  // backdrop/clear/input
  backdrop.addEventListener("click", closeSearch);
  clear.addEventListener("click", ()=>{
    if (input.value.trim()){
      input.value = ""; results.innerHTML = ""; input.focus(); renderRecommendations(data);
    } else closeSearch();
  });
  clear.addEventListener("keydown", (e)=>{
    if (e.key === "Enter" || e.key === " "){ e.preventDefault(); clear.click(); }
  });

  input.addEventListener("input", function(){
    const q = this.value.toLowerCase().replace(/\s+/g,"");
    if (q){
      const filtered = data.filter(d => d.title.toLowerCase().replace(/\s+/g,"").includes(q));
      renderResults(filtered);
    } else {
      renderRecommendations(data);
    }
  });
  // ===== 키보드 내비게이션 =====
  // 리스트 수집 유틸
  function collectLists(){
    const recs  = results.querySelectorAll(".recommend-item");
    const cards = results.querySelectorAll(".search-card");
    const isRec = recs.length > 0 && cards.length === 0;
    const list  = isRec ? recs : cards;
    return { recs, cards, isRec, list };
  }
  // 카드형일 때 가로 개수 계산 (그리드 기준)
  function itemsPerRow(){
    const wrap = results.querySelector(".search-results-images");
    const first = results.querySelector(".search-card");
    if (!wrap || !first) return 1;
    const cw = first.getBoundingClientRect().width || 1;
    const ww = wrap.getBoundingClientRect().width || results.clientWidth || 1;
    return Math.max(1, Math.round(ww / cw));
  }
  // 하이라이트 적용
  function setHighlight(idx){
    const { list } = collectLists();
    list.forEach((el,i)=> el.classList.toggle("highlighted", i === idx));
    currentIndex = idx;
    if (list[idx]) list[idx].scrollIntoView({ block:"nearest", inline:"nearest" });
  }
  // 엔터 실행
  function activateCurrent(){
    const { isRec, list } = collectLists();
    const el = list[currentIndex];
    if (!el) return;

    if (isRec){
      const link = el.getAttribute("data-link");
      if (link) location.href = link;
    } else {
      const title = el.querySelector(".card-title")?.textContent.trim();
      const match = title && data.find(d => d.title === title);
      if (match?.link) location.href = match.link;
    }
  }

  // 입력창에서 방향키/엔터/ESC 처리
  input.addEventListener("keydown", (e)=>{
    const { isRec, list } = collectLists();
    const hasList = list.length > 0;

    if (e.key === "Escape"){ 
      closeSearch(); 
      return;
    }
    if (!hasList) return;

    if (e.key === "ArrowDown"){
      e.preventDefault();
      if (currentIndex < 0) currentIndex = 0;
      else if (isRec) currentIndex = (currentIndex + 1) % list.length;
      else {
        const n = itemsPerRow();
        const next = currentIndex + n;
        if (next < list.length) currentIndex = next;
      }
      setHighlight(currentIndex);
    } else if (e.key === "ArrowUp"){
      e.preventDefault();
      if (currentIndex < 0) currentIndex = 0;
      else if (isRec) currentIndex = (currentIndex - 1 + list.length) % list.length;
      else {
        const n = itemsPerRow();
        const prev = currentIndex - n;
        if (prev >= 0) currentIndex = prev;
      }
      setHighlight(currentIndex);
    } else if (e.key === "ArrowRight" && !isRec){
      e.preventDefault();
      if (currentIndex + 1 < list.length){
        currentIndex++;
        setHighlight(currentIndex);
      }
    } else if (e.key === "ArrowLeft" && !isRec){
      e.preventDefault();
      if (currentIndex - 1 >= 0){
        currentIndex--;
        setHighlight(currentIndex);
      }
    } else if (e.key === "Enter"){
      e.preventDefault();
      if (currentIndex < 0) return;
      activateCurrent();
    }
  });

  // 마우스로 결과 클릭 시도
  results.addEventListener("click", (e)=>{
    const rec = e.target.closest(".recommend-item");
    if (rec){
      const link = rec.getAttribute("data-link");
      if (link) location.href = link;
      return;
    }
    const card = e.target.closest(".search-card");
    if (card){
      const title = card.querySelector(".card-title")?.textContent.trim();
      const match = title && data.find(d => d.title === title);
      if (match?.link) location.href = match.link;
    }
  });

  // 바깥 클릭 시 닫기
  document.addEventListener("click", (e)=>{
    if (bar.classList.contains("hidden") ||
        bar.contains(e.target) ||
        e.target.closest(".search-icon") ||
        e.target.closest("#search-backdrop")) return;
    closeSearch();
  });
}

  // ---------- cart opener (header only; drawer is owned by CartPanel.js) ----------
  function wireCartButton() {
    const bag = document.querySelector("header .shop-toggle");
    if (!bag || bag.dataset.bound) return;
    bag.dataset.bound = "1";

    bag.setAttribute("data-cart-open", "");
    bag.setAttribute("role", "button");
    bag.setAttribute("aria-controls", "cart");

    window.closeCart = window.closeCart || (() => {
      window.dispatchEvent(new CustomEvent("pp:cart:close"));
    });
  }

  // ---------- DEV-ONLY: auto-insert CartPanel.html if missing ----------
  async function ensureCartPartialDev() {
    const hasPanel = document.getElementById("cart") && document.getElementById("cart-backdrop");
    if (hasPanel) return;
    try {
      const url = (window.PP_PARTIALS && window.PP_PARTIALS.cart) || "/front/cartpanel.html";
      const html = await fetchText(url);
      document.body.insertAdjacentHTML("beforeend", html);
       // ★ order fix: #cart 다음에 #cart-backdrop이 오도록 재배치
      const cart = document.getElementById("cart");
      const backdrop = document.getElementById("cart-backdrop");
      if (cart && backdrop && backdrop.previousElementSibling !== cart) {
        cart.after(backdrop);
      }
    } catch (e) {
      console.warn("CartPanel partial not found. Make sure /front/cartpanel.html is present.");
    }
  }

  // ---------- boot panels (CSS 보장 → partial 보장 → 모듈 import → init) ----------
  async function bootPanels() {
    // 1) 스타일 보장 (대소문자: Cart.css)
    ensureCSS("/front/cart.css");

    // 2) 패널 마크업 보장
    await ensureCartPartialDev();

    (function normalizeCartOrder(){
      const cart = document.getElementById("cart");
      const backdrop = document.getElementById("cart-backdrop");
      if (cart && backdrop && backdrop.previousElementSibling !== cart) cart.after(backdrop);
    })();

    // 3) 모듈 import (순서: CartPanel 먼저)
    try {
      const cartMod = await import("/front/cartpanel.js");
      if (cartMod?.ensureCartPanel) cartMod.ensureCartPanel();
    } catch (e) {
      console.error("Cart panel boot failed:", e);
    }

    // (선택) 인보이스 패널도 쓰면 이어서 로드
    try {
      const invMod = await import("/front/invoicepanel.js");
      if (invMod?.ensureInvoicePanel) invMod.ensureInvoicePanel();
    } catch (e) {
      /* optional, ignore if not present */
    }
  }

  // ---------- boot header features ----------
  function bootHeaderFeatures() {
    wireResizeFontEvents();
    hardenHeaderIcons();

    // 기존 setupSearchBar() 대신 모듈형 서치 부팅
    loadSearchPanel();

    wireCartButton();
  }

  // ---------- inject or boot ----------
  async function injectHeader() {
    const anchor = document.querySelector('[data-include="header"]');

    if (!anchor) {
      await bootPanels();        // ← 패널 선 부팅
      bootHeaderFeatures();
      return;
    }

    if (anchor.querySelector("header") || document.querySelector("body > header")) {
      await bootPanels();
      bootHeaderFeatures();
      return;
    }

    const candidates = ["/front/header.html","front/header.html","../front/header.html","../../front/header.html"];
    let html = null, lastErr = null;
    for (const url of candidates) { try { html = await fetchText(url); break; } catch (e) { lastErr = e; } }
    if (!html) { console.error("Header injection failed:", lastErr); await bootPanels(); return; }

    anchor.insertAdjacentHTML("afterbegin", html);

    await bootPanels();
    bootHeaderFeatures();
    window.dispatchEvent(new CustomEvent("header:ready"));
  }

  ready(injectHeader);
})();

document.dispatchEvent(new CustomEvent("header-loaded"));

