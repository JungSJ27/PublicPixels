import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";

const stage = document.getElementById("stage");
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
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

let sky = null;

new EXRLoader().load(
  "./citrus_orchard_road_puresky_4k.exr",
  (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;

    const envRT = pmrem.fromEquirectangular(tex);
    scene.environment = envRT.texture;

    const skyGeo = new THREE.SphereGeometry(260, 64, 64);
    const skyMat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      depthWrite: false
    });

    sky = new THREE.Mesh(skyGeo, skyMat);
    sky.rotation.y = Math.PI * 0.5;
    scene.add(sky);

    scene.background = null;

    console.log("EXR loaded OK");
  },
  undefined,
  (e) => {
    console.error("EXR load error", e);
  }
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
  color: 0x062047,
  roughness: 0.02,
  metalness: 0.0,

  transmission: 0.22,
  thickness: 1.3,
  ior: 1.333,

  clearcoat: 1.0,
  clearcoatRoughness: 0.035,

  transparent: true,
  opacity: 0.18,

  bumpMap: rippleTex,
  bumpScale: 0.18,

  envMapIntensity: 1.25
});

const water = new THREE.Mesh(new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE), waterMat);
water.rotation.x = Math.PI * -0.5;
water.position.y = waterY + 0.001;
scene.add(water);

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
document.getElementById("btnFocusModel")?.addEventListener("click", () => {
  controls.target.set(0, 3.05, 0.2);
  camera.position.set(1.6, 3.7, 8.1);
});

/* =========================
   RIPPLE FROM PEACH CONTACT
========================= */

let wasTouching = false;
let lastTouchTime = -999;

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

  if (touching && !wasTouching) {
    if (t - lastTouchTime > 0.25) {
      lastTouchTime = t;

      const { u, v } = worldXZToUV(peachRoot.position.x, peachRoot.position.z);
      addRipple(u, v, 1.0);
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
    const amp = 0.22;
    const floatY = peachBaseY + Math.sin(t * 0.85) * amp;
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
