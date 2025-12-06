import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* ---------- 기본 셋업: DOM 참조 ---------- */
const wrap = document.getElementById('section2');
const canvas = document.getElementById('c');
if (!wrap || !canvas) throw new Error('[section2] #section2 or #c not found');

// ========== INTRO & BUTTON LOGIC ==========
const intro = document.getElementById("intro-screen");
const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");
const hud = document.getElementById("s2-controls");

playBtn.addEventListener("click", () => {
  intro.style.display = "none";
  hud.style.display = "block";

  // pointer lock 활성화
  const canvas = document.getElementById("c");
  canvas.requestPointerLock();
});

archiveBtn.addEventListener("click", () => {
  window.location.href = "archive/";
});


/* ---------- 데이터: 문(작품) 목록 ---------- */
const projects = [
  { title: 'Work A', url: '#work-a' },
  { title: 'Work B', url: '#work-b' },
  { title: 'Work C', url: '#work-c' },
  { title: 'Work D', url: '#work-d' },
  { title: 'Work E', url: '#work-e' },
  { title: 'Work F', url: '#work-f' },
  { title: 'Work G', url: '#work-g' },
  { title: 'Work H', url: '#work-h' },
];
const MASTER = { title: 'All Works', url: '#all-works' };

const isMobileDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
renderer.setClearColor(0x000000, 0); // canvas 투명

const camera = new THREE.PerspectiveCamera(65, 1, 0.01, 200);
camera.position.set(0, 1.6, 7);

/* Lights */
scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.05));
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 8, 2);
scene.add(dir);

/* 바닥 그리드 */
const grid = new THREE.GridHelper(70, 48, 0x2a2f3a, 0x1b202b);
grid.position.set(0, -4, -10);
grid.material.transparent = true;
grid.material.opacity = 0.35;
scene.add(grid);

/* ---------- 문 생성 유틸 ---------- */
const DOOR_W = 1.2,
  DOOR_H = 2.0,
  FRAME_T = 0.08;

function makeTitleTexture(text = '') {
  const padX = 20,
    padY = 10,
    fontSize = 28;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  const tw = Math.max(200, Math.ceil(ctx.measureText(text).width) + padX * 2);
  const th = 64 + padY * 2;
  c.width = tw;
  c.height = th;

  ctx.fillStyle = '#0e121a';
  ctx.fillRect(0, 0, tw, th);
  ctx.strokeStyle = '#2f3a4c';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, tw - 2, th - 2);
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.fillStyle = '#eaf2ff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padX, th / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeDoor({ title, color = 0x92a0b4, glow = false }) {
  const g = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W + FRAME_T, DOOR_H + FRAME_T, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.7, metalness: 0.2 })
  );
  g.add(frame);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W, DOOR_H),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.1,
      emissive: glow ? 0x4458ff : 0x000000,
      emissiveIntensity: glow ? 0.35 : 0,
    })
  );
  panel.position.z = 0.06;
  g.add(panel);

  const tex = makeTitleTexture(title);
  const titleMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const titleMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W, DOOR_H * 0.18),
    titleMat
  );
  titleMesh.position.set(0, DOOR_H * 0.55, 0.07);
  g.add(titleMesh);

  const highlight = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W + 0.12, DOOR_H + 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
  );
  highlight.position.z = 0.065;
  highlight.visible = false;
  g.add(highlight);

  g.userData = { panel, highlight, title, isMaster: glow };
  return g;
}

function makeMasterDoor() {
  const g = makeDoor({ title: MASTER.title, color: 0x5db6ff, glow: true });

  const pt = new THREE.PointLight(0x6eb7ff, 0.8, 8, 2);
  pt.position.set(0, 0.6, 0.3);
  g.add(pt);

  return g;
}

/* ---------- 3) 배치 ---------- */
const doors = [];
const rand = (a, b) => a + Math.random() * (b - a);

// 마스터 문
const master = makeMasterDoor();
master.position.set(0, 1.6, -6);
master.userData.baseY = 1.6;
scene.add(master);

// 주변 랜덤 문 (모바일이면 안 만듦)
const isMobile = window.matchMedia('(max-width: 840px)').matches;
if (!isMobile) {
  projects.forEach((p, i) => {
    const d = makeDoor({
      title: p.title,
      color: new THREE.Color(`hsl(${((i * 360) / projects.length) | 0}, 55%, 60%)`).getHex(),
    });
    const r = rand(5.5, 9.0);
    const th = rand(-Math.PI * 0.6, Math.PI * 0.6);
    d.position.set(Math.sin(th) * r, rand(0.8, 3.2), -6 - Math.cos(th) * 1.5);
    d.userData.baseY = d.position.y;
    d.lookAt(0, 1.6, -7);
    scene.add(d);
    doors.push({
      mesh: d,
      url: p.url,
      phase: Math.random() * Math.PI * 2,
      baseY: d.userData.baseY,
    });
  });
}

