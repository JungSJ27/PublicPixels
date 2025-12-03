let quantity = 1;
let selectedColor = null;
let selectedSize = null;
let productData = null;

async function loadProduct() {
  const res = await fetch("./heart-necklace.json");
  const data = await res.json();

  productData = data; // ⭐ cart에 넣기 위해 전역 저장

  /* Title, Price */
  document.getElementById("prod-title").textContent = data.title;
  document.getElementById("prod-price").textContent = `$${data.price}`;
  document.getElementById("prod-desc").textContent = data.desc;

  /* Images */
  const imgWrap = document.getElementById("prod-images");
  data.images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    imgWrap.appendChild(img);
  });

  /* Colors */
  const colorArea = document.getElementById("color-area");
  data.colors.forEach(color => {
    const c = document.createElement("button");
    c.className = "color-circle";
    c.style.background = color;

    c.onclick = () => {
      document.querySelectorAll(".color-circle").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      selectedColor = color;
    };

    colorArea.appendChild(c);
  });

  /* Sizes */
  const sizeArea = document.getElementById("size-area");
  data.sizes.forEach(size => {
    const btn = document.createElement("button");
    btn.className = "size-btn";
    btn.textContent = size;

    btn.onclick = () => {
      document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = size;
    };

    sizeArea.appendChild(btn);
  });

  /* Notes */
  const notesArea = document.getElementById("notes-area");
  data.notes.forEach(n => {
    const li = document.createElement("li");
    li.textContent = n;
    notesArea.appendChild(li);
  });

  document.getElementById("mat-area").textContent = data.material;
  document.getElementById("ship-area").textContent = data.shipping;
  document.getElementById("care-area").textContent = data.care;
}

loadProduct();

/* Quantity */
document.getElementById("qty-plus").onclick = () => {
  quantity++;
  document.getElementById("qty-num").textContent = quantity;
};

document.getElementById("qty-minus").onclick = () => {
  if (quantity > 1) quantity--;
  document.getElementById("qty-num").textContent = quantity;
};

/* Add to Cart */
document.getElementById("addCartBtn").onclick = () => {
  if (!selectedColor || !selectedSize) {
    alert("Please select a color and size.");
    return;
  }

  if (!productData) {
    alert("Product data not loaded yet.");
    return;
  }

  let cart = JSON.parse(localStorage.getItem("pp-cart") || "[]");

  cart.push({
    id: productData.id,
    title: productData.title,
    price: productData.price,
    qty: quantity,
    thumb: productData.thumb, // JSON에서 제공하는 대표 이미지
    options: {
      color: selectedColor,
      size: selectedSize
    }
  });

  localStorage.setItem("pp-cart", JSON.stringify(cart));

  // cart.js에서 받는 open-cart 이벤트
  window.dispatchEvent(new CustomEvent("open-cart"));
};
