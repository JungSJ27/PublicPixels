// Heart Necklace Product Page — fixed id + media
import { add } from "/front/cartstore.js";

let data = null;
let qty = 1;
let selColor = null;
let selSize = null;
let mainImage = "";   // 썸네일 절대 경로 저장용

async function load() {
  const res = await fetch("./heart-necklace.json");
  data = await res.json();

  const base = document.baseURI;

  // ✅ 첫 이미지를 절대경로로 만들어서 저장
  mainImage = new URL(data.images[0], base).href;

  document.getElementById("title").textContent = data.title;
  document.getElementById("price").textContent =
    data.price === 0 ? "Req." : "$" + data.price;
  document.getElementById("desc").textContent = data.desc;

  // ✅ 페이지에 표시되는 이미지들도 절대경로로
  const imgArea = document.getElementById("img-area");
  data.images.forEach(src => {
    const img = document.createElement("img");
    img.src = new URL(src, base).href;
    imgArea.appendChild(img);
  });

  // colors
  const cl = document.getElementById("colors");
  data.colors.forEach(c => {
    const b = document.createElement("button");
    b.className = "color-btn";
    b.style.background = c;
    b.onclick = () => {
      document.querySelectorAll(".color-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      selColor = c;
    };
    cl.appendChild(b);
  });

  // sizes
  const sz = document.getElementById("sizes");
  data.sizes.forEach(s => {
    const b = document.createElement("button");
    b.className = "size-btn";
    b.textContent = s;
    b.onclick = () => {
      document.querySelectorAll(".size-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      selSize = s;
    };
    sz.appendChild(b);
  });

  // notes
  const notes = document.getElementById("notes");
  data.notes.forEach(n => {
    const li = document.createElement("li");
    li.textContent = n;
    notes.appendChild(li);
  });

  document.getElementById("mat").textContent = data.material;
  document.getElementById("ship").textContent = data.shipping;
  document.getElementById("care").textContent = data.care;
}

// 수량은 그대로
load();

document.getElementById("qty-plus").onclick = () => {
  qty++;
  document.getElementById("qty-num").textContent = qty;
};
document.getElementById("qty-minus").onclick = () => {
  if (qty > 1) qty--;
  document.getElementById("qty-num").textContent = qty;
};

// ✅ ADD TO CART
document.getElementById("btnAdd").onclick = () => {
  if (!selColor || !selSize) {
    alert("Please select color and size.");
    return;
  }

const item = {
  id: data.id,
  name: data.title,
  price: data.price,
  qty: qty,
  url: location.href,

  // thumbnail을 목록 페이지와 동일하게
  media: "/pixelshop/secass3/THN.png",

  // variant는 목록 페이지와 동일하게 "없음"
  variant: "",

  type: "product",
};


  add(item, qty);

  // 카트 열기
  if (window.openCart) {
    window.openCart();
  } else {
    window.dispatchEvent(new CustomEvent("cart:add", { detail: item }));
  }
};
