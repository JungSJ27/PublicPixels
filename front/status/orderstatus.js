// request.js 와 같은 Apps Script 주소로 맞추기
const API_URL =
  "https://script.google.com/macros/s/AKfycbwq_l6uQkcJt1iKLhn4_e4J9Q4eTCK628W49nP6rdRuFbUHwqlg2RZq7irkuQQDgXeS/exec";

const input   = document.querySelector("#orderIDinput");
const result  = document.querySelector("#result");
const checkBtn = document.querySelector("#checkBtn");
const stepsEl  = document.querySelector("#statusSteps");

function clearSteps() {
  stepsEl
    .querySelectorAll(".step")
    .forEach(step => step.classList.remove("active"));
}

function updateSteps(stepNumber) {
  clearSteps();
  stepsEl.querySelectorAll(".step").forEach(step => {
    const s = Number(step.dataset.step);
    if (s <= stepNumber) {
      step.classList.add("active");
    }
  });
}

async function fetchOrder(id) {
  result.textContent = "Loading...";

  try {
    const res  = await fetch(API_URL + "?id=" + encodeURIComponent(id));
    const data = await res.json();

    if (!data.success || !data.order) {
      clearSteps();
      result.textContent = "No order found.";
      return;
    }

    const order = data.order;

    // 단계 숫자에 따라 불 켜기
    const stepNum = typeof order.statusStep === "number"
      ? order.statusStep
      : 0;
    updateSteps(stepNum);

    // items 문자열을 보기 좋게
    const itemsList = String(order.items || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const itemsHTML = itemsList
      .map(txt => `<li>${txt}</li>`)
      .join("");

    const subtotalText =
      Number(order.subtotal) <= 0
        ? "Req."
        : "$" + Number(order.subtotal).toFixed(2);

    result.innerHTML = `
      <h2>${order.orderID}</h2>

      <p><strong>Name:</strong> ${order.name || ""}</p>
      <p><strong>Email:</strong> ${order.email || ""}</p>
      <p><strong>Phone:</strong> ${order.phone || ""}</p>
      <p><strong>Address:</strong> ${order.address || ""}</p>

      <p><strong>Status:</strong> ${order.status || ""}</p>

      <p><strong>Items:</strong></p>
      <ul>${itemsHTML}</ul>

      <p><strong>Subtotal:</strong> ${subtotalText}</p>

      <p><strong>Tracking:</strong> ${order.tracking || "-"}</p>
      <p><strong>Notes:</strong> ${order.notes || "-"}</p>
    `;
  } catch (err) {
    console.error(err);
    clearSteps();
    result.textContent = "Error while loading order.";
  }
}

checkBtn.addEventListener("click", () => {
  const id = input.value.trim();
  if (!id) return;
  fetchOrder(id);
});

// request.html 에서 넘어올 때 ?id= 파라미터로 자동 조회
const urlID = new URLSearchParams(location.search).get("id");
if (urlID) {
  input.value = urlID;
  fetchOrder(urlID);
}
