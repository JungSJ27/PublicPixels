// Heart Necklace Product Page — color = link navigation
import { add } from "/front/cartstore.js";

let data = null;
let qty = 1;
let selSize = null;
let mainImage = "";

async function load() {
  const res = await fetch("./heart-necklace.json");
  data = await res.json();

  const base = document.baseURI;

  // 메인 썸네일 절대경로
  mainImage = new URL(data.images[0], base).href;

  // 기본 텍스트
  document.getElementById("title").textContent = data.title;
  document.getElementById("price").textContent =
    data.price === 0 ? "Req." : "$" + data.price;
  document.getElementById("desc").textContent = data.desc;

  // 이미지 렌더링
  const imgArea = document.getElementById("img-area");
  data.images.forEach((src) => {
    const img = document.createElement("img");
    img.src = new URL(src, base).href;
    imgArea.appendChild(img);
  });

  // --------------------------------
  // ⭐ COLOR BUTTON → PAGE LINK
  // --------------------------------
  const cl = document.getElementById("colors");
  cl.innerHTML = "";

  if (Array.isArray(data.colors)) {
    data.colors.forEach((c) => {
      const b = document.createElement("button");
      b.className = "color-btn";
      b.style.background = c.color;
      b.onclick = () => {
        location.href = c.href; // 해당 색상 페이지로 이동
      };
      cl.appendChild(b);
    });
  }

  // --------------------------------
  // ⭐ SIZE BUTTONS
  // --------------------------------
  const sz = document.getElementById("sizes");
  const sizeBlock = document.querySelector(".block:nth-of-type(2)");

  if (!data.sizes || !Array.isArray(data.sizes) || data.sizes.length === 0) {
    // 사이즈 정보 없으면 전체 블록 숨김
    if (sizeBlock) sizeBlock.style.display = "none";
  } else {
    data.sizes.forEach((s) => {
      const b = document.createElement("button");
      b.className = "size-btn";
      b.textContent = s;

      b.onclick = () => {
        document
          .querySelectorAll(".size-btn")
          .forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        selSize = s;
      };

      sz.appendChild(b);
    });
  }

  // --------------------------------
  // ⭐ NOTES (여러 줄 p로 렌더링)
  // --------------------------------
  const notesBox = document.getElementById("notes");
  if (Array.isArray(data.notes) && notesBox) {
    notesBox.innerHTML = "";
    data.notes.forEach((n) => {
      const p = document.createElement("p");
      p.textContent = n;
      notesBox.appendChild(p);
    });
  }

  // 기타 텍스트
  document.getElementById("mat").textContent = data.material || "";
  document.getElementById("ship").textContent = data.shipping || "";
  document.getElementById("care").textContent = data.care || "";
}

load();

// --------------------------------
// Quantity
// --------------------------------
document.getElementById("qty-plus").onclick = () => {
  qty++;
  document.getElementById("qty-num").textContent = qty;
};

document.getElementById("qty-minus").onclick = () => {
  if (qty > 1) qty--;
  document.getElementById("qty-num").textContent = qty;
};

// --------------------------------
// ⭐ ADD TO CART (color 없음, size는 있을 때만 필수)
// --------------------------------
document.getElementById("btnAdd").onclick = () => {
  // 사이즈 옵션이 존재하는 상품일 때만 선택 강제
  if (Array.isArray(data.sizes) && data.sizes.length > 0 && !selSize) {
    alert("Please select size.");
    return;
  }

  const item = {
    id: data.id,
    name: data.title,
    price: data.price,
    qty: qty,
    url: location.href,
    media: mainImage,
    variant:
      Array.isArray(data.sizes) && data.sizes.length > 0 ? selSize : null,
    type: "product",
  };

  add(item, qty);

  if (window.openCart) {
    window.openCart();
  } else {
    window.dispatchEvent(new CustomEvent("cart:add", { detail: item }));
  }
};
