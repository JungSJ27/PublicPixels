import {
  getItems,
  setQty,
  remove,
  getSubtotal
} from "/front/cartstore.js";

const leftBox = document.querySelector("#leftItems");
const rightBox = document.querySelector("#rightList");
const sumTotal = document.querySelector("#sumTotal");
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
      <img class="thumb" src="${item.media || ""}" />

      <div class="info">
        <div class="title">${item.name}</div>
        <div class="price">$${item.price.toFixed(2)}</div>

        <div class="qty-box">
          <button class="minus">−</button>
          <span class="qty">${item.qty}</span>
          <button class="plus">+</button>
        </div>

        <button class="remove">Remove</button>
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

  if (!items.length) {
    rightBox.innerHTML = `<p class="empty">No items</p>`;
    return;
  }

  for (const item of items) {
    const div = document.createElement("div");
    div.className = "sum-line";

    div.innerHTML = `
      <span>${item.name}</span>
      <span>$${(item.price * item.qty).toFixed(2)}</span>
    `;

    rightBox.appendChild(div);
  }
}

/* SUBTOTAL */
function updateSubtotal() {
  sumTotal.textContent = `$${getSubtotal().toFixed(2)}`;
}

/* RENDER */
function renderAll() {
  const items = getItems();
  renderLeft(items);
  renderRight(items);
  updateSubtotal();
}

renderAll();

/* SUBMIT */
submitBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!getItems().length) return alert("Your bag is empty.");
  alert("Request submitted (fake). Replace with server logic.");
});
