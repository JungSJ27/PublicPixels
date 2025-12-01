function loadOrders() {
  return JSON.parse(localStorage.getItem("pp_orders") || "[]");
}

const input = document.querySelector("#orderIDinput");
const result = document.querySelector("#result");
const checkBtn = document.querySelector("#checkBtn");

checkBtn.onclick = () => {
  const id = input.value.trim();
  if (!id) return;

  const orders = loadOrders();
  const found = orders.find(o => o.orderID === id);

  if (!found) {
    result.classList.remove("hidden");
    result.innerHTML = `<p>No order found.</p>`;
    return;
  }

  const itemHTML = found.items.map(i => `
    <li>${i.name} × ${i.qty}</li>
  `).join("");

  result.classList.remove("hidden");
  result.innerHTML = `
    <h2>Order ${found.orderID}</h2>

    <p><strong>Status:</strong> ${found.status}</p>

    <p><strong>Items:</strong></p>
    <ul>${itemHTML}</ul>

    <p><strong>Subtotal:</strong> ${found.subtotal <= 0 ? "Req." : "$" + found.subtotal.toFixed(2)}</p>

    <p><strong>Notes:</strong> ${found.notes || "(none)"}</p>

    <p><strong>Shipping method:</strong> ${found.shipping || "-"}</p>
    <p><strong>Tracking code:</strong> ${found.tracking || "-"}</p>
  `;
};
