(() => {
  const viewport = document.getElementById("mediaViewport");
  const scaler = document.getElementById("mediaScaler");
  const canvas = document.getElementById("mediaCanvas");

  if (!viewport || !scaler || !canvas) return;

  function scaleCanvasToViewportHeight() {
    const canvasW = canvas.offsetWidth;
    const canvasH = canvas.offsetHeight;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    // 높이에 맞춰 스케일, 비율 유지
    const scale = vh / canvasH;

    // 스케일된 실제 크기만큼 스크롤 영역이 생기도록 scaler의 크기를 픽셀로 지정
    const scaledW = Math.ceil(canvasW * scale);
    const scaledH = Math.ceil(canvasH * scale);

    scaler.style.width = scaledW + "px";
    scaler.style.height = scaledH + "px";

    canvas.style.transform = `scale(${scale})`;
  }

  // 트랙패드 세로 휠을 가로 스크롤로 변환 (가로 스테이지에서만)
  function wheelToHorizontal(e) {
    const canScrollX = viewport.scrollWidth > viewport.clientWidth;
    if (!canScrollX) return;

    // shift 누르면 원래 가로 스크롤이니까 그대로 두기
    if (e.shiftKey) return;

    // 세로 스크롤 입력을 가로로 바꿔주기
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0) {
      e.preventDefault();
      viewport.scrollLeft += delta;
    }
  }

  // 드래그로 가로 스크롤
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  function onDown(e) {
    isDown = true;
    startX = e.clientX;
    startScrollLeft = viewport.scrollLeft;
  }

  function onMove(e) {
    if (!isDown) return;
    const dx = e.clientX - startX;
    viewport.scrollLeft = startScrollLeft - dx;
  }

  function onUp() {
    isDown = false;
  }

  // 초기화
  window.addEventListener("load", scaleCanvasToViewportHeight);
  window.addEventListener("resize", scaleCanvasToViewportHeight);

  // 상단에서만 휠 가로 변환
  viewport.addEventListener("wheel", wheelToHorizontal, { passive: false });

  // 드래그
  viewport.addEventListener("pointerdown", onDown);
  viewport.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
})();
