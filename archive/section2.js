/* =========================================================
   Section2.js — Pixel Gate Scene (Stable Full Version)
   ========================================================= */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* ---------- DOM ---------- */
const wrap = document.getElementById('section2');
const canvas = document.getElementById('c');
const introUI = document.getElementById("intro-ui");
const playBtn = document.querySelector(".btn-play");
const archiveBtn = document.querySelector(".btn-archive");
const hud = document.getElementById("s2-controls");

if (!wrap || !canvas) throw new Error("Section2 element missing");

/* ---------- Renderer ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);  // transparent

/* ---------- Scene & Camera ---------- */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(65, 1, 0.01, 200);

/* ⭐ 카메라 초기 위치: 멀리서 전체 화면 보이게 설정 */
camera.position.set(0, 1.8, 14);

/* ---------- Lights ---------- */
scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.1));
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 8, 2);
scene.add(dir);

/* ---------- Grid Floor ---------- */
const grid = new THREE.GridHelper(90, 60, 0x20252f, 0x10141b);
grid.position.set(0, -4, 0);
grid.material.opacity = 0.32;
grid.material.transparent = true;
scene.add(grid);

/* ---------- Data ---------- */
const projects = [
  { title: 'Work A', url: '#work-a' },
  { title: 'Work B', url: '#work-b' },
  { title: 'Work C', url: '#work-c' },
  { title: 'Work D', url: '#work-d' },
  { title: 'Work E', url: '#work-e' },
  { title: 'Work F', url: '#work-f' },
];

const MASTER = { title: "All Works", url: "archive/" };

/* ---------- Utilities ---------- */
function makeTitleTexture(text) {
  const fontSize = 28;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.font = `600 ${fontSize}px Poppins, sans-serif`;
  const width = ctx.measureText(text).width + 40;
  const height = fontSize * 2;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#0d1118";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#3b465a";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  ctx.font = `600 ${fontSize}px Poppins, sans-serif`;
  ctx.fillStyle = "#e2e8ff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 20, height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeDoor(title, colorHex, emissive = false) {
  const g = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.1, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x18202e, roughness: 0.7 })
  );
  g.add(frame);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.9),
    new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: emissive ? colorHex : 0x000000,
      emissiveIntensity: emissive ? 0.35 : 0.0
    })
  );
  panel.position.z = 0.055;
  g.add(panel);

  const tex = makeTitleTexture(title);
  const titleMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.35),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  titleMesh.position.set(0, 1.15, 0.065);
  g.add(titleMesh);

  const highlight = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 2.2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
  );
  highlight.position.z = 0.07;
  highlight.visible = false;
  g.add(highlight);

  g.userData = { panel, highlight, title };
  return g;
}

function makeMasterDoor() {
  const g = makeDoor(MASTER.title, 0x5db6ff, true);
  const light = new THREE.PointLight(0x88caff, 1.0, 8);
  light.position.set(0, 0.6, 0.4);
  g.add(light);
  return g;
}

/* ---------- Build Doors ---------- */
const doors = [];
const master = makeMasterDoor();
master.position.set(0, 1.7, -8);
scene.add(master);

doors.push({ mesh: master, url: MASTER.url });

projects.forEach((p, i) => {
  const color = new THREE.Color(`hsl(${(i * 360) / projects.length}, 60%, 60%)`);
  const d = makeDoor(p.title, color.getHex());

  const angle = (i / projects.length) * Math.PI * 2;
  const radius = 9.5;

  d.position.set(Math.sin(angle) * radius, 1.6, -6 - Math.cos(angle) * radius * 0.3);
  d.lookAt(0, 1.6, -8);

  scene.add(d);
  doors.push({ mesh: d, url: p.url });
});

/* ---------- Pointer Lock Controls ---------- */
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

/* ---------- Intro UI : Play ---------- */
let introActive = true;

playBtn.onclick = () => {
  introActive = false;
  introUI.style.opacity = "0";
  introUI.style.pointerEvents = "none";
  hud.style.display = "block";

  setTimeout(() => introUI.remove(), 500);

  camera.position.set(0, 1.6, 6);   // 플레이 시작 시 가까이
  controls.lock();
};

archiveBtn.onclick = () => {
  window.location.href = "archive/";
};

/* ---------- Highlight ---------- */
const raycaster = new THREE.Raycaster();
let hovered = null;

function highlight() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(doors.map(d => d.mesh), true);

  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.panel) o = o.parent;

    if (hovered !== o) {
      if (hovered) hovered.userData.highlight.visible = false;
      hovered = o;
      if (hovered) hovered.userData.highlight.visible = true;
    }
  } else {
    if (hovered) hovered.userData.highlight.visible = false;
    hovered = null;
  }
}

renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked) return;
  if (!hovered) return;

  const d = doors.find(d => d.mesh === hovered);
  if (d) window.location.href = d.url;
});

/* ---------- Resize ---------- */
function fit() {
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", fit);
fit();

/* ---------- Animate ---------- */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  // 문 움직임
  doors.forEach((d, i) => {
    if (d.mesh === master) {
      d.mesh.position.y = 1.7 + Math.sin(t * 1.2) * 0.07;
    } else {
      d.mesh.position.y = 1.6 + Math.sin(t * 1.4 + i) * 0.05;
    }
  });

  highlight();
  renderer.render(scene, camera);
}

animate();
