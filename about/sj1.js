import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Sky } from "three/addons/objects/Sky.js";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const stage = document.getElementById("stage");

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0b12, 30, 160);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
stage.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);
camera.position.set(0.8, 3.3, 12.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2.0, 0);
controls.maxDistance = 28;
controls.minDistance = 6;
controls.maxPolarAngle = Math.PI * 0.48;

const clock = new THREE.Clock();

/* environment map */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* post */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.45,
  0.55,
  0.88
);
composer.addPass(bloom);

/* sky */
const sky = new Sky();
sky.scale.setScalar(450);
scene.add(sky);

const sun = new THREE.Vector3();
const skyU = sky.material.uniforms;
skyU.turbidity.value = 4.0;
skyU.rayleigh.value = 2.2;
skyU.mieCoefficient.value = 0.006;
skyU.mieDirectionalG.value = 0.82;

setSun(38, 160);

/* realistic cloud planes */
const clouds = makeCloudBackdrop();
scene.add(clouds);

/* lights for glossy ad look */
const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(8, 10, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xcfe0ff, 1.25);
fill.position.set(-7, 3.0, 6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffc6d8, 1.6);
rim.position.set(-2, 8, -12);
scene.add(rim);

scene.add(new THREE.AmbientLight(0xffffff, 0.18));

/* subtle floor */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(55, 120),
  new THREE.MeshStandardMaterial({
    color: 0x050509,
    roughness: 1.0,
    metalness: 0.0
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
scene.add(ground);

/* groups */
const peachGroup = new THREE.Group();
scene.add(peachGroup);

let peachRoot = null;
let humanoid = null;

/* materials */
const peachMat = new THREE.MeshPhysicalMaterial({
  color: 0xff2a52,
  roughness: 0.12,
  metalness: 0.06,
  clearcoat: 1.0,
  clearcoatRoughness: 0.03,
  sheen: 0.35,
  sheenRoughness: 0.6,
  sheenColor: new THREE.Color(0xffb3c0),
  transmission: 0.14,
  thickness: 0.8,
  ior: 1.46
});

/* load peach glb */
const gltf = new GLTFLoader();
gltf.load(
  "./peach.glb",
  (res) => {
    peachRoot = res.scene;

    peachRoot.traverse((c) => {
      if (!c.isMesh) return;
      c.material = peachMat;
      c.castShadow = false;
      c.receiveShadow = false;
      if (c.geometry) c.geometry.computeVertexNormals();
    });

    peachRoot.scale.set(2.35, 2.35, 2.35);
    peachRoot.position.set(0, 0.9, 0);
    peachRoot.rotation.y = Math.PI * 0.22;

    peachGroup.add(peachRoot);

    const anchor = new THREE.Object3D();
    anchor.name = "humanoidAnchor";
    anchor.position.set(0, 2.55, 0.25);
    peachGroup.add(anchor);

    humanoid = makeDemoHumanoid();
    humanoid.position.copy(anchor.position);
    humanoid.rotation.y = -Math.PI * 0.18;
    scene.add(humanoid);
  },
  undefined,
  (err) => console.error("peach.glb load error", err)
);

/* optional humanoid glb */
function loadHumanoidGLB(url){
  gltf.load(
    url,
    (res) => {
      if (humanoid) scene.remove(humanoid);
      humanoid = res.scene;

      humanoid.traverse((c) => {
        if (!c.isMesh) return;
        c.castShadow = false;
        c.receiveShadow = false;
      });

      const anchor = peachGroup.getObjectByName("humanoidAnchor");
      const pos = anchor ? anchor.position : new THREE.Vector3(0, 2.5, 0.2);

      humanoid.position.copy(pos);
      humanoid.rotation.y = -Math.PI * 0.18;

      scene.add(humanoid);
    },
    undefined,
    (err) => console.error("model.glb load error", err)
  );
}

/* particles */
const petals = makePetals(900);
scene.add(petals);

const dust = makeDust(650);
scene.add(dust);

/* UI */
initUI();
initChatDemo();

document.getElementById("btnFocusPeach")?.addEventListener("click", () => {
  controls.target.set(0, 2.0, 0);
  camera.position.set(0.8, 3.3, 12.5);
});

document.getElementById("btnFocusModel")?.addEventListener("click", () => {
  controls.target.set(0, 2.65, 0.2);
  camera.position.set(1.6, 3.3, 8.4);
});

/* render loop */
function animate(){
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  controls.update();

  peachGroup.rotation.y = Math.sin(t * 0.18) * 0.18;
  peachGroup.position.y = 0.10 + Math.sin(t * 0.55) * 0.11;

  if (peachRoot){
    peachMat.clearcoatRoughness = 0.03 + (Math.sin(t * 0.6) * 0.006);
  }

  if (humanoid){
    humanoid.position.y += Math.sin(t * 0.9) * 0.0018;
  }

  animatePetals(petals, dt);
  animateDust(dust, dt);

  clouds.position.x = Math.sin(t * 0.02) * 0.8;
  clouds.position.y = 22.0 + Math.sin(t * 0.015) * 0.45;

  composer.render();
}
animate();

/* resize */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

/* helpers */
function setSun(elevationDeg, azimuthDeg){
  const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
  const theta = THREE.MathUtils.degToRad(azimuthDeg);

  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms.sunPosition.value.copy(sun);
}

function makeCloudBackdrop(){
  const tex = makeCloudTexture(2048, 1024);

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.98,
    depthWrite: false
  });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 140),
    mat
  );

  plane.position.set(0, 22.0, -110);
  plane.rotation.y = 0;

  const grp = new THREE.Group();
  grp.add(plane);

  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(280, 160),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      depthWrite: false
    })
  );
  haze.position.set(0, 20.5, -105);
  grp.add(haze);

  return grp;
}

