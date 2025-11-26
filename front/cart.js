// /Front/Cart.js — Shop page helpers only (no drawer UI)
// When "Add to cart" is clicked on a product card, add via CartStore.

import { add } from "/front/cartstore.js";

(function () {
  const grid = document.getElementById("grid"); // only run if the grid exists
  if (!grid) return;

  // ---------- utils ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const toNumber = (v) => {
    const n = Number(String(v || "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // 경로 보정 — 간단한 절대화만 수행
  const resolveURL = (u, baseEl) => {
    try {
      // 카드나 섹션에 data-media-root="/Section3/Thumbs/" 같은 힌트를 줄 수 있음
      const root = baseEl?.closest("[data-media-root]")?.getAttribute("data-media-root");
      if (root && u && !/^https?:\/\//i.test(u) && !u.startsWith("/")) {
        // 상대경로인 경우에만 root 붙이기
        return new URL(root.replace(/\/+$/,"/") + u.replace(/^\/+/,""), location.origin).href;
      }
      return new URL(u, document.baseURI).href;
    } catch {
      return u || "";
    }
  };


  // background-image 추출
  const getBgURL = (el, baseEl) => {
    if (!el) return "";
    const bg = getComputedStyle(el).backgroundImage || "";
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    return m ? resolveURL(m[1], baseEl) : "";
  };

  // 카드에서 썸네일 후보를 순서대로 탐색
  const getCardMedia = (card) => {
    const fromData = card.dataset.media;
    if (fromData) return resolveURL(fromData, card);

    const img = card.querySelector("img");
    if (img){
      const s = img.getAttribute("src") || img.getAttribute("data-src") || img.currentSrc || img.src;
      if (s) return resolveURL(s, card);
    }

    const vid = card.querySelector("video");

    if (vid){
      if (vid.poster) return resolveURL(vid.poster, card);  // card 추가
      const vs = vid.getAttribute("src") || vid.querySelector("source")?.getAttribute("src");
      if (vs) return resolveURL(vs, card);
    }


  // 사용처
  const thumb = card.querySelector(".thumb");
  const bg = getBgURL(thumb, card) || getBgURL(card, card);
  if (bg) return bg;

    return "";
  };


  // optional: cart icon target (fly animation 목적)
  const cartTarget = document.querySelector("[data-open-cart]") || document.querySelector(".icon-cart");

  function flyToCart(sourceBtn) {
    if (!cartTarget || !sourceBtn) return;
    const s = sourceBtn.getBoundingClientRect();
    const t = cartTarget.getBoundingClientRect();

    const ghost = sourceBtn.cloneNode(true);
    ghost.style.position = "fixed";
    ghost.style.left = s.left + "px";
    ghost.style.top = s.top + "px";
    ghost.style.zIndex = 1600;
    ghost.style.transform = "translate(0,0) scale(1)";
    ghost.style.opacity = "1";
    ghost.style.transition = "transform .5s cubic-bezier(.3,.7,0,1), opacity .5s";
    document.body.appendChild(ghost);

    const dx = t.left - s.left;
    const dy = t.top - s.top;
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.35)`;
      ghost.style.opacity = ".25";
    });
    setTimeout(() => ghost.remove(), 520);
  }

  // ---------- ensure every card has an action button ----------
  function ensureActions() {
    grid.querySelectorAll(".card").forEach((card) => {
      if (card.querySelector(".card__actions")) return;
      const actions = document.createElement("div");
      actions.className = "card__actions";
      actions.outerHTML = `<div class="card__actions" style="position:absolute;right:12px;bottom:12px;margin:0;padding:0;pointer-events:auto;"><button type="button" class="addBtn" aria-label="Add to cart"></button></div>`;

      card.appendChild(actions);
    });
  }
  ensureActions();
  document.addEventListener("productsRendered", ensureActions);

  // ---------- add to cart ----------
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".addBtn");
    if (!btn) return;

    const card = e.target.closest(".card");
    if (!card) return;

    // 잠깐 중복 방지
    if (btn.dataset.lock === "1") return;
    btn.dataset.lock = "1";

    // Build item from dataset/DOM (id는 최대한 안정적으로 생성)
    const anchor = $("a", card);
    const idFallback =
      card.dataset.id ||
      card.getAttribute("id") ||
      anchor?.href ||
      (card.querySelector("img")?.src ?? "") ||
      Math.random().toString(36).slice(2);

      const item = {
      id: String(idFallback),
      name:
        card.dataset.title ||
        $(".card__title", card)?.textContent?.trim() ||
        "Item",
      price: toNumber(card.dataset.price ?? $(".card__price", card)?.textContent),
      url: card.dataset.url || anchor?.href || "#",
      media: getCardMedia(card),   // ← 여기만 핵심 변경
      variant: card.dataset.variant || "",
      type: "product",
      qty: 1,
    };


    try {
      add(item, 1);
      // 피드백 + 애니메이션
      const original = btn.textContent;
      btn.textContent = "Added";
      btn.classList.add("added");
      flyToCart(btn);

      // 외부(드로어 등)에서 듣도록 이벤트 발행
      window.dispatchEvent(new CustomEvent("cart:add", { detail: item }));

      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("added");
        btn.dataset.lock = "0";
      }, 900);
    } catch (err) {
      console.error("[Cart] add failed:", err);
      btn.textContent = "Error";
      setTimeout(() => {
        btn.textContent = "Add to cart";
        btn.dataset.lock = "0";
      }, 1000);
    }
  });
})();



