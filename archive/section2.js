/* ======================================================
   BASIC SELECTORS
====================================================== */
const introUI = document.getElementById("intro-ui");
const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");
const hud = document.getElementById("s2-controls");
const rippleCanvas = document.getElementById("ripple-overlay");
const rippleCtx = rippleCanvas.getContext("2d");

/* ======================================================
   RIPPLE CANVAS SETUP
====================================================== */
function resizeRipple() {
  rippleCanvas.width = window.innerWidth;
  rippleCanvas.height = window.innerHeight;
}
resizeRipple();
window.addEventListener("resize", resizeRipple);

/* ======================================================
   GENERATE WATER RIPPLE EFFECT
====================================================== */
let t = 0;
function drawRipple() {
  const w = rippleCanvas.width;
  const h = rippleCanvas.height;

  rippleCtx.clearRect(0, 0, w, h);

  const imgData = rippleCtx.createImageData(w, h);
  const data = imgData.data;

  // 얇은 하얀 선 느낌 + 비정형 패턴
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      const nx = x / w;
      const ny = y / h;

      // 불규칙 wave
      const wave =
        Math.sin((nx * 14 + t) * 3) * 0.5 +
        Math.sin((ny * 20 - t * 0.9) * 4) * 0.5 +
        Math.sin((nx * 50 - ny * 30 + t * 1.3)) * 0.2;

      const v = (wave + 1) * 0.5;

      // contrast 더 강하게
      let bright = Math.pow(v, 8) * 255;

      // 얇은 하이라인 강조
      if (v > 0.92) bright = 255;

      data[i] = 180 + bright * 0.3;
      data[i + 1] = 200 + bright * 0.4;
      data[i + 2] = 255;
      data[i + 3] = 60 + bright * 0.5;
    }
  }

  rippleCtx.putImageData(imgData, 0, 0);
  t += 0.01;

  requestAnimationFrame(drawRipple);
}
drawRipple();

/* ======================================================
   INTRO BUTTON LOGIC
====================================================== */
playBtn.addEventListener("click", () => {
  introUI.style.display = "none";

  // HUD 켜기
  hud.classList.add("visible");
  hud.style.pointerEvents = "auto";

  // 물결 페이드아웃 → hidden
  rippleCanvas.classList.add("hidden");
  setTimeout(() => {
    rippleCanvas.style.display = "none";
  }, 1600);

  // 3D map pointer lock 활성화
  const canvas = document.getElementById("c");
  canvas.requestPointerLock();
});

archiveBtn.addEventListener("click", () => {
  window.location.href = "archive/";
});

/* ======================================================
   KEEP THREE.JS RENDER LOOP ALIVE
====================================================== */
// 네가 기존에 갖고 있었던 THREE.js 코드의 animate()는 그대로 유지해야 함.
// 절대 이 파일에서 animate()를 덮어쓰지 않음.
// 이 파일은 ripple overlay + intro UI만 담당.
