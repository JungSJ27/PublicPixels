// /Front/CartStore.js — single source of truth (no DOM)
// Stores items in localStorage and emits a change event for the UI.

const KEY_V1 = "pp_cart_items";       // 예전 키 (상대경로가 섞여 있을 수 있음)
const KEY_V2 = "pp_cart_items_v2";    // 새 키 (절대경로만 저장)
export const CART_KEYS = {
  items: KEY_V2,
  count: "pp_cart_count",
};

const toAbs = (u) => {
  try { return new URL(u, document.baseURI).href; }
  catch { return u || ""; }
};

// v2 우선 읽고, 없으면 v1 → v2로 1회 마이그레이션
function readItems() {
  try {
    const v2 = JSON.parse(localStorage.getItem(CART_KEYS.items) || "[]");
    if (Array.isArray(v2) && v2.length) return v2;

    const v1 = JSON.parse(localStorage.getItem(KEY_V1) || "[]");
    if (!Array.isArray(v1) || !v1.length) return [];

    const migrated = v1.map(it => ({
      id: String(it.id),
      name: it.name || it.title || "Untitled",
      price: Number(it.price || 0),
      qty: Number(it.qty || 1),
      url: toAbs(it.url || "#"),
      media: toAbs(it.media || ""),
      variant: it.variant || "",
      type: it.type || "item",
    }));
    // v1 → v2 마이그레이션 직후
    localStorage.setItem(CART_KEYS.items, JSON.stringify(migrated));
    localStorage.removeItem(KEY_V1);   // ← 추가: 재마이그레이션 방지
    return migrated;
  } catch {
    return [];
  }
}

function writeItems(items) {
  // 1) 장바구니 배열을 v2 키에 저장
  localStorage.setItem(CART_KEYS.items, JSON.stringify(items));

  // 2) 총 수량과 소계를 계산
  const count = items.reduce((n, it) => n + Number(it.qty || 0), 0);
  const subtotal = items.reduce((n, it) => n + (Number(it.price || 0) * Number(it.qty || 0)), 0);

  // 3) 총 수량을 따로 저장해 두면 헤더 아이콘 배지 같은 데서 빨리 읽기 좋아
  localStorage.setItem(CART_KEYS.count, String(count));

  // 4) 같은 탭의 UI에게 “장바구니 바뀜”을 직접 알려줌
  //    CartPanel 같은 곳에서 이 이벤트를 듣고 화면을 다시 그림
  window.dispatchEvent(new CustomEvent("pp:cart:change", {
    detail: { items, count, subtotal }
  }));

  // 5) 선택사항. 원래 'storage' 이벤트는 다른 탭에서만 자동으로 발생함.
  //    여기서는 수동으로 하나 만들어 쏴서, 다른 리스너들도 즉시 반응하게 함.
  try {
    window.dispatchEvent(new StorageEvent("storage", {
      key: CART_KEYS.count,
      newValue: String(count)
    }));
  } catch {}
}

// ---------- public getters ----------
export function getItems() { return readItems(); }
export function getCount() {
  const v = localStorage.getItem(CART_KEYS.count);
  return v == null ? readItems().reduce((n, it) => n + Number(it.qty || 0), 0) : Number(v);
}
export function getSubtotal() {
  return readItems().reduce((n, it) => n + (Number(it.price || 0) * Number(it.qty || 0)), 0);
}

// ---------- public mutations ----------
export function add(item, qty = 1) {
  const items = readItems();

  const id = String(item?.id || Math.random().toString(36).slice(2));
  const mediaAbs = toAbs(item?.media);
  const urlAbs   = item?.url ? toAbs(item.url) : "#";

  const i = items.findIndex(x => String(x.id) === id);

  if (i >= 0) {
    items[i].qty = Number(items[i].qty || 0) + Number(qty || 0);

    if (!items[i].media && mediaAbs) items[i].media = mediaAbs;
    if ((!items[i].url || items[i].url === "#") && urlAbs) items[i].url = urlAbs;
    if (!items[i].name && (item?.name || item?.title)) items[i].name = item.name || item.title;
    if (!items[i].variant && item?.variant) items[i].variant = item.variant;
    if (Number(items[i].price || 0) === 0 && Number(item?.price || 0) > 0) {
      items[i].price = Number(item.price);
    }
    if (!items[i].type && item?.type) items[i].type = item.type;
  } else {
    items.unshift({
      id,
      name: item?.name || item?.title || "Untitled",
      price: Number(item?.price || 0),
      qty: Number(qty || 1),
      url: urlAbs,
      media: mediaAbs,
      variant: item?.variant || "",
      type: item?.type || "item",
    });
  }

  writeItems(items);
}

export function remove(id) {
  const items = readItems().filter(x => String(x.id) !== String(id));
  writeItems(items);
}

export function toggle(item) {
  const items = readItems();
  const id = String(item.id);
  const i = items.findIndex(x => String(x.id) === id);
  if (i >= 0) {
    items.splice(i, 1);
    writeItems(items);
    return false; // now removed
  } else {
    add(item, 1);
    return true; // now added
  }
}

export function setQty(id, qty) {
  const q = Math.max(0, Number(qty || 0));
  const items = readItems();
  const i = items.findIndex(x => String(x.id) === String(id));
  if (i < 0) return;
  if (q === 0) items.splice(i, 1);
  else items[i].qty = q;
  writeItems(items);
}

export function clear() { writeItems([]); }

// ---------- subscribe helper ----------
export function onChange(callback) {
  const handler = (e) => {
    const detail = e.detail || { items: getItems(), count: getCount(), subtotal: getSubtotal() };
    callback(detail);
  };
  window.addEventListener("pp:cart:change", handler);
  return () => window.removeEventListener("pp:cart:change", handler);
}
