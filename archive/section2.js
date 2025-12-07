/* INTRO ELEMENTS */
const introUI = document.getElementById("intro-ui");
const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");
const rippleOverlay = document.getElementById("ripple-overlay");
const hud = document.getElementById("hud");

/* ======================================================
   THREE.JS SCENE
====================================================== */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* Renderer */
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000010, 1);

/* Scene */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000010, 10, 180);

/* Camera */
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 2.8, 8);

/* Lights */
scene.add(new THREE.AmbientLight(0x95b2ff, 1.2));
const d = new THREE.DirectionalLight(0xffffff, 2);
d.position.set(15, 25, 15);
scene.add(d);

/* Ocean Plane */
const oceanGeo = new THREE.PlaneGeometry(300, 300);
const oceanMat = new THREE.MeshPhongMaterial({ color: 0x001c39 });
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI/2;
scene.add(ocean);

/* MODEL LOADER */
const loader = new GLTFLoader();

/* Load House */
loader.load("/models/house.glb", (gltf)=>{
  const house = gltf.scene;
  house.position.set(0,0,0);
  house.scale.set(1.2,1.2,1.2);
  scene.add(house);
});

/* RANDOM FRAMES */
let frames = [];

for (let i=0; i<8; i++){
  loader.load("/models/frame.glb", (gltf)=>{
    const f = gltf.scene;

    f.position.set(
      (Math.random()-0.5)*80,
      1 + Math.random()*1.5,
      (Math.random()-0.5)*80
    );
    f.scale.set(0.9,0.9,0.9);
    f.userData.baseY = f.position.y;

    scene.add(f);
    frames.push(f);
  });
}

/* Float Animation */
function animateFrames(t){
  frames.forEach((f, i)=>{
    f.position.y = f.userData.baseY + Math.sin(t*0.001 + i)*0.25;
    f.rotation.y += 0.002;
  });
}

/* Controls */
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

let lx=0, ly=0;

document.addEventListener("mousemove", e=>{
  if (document.pointerLockElement === canvas){
    lx -= e.movementX * 0.0025;
    ly -= e.movementY * 0.0025;
    ly = Math.max(-1.1, Math.min(1.1, ly));
  }
});

/* MAIN LOOP */
function animate(t){
  requestAnimationFrame(animate);

  animateFrames(t);

  const sp = 0.16;
  const dir = new THREE.Vector3();

  if (keys["w"]) dir.z -= sp;
  if (keys["s"]) dir.z += sp;
  if (keys["a"]) dir.x -= sp;
  if (keys["d"]) dir.x += sp;

  dir.applyAxisAngle(new THREE.Vector3(0,1,0), lx);
  camera.position.add(dir);

  camera.rotation.set(ly, lx, 0);

  renderer.render(scene, camera);
}
animate();

/* Resize */
window.addEventListener("resize", ()=>{
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
});

/* ======================================================
   PLAY BUTTON
====================================================== */
playBtn.addEventListener("click", () => {

  introUI.style.display = "none";

  rippleOverlay.classList.add("hidden");
  setTimeout(()=> rippleOverlay.remove(), 1000);

  hud.hidden = false;
  setTimeout(()=> hud.classList.add("visible"), 50);

  canvas.requestPointerLock();
});

/* ARCHIVE */
archiveBtn.addEventListener("click", ()=>{
  window.location.href = "/archive/";
});