function makeCloudTexture(w, h){
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#3aa0ff");
  grad.addColorStop(0.55, "#6ec5ff");
  grad.addColorStop(1, "#cfe9ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 38; i++){
    const cx = Math.random() * w;
    const cy = (Math.random() * 0.55 + 0.05) * h;
    const base = (Math.random() * 0.22 + 0.10) * w;

    paintCloud(ctx, cx, cy, base, base * 0.55);
  }

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.55, 50, w * 0.5, h * 0.55, h * 0.95);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.14)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function paintCloud(ctx, x, y, w, h){
  ctx.save();
  ctx.translate(x, y);

  const puffCount = 18 + Math.floor(Math.random() * 18);
  for (let i = 0; i < puffCount; i++){
    const px = (Math.random() - 0.5) * w;
    const py = (Math.random() - 0.5) * h;
    const r = (Math.random() * 0.22 + 0.14) * Math.min(w, h);

    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.55, "rgba(255,255,255,0.62)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* demo humanoid */
function makeDemoHumanoid(){
  const g = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.32,
    metalness: 0.08,
    transparent: true,
    opacity: 0.92
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), mat);
  head.position.y = 2.85;

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.95, 10, 24), mat);
  body.position.y = 2.15;

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x9cb3ff,
      transparent: true,
      opacity: 0.05
    })
  );
  aura.position.y = 2.25;

  g.add(aura, head, body);
  return g;
}

