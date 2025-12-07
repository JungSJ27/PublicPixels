import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* ---------- 기본 DOM ---------- */
const wrap   = document.getElementById('section2');
const canvas = document.getElementById('c');
if (!wrap || !canvas) throw new Error('[section2] missing #section2 or #c');

/* 인트로 UI 요소 */
const introUI   = document.getElementById('intro-ui');
const playBtn   = document.querySelector('.btn-play')  || document.getElementById('btn-play');
const archiveBtn= document.querySelector('.btn-archive') || document.getElementById('btn-archive');
const hud       = document.getElementById('s2-controls');

let introActive = true;
wrap.classList.add('intro-active');

/* ---------- 버튼 로직 ---------- */

// PLAY → 인트로 종료 + HUD 표시 + 포인터락
if (playBtn) {
  playBtn.addEventListener('click', () => {
    introActive = false;
    if (introUI) introUI.style.display = 'none';
    wrap.classList.remove('intro-active');
    if (hud) hud.classList.add('active');

    if (!isMobileDevice && !controls.isLocked) {
      controls.lock();
    }
  });
}

// ARCHIVE → 아카이브 페이지로
if (archiveBtn) {
  archiveBtn.addEventListener('click', () => {
    window.location.href = 'archive/';
  });
}

/* ---------- 데이터: 문(작품) 목록 ---------- */
const projects = [
  { title: 'Work A', url: '#work-a' },
  { title: 'Work B', url: '#work-b' },
  { title: 'Work C', url: '#work-c' },
  { title: 'Work D', url: '#work-d' },
  { title: 'Work E', url: '#work-e' },
  { title: 'Work F', url: '#work-f' },
  { title: 'Work G', url: '#work-g' },
  { title: 'Work H', url: '#work-h' }
];

const MASTER = { title: 'All Works', url: '#all-works' };
const isMobileDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/* ---------- THREE 기본 셋업 ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030013, 0.035);

renderer.setClearColor(0x000000, 0);

/* 카메라 – 살짝 멀리서 전체를 보는 뷰 */
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 200);
camera.position.set(0, 3.0, 13);

/* Lights */
scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x080810, 1.2));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(8, 12, 4);
scene.add(dir);

/* 바닥 그리드 (약하게) */
const grid = new THREE.GridHelper(80, 64, 0x2f3550, 0x171828);
grid.position.set(0, -3.2, -12);
grid.material.transparent = true;
grid.material.opacity = 0.3;
scene.add(grid);

/* ---------- 얕은 물 면 ---------- */
const waterGeo = new THREE.PlaneGeometry(70, 70, 120, 120);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x05081a,
  roughness: 0.9,
  metalness: 0.15,
  transparent: true,
  opacity: 0.98
});

const water = new THREE.Mesh(waterGeo, waterMat);
water.rotation.x = -Math.PI / 2;
water.position.set(0, -3.3, -10);
scene.add(water);

/* 원래 정점 복사해서 저장 (파도 계산용) */
const waterPos = water.geometry.attributes.position;
const waterBase = waterPos.array.slice();

/* ---------- 문 생성 유틸 ---------- */
const DOOR_W = 1.2;
const DOOR_H = 2.2;
const FRAME_T = 0.08;

function makeTitleTexture(text = '') {
  const padX = 20;
  const padY = 10;
  const fontSize = 28;

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');

  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  const tw = Math.max(220, Math.ceil(ctx.measureText(text).width) + padX * 2);
  const th = 64 + padY * 2;
  c.width = tw;
  c.height = th;

  ctx.fillStyle = '#050815';
  ctx.fillRect(0, 0, tw, th);

  ctx.strokeStyle = '#3a4a7a';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, tw - 2, th - 2);

  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.fillStyle = '#f5f5ff';
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
    new THREE.BoxGeometry(DOOR_W + FRAME_T, DOOR_H + FRAME_T, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x050915,
      roughness: 0.8,
      metalness: 0.25
    })
  );
  g.add(frame);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W, DOOR_H),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.15,
      emissive: glow ? 0x6cc4ff : 0x000000,
      emissiveIntensity: glow ? 0.5 : 0
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
  titleMesh.position.set(0, DOOR_H * 0.55, 0.08);
  g.add(titleMesh);

  const highlight = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W + 0.18, DOOR_H + 0.18),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12
    })
  );
  highlight.position.z = 0.09;
  highlight.visible = false;
  g.add(highlight);

  g.userData = { panel, highlight, title, isMaster: glow };
  return g;
}

function makeMasterDoor() {
  const g = makeDoor({ title: MASTER.title, color: 0x59b7ff, glow: true });

  const pt = new THREE.PointLight(0x73cfff, 1.0, 12, 2.0);
  pt.position.set(0, 0.7, 0.4);
  g.add(pt);

  return g;
}

/* ---------- 문 배치 ---------- */
const doors = [];
const rand = (a, b) => a + Math.random() * (b - a);

// 중앙 마스터 도어 (나중에 글라스 하우스 앞 느낌)
const master = makeMasterDoor();
master.position.set(0, 0.8, -14);
master.userData.baseY = master.position.y;
scene.add(master);

// 주변 랜덤 도어 (물 위에 떠있는 느낌)
const isMobile = window.matchMedia('(max-width: 840px)').matches;

