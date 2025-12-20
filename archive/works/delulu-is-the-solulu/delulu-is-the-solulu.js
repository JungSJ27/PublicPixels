/* delulu-is-the-solulu.js */

/* =========================
   VIDEO SEQUENCE
========================= */

const videos = [
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/delulu-is-the-solulu/G_23FA_dda610sec1(or%202)_JJ_SavvyA_OnurM_LuizaV_deluluisthesolulu.mp4",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/delulu-is-the-solulu/G_23FA_dda610sec1(or%202)_JJ_SavvyA_OnurM_LuizaV_deluluisthesolulu(2).mp4"
];

const captions = [
  /* =========================
     VIDEO 1 – ENGLISH
  ========================= */
  `
  <div class="art-info">
    <h1 class="art-title">Delulu is the Solulu</h1>

    <p class="art-meta">
      2024<br>
      Installation (projection mapping, 3D printing, electronics, motors)<br>
      1.5 × 1.5 × 2.5 m
    </p>

    <div class="art-divider"></div>

    <p class="art-desc">
      Welcome to <i>Delulu is the Solulu</i>, an installation that invites you
      to explore the complex landscapes of the human mind.
      <i>Delulu</i> is a term derived from the digital landscape where diverse
      identities are assumed and perceptions are manipulated.
    </p>

    <p class="art-desc">
      In the exhibition, objects are deliberately arranged on the floor and
      above eye level to represent discoverable yet disorienting conditions.
      As the objects are illuminated, shadows emerge, creating an additional
      layer of complexity within the visual experience.
    </p>

    <p class="art-desc">
      Light and shadow embody obscured truths and distorted realities.
      Viewers are invited to question the boundaries of perception, and to
      consider whether <i>delulu</i> is truly the <i>solulu</i>.
    </p>

    <a class="info-link" href="/studiolog/log/202405/">
      <svg class="ic-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17 L17 7" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M10 7h7v7" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
      Explore Exhibition
    </a>
  </div>
  `,

  /* =========================
     VIDEO 2 – KOREAN
  ========================= */
  `
  <div class="art-info">
    <h1 class="art-title">Delulu is the Solulu</h1>

    <p class="art-meta">
      2024<br>
      Installation (projection mapping, 3D printing, electronics, motors)<br>
      1.5 × 1.5 × 2.5 m
    </p>

    <div class="art-divider"></div>

    <p class="art-desc kor">
      <i>Delulu is the Solulu</i>는 인간의 심리적 풍경을 탐구하도록
      관객을 초대하는 설치 작품이다.
      ‘Delulu’라는 표현은 디지털 환경 속에서 정체성이 유동적으로
      구성되고 인식이 조작되는 상태를 의미한다.
    </p>

    <p class="art-desc kor">
      전시장 안의 오브젝트들은 바닥과 시선 위 공간에 의도적으로
      배치되어, 발견 가능하지만 동시에 방향 감각을 흐트러뜨리는
      상태를 만들어낸다.
      조명이 켜지면 그림자가 생성되며 시각적 경험에 또 다른 층위를
      더한다.
    </p>

    <p class="art-desc kor">
      빛과 그림자는 왜곡된 현실과 가려진 진실을 상징하며,
      관객은 인식의 경계를 질문하게 된다.
      이 작업은 ‘망상(delulu)’이 과연 ‘해결책(solulu)’이 될 수 있는지를
      되묻는다.
    </p>

    <a class="info-link" href="/studiolog/log/202405/">
      <svg class="ic-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17 L17 7" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M10 7h7v7" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
      Explore Exhibition
    </a>
  </div>
  `
];


const player = document.getElementById("player");
const caption = document.getElementById("caption");
const modalText = document.getElementById("modalText");
const videoBox = document.getElementById("videoBox");
const videoModal = document.getElementById("videoModal");

let index = 0;
let modalOpen = false;

function playVideo(i) {
  player.src = videos[i];
  caption.textContent = `${i + 1} / ${videos.length}`;
  modalText.innerHTML = captions[i];
  modalText.scrollTop = 0;
  player.load();
  player.play().catch(() => {});
}

player.addEventListener("ended", () => {
  index = (index + 1) % videos.length;
  playVideo(index);
});

playVideo(index);

