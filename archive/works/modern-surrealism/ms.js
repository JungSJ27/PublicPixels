/* =======================================================
   PAGE INIT
======================================================= */

window.addEventListener("DOMContentLoaded", () => {
  // headerLoader가 header를 DOM에 넣은 다음 프레임에 실행
  requestAnimationFrame(() => {
    initHeaderScroll();
  });

  initVideoFade();
  initImageSlider();
});

/* =======================================================
   HEADER SHOW / HIDE  (scroll up = show, scroll down = hide)
======================================================= */

window.addEventListener("load", () => {
  // headerLoader로 include된 헤더 잡기
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");
  const listToggle = document.querySelector(".list-toggle");

  if (!header) return;

  function applyHidden(isHidden) {
    if (isHidden) {
      header.classList.add("header-hidden");
      if (listToggle) listToggle.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
      if (listToggle) listToggle.classList.remove("header-hidden");
    }
  }

  let lastY = window.scrollY;

  // 첫 로딩 시 상태
  if (window.scrollY > 10) applyHidden(true);
  else applyHidden(false);

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    // 맨 위 근처면 항상 보이게
    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    // 스크롤 방향에 따라 토글
    if (y < lastY - 2) {
      // 위로 스크롤 = 보이기
      applyHidden(false);
    } else if (y > lastY + 2) {
      // 아래로 스크롤 = 숨기기
      applyHidden(true);
    }

    lastY = y;
  });
});


/* ===============================================
   CONDENSED PAGE – INFO MODAL
   Desktop: hover
   Mobile: tap toggle (scroll safe)
=============================================== */
document.addEventListener("DOMContentLoaded", () => {
  const imageStage = document.querySelector(".image-stage");
  const modal = document.getElementById("fullscreenModal");
  if (!imageStage || !modal) return;

  const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  let isOpen = false;

  function setModal(open) {
    isOpen = open;
    modal.classList.toggle("show", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
  }

  /* DESKTOP – HOVER 유지 */
  if (!isTouch) {
    imageStage.addEventListener("mouseenter", () => setModal(true));
    imageStage.addEventListener("mouseleave", () => setModal(false));
    return;
  }

  /* MOBILE – TAP OPEN and TAP CLOSE, SCROLL SAFE */
  let sx = 0, sy = 0, moved = false;

  document.addEventListener("touchstart", (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    sx = t.clientX;
    sy = t.clientY;
    moved = false;
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - sx);
    const dy = Math.abs(t.clientY - sy);
    if (dx > 8 || dy > 8) moved = true;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (moved) return;

    const target = e.target;

    /* 헤더나 리스트 버튼은 항상 클릭 가능 */
    if (target.closest("header") || target.closest(".list-toggle")) return;

    /* 모달이 닫혀있을 때는 사진 터치만 열기 */
    if (!isOpen) {
      if (target.closest(".image-stage")) setModal(true);
      return;
    }

    /* 모달이 열려있을 때는 탭이면 닫기
       링크는 예외로 두고 싶으면 아래 한 줄 유지
    */
    if (target.closest("a")) return;

    setModal(false);
  }, { passive: true });
});


