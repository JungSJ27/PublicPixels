import { getItems, setQty, remove, getSubtotal } from "/front/cartstore.js";

/* ---------- ORDER ID ---------- */
function generateOrderID() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 90000) + 10000;
  return `PP-${y}${m}${d}-${r}`;
}

/* ---------- API URL ---------- */
const API_URL =
  "https://script.google.com/macros/s/AKfycbyFgp8K5c6w_o665QhB_ihSIGfUb3GSXttJbrCK-z57lqvX_vfHbRbfE2wLWblf1sKm6w/exec";

/* ---------- ELEMENTS ---------- */
const leftBox   = document.getElementById("leftItems");
const rightBox  = document.getElementById("rightList");
const sumTotal  = document.getElementById("sumTotal");
const form      = document.getElementById("reqForm");
const submitBtn = document.getElementById("submitBtn");

/* ------------ RENDER LEFT -------------- */
function renderLeft(items) {
  leftBox.innerHTML = "";

  if (!items.length) {
    leftBox.innerHTML = `<p class="empty">Your collection is empty.</p>`;
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "req-item-row";

    row.innerHTML = `
      <img class="thumb" src="${item.media}" alt="">
      <div class="info">
        <div class="title">${item.name}</div>
        <div class="price">${
          item.price <= 0 ? "Req." : "$" + item.price.toFixed(2)
        }</div>

        <div class="qty-box">
          <button class="minus">−</button>
          <span class="qty">${item.qty}</span>
          <button class="plus">+</button>
        </div>

        <button class="remove">×</button>
      </div>
    `;

    // 수량 조정
    row.querySelector(".minus").onclick = () => {
      if (item.qty > 1) setQty(item.id, item.qty - 1);
      renderAll();
    };
    row.querySelector(".plus").onclick = () => {
      setQty(item.id, item.qty + 1);
      renderAll();
    };

    // 제거
    row.querySelector(".remove").onclick = () => {
      remove(item.id);
      renderAll();
    };

    leftBox.appendChild(row);
  }
}

/* ------------ RENDER RIGHT -------------- */
function renderRight(items) {
  rightBox.innerHTML = "";

  for (const item of items) {
    const div = document.createElement("div");
    div.className = "sum-line";
    div.innerHTML = `
      <span>${item.name} × ${item.qty}</span>
      <span>${
        item.price <= 0 ? "Req." : "$" + (item.price * item.qty).toFixed(2)
      }</span>
    `;
    rightBox.appendChild(div);
  }
}

/* ------------ SUBTOTAL -------------- */
function updateSubtotal() {
  const items = getItems();

  if (!items.length) {
    sumTotal.textContent = "";
    return;
  }

  let total = 0;
  let hasReq = false;

  for (const item of items) {
    if (item.price > 0) {
      total += item.price * item.qty;
    } else {
      hasReq = true;   // Req 상품이 하나라도 있으면 true
    }
  }

  let result = "";

  if (hasReq && total > 0) {
    // 혼합: Req + 가격
    result = `α + $${total.toFixed(2)}`;
  }
  else if (hasReq && total === 0) {
    // Req 상품만 있음
    result = `Req.`;
  }
  else {
    // 가격만 있음
    result = `$${total.toFixed(2)}`;
  }

  sumTotal.textContent = result;
}



/* ------------ SUBMIT HANDLER -------------- */
submitBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const items = getItems();
  if (!items.length) return alert("Your collection is empty.");

  const name = form.querySelector("#name").value.trim();
  const email = form.querySelector("#email").value.trim();
  if (!name || !email) return alert("Please fill in Name and Email.");

  const orderID = generateOrderID();

  /* 🔥 slimItems: id, qty, price ONLY */
  const slimItems = items.map(x => ({
    id: x.id,
    qty: x.qty,
    price: x.price
  }));

  const orderData = {
    action: "create",
    orderID,
    name,
    email,
    phone: form.querySelector("#phone").value,
    address: form.querySelector("#address").value,
    items: JSON.stringify(slimItems),
    subtotal: getSubtotal(),
    notes: form.querySelector("#notes").value,
    status: "Pending",
    tracking: ""
  };

  /* ----- SEND TO GOOGLE SHEET ----- */
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(orderData)
    });
  } catch (err) {
    console.error("Google Sheet ERROR:", err);
  }

  /* ---------- MODAL ---------- */
  const modal = document.getElementById("copyModal");
  const codeBox = document.getElementById("copyCode");
  const copyBtn = document.getElementById("copyBtn");
  const closeBtn = document.getElementById("closeCopy");

  codeBox.textContent = orderID;
  modal.hidden = false;

  const goToStatus = () => {
  location.href = `../status/?id=${encodeURIComponent(orderID)}`;};


  copyBtn.onclick = () =>
    navigator.clipboard.writeText(orderID).finally(goToStatus);
  closeBtn.onclick = goToStatus;
});

/* ---------- INIT ---------- */
function renderAll() {
  const items = getItems();
  renderLeft(items);
  renderRight(items);
  updateSubtotal();
}
renderAll();