/* =========================
   MODAL UX
========================= */

/* desktop hover pause */
videoBox?.addEventListener("mouseenter", () => {
  if (!player.paused) player.pause();
});

videoBox?.addEventListener("mouseleave", () => {
  if (!modalOpen) player.play().catch(() => {});
});

/* mobile tap toggle */
videoBox?.addEventListener("click", () => {
  const isCoarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!isCoarse) return;

  modalOpen = !modalOpen;
  videoBox.classList.toggle("show-modal", modalOpen);
  videoModal?.setAttribute("aria-hidden", modalOpen ? "false" : "true");

  if (modalOpen) player.pause();
  else player.play().catch(() => {});
});

/* =========================
   THREE JS BACKGROUND
========================= */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* =========================
   BASIC SETUP
========================= */

const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
});

renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  120
);
camera.position.z = 8;

/* =========================
   LIGHTS
========================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.72));

const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
dirLight.position.set(4, 6, 4);
scene.add(dirLight);

/* =========================
   LOADERS & STORAGE
========================= */

const loader = new GLTFLoader();
const floaters = [];

/* =========================
   HELPERS
========================= */

// material
function makeMaterial() {
  const colors = [0x8fa7ff, 0xa2ffd6, 0xffb3e6, 0xcbb3ff, 0xffe3a2];
  return new THREE.MeshPhysicalMaterial({
    color: colors[Math.floor(Math.random() * colors.length)],
    roughness: 0.5,
    metalness: 0.05,
    transmission: 0.6,
    thickness: 0.5,
    transparent: true,
    opacity: 0.82
  });
}

// camera visible bounds
function getVisibleBounds(z) {
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFOV / 2) * Math.abs(z - camera.position.z);
  const width = height * camera.aspect;
  return { width, height };
}

// force edge position (중앙 차단)
function edgePosition(range, deadZone = 0.7) {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const t = deadZone + Math.random() * (1 - deadZone);
  return sign * t * range;
}

/* =========================
   MODELS
========================= */

const glbs = [
  "./glass.glb",
  "./fork.glb",
  "./spoon.glb",
  "./plate.glb",
  "./knife.glb"
];

// 🔥 모델 개수 (확실히 많게)
glbs.forEach((path) => {
  const count = 3 + Math.floor(Math.random() * 3); // 4–6개
  for (let i = 0; i < count; i++) {
    addFloater(path);
  }
});

/* =========================
   ADD FLOATER
========================= */

function addFloater(path) {
  loader.load(path, (gltf) => {
    const obj = gltf.scene;
    const mat = makeMaterial();

    obj.traverse((c) => {
      if (c.isMesh) c.material = mat;
    });

    // normalize size
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z);

    const TARGET_SIZE = 0.34;
    obj.scale.setScalar(TARGET_SIZE / maxAxis);

    // depth
    const z = camera.position.z - (2.2 + Math.random() * 2.8);
    const { width, height } = getVisibleBounds(z);

    const rx = width / 2;
    const ry = height / 2;

    // 🔥 X or Y 중 하나는 무조건 edge
    const lockX = Math.random() < 0.5;

    const x = lockX
      ? edgePosition(rx, 0.75)
      : (Math.random() - 0.5) * width * 0.6;

    const y = lockX
      ? (Math.random() - 0.5) * height * 0.6
      : edgePosition(ry, 0.75);

    obj.position.set(x, y, z);

    obj.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    obj.userData = {
      seed: Math.random() * 10,
      drift: 0.0006 + Math.random() * 0.0007,
      wobble: 0.0002 + Math.random() * 0.00025
    };

    scene.add(obj);
    floaters.push(obj);
  });
}

/* =========================
   ANIMATION
========================= */

function animate(t) {
  t *= 0.001;

  for (const o of floaters) {
    o.position.y += Math.sin(t + o.userData.seed) * o.userData.drift;
    o.position.x += Math.cos(t * 0.7 + o.userData.seed) * o.userData.drift * 0.55;

    o.position.y +=
      Math.sin(t * 1.8 + o.userData.seed * 2.1) * o.userData.wobble;

    o.rotation.y += 0.0009;
    o.rotation.x += 0.00065;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* =========================
   RESIZE
========================= */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