/* =======================================================
   BUTTERFLY SWARM (GLB) – CONTROLLABLE XYZ ROTATION
======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initButterflySwarm();
});

function initButterflySwarm() {
  const host = document.getElementById("bt-swarm");
  if (!host) return;

  /* ===============================
     🎛️ CONTROLS (여기만 만지면 됨)
  =============================== */

  const COUNT = 10;
  const MODEL_SRC = "./BT1.glb";

  // 속도 (너 값 0.05는 너무 느려서 방향 느낌이 거의 안 보임)
  const SPEED = 0.2;

  const SIZE_MIN = 80;
  const SIZE_MAX = 150;

  // 🔴 빨간색 (RGBA)
  const RED_COLOR = [0.4, 0.4, 0.4, 0.4];

  // ✅ 너가 원하는 “앞뒤/상하/좌우 회전” 컨트롤
  const ROT = {
    x: 30,      // 위아래 뒤집기: 180 해보면 확 바뀜
    y: 20,    // 앞뒤 뒤집기: 0 ↔ 180
    z: 80       // 자체 틀기
  };

  // 이동 방향에 따라 추가로 기울일지
  const FOLLOW_MOTION = {
    enabled: true,
    amount: 1.0  // 0이면 완전 고정, 1이면 이동방향 완전 반영
  };

  /* ===============================
     SETUP
  =============================== */

  let W = window.innerWidth;
  let H = window.innerHeight;

  const butterflies = [];
  const rand = (a, b) => a + Math.random() * (b - a);

  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "2000";

  /* ===============================
     CREATE ONE BUTTERFLY
  =============================== */

  function createButterfly() {
    const wrap = document.createElement("div");
    wrap.className = "bt-butterfly";
    wrap.style.position = "absolute";
    wrap.style.left = "0";
    wrap.style.top = "0";
    wrap.style.pointerEvents = "none";
    wrap.style.willChange = "transform";

    const size = rand(SIZE_MIN, SIZE_MAX);
    wrap.style.width = `${size}px`;
    wrap.style.height = `${size}px`;

    const mv = document.createElement("model-viewer");
    mv.src = MODEL_SRC;

    mv.setAttribute("autoplay", "");
    mv.setAttribute("animation-name", "*");
    mv.setAttribute("animation-playback-rate", "0.4");
    mv.setAttribute("interaction-prompt", "none");
    mv.setAttribute("disable-zoom", "");

    mv.setAttribute("exposure", "1.15");
    mv.setAttribute("shadow-intensity", "0");

    mv.style.width = "100%";
    mv.style.height = "100%";

    // ✅ 모델 자체의 “기본 방향”을 mv에 넣어준다 (앞뒤 뒤집기 등)
    // 이렇게 해두면 매 프레임 wrap을 업데이트해도 기본 방향이 유지됨
    mv.style.transform = `rotateX(${ROT.x}deg) rotateY(${ROT.y}deg) rotateZ(${ROT.z}deg)`;

    mv.addEventListener("load", () => {
      const model = mv.model;
      if (!model) return;

      model.materials.forEach((mat) => {
        if (!mat.pbrMetallicRoughness) return;
        mat.pbrMetallicRoughness.setBaseColorFactor(RED_COLOR);
        mat.pbrMetallicRoughness.setMetallicFactor(0.1);
        mat.pbrMetallicRoughness.setRoughnessFactor(0.6);
      });
    });

    wrap.appendChild(mv);
    host.appendChild(wrap);

    butterflies.push({
      el: wrap,
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-2, 2) * SPEED,
      vy: rand(-2, 2) * SPEED,
      ax: rand(-0.08, 0.08),
      ay: rand(-0.08, 0.08),
    });
  }

  for (let i = 0; i < COUNT; i++) createButterfly();

  window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;
  });

  /* ===============================
     ANIMATION LOOP
  =============================== */

  function animate() {
    const pad = 160;

    for (const b of butterflies) {
      b.vx += b.ax * SPEED;
      b.vy += b.ay * SPEED;

      b.vx = Math.max(-4 * SPEED, Math.min(4 * SPEED, b.vx));
      b.vy = Math.max(-4 * SPEED, Math.min(4 * SPEED, b.vy));

      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -pad) b.x = W + pad;
      if (b.x > W + pad) b.x = -pad;
      if (b.y < -pad) b.y = H + pad;
      if (b.y > H + pad) b.y = -pad;

      // ✅ 각도 변환 올바르게: 180/PI
      const motionAngle = Math.atan2(b.vy, b.vx) * (180 / Math.PI);

      // 이동 방향을 얼마나 반영할지
      const zFollow = FOLLOW_MOTION.enabled
        ? motionAngle * FOLLOW_MOTION.amount
        : 0;

      // ✅ wrap은 “위치 + 이동방향 기울기”만 담당 (기본 회전은 mv가 담당)
      b.el.style.transform =
        `translate3d(${b.x}px, ${b.y}px, 0) rotateZ(${zFollow}deg)`;

      if (Math.random() < 0.02) {
        b.ax = rand(-0.12, 0.12);
        b.ay = rand(-0.12, 0.12);
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
