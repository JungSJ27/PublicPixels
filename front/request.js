import {
  getItems,
  setQty,
  remove,
  getSubtotal
} from "/front/cartstore.js";

/* -----------------------------
   AUTO ORDER ID 생성
------------------------------ */
function generateOrderID() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 90000) + 10000;

  return `PP-${y}${m}${d}-${r}`;
}

/* -----------------------------
    REQUEST PAGE RENDERING
------------------------------ */

const leftBox = document.querySelector("#leftItems");
const rightBox = document.querySelector("#rightList");
const sumTotal = document.querySelector("#sumTotal");
const form = document.querySelector("#reqForm");
const submitBtn = document.querySelector("#submitBtn");


/* LEFT ITEMS */
function renderLeft(items) {
  leftBox.innerHTML = "";

  if (!items.length) {
    leftBox.innerHTML = `<p class="empty">Your bag is empty.</p>`;
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "req-item-row";

    row.innerHTML = `
      <img class="thumb" src="${item.media}" />
      <div class="info">
        <div class="title">${item.name}</div>
        <div class="price">${item.price <= 0 ? "Req." : "$" + item.price.toFixed(2)}</div>

        <div class="qty-box">
          <button class="minus">−</button>
          <span class="qty">${item.qty}</span>
          <button class="plus">+</button>
        </div>

        <button class="remove">×</button>
      </div>
    `;

    row.querySelector(".minus").onclick = () => {
      if (item.qty > 1) setQty(item.id, item.qty - 1);
      renderAll();
    };

    row.querySelector(".plus").onclick = () => {
      setQty(item.id, item.qty + 1);
      renderAll();
    };

    row.querySelector(".remove").onclick = () => {
      remove(item.id);
      renderAll();
    };

    leftBox.appendChild(row);
  }
}

/* RIGHT SUMMARY */
function renderRight(items) {
  rightBox.innerHTML = "";

  for (const item of items) {
    const div = document.createElement("div");
    div.className = "sum-line";

    div.innerHTML = `
      <span>${item.name} × ${item.qty}</span>
      <span>${item.price <= 0 ? "Req." : "$" + (item.price * item.qty).toFixed(2)}</span>
    `;

    rightBox.appendChild(div);
  }
}

/* SUBTOTAL */
function updateSubtotal() {
  const items = getItems();
  const total = getSubtotal();
  const el = sumTotal;

  if (!items.length) {
    el.textContent = "";
    return;
  }

  const hasArt = items.some(x => Number(x.price) <= 0);
  const hasProduct = items.some(x => Number(x.price) > 0);
  const subtotal = `$${total.toFixed(2)}`;

  if (hasArt && hasProduct) {
    el.innerHTML = `α + ${subtotal}`;
  } else if (hasArt) {
    el.textContent = "Req.";
  } else {
    el.textContent = subtotal;
  }
}

/* -----------------------------
    SAVE ORDER TO LOCALSTORAGE
------------------------------ */

function saveOrder(data) {
  const orders = JSON.parse(localStorage.getItem("pp_orders") || "[]");
  orders.push(data);
  localStorage.setItem("pp_orders", JSON.stringify(orders));
}

/* -----------------------------
    SUBMIT
------------------------------ */
submitBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const items = getItems();
  if (!items.length) return alert("Your bag is empty.");

  const orderID = generateOrderID();

  const formData = {
    orderID,
    items,
    subtotal: getSubtotal(),
    notes: form.querySelector("#notes").value || "",
    name: form.querySelector("#name").value,
    email: form.querySelector("#email").value,
    phone: form.querySelector("#phone").value,
    address: form.querySelector("#address").value,
    status: "Pending", // 기본값
    shipping: "",
    tracking: "",
    created: new Date().toISOString()
  };

  saveOrder(formData);

  alert(`Request submitted!\nYour order ID: ${orderID}`);

  location.href = "/front/orderstatus.html";
});

/* ----------------------------- */

function renderAll() {
  const items = getItems();
  renderLeft(items);
  renderRight(items);
  updateSubtotal();
}

renderAll();
