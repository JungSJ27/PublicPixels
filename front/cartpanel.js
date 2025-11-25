// /front/CartPanel.js — drawer UI only (opens/closes/renders)

import {
  getItems, add, remove, setQty, clear,
  getCount, getSubtotal, onChange
} from "/front/cartstore.js";

// tiny utils
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmt = (n) => {
  const v = Number(n) || 0;
  return v <= 0
    ? "Available upon inquiry"
    : new Intl.NumberFormat(undefined, { style:"currency", currency:"USD" }).format(v);
};
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// main
export function ensureCartPanel(){
  const panel   = $("#cart");
  const overlay = $("#cart-backdrop");
  if (!panel || !overlay) return;

  const isOpen = () => panel.getAttribute("aria-hidden") === "false";

  // open close toggle
  function open(){
    if (typeof window.closeSearch === "function") window.closeSearch();
    panel.setAttribute("aria-hidden", "false");
    overlay.removeAttribute("hidden");
    document.documentElement.style.overflow = "hidden";
    $$("[data-cart-open]").forEach(btn => btn.setAttribute("aria-expanded","true"));
    render();
  }
  function close(){
    panel.setAttribute("aria-hidden", "true");
    overlay.setAttribute("hidden", "");
    document.documentElement.style.overflow = "";
    $$("[data-cart-open]").forEach(btn => btn.setAttribute("aria-expanded","false"));
  }
  const toggle = () => (isOpen() ? close() : open());

  // backdrop click → close (bind once)
  if (!overlay.dataset.bound){
    overlay.dataset.bound = "1";
    overlay.addEventListener("click", close);
  }

  // render list + subtotal + alpha mark
  function render(){
    const list   = $("#cart-list");
    const empty  = $("#cart-empty");
    const subEl  = $("#cart-subtotal");
    if (!list) return;

    const items = safeGetItems();
    list.innerHTML = items.map(it => rowHTML(it)).join("");

    const none = items.length === 0;
    if (empty) empty.style.display = none ? "block" : "none";
    if (subEl) subEl.textContent = fmt(safeSubtotal());

    updateBadge();
    updateAlphaIndicators(items);
  }

  function rowHTML(it){
    return `
      <div class="cart-item" data-id="${esc(it.id)}">
        <a class="thumb" href="${esc(it.url || "#")}">
          ${it.media ? `<img src="${esc(it.media)}" alt="">` : ""}
        </a>
        <div class="meta">
          <a class="title" href="${esc(it.url || "#")}">${esc(it.name || it.title || "Untitled")}</a>
          ${it.variant ? `<div class="variant">${esc(it.variant)}</div>` : ""}
        </div>
        <div class="qty">
          <button class="btn" data-cart-dec="${esc(it.id)}" aria-label="Decrease">−</button>
          <span class="num">${Number(it.qty || 1)}</span>
          <button class="btn" data-cart-inc="${esc(it.id)}" aria-label="Increase">+</button>
        </div>
        <div class="price">${fmt(it.price)}</div>
        <button class="remove" data-cart-remove="${esc(it.id)}" aria-label="Remove">✕</button>
      </div>
    `;
  }

  // header cart badge
  function updateBadge(){
    const badge = $("#cart-count");
    if (!badge) return;
    try { badge.textContent = String(getCount()); } catch {}
  }

  // alpha: title badge + subtotal flag
  function updateAlphaIndicators(items){
    const hasArt = items.some(x =>
      x?.type === "artwork" || x?.kind === "artwork" || Number(x?.price || 0) <= 0
    );

    const t = $("#cart-title");
    if (t){
      const n = items.length;
      t.textContent = n > 0 ? `Your selection · ${n}` : `Your selection`;
      let badge = t.querySelector(".cart__alpha");
      if (hasArt){
        if (!badge){
          badge = document.createElement("span");
          badge.className = "cart__alpha";
          badge.textContent = "α";
          t.appendChild(badge);
        }
      } else if (badge){
        badge.remove();
      }
    }

    const sub = $("#cart-subtotal");
    if (sub){
      let flag = sub.parentElement?.querySelector?.(".cart__alpha");
      if (hasArt){
        if (!flag){
          flag = document.createElement("span");
          flag.className = "cart__alpha";
          flag.textContent = "α";
          sub.after(flag);
        }
      } else if (flag){
        flag.remove();
      }
    }
  }

  // openers bind once
  function bindOpeners(){
    $$("[data-cart-open]").forEach(btn => {
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      });
    });
  }
  bindOpeners();
  window.addEventListener("header:ready", bindOpeners);
  new MutationObserver(bindOpeners).observe(document.documentElement, { childList:true, subtree:true });

  // inside-panel delegation
  if (!panel.dataset.innerBound){
    panel.dataset.innerBound = "1";
    panel.addEventListener("click", (e) => {
      const t = e.target;

      if (t.closest("[data-cart-close]")) { e.preventDefault(); close(); return; }

      const rm = t.closest("[data-cart-remove]");
      if (rm){
        safeRemove(rm.getAttribute("data-cart-remove")); render(); return;
      }
      const inc = t.closest("[data-cart-inc]");
      if (inc){
        const id = inc.getAttribute("data-cart-inc");
        const it = safeGetItems().find(x => String(x.id) === String(id));
        safeSetQty(id, Number(it?.qty || 0) + 1);
        render();
        return;
      }
      const dec = t.closest("[data-cart-dec]");
      if (dec){
        const id = dec.getAttribute("data-cart-dec");
        const it = safeGetItems().find(x => String(x.id) === String(id));
        const next = Math.max(1, Number(it?.qty || 1) - 1);
        safeSetQty(id, next);
        render();
        return;
      }

      // footer actions
      if (t.closest("[data-cart-clear]"))   { safeClear(); render(); return; }
      if (t.closest("[data-cart-request]")) { handleRequest(); return; }
      if (t.closest("[data-cart-status]"))  { handleStatus();  return; }
      if (t.closest("[data-cart-invoice]")) { handleInvoice(); return; }
    });
  }

  // click-outside to close
  if (!panel.dataset.outsideBound){
    panel.dataset.outsideBound = "1";
    document.addEventListener("pointerdown", (e) => {
      if (!isOpen()) return;
      const inside = panel.contains(e.target);
      const opener = e.target.closest?.("[data-cart-open]");
      const back   = e.target.closest?.("#cart-backdrop");
      if (inside || opener || back) return;
      close();
    }, true);
  }

  // esc + external close
  window.addEventListener("keydown", (e)=>{ if(e.key === "Escape") close(); });
  window.addEventListener("pp:cart:close", close);

  // re-render on store changes and cross tab
  try {
    onChange(render);
    window.addEventListener("storage", (e)=>{ if (e.key === "pp_cart_count") render(); });
  } catch {}

  // first paint + expose
  render();
  window.openCart   = open;
  window.closeCart  = close;
  window.toggleCart = toggle;
}

// helpers
function safeGetItems(){ try { return getItems(); } catch { return []; } }
function safeSubtotal(){ try { return getSubtotal(); } catch { return 0; } }
function safeRemove(id){ try { remove(id); } catch {} }
function safeSetQty(id, q){ try { setQty(id, q); } catch {} }
function safeClear(){ try { clear(); } catch {} }

// snapshot helper
function saveRequestSnapshot(){
  try{
    const items = safeGetItems();
    const subtotal = safeSubtotal();
    sessionStorage.setItem("pp_request_snapshot", JSON.stringify({
      items, subtotal, ts: Date.now()
    }));
  }catch{}
}

// request status invoice hooks
function handleRequest(){
  const items = safeGetItems();
  if (!items.length){
    alert("Your bag is empty.");
    return;
  }
  saveRequestSnapshot();
  try { window.closeCart?.(); } catch {}
  location.href = "/front/request.html";
}

function handleStatus(){
  const last = localStorage.getItem("pp_last_request");
  if (last) {
    location.href = `/front/orderstatus.html?id=${encodeURIComponent(last)}`;
  } else {
    location.href = "/front/orderstatus.html";
  }
}

// optional
function handleInvoice(){
  handleStatus();
}

ensureCartPanel();