/* petals */
function makePetals(count){
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const seed = new Float32Array(count);

  for (let i = 0; i < count; i++){
    const ix = i * 3;

    pos[ix + 0] = THREE.MathUtils.randFloatSpread(65);
    pos[ix + 1] = THREE.MathUtils.randFloat(2, 36);
    pos[ix + 2] = THREE.MathUtils.randFloatSpread(65);

    vel[ix + 0] = THREE.MathUtils.randFloat(-0.20, 0.20);
    vel[ix + 1] = THREE.MathUtils.randFloat(-0.60, -0.10);
    vel[ix + 2] = THREE.MathUtils.randFloat(-0.20, 0.20);

    seed[i] = Math.random();
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("velocity", new THREE.BufferAttribute(vel, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.09,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    color: 0xffd6df
  });

  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function animatePetals(points, dt){
  const p = points.geometry.attributes.position;
  const v = points.geometry.attributes.velocity;
  const s = points.geometry.attributes.seed;
  const now = performance.now() * 0.001;

  for (let i = 0; i < p.count; i++){
    const ix = i * 3;
    const sway = Math.sin(now + s.getX(i) * 10) * 0.03;

    p.array[ix + 0] += (v.array[ix + 0] + sway) * dt * 4.4;
    p.array[ix + 1] += v.array[ix + 1] * dt * 4.4;
    p.array[ix + 2] += v.array[ix + 2] * dt * 4.4;

    if (p.array[ix + 1] < -1.0){
      p.array[ix + 0] = THREE.MathUtils.randFloatSpread(65);
      p.array[ix + 1] = THREE.MathUtils.randFloat(20, 38);
      p.array[ix + 2] = THREE.MathUtils.randFloatSpread(65);
    }
  }

  p.needsUpdate = true;
}

/* dust */
function makeDust(count){
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);

  for (let i = 0; i < count; i++){
    const ix = i * 3;

    pos[ix + 0] = THREE.MathUtils.randFloatSpread(45);
    pos[ix + 1] = THREE.MathUtils.randFloat(0, 26);
    pos[ix + 2] = THREE.MathUtils.randFloatSpread(45);

    vel[ix + 0] = THREE.MathUtils.randFloat(-0.05, 0.05);
    vel[ix + 1] = THREE.MathUtils.randFloat(-0.02, 0.06);
    vel[ix + 2] = THREE.MathUtils.randFloat(-0.05, 0.05);
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("velocity", new THREE.BufferAttribute(vel, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.028,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    color: 0xcdd6ff
  });

  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function animateDust(points, dt){
  const p = points.geometry.attributes.position;
  const v = points.geometry.attributes.velocity;

  for (let i = 0; i < p.count; i++){
    const ix = i * 3;

    p.array[ix + 0] += v.array[ix + 0] * dt * 3.0;
    p.array[ix + 1] += v.array[ix + 1] * dt * 3.0;
    p.array[ix + 2] += v.array[ix + 2] * dt * 3.0;

    if (p.array[ix + 1] > 30){
      p.array[ix + 0] = THREE.MathUtils.randFloatSpread(45);
      p.array[ix + 1] = THREE.MathUtils.randFloat(0, 7);
      p.array[ix + 2] = THREE.MathUtils.randFloatSpread(45);
    }
  }

  p.needsUpdate = true;
}

/* UI */
function initUI(){
  const tabs = document.querySelectorAll(".tab");
  const chatPanel = document.getElementById("panel-chat");
  const arcPanel = document.getElementById("panel-archive");

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("is-on"));
      btn.classList.add("is-on");

      const tab = btn.dataset.tab;
      chatPanel.classList.toggle("is-on", tab === "chat");
      arcPanel.classList.toggle("is-on", tab === "archive");
    });
  });
}

function initChatDemo(){
  const chatlog = document.getElementById("chatlog");
  const composer = document.getElementById("composer");
  const chatInput = document.getElementById("chatInput");

  composer?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (chatInput?.value || "").trim();
    if (!text) return;

    pushMsg("user", text);
    chatInput.value = "";

    const reply = demoReply(text);
    setTimeout(() => pushMsg("system", reply), 240);
  });

  function pushMsg(type, text){
    const el = document.createElement("div");
    el.className = `msg ${type}`;
    el.textContent = text;
    chatlog.appendChild(el);
    chatlog.scrollTop = chatlog.scrollHeight;
  }

  function demoReply(text){
    const t = text.toLowerCase();
    if (t.includes("복숭아")) return "복숭아는 너의 시작점이야 가장 선명한 좌표";
    if (t.includes("엄마")) return "지나침과 도착의 서사야 정리 후 결실";
    if (t.includes("cv")) return "Archive 탭에서 CV를 열 수 있어";
    return "나는 SJ1 너의 기억과 작업을 연결하는 휴머노이드";
  }
}
