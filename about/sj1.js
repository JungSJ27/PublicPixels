import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";

/* =========================
   UI
========================= */

const chatPanel = document.getElementById("chatPanel");
const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const btnChatOpen = document.getElementById("btnChatOpen");
const btnChatClose = document.getElementById("btnChatClose");
const btnMenuToggle = document.getElementById("btnMenuToggle");
const menuBody = document.getElementById("menuBody");

btnMenuToggle?.addEventListener("click", () => {
  menuBody?.classList.toggle("is-collapsed");
});

function openChat(){
  chatPanel?.classList.add("is-open");
  chatPanel?.setAttribute("aria-hidden", "false");
  setTimeout(() => chatInput?.focus(), 0);

  if (!chatLog?.dataset?.booted){
    chatLog.dataset.booted = "1";
    addMsg("bot", "Hi Seungjin. I am SJ1. Tell me what you want to explore with the avatar today.");
  }
}

function closeChat(){
  chatPanel?.classList.remove("is-open");
  chatPanel?.setAttribute("aria-hidden", "true");
}

btnChatOpen?.addEventListener("click", openChat);
btnChatClose?.addEventListener("click", closeChat);

function addMsg(role, text){
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function simpleSJ1Reply(userText){
  const t = userText.toLowerCase();

  if (t.includes("hi") || t.includes("hello") || t.includes("안녕")){
    return "Hi. Do you want to talk about the work, the avatar behavior, or the world setting?";
  }
  if (t.includes("world") || t.includes("environment") || t.includes("sky") || t.includes("하늘")){
    return "We can tune sky exposure, water clarity, and reflections. Tell me what mood you want. calm, dreamy, surreal, or realistic.";
  }
  if (t.includes("water") || t.includes("물") || t.includes("ripple") || t.includes("물결")){
    return "I can increase ripple strength, change frequency, or make the water clearer. Tell me which direction you want.";
  }
  if (t.includes("avatar") || t.includes("humanoid") || t.includes("아바타")){
    return "For the avatar, we can add head turn to camera, idle breathing, and a gesture on message. Which one first?";
  }
  return "Got it. Say a bit more. What should SJ1 do next on screen?";
}

chatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = (chatInput.value || "").trim();
  if (!text) return;

  addMsg("user", text);
  chatInput.value = "";

  const reply = simpleSJ1Reply(text);
  setTimeout(() => addMsg("bot", reply), 160);
});

/* =========================
   THREE SETUP
========================= */

const stage = document.getElementById("stage");
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
stage.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0.9, 3.15, 11.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2.05, 0);
controls.minDistance = 6;
controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI * 0.48;

const clock = new THREE.Clock();

/* =========================
   EXR SKY AND ENV
========================= */

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

new EXRLoader().load(
  "./citrus_orchard_road_puresky_2k.exr",
  (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.needsUpdate = true;

    const envRT = pmrem.fromEquirectangular(tex);
    scene.environment = envRT.texture;

    scene.background = tex;
    scene.backgroundIntensity = 1.0;
    scene.backgroundBlurriness = 0.0;

    console.log("EXR loaded OK");
  },
  undefined,
  (e) => console.error("EXR load error", e)
);

/* =========================
   LIGHTS
========================= */

const key = new THREE.DirectionalLight(0xffffff, 0.85);
key.position.set(5, 9, 7);
scene.add(key);

const fill = new THREE.DirectionalLight(0xcfe7ff, 0.55);
fill.position.set(-6, 4, 6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffc6d8, 0.70);
rim.position.set(-2, 10, -10);
scene.add(rim);

scene.add(new THREE.AmbientLight(0xffffff, 0.10));

/* =========================
   WATER
========================= */

const waterY = 0.0;
const WATER_SIZE = 260;

const reflector = new Reflector(new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE), {
  textureWidth: Math.floor(window.innerWidth * renderer.getPixelRatio()),
  textureHeight: Math.floor(window.innerHeight * renderer.getPixelRatio()),
  color: 0x0b1730
});
reflector.rotation.x = Math.PI * -0.5;
reflector.position.y = waterY;
scene.add(reflector);

