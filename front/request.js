import {
  getItems,
  setQty,
  remove,
  getSubtotal
} from "./cartstore.js";   // ← /front 제거한 상대 경로 유지

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
   GOOGLE SHEET API URL
------------------------------ */
const API_URL =
  "https://script.google.com/macros/s/AKfycbxNCJ0fee0pUqNYitMrU5diZRJxh9WNviREQM1DZJaRyD3_5J1dmSyaQdHL82uFPx3z/exec";

/* -----------------------------
    ELEMENTS
------------------------------ */
const leftBox   = document.getElementById("leftItems");
const rightBox  = document.getElementById("rightList");
const sumTotal  = document.getElementById("sumTotal");
const form      = document.getElementById("reqForm");
const submitBtn = document.getElementById("submitBtn");

/* -----------------------------
    LEFT RENDER
------------------------------ */
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

    // 수량 조절
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

/* -----------------------------
    RIGHT RENDER
------------------------------ */
function renderRight(items) {
  rightBox.innerHTML = "";

  for (const item of items) {
    const div = document.createElement("div");
    div.className = "sum-line";

    div.innerHTML = `
      <span>${item.name} × ${item.qty}</span>
      <span>${
        item.price <= 0
          ? "Req."
          : "$" + (item.price * item.qty).toFixed(2)
      }</span>
    `;
    rightBox.appendChild(div);
  }
}

/* -----------------------------
    SUBTOTAL
------------------------------ */
function updateSubtotal() {
  const items = getItems();
  const total = getSubtotal();

  if (!items.length) {
    sumTotal.textContent = "";
    return;
  }

  const hasArt = items.some(x => Number(x.price) <= 0);
  const subtotal = `$${total.toFixed(2)}`;

  if (hasArt && total > 0) {
    sumTotal.innerHTML = `α + ${subtotal}`;
  } else if (hasArt) {
    sumTotal.textContent = "Req.";
  } else {
    sumTotal.textContent = subtotal;
  }
}

/* -----------------------------
    LOCAL BACKUP SAVE
------------------------------ */
function saveOrderLocal(data) {
  const orders = JSON.parse(localStorage.getItem("pp_orders") || "[]");
  orders.push(data);
  localStorage.setItem("pp_orders", JSON.stringify(orders));
}

/* -----------------------------
    SUBMIT HANDLER
------------------------------ */
submitBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const items = getItems();
  if (!items.length) {
    alert("Your bag is empty.");
    return;
  }

  // 기본 폼 체크 (이름/이메일)
  const name  = form.querySelector("#name").value.trim();
  const email = form.querySelector("#email").value.trim();

  if (!name || !email) {
    alert("Please fill in at least Name and Email.");
    return;
  }

  const orderID = generateOrderID();

  const orderData = {
    orderID,
    items,
    subtotal: getSubtotal(),
    notes: form.querySelector("#notes").value || "",
    name,
    email,
    phone:   form.querySelector("#phone").value,
    address: form.querySelector("#address").value,
    status:  "Pending",
    shipping: "",
    tracking: "",
    created: new Date().toISOString()
  };

  // 1) Google Sheet 전송
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "create", ...orderData })
    });
  } catch (err) {
    console.error("Google Sheet ERROR:", err);
    // 실패해도 주문은 계속 진행
  }

  // 2) 로컬 백업
  saveOrderLocal(orderData);

  // 3) 모달 열기 + 코드 채우기
  const modal   = document.getElementById("copyModal");
  const codeBox = document.getElementById("copyCode");
  const copyBtn = document.getElementById("copyBtn");
  const closeBtn = document.getElementById("closeCopy");

  const goToStatus = () => {
    if (modal) modal.hidden = true;
    // request.html과 같은 폴더에 있다고 가정
    location.href = "orderstatus.html?id=" + encodeURIComponent(orderID);
  };

  if (modal && codeBox && copyBtn && closeBtn) {
    codeBox.textContent = orderID;
    modal.hidden = false;

    // 자동 복사 시도 (실패해도 무시)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(orderID).catch(() => {});
    }

    // Copy 버튼: 다시 한 번 복사 + 이동
    copyBtn.onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(orderID)
          .catch(() => {})
          .finally(goToStatus);
      } else {
        goToStatus();
      }
    };

    // Close 버튼: 복사 없이 바로 이동
    closeBtn.onclick = goToStatus;

  } else {
    // 모달 엘리먼트가 없으면 옛날 방식으로
    alert(`Your request has been submitted.\nOrder ID: ${orderID}`);
    goToStatus();
  }
});

/* -----------------------------
    INIT RENDER
------------------------------ */
function renderAll() {
  const items = getItems();
  renderLeft(items);
  renderRight(items);
  updateSubtotal();
}

renderAll();
