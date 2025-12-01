/* ===========================
   1) 색상 변경 → 페이지 이동
=========================== */
const colorSelect = document.querySelector("#colorSelect");

if (colorSelect) {
  colorSelect.addEventListener("change", () => {
    const link = colorSelect.selectedOptions[0].dataset.link;
    if (link) window.location.href = link;
  });
}


/* ===========================
   2) 수량 선택
=========================== */
let qty = 1;
const qtyMinus = document.querySelector("#qtyMinus");
const qtyPlus = document.querySelector("#qtyPlus");
const qtyNum = document.querySelector("#qtyNum");

qtyMinus.addEventListener("click", () => {
  if (qty > 1) qty--;
  qtyNum.textContent = qty;
});

qtyPlus.addEventListener("click", () => {
  qty++;
  qtyNum.textContent = qty;
});


/* ===========================
   3) ADD TO CART
=========================== */
import { addItemToCart } from "/front/cart.js";

const addToCartBtn = document.querySelector("#addToCartBtn");

addToCartBtn.addEventListener("click", () => {

  const size = document.querySelector("#sizeSelect").value;
  const color = document.querySelector("#colorSelect").value;

  addItemToCart({
    id: addToCartBtn.dataset.id + "_" + color + "_" + size,
    title: addToCartBtn.dataset.title + ` (${color}, ${size})`,
    price: Number(addToCartBtn.dataset.price),
    qty,
    thumb: addToCartBtn.dataset.thumb
  });

});


/* ===========================
   4) 아코디언
=========================== */
document.querySelectorAll(".acc-item").forEach(item => {
  const header = item.querySelector(".acc-header");
  header.addEventListener("click", () => {
    item.classList.toggle("active");
  });
});