const ripple = createRippleCanvas(1024);
const rippleTex = new THREE.CanvasTexture(ripple.canvas);
rippleTex.wrapS = THREE.RepeatWrapping;
rippleTex.wrapT = THREE.RepeatWrapping;
rippleTex.colorSpace = THREE.SRGBColorSpace;

const waterMat = new THREE.MeshPhysicalMaterial({
  color: 0x0d3c6b,
  roughness: 0.01,
  metalness: 0.0,

  transmission: 0.86,
  thickness: 0.50,
  ior: 1.333,

  attenuationColor: new THREE.Color(0xcff2ff),
  attenuationDistance: 10.0,

  clearcoat: 1.0,
  clearcoatRoughness: 0.02,

  transparent: true,
  opacity: 0.10,

  bumpMap: rippleTex,
  bumpScale: 0.14,

  envMapIntensity: 1.7
});

const water = new THREE.Mesh(new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE), waterMat);
water.rotation.x = Math.PI * -0.5;
water.position.y = waterY + 0.001;
scene.add(water);

/* petals on water */
const petals = makePetals({
  count: 240,
  area: WATER_SIZE * 0.42,
  y: waterY + 0.012
});
scene.add(petals.group);

/* =========================
   PEACH
========================= */

const peachGroup = new THREE.Group();
scene.add(peachGroup);

const peachMat = new THREE.MeshPhysicalMaterial({
  color: 0xff1240,
  roughness: 0.06,
  metalness: 0.08,
  clearcoat: 1.0,
  clearcoatRoughness: 0.02,
  transmission: 0.18,
  thickness: 0.95,
  ior: 1.46,
  sheen: 0.38,
  sheenRoughness: 0.55,
  sheenColor: new THREE.Color(0xffb0c4),
  envMapIntensity: 1.1
});

let peachRoot = null;
let peachRadius = 0.45;
let peachBaseY = 2.05;
let humanoid = null;

const gltf = new GLTFLoader();
gltf.load(
  "./peach.glb",
  (res) => {
    peachRoot = res.scene;

    peachRoot.traverse((c) => {
      if (!c.isMesh) return;
      c.material = peachMat;
      if (c.geometry) c.geometry.computeVertexNormals();
      c.castShadow = false;
      c.receiveShadow = false;
    });

    peachRoot.scale.set(2.75, 2.75, 2.75);
    peachRoot.rotation.x = Math.PI;
    peachRoot.rotation.y = Math.PI * 0.18;
    peachRoot.position.set(0, peachBaseY, 0);
    peachGroup.add(peachRoot);

    const box = new THREE.Box3().setFromObject(peachRoot);
    const size = new THREE.Vector3();
    box.getSize(size);
    peachRadius = Math.max(size.x, size.y, size.z) * 0.30;

    /* float rule
       최고점에서는 바닥이 수면보다 확실히 위
       최저점에서는 살짝 닿아서 물결 */
    floatAmp = 0.12;
    const clearanceAtPeak = 0.12;
    peachBaseY = waterY + peachRadius + clearanceAtPeak - floatAmp;
    peachRoot.position.y = peachBaseY;

    humanoid = makeDemoHumanoid();
    humanoid.position.set(0, 3.75, 0.25);
    humanoid.rotation.y = Math.PI * -0.16;
    scene.add(humanoid);

    console.log("peach loaded", { peachRadius });
  },
  undefined,
  (err) => console.error("peach.glb load error", err)
);

/* contact shadow */
const contact = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 64),
  new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.08,
    depthWrite: false
  })
);
contact.rotation.x = Math.PI * -0.5;
contact.position.y = waterY + 0.002;
scene.add(contact);

/* focus buttons */
document.getElementById("btnFocusPeach")?.addEventListener("click", () => {
  controls.target.set(0, 2.05, 0);
  camera.position.set(0.9, 3.15, 11.6);
});
document.getElementById("btnFocusHumanoid")?.addEventListener("click", () => {
  controls.target.set(0, 3.05, 0.2);
  camera.position.set(1.6, 3.7, 8.1);
});