if (!isMobile) {
  projects.forEach((p, i) => {
    const d = makeDoor({
      title: p.title,
      color: new THREE.Color(`hsl(${(i * 360) / projects.length}, 55%, 65%)`).getHex()
    });

    const r  = rand(7.5, 12.0);                        // 카메라 기준 반경
    const th = rand(-Math.PI * 0.4, Math.PI * 0.4);    // 좌우 각도
    d.position.set(
      Math.sin(th) * r,
      rand(-0.2, 1.0),
      -14 - Math.cos(th) * 1.5
    );
    d.userData.baseY = d.position.y;
    d.lookAt(0, 0.8, -16);
    scene.add(d);

    doors.push({
      mesh: d,
      url: p.url,
      phase: Math.random() * Math.PI * 2,
      baseY: d.userData.baseY
    });
  });
}

/* 마스터 도어도 doors 배열에 포함 (아트웍 전체 보기 등) */
doors.push({
  mesh: master,
  url: 'archive/',
  phase: Math.random() * Math.PI * 2,
  baseY: master.userData.baseY
});

/* ---------- PointerLockControls ---------- */
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());
controls.getObject().position.set(0, 2.2, 6);

window.master  = { mesh: master };
window.camera  = camera;
window.controls= controls;

/* 섹션 아무데나 클릭 → 인트로 끝난 뒤에만 포인터락 */
wrap.addEventListener('click', () => {
  if (introActive) return;
  if (isMobileDevice) return;
  if (!controls.isLocked) controls.lock();
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  document.body.style.overflow = locked ? 'hidden' : '';
});

/* ---------- 이동 로직 ---------- */
const keys = new Set();
window.addEventListener('keydown', e => keys.add(e.code));
window.addEventListener('keyup',   e => keys.delete(e.code));

const tmpForward = new THREE.Vector3();
const tmpRight   = new THREE.Vector3();
const WORLD_UP   = new THREE.Vector3(0, 1, 0);

function updateMovement(dt) {
  const speed = 4.0;
  let mx = 0, mz = 0;

  if (keys.has('KeyW') || keys.has('ArrowUp'))    mz += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown'))  mz -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;

  if (!mx && !mz) return;

  controls.getDirection(tmpForward);
  tmpForward.y = 0;
  if (tmpForward.lengthSq() === 0) return;
  tmpForward.normalize();

  tmpRight.crossVectors(tmpForward, WORLD_UP).normalize();

  const move = new THREE.Vector3()
    .addScaledVector(tmpForward, mz)
    .addScaledVector(tmpRight,   mx)
    .normalize()
    .multiplyScalar(speed * dt);

  const obj = controls.getObject();
  obj.position.add(move);
  obj.position.y = 2.2; // 고정 높이
}

/* ---------- 선택 / 하이라이트 ---------- */
const raycaster = new THREE.Raycaster();
let hovered = null;

function highlightFromCenter() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(doors.map(d => d.mesh), true);

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

/* 클릭 또는 Enter로 포탈 진입 */
renderer.domElement.addEventListener('click', () => {
  if (!controls.isLocked) return;
  if (!hovered) return;
  go(doors.find(d => d.mesh === hovered)?.url);
});

window.addEventListener('keydown', e => {
  if (e.code === 'Enter' && hovered) {
    go(doors.find(d => d.mesh === hovered)?.url);
  }
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

/* ---------- 반응형 ---------- */
function fitToParent() {
  const w = Math.max(1, wrap.clientWidth);
  const h = Math.max(1, wrap.clientHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', fitToParent);
fitToParent();

/* ---------- 메인 루프 (문 둥둥 + 물결) ---------- */
const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);

  const dt = Math.min(0.033, clock.getDelta());
  const t  = clock.elapsedTime;

  // 파도 애니메이션
  const arr = waterPos.array;
  const base = waterBase;
  for (let i = 0; i < arr.length; i += 3) {
    const x = base[i];
    const y0 = base[i + 1];
    const z = base[i + 2];

    const wave1 = Math.sin(x * 0.22 + t * 1.1) * 0.12;
    const wave2 = Math.cos(z * 0.18 + t * 0.9) * 0.08;
    arr[i + 1] = y0 + wave1 + wave2;
  }
  waterPos.needsUpdate = true;
  water.geometry.computeVertexNormals();

  // 문 둥둥 + 약간 회전
  for (const d of doors) {
    if (d.mesh === master) {
      d.mesh.position.y = d.baseY + Math.sin(t * 1.0 + d.phase) * 0.12;
    } else {
      d.mesh.position.y = d.baseY + Math.sin(t * 1.4 + d.phase) * 0.06;
      d.mesh.rotation.z = Math.sin(t * 0.7 + d.phase) * 0.03;
    }
  }

  if (controls.isLocked) updateMovement(dt);
  highlightFromCenter();
  renderer.render(scene, camera);
}
tick();

/* ---------- 모바일: 탭 한 번에 전체 아트로 이동 (예전 로직 대충 유지) ---------- */
(function MobileFullTap() {
  const isMobile = matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isMobile) return;

  const section = document.getElementById('section2');
  if (!section) return;

  section.style.touchAction = 'manipulation';

  let tapped = false;
  function goToArtwork() {
    if (introActive) return;
    if (tapped) return;
    tapped = true;
    window.location.href = 'archive/';
  }

  window.addEventListener('pageshow', e => {
    if (e.persisted) tapped = false;
  });

  let downX = 0, downY = 0, downT = 0;
  section.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    downX = e.clientX;
    downY = e.clientY;
    downT = performance.now();
  }, { passive: true });

  section.addEventListener('pointerup', e => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
    const dt = performance.now() - downT;
    if (dist < 12 && dt < 500) goToArtwork();
  }, { passive: true });

  section.addEventListener('click', () => {
    goToArtwork();
  }, { passive: true });
})();
