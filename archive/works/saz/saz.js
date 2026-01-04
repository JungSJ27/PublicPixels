// saz.js

const BASE_URL = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/saz/";
const TOTAL = 18;

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("sazTrack");
  const viewport = document.getElementById("sazViewport");
  if (!track || !viewport) return;

  // 18개 위계 기준으로 사이즈와 흐름을 먼저 잡아줌
  // 1 모티프 1 + 바리에이션 3개 (4)
  // 1 모티프 2 (2)
  // 솔리드 2개 (2)
  // 기하학 5개 (5)
  // 나비 2개 (2)
  // 꽃 1 + 바리에이션 3 (4)
  const layout = [
    { i: 1, cls: "saz-tile is-big" },     // motif 1 main
    { i: 2, cls: "saz-tile is-wide" },    // motif 1 var
    { i: 3, cls: "saz-tile is-small" },   // motif 1 var
    { i: 4, cls: "saz-tile is-tall" },    // motif 1 var

    { i: 5, cls: "saz-tile is-wide" },    // motif 2
    { i: 6, cls: "saz-tile is-small" },   // motif 2 var

    { i: 7, cls: "saz-tile is-wide" },    // solid
    { i: 8, cls: "saz-tile is-wide" },    // solid

    { i: 9, cls: "saz-tile is-small" },   // geometric
    { i: 10, cls: "saz-tile is-tall" },   // geometric
    { i: 11, cls: "saz-tile is-small" },  // geometric
    { i: 12, cls: "saz-tile is-wide" },   // geometric
    { i: 13, cls: "saz-tile is-small" },  // geometric

    { i: 14, cls: "saz-tile is-tall" },   // butterfly
    { i: 15, cls: "saz-tile is-small" },  // butterfly

    { i: 16, cls: "saz-tile is-big" },    // floral main
    { i: 17, cls: "saz-tile is-small" },  // floral var
    { i: 18, cls: "saz-tile is-wide" }    // floral var
  ];

  layout.forEach(item => {
    const tile = document.createElement("div");
    tile.className = item.cls;

    const img = document.createElement("img");
    img.src = `${BASE_URL}saz${item.i}.png`;
    img.alt = `Saz pattern ${item.i}`;
    img.loading = "lazy";
    img.decoding = "async";

    tile.appendChild(img);
    track.appendChild(tile);
  });

  // wheel -> horizontal scroll only inside viewport (desenlace 방식 응용) :contentReference[oaicite:2]{index=2}
  function wheelToHorizontal(e){
    if (viewport.scrollWidth <= viewport.clientWidth) return;
    if (e.shiftKey) return;

    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0){
      e.preventDefault();
      viewport.scrollLeft += delta;
    }
  }

  // drag to scroll
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  viewport.addEventListener("pointerdown", e => {
    isDown = true;
    startX = e.clientX;
    startScrollLeft = viewport.scrollLeft;
    viewport.setPointerCapture?.(e.pointerId);
  });

  viewport.addEventListener("pointermove", e => {
    if (!isDown) return;
    viewport.scrollLeft = startScrollLeft - (e.clientX - startX);
  });

  window.addEventListener("pointerup", () => {
    isDown = false;
  });

  viewport.addEventListener("wheel", wheelToHorizontal, { passive: false });
});