/* =========================
   RIPPLE FROM PEACH CONTACT
========================= */

let wasTouching = false;
let lastTouchTime = -999;
let floatAmp = 0.12;

function worldXZToUV(x, z) {
  const half = WATER_SIZE * 0.5;
  const u = THREE.MathUtils.clamp((x + half) / WATER_SIZE, 0, 1);
  const v = THREE.MathUtils.clamp((z + half) / WATER_SIZE, 0, 1);
  return { u, v };
}

function updateContactRipple(t) {
  if (!peachRoot) return;

  const yBottom = peachRoot.position.y - peachRadius;
  const touching = yBottom <= waterY + 0.01;

  if (touching) {
    const isFirstHit = touching && !wasTouching;
    const minGap = isFirstHit ? 0.12 : 0.22;

    if (t - lastTouchTime > minGap) {
      lastTouchTime = t;

      const { u, v } = worldXZToUV(peachRoot.position.x, peachRoot.position.z);
      addRipple(u, v, isFirstHit ? 1.0 : 0.55);

      petals.pulse(peachRoot.position.x, peachRoot.position.z, isFirstHit ? 1.0 : 0.6);
    }
  }

  wasTouching = touching;
}

/* =========================
   ANIMATE
========================= */

function animate(){
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  controls.update();

  if (peachRoot) {
    const floatY = peachBaseY + Math.sin(t * 0.85) * floatAmp;
    peachRoot.position.y = floatY;

    peachGroup.rotation.y = Math.sin(t * 0.22) * 0.14;

    updateContactRipple(t);

    const dist = Math.max(0, peachRoot.position.y - waterY);
    contact.material.opacity = THREE.MathUtils.clamp(0.12 - dist * 0.03, 0.03, 0.10);
  }

  if (humanoid){
    humanoid.position.y = 3.75 + Math.sin(t * 0.95) * 0.02;
  }

  ripple.step(dt);
  rippleTex.needsUpdate = true;

  petals.update(t, dt);

  renderer.render(scene, camera);
}
animate();

/* =========================
   RESIZE
========================= */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  reflector.getRenderTarget().setSize(
    Math.floor(window.innerWidth * renderer.getPixelRatio()),
    Math.floor(window.innerHeight * renderer.getPixelRatio())
  );
});

/* =========================
   RIPPLE CANVAS
========================= */

