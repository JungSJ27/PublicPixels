console.log("orderstatus loaded");

// === 반드시 Apps Script 웹앱 URL로 교체 ===
const API_URL = "https://script.google.com/macros/s/AKfycbyFgp8K5c6w_o665QhB_ihSIGfUb3GSXttJbrCK-z57lqvX_vfHbRbfE2wLWblf1sKm6w/exec";


// === DOM ===
const input = document.getElementById("orderIDinput");
const checkBtn = document.getElementById("checkBtn");
const orderArea = document.getElementById("orderArea");

const orderInfo = document.getElementById("orderInfo");
const shippingInfo = document.getElementById("shippingInfo");
const invoiceInfo = document.getElementById("invoiceInfo");

const stepsBox = document.getElementById("statusSteps");
const backBtn = document.getElementById("backBtn");


// === URL 파라미터 자동 입력 ===
window.onload = () => {
  const urlParams = new URLSearchParams(location.search);
  const id = urlParams.get("id");

  if (id) {
    input.value = id;
    loadOrder();
  }
};


// === 체크버튼 ===
checkBtn.onclick = () => loadOrder();


// === 주문 조회 ===
async function loadOrder() {
  const id = input.value.trim();
  if (!id) return;

  orderInfo.innerHTML = "Loading...";
  shippingInfo.innerHTML = "";
  invoiceInfo.innerHTML = "";
  orderArea.classList.remove("hidden");

  try {
    const res = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`);
    const data = await res.json();

    if (!data.success) {
      orderInfo.innerHTML = "No order found.";
      clearSteps();
      return;
    }

    renderOrderInfo(data);
    renderShipping(data);
    renderInvoice(data);
    renderSteps(data.step);

  } catch (err) {
    console.error("Error:", err);
    orderInfo.innerHTML = "Error loading order...";
  }
}


// === 주문 정보 ===
function renderOrderInfo(d) {
  orderInfo.innerHTML = `
    <p><strong>Name:</strong> ${d.name}</p>
    <p><strong>Email:</strong> ${d.email}</p>
    <p><strong>Phone:</strong> ${d.phone}</p>
    <p><strong>Address:</strong> ${d.address}</p>

    <p><strong>Items:</strong> ${d.items}</p>
    <p><strong>Subtotal:</strong> $${Number(d.subtotal).toFixed(2)}</p>

    ${d.notes ? `<p><strong>Notes:</strong> ${d.notes}</p>` : ""}
  `;
}


// === 배송 정보 ===
function renderShipping(d) {
  if (!d.tracking_method && !d.tracking_number && !d.tracking_link) {
    shippingInfo.innerHTML = "<p>No shipping information yet.</p>";
    return;
  }

  shippingInfo.innerHTML = `
    ${d.tracking_method ? `<p><strong>Carrier:</strong> ${d.tracking_method}</p>` : ""}
    ${d.tracking_number ? `<p><strong>Tracking Number:</strong> ${d.tracking_number}</p>` : ""}
    ${
      d.tracking_link
        ? `<p><a href="${d.tracking_link}" target="_blank">Track Package</a></p>`
        : ""
    }
  `;
}


// === 인보이스 ===
function renderInvoice(d) {
  if (!d.invoice_link) {
    invoiceInfo.innerHTML = "<p>No invoice yet.</p>";
    return;
  }

  invoiceInfo.innerHTML = `
    <p><a href="${d.invoice_link}" target="_blank">Download Invoice (PDF)</a></p>
  `;
}


// === 상태 단계 ===
function renderSteps(stepNum) {
  const stepItems = document.querySelectorAll("#statusSteps .step");

  stepItems.forEach(step => {
    const n = Number(step.dataset.step);
    const dot = step.querySelector(".dot");

    if (n <= stepNum) {
      dot.classList.add("active");
      step.classList.add("active-text");
    } else {
      dot.classList.remove("active");
      step.classList.remove("active-text");
    }
  });
}


// === 단계 초기화 ===
function clearSteps() {
  const dots = stepsBox.querySelectorAll(".dot");
  dots.forEach(d => d.classList.remove("active"));
}


// === 뒤로가기 ===
backBtn.onclick = () => {
  location.href = "index.html";
};