/* ---------- PointerLockControls ---------- */
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());
controls.getObject().position.set(0, 1.6, 7);

// 전역 등록 (모바일 줌인 스크립트용)
window.master = { mesh: master };
window.camera = camera;
window.controls = controls;

// 마스터 문 = 전체 작업 페이지로
doors.push({
  mesh: master,
  url: 'section2/artworks.html',
  phase: Math.random() * Math.PI * 2,
  baseY: master.userData.baseY,
});

// 섹션 클릭 시 포인터락 (인트로가 끝난 뒤에만)
wrap.addEventListener('click', () => {
  if (introActive) return;
  if (isMobileDevice) return;
  if (!controls.isLocked) controls.lock();
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  document.body.style.overflow = locked ? 'hidden' : '';
});

/* ---------- 이동 키 입력 ---------- */
const keys = new Set();
window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function updateMovement(dt) {
  const speed = 3.5;
  let mx = 0,
    mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;

  if (mx || mz) {
    controls.getDirection(tmpForward);
    tmpForward.y = 0;
    if (tmpForward.lengthSq() === 0) return;
    tmpForward.normalize();

    tmpRight.crossVectors(tmpForward, WORLD_UP).normalize();

    const move = new THREE.Vector3()
      .addScaledVector(tmpForward, mz)
      .addScaledVector(tmpRight, mx)
      .normalize()
      .multiplyScalar(speed * dt);

    const obj = controls.getObject();
    obj.position.add(move);
    obj.position.y = 1.6;
  }
}

/* ---------- 선택 / 하이라이트 / 이동 ---------- */
const raycaster = new THREE.Raycaster();
let hovered = null;

function highlightFromCenter() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(doors.map((d) => d.mesh), true);
  if (hits.length) {
    let m = hits[0].object;
    while (m && !m.userData.panel) m = m.parent;
    if (m !== hovered) {
      if (hovered) hovered.userData.highlight.visible = false;
      hovered = m;
      if (hovered) hovered.userData.highlight.visible = true;
    }
  } else {
    if (hovered) hovered.userData.highlight.visible = false;
    hovered = null;
  }
}

renderer.domElement.addEventListener('click', () => {
  if (!controls.isLocked) return;
  if (!hovered) return;
  go(doors.find((d) => d.mesh === hovered)?.url);
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && hovered) go(doors.find((d) => d.mesh === hovered)?.url);
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') {
    const d = doors[Math.floor(Math.random() * doors.length)].mesh;
    camera.lookAt(d.position.x, d.position.y, d.position.z);
  }
});

function go(url) {
  if (!url) return;
  if (url.startsWith('#')) {
    document.querySelector(url)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    controls.unlock();
  } else {
    window.location.href = url;
  }
}

/* ---------- 반응형 & 가시성 처리 ---------- */
function fitToParent() {
  const w = Math.max(1, wrap.clientWidth);
  const h = Math.max(1, wrap.clientHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', fitToParent);
fitToParent();

let active = false;
const io = new IntersectionObserver(
  ([e]) => {
    active = e.isIntersecting;
    if (active) fitToParent();
  },
  { threshold: 0.08 }
);
io.observe(wrap);

/* ---------- 메인 루프 ---------- */
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  if (!active) return;

  const dt = Math.min(0.033, clock.getDelta());
  if (controls.isLocked) updateMovement(dt);

  const t = clock.elapsedTime;
  for (const d of doors) {
    if (d.mesh === master) {
      d.mesh.position.y = d.baseY + Math.sin(t * 1.2 + d.phase) * 0.06;
    } else {
      d.mesh.position.y = d.baseY + Math.sin(t * 1.3 + d.phase) * 0.006;
      d.mesh.rotation.z = Math.sin(t * 0.8 + d.phase) * 0.03;
    }
  }

  highlightFromCenter();
  renderer.render(scene, camera);
}
tick();

/* ===== Section2: 모바일 탭 시 전체 화면 아무데나 눌러도 이동 ===== */
(function MobileFullTap() {
  const isMobile = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const section = document.getElementById('section2');
  if (!isMobile || !section) return;

  // iOS: 터치 반응성 향상
  section.style.touchAction = 'manipulation';

  let tapped = false;
  function goToArtwork() {
    if (introActive) return; // 인트로가 남아 있으면 자동 이동 막기
    if (tapped) return;
    tapped = true;
    window.location.href = 'art/';
  }

  // 뒤로가기 후 다시 활성화
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) tapped = false;
  });

  // 탭 감지
  let downX = 0,
    downY = 0,
    downT = 0;
  section.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
    },
    { passive: true }
  );

  section.addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      const dt = performance.now() - downT;
      const isTap = dist < 12 && dt < 500;
      if (isTap) goToArtwork();
    },
    { passive: true }
  );

  // fallback
  section.addEventListener(
    'click',
    () => {
      goToArtwork();
    },
    { passive: true }
  );
})();