function createRippleCanvas(size){
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const ripples = [];

  function step(dt){
    ctx.fillStyle = "rgba(128,128,128,0.085)";
    ctx.fillRect(0, 0, size, size);

    for (let i = ripples.length - 1; i >= 0; i--){
      const r = ripples[i];
      r.t += dt;

      const life = r.t / r.life;
      if (life >= 1){
        ripples.splice(i, 1);
        continue;
      }

      const radius = r.r0 + life * r.r1;
      const alpha = (1.0 - life) * r.a;

      const cx = r.x * size;
      const cy = r.y * size;

      const g = ctx.createRadialGradient(cx, cy, radius * 0.68, cx, cy, radius);
      g.addColorStop(0, "rgba(128,128,128,0)");
      g.addColorStop(1, `rgba(255,255,255,${alpha})`);

      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(1.0, (1.0 - life) * 12.0);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function add(x, y, strength){
    ripples.push({
      x,
      y,
      t: 0,
      life: 1.55,
      r0: 10,
      r1: 520,
      a: 0.26 * strength
    });
  }

  ctx.fillStyle = "rgb(128,128,128)";
  ctx.fillRect(0, 0, size, size);

  return { canvas, step, add };
}

function addRipple(x, y, strength){
  ripple.add(x, y, strength);
}

/* =========================
   PETALS
========================= */

function makePetals({ count, area, y }){
  const tex = makePetalTexture(256);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const geo = new THREE.PlaneGeometry(0.34, 0.34);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const data = [];

  for (let i = 0; i < count; i++){
    const x = (Math.random() * 2 - 1) * area;
    const z = (Math.random() * 2 - 1) * area;
    const r = Math.random() * Math.PI * 2;
    const s = THREE.MathUtils.lerp(0.55, 1.15, Math.random());

    dummy.position.set(x, y + Math.random() * 0.006, z);
    dummy.rotation.set(Math.PI * -0.5, r, (Math.random() * 2 - 1) * 0.22);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    data.push({
      x,
      z,
      y: dummy.position.y,
      r,
      s,
      driftX: (Math.random() * 2 - 1) * 0.010,
      driftZ: (Math.random() * 2 - 1) * 0.010,
      bob: Math.random() * 10,
      pulse: 0
    });
  }

  mesh.instanceMatrix.needsUpdate = true;

  function update(t, dt){
    for (let i = 0; i < count; i++){
      const p = data[i];

      p.pulse = Math.max(0, p.pulse - dt * 0.9);

      p.x += p.driftX * dt;
      p.z += p.driftZ * dt;

      const limit = area;
      if (p.x > limit) p.x = -limit;
      if (p.x < -limit) p.x = limit;
      if (p.z > limit) p.z = -limit;
      if (p.z < -limit) p.z = limit;

      const bobY = Math.sin(t * 0.9 + p.bob) * 0.004;
      const tilt = Math.sin(t * 0.7 + p.bob) * 0.10;

      const pulseLift = p.pulse * 0.010;
      const pulseTilt = p.pulse * 0.25;

      dummy.position.set(p.x, p.y + bobY + pulseLift, p.z);
      dummy.rotation.set(
        Math.PI * -0.5 + tilt * 0.15,
        p.r + Math.sin(t * 0.25 + p.bob) * 0.06,
        tilt + pulseTilt
      );
      dummy.scale.set(p.s, p.s, p.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function pulse(wx, wz, strength){
    const s = THREE.MathUtils.clamp(strength, 0, 1.0);

    for (let i = 0; i < count; i++){
      const p = data[i];
      const dx = p.x - wx;
      const dz = p.z - wz;
      const d2 = dx * dx + dz * dz;

      if (d2 < 4.5 * 4.5){
        const k = 1.0 - Math.sqrt(d2) / 4.5;
        p.pulse = Math.max(p.pulse, k * 0.9 * s);
      }
    }
  }

  return { group: mesh, update, pulse };
}

function makePetalTexture(size){
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  const cx = size * 0.5;
  const cy = size * 0.55;

  const grad = ctx.createRadialGradient(cx, cy, size * 0.05, cx, cy, size * 0.52);
  grad.addColorStop(0.0, "rgba(255,235,245,0.98)");
  grad.addColorStop(0.35, "rgba(255,176,210,0.92)");
  grad.addColorStop(1.0, "rgba(255,120,170,0.0)");

  ctx.fillStyle = grad;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI * 0.15);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.46);
  ctx.bezierCurveTo(size * 0.36, -size * 0.35, size * 0.42, size * 0.12, 0, size * 0.44);
  ctx.bezierCurveTo(-size * 0.42, size * 0.12, -size * 0.36, -size * 0.35, 0, -size * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.globalCompositeOperation = "source-atop";
  const core = ctx.createRadialGradient(cx, cy + size * 0.10, size * 0.02, cx, cy + size * 0.10, size * 0.22);
  core.addColorStop(0.0, "rgba(255,255,255,0.35)");
  core.addColorStop(1.0, "rgba(255,255,255,0.0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  return new THREE.CanvasTexture(c);
}

/* =========================
   DEMO HUMANOID
========================= */

function makeDemoHumanoid(){
  const g = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.26,
    metalness: 0.12,
    transparent: true,
    opacity: 0.92
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), mat);
  head.position.y = 3.12;

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.95, 10, 24), mat);
  body.position.y = 2.45;

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x9cb3ff,
      transparent: true,
      opacity: 0.05
    })
  );
  aura.position.y = 2.55;

  g.add(aura, head, body);
  return g;
}
