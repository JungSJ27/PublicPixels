// ===============================
// 0. three.js + GLTFLoader import
// ===============================
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ===============================
// 1. Three.js 기본 셋업
// ===============================
let scene, camera, renderer, avatar;

init3D();
loadAvatar();
animate();

function init3D() {
  const canvas = document.getElementById("avatarCanvas");
  if (!canvas) {
    console.error("avatarCanvas not found");
    return;
  }

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    35, // 시야각 살짝 좁게
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  // 카메라를 살짝 위·뒤로
  camera.position.set(0, 1.4, 4.2);
  camera.lookAt(0, 0.6, 0); // 약간 위쪽(가슴 정도)을 보도록

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // 라이트
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(1, 2, 2);
  scene.add(dirLight);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x556688, 0.7);
  scene.add(hemi);

  window.addEventListener("resize", onResize);
}

function loadAvatar() {
  const loader = new GLTFLoader();

  loader.load("secass1/AIModelO.glb", (gltf) => {
    avatar = gltf.scene;

    // 일단 장면에 넣고 현재 크기 측정
    scene.add(avatar);

    // 1) bounding box로 현재 크기/중심 계산
    const box = new THREE.Box3().setFromObject(avatar);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // 2) 전체 키를 targetHeight로 맞추기
    const targetHeight = 1.7; // 화면 안에 보일 목표 키
    const scaleFactor = targetHeight / size.y;
    avatar.scale.setScalar(scaleFactor);

    // 3) 다시 박스 계산해서 중심/바닥 정리
    const box2 = new THREE.Box3().setFromObject(avatar);
    const size2 = new THREE.Vector3();
    const center2 = new THREE.Vector3();
    box2.getSize(size2);
    box2.getCenter(center2);

    // 모델 중심을 원점으로 옮기기
    avatar.position.sub(center2);

    // 바닥이 타원 위에 올라오도록 Y 위치 조정
    // (값 조금씩 바꿔보면서 미세조정 가능: -0.35 ~ -0.6 정도)
    avatar.position.y = 0.1;

    // 정면 보게 하기 (회전 X)
    avatar.rotation.y = 4.5;

    // 카메라 다시 살짝 가슴 정도를 보게
    camera.lookAt(0, 0.6, 0);
  });
}

function onResize() {
  if (!renderer || !camera) return;
  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // 회전 없음! 그대로 정면
  // if (avatar) avatar.rotation.y += 0.003;  // ❌ 이 줄 삭제

  renderer.render(scene, camera);
}

// ===============================
// 2. Mode buttons → text + stats
// ===============================
const aboutData = {
  headphones: {
    title: "Interactive Artist Mode",
    text:
      "I build interactive installations using sound, light, moths and data flows. Think theremins, sensors and projection mapping.",
    tags: ["Theremin", "TouchDesigner", "Sensors", "Moths"],
    stats: { creative: 95, tech: 88, craft: 70, social: 68 }
  },
  apron: {
    title: "Textile And Craft Mode",
    text:
      "My textile background shows up in weaving, spinning and craft as a way to talk about labor, time and care.",
    tags: ["Textile", "Weaving", "Spinning wheel", "Craft"],
    stats: { creative: 85, tech: 60, craft: 95, social: 60 }
  },
  street: {
    title: "Street And Brand Mode",
    text:
      "Y2K graphics, pop up store ideas and brand collaborations. I like mixing cute visuals with critical stories.",
    tags: ["Branding", "Y2K", "Graphic design", "Pop up"],
    stats: { creative: 90, tech: 75, craft: 72, social: 80 }
  },
  casual: {
    title: "Daily JJ Mode",
    text:
      "Stories from living in New York as a Korean artist, figuring out visas, rent and how to keep making art.",
    tags: ["NY life", "Immigration", "Artist life", "Coffee"],
    stats: { creative: 78, tech: 68, craft: 65, social: 92 }
  }
};

const statKeys = ["creative", "tech", "craft", "social"];

const modeTitle = document.getElementById("modeTitle");
const modeText = document.getElementById("modeText");
const modeTags = document.getElementById("modeTags");
const modeButtons = document.querySelectorAll(".mode-btn");

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.dataset.item;
    const info = aboutData[item];
    if (!info) return;

    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    modeTitle.innerText = info.title;
    modeText.innerText = info.text;

    modeTags.innerHTML = "";
    info.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.innerText = tag;
      modeTags.appendChild(span);
    });

    statKeys.forEach((key) => {
      const value = info.stats[key] ?? 0;
      const fill = document.querySelector(
        `.stat-row[data-stat="${key}"] .stat-fill`
      );
      if (fill) {
        fill.style.width = `${value}%`;
      }
    });
  });
});

// 기본 모드 자동 선택
const firstBtn = document.querySelector(".mode-btn[data-item='headphones']");
if (firstBtn) firstBtn.click();

// ===============================
// 3. Mini chat
// ===============================
const quickReplies = {
  nyc:
    "New York keeps me slightly overwhelmed in a good way – it is chaos, art and survival practice in one city.",
  theme:
    "My main themes are repetition, instinct, labor and the fragile line between survival and self destruction.",
  moths:
    "Moths are my symbol for instinct. They keep flying toward the light even when it burns, which feels very human to me."
};

document.querySelectorAll(".chat-quick button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.q;
    const answer = quickReplies[key];
    if (!answer) return;

    const chatBody = document.getElementById("chatBody");
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble jj";
    bubble.innerText = answer;

    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  });
});
