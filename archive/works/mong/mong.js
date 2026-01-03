// mong.js
(() => {
  const modal = document.getElementById("mong_modal");
  const modalTitle = document.getElementById("modal_title");
  const modalText = document.getElementById("modal_text");

  const btnPrev = document.getElementById("modal_prev");
  const btnNext = document.getElementById("modal_next");

  const tiles = Array.from(document.querySelectorAll(".mong_tile"));

  const tileCopy = {
    "1_1": "Tile 1 1 description.",
    "1_2": "Tile 1 2 description.",
    "1_3": "Tile 1 3 description.",
    "2_1": "Tile 2 1 description.",
    "2_2": "Tile 2 2 description.",
    "2_3": "Tile 2 3 description.",
    "3_1": "Tile 3 1 description.",
    "3_2": "Tile 3 2 description.",
    "3_3": "Tile 3 3 description."
  };

  let activeIndex = 0;

  function openModal(index){
    activeIndex = index;
    const tile = tiles[activeIndex];
    const id = tile?.dataset?.tile || "";

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    modalTitle.textContent = id.replace("_", " ");
    modalText.textContent = tileCopy[id] || "Add your description in mong.js";

    document.body.style.overflow = "hidden";
  }

  function closeModal(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function step(delta){
    const next = (activeIndex + delta + tiles.length) % tiles.length;
    openModal(next);
  }

  tiles.forEach((btn, idx) => {
    btn.addEventListener("click", () => openModal(idx));
  });

  modal.addEventListener("click", (e) => {
    const closeTarget = e.target.closest("[data_close='1']");
    if (closeTarget) closeModal();
  });

  btnPrev.addEventListener("click", () => step(-1));
  btnNext.addEventListener("click", () => step(1));

  window.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;

    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
})();
