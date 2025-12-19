/* =========================
   VIDEO SEQUENCE
========================= */

const videos = [
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/delulu-is-the-solulu/G_23FA_dda610sec1(or%202)_JJ_SavvyA_OnurM_LuizaV_deluluisthesolulu.mp4",
  "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/delulu-is-the-solulu/G_23FA_dda610sec1(or%202)_JJ_SavvyA_OnurM_LuizaV_deluluisthesolulu(2).mp4"
];

const captions = [
  "This scene documents the installation process. The system repeats a constrained motion.",
  "Instability accumulates as repetition continues without resolution."
];

const player = document.getElementById("player");
const caption = document.getElementById("caption");
const modalText = document.getElementById("modalText");

let index = 0;

function playVideo(i) {
  player.src = videos[i];
  caption.textContent = `${i + 1} / ${videos.length}`;
  modalText.textContent = captions[i];
  player.load();
  player.play().catch(()=>{});
}

player.addEventListener("ended", () => {
  index = (index + 1) % videos.length;
  playVideo(index);
});

playVideo(index);

/* =========================
   THREE JS BACKGROUND
========================= */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
  100
);
camera.position.z = 8;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(4, 6, 4);
scene.add(light);

const loader = new GLTFLoader();
const floaters = [];

function makeMaterial() {
  const colors = [0x8fa7ff, 0xa2ffd6, 0xffb3e6, 0xcbb3ff, 0xffe3a2];
  return new THREE.MeshPhysicalMaterial({
    color: colors[Math.floor(Math.random() * colors.length)],
    roughness: 0.5,
    metalness: 0.05,
    transmission: 0.6,
    thickness: 0.5,
    transparent: true,
    opacity: 0.8
  });
}

function getVisibleBounds(z) {
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFOV / 2) * Math.abs(z - camera.position.z);
  const width = height * camera.aspect;
  return { width, height };
}

const glbs = [
  "./glass.glb",
  "./fork.glb",
  "./spoon.glb",
  "./plate.glb",
  "./knife.glb"
];

// 🔥 각 모델당 2–3개씩 생성
glbs.forEach(path => {
  const count = 2 + Math.floor(Math.random() * 2); // 2 or 3
  for (let i = 0; i < count; i++) {
    addFloater(path);
  }
});

function addFloater(path) {
  loader.load(path, (gltf) => {
    const obj = gltf.scene;
    const mat = makeMaterial();

    obj.traverse((c) => {
      if (c.isMesh) {
        c.material = mat;
        c.geometry.computeBoundingBox();
      }
    });

    // normalize size (🔥 더 작게)
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z);

    const TARGET_SIZE = 0.45; // 🔥 작아짐
    obj.scale.setScalar(TARGET_SIZE / maxAxis);

    // place inside camera view
    const z = camera.position.z - (1.8 + Math.random() * 1.8);
    const { width, height } = getVisibleBounds(z);
    const margin = 0.8;

    obj.position.set(
      (Math.random() - 0.5) * (width - margin),
      (Math.random() - 0.5) * (height - margin),
      z
    );

    obj.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    obj.userData = {
      seed: Math.random() * 10,
      drift: 0.0006 + Math.random() * 0.0006
    };

    scene.add(obj);
    floaters.push(obj);
  });
}

function animate(t) {
  t *= 0.001;

  for (const o of floaters) {
    o.position.y += Math.sin(t + o.userData.seed) * o.userData.drift;
    o.position.x += Math.cos(t * 0.7 + o.userData.seed) * o.userData.drift * 0.5;
    o.rotation.y += 0.0008;
    o.rotation.x += 0.0006;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
