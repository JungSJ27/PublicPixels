let orbit1Diameter;
let orbit2Diameter;
let orbit3Diameter;
let orbit4Diameter;

const heart = [];
const comb = [];

let a = 0;
let f = 0;
let t = 0;
let j = 0;
let sat = 0;
let sat2 = 0;
let sat3 = 0;

const SNOWFLAKES_PER_LAYER = 200;
const MAX_SIZE = 2;
const GRAVITY = 0.02;
const LAYER_COUNT = 5;

const SNOWFLAKES = [];

/* =========================
   HEADER
========================= */

(function () {
  if (isMobileDevice()) {
    document.body.classList.add("header-reveal");
    return;
  }

  const body = document.body;
  const zone = document.querySelector(".header-hover-zone");
  if (!zone) return;

  let hideTimer = null;

  function show() {
    clearTimeout(hideTimer);
    body.classList.add("header-reveal");
  }

  function hide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      body.classList.remove("header-reveal");
    }, 500);
  }

  zone.addEventListener("mouseenter", show);
  zone.addEventListener("mouseleave", hide);

  function bindHeaderHover() {
    const header = document.querySelector("header");
    if (!header) return false;

    header.addEventListener("mouseenter", show);
    header.addEventListener("mouseleave", hide);
    return true;
  }

  if (!bindHeaderHover()) {
    const iv = setInterval(() => {
      if (bindHeaderHover()) clearInterval(iv);
    }, 200);
    setTimeout(() => clearInterval(iv), 6000);
  }
})();

/* =========================
   MODAL CONTROL
========================= */
let infoModalEl = null;
let isModalOpen = false;

function ensureInfoModal() {
  if (!infoModalEl) infoModalEl = document.getElementById("infoModal");
  return infoModalEl;
}

function setInfoModalOpen(isOpen) {
  const el = ensureInfoModal();
  if (!el) return;

  isModalOpen = isOpen;

  if (isOpen) {
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  } else {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// 화면 중앙 하트 주변 hover 범위
function isMouseOverCenterHeart() {
  const centerX = windowWidth / 2;
  const centerY = windowHeight / 2;
  const hoverRange = 110;

  return (
    mouseX >= centerX - hoverRange &&
    mouseX <= centerX + hoverRange &&
    mouseY >= centerY - hoverRange &&
    mouseY <= centerY + hoverRange
  );
}

/* =========================
   ORBIT CONSTANTS
========================= */
const DIAMETER_INCREASE = 0.15;
const ORBIT_1_MULTIPLIER = 2.1;
const ORBIT_2_MULTIPLIER = 3.8;
const ORBIT_3_MULTIPLIER = 4.5;
const ORBIT_4_MULTIPLIER = 7.8;

const MAX_PARTICLES_DRAWN = 20000;

const COLOR_PALETTES = [
  {
    1: { r: 245, g: 135, b: 203, a: 1.0 },
    2: { r: 160, g: 103, b: 75, a: 1.0 },
    3: { r: 223, g: 51, b: 125, a: 1.0 },
    4: { r: 250, g: 108, b: 168, a: 1.0 },
  },
  {
    1: { r: 103, g: 229, b: 142, a: 1.0 },
    2: { r: 161, g: 206, b: 63, a: 1.0 },
    3: { r: 16, g: 126, b: 87, a: 1.0 },
    4: { r: 100, g: 71, b: 96, a: 1.0 },
  },
];

const PLANET_COLOR_OFFSET = 40;

let ORBIT_1_COLOR = COLOR_PALETTES[0][1];
let ORBIT_2_COLOR = COLOR_PALETTES[0][2];
let ORBIT_3_COLOR = COLOR_PALETTES[0][3];
let ORBIT_4_COLOR = COLOR_PALETTES[0][4];

let PLANET_1_COLOR = {
  r: ORBIT_1_COLOR.r + PLANET_COLOR_OFFSET,
  g: ORBIT_1_COLOR.g + PLANET_COLOR_OFFSET,
  b: ORBIT_1_COLOR.b + PLANET_COLOR_OFFSET,
  a: 1.0,
};
let PLANET_2_COLOR = {
  r: ORBIT_2_COLOR.r + PLANET_COLOR_OFFSET,
  g: ORBIT_2_COLOR.g + PLANET_COLOR_OFFSET,
  b: ORBIT_2_COLOR.b + PLANET_COLOR_OFFSET,
  a: 1.0,
};
let PLANET_3_COLOR = {
  r: ORBIT_3_COLOR.r + PLANET_COLOR_OFFSET,
  g: ORBIT_3_COLOR.g + PLANET_COLOR_OFFSET,
  b: ORBIT_3_COLOR.b + PLANET_COLOR_OFFSET,
  a: 1.0,
};
let PLANET_4_COLOR = {
  r: ORBIT_4_COLOR.r + PLANET_COLOR_OFFSET,
  g: ORBIT_4_COLOR.g + PLANET_COLOR_OFFSET,
  b: ORBIT_4_COLOR.b + PLANET_COLOR_OFFSET,
  a: 1.0,
};

class Planet {
  constructor(color, orbitLevel) {
    this.color = color;
    this.orbitLevel = orbitLevel;

    this.startAngleOffset = random(50);
    this.xOffset = random(-20, 20) + randomGaussian();
    this.yOffset = random(-20, 20) + randomGaussian();

    // ⭐ 성운 두께 (한 번만 결정)
this.zOffset = randomGaussian() * (orbitLevel * 6);
  }


  drawPlanet() {
    const angleVector = this.computeVector();

    push();
    translate(
      angleVector.x + this.xOffset,
      angleVector.y + this.yOffset,
      angleVector.z          // ⭐ 여기서 깊이 생김
    );

    noStroke();
    fill(
      this.color.r,
      this.color.g,
      this.color.b,
      180
    );

    // 성운처럼 보이게 sphere or point
    sphere(planetScale.scale * 0.6);
    // 또는: point(0, 0, 0);

    pop();
  }

  computeVector() {
    let r;
    switch (this.orbitLevel) {
      case 1:
        r = orbit1Diameter / 2;
        break;
      case 2:
        r = orbit2Diameter / 2;
        break;
      case 3:
        r = orbit3Diameter / 2;
        break;
      case 4:
        r = orbit4Diameter / 4;
        break;
      default:
        r = 100;
        break;
    }

    const angle = ((millis() * planetSpeed.speed) % 360) + this.startAngleOffset;
    const x = r * 16 * pow(sin(angle), 3);
    const y = -r * (13 * cos(angle) - 5 * cos(2 * angle) - 2 * cos(3 * angle) - cos(4 * angle));
    return createVector(
      x / 11,
      y / 11 - 40,
      this.zOffset +
        sin(frameCount * 0.01 + this.startAngleOffset) * 2
    );
  }
}

let membersAtLevel = [
  { members: 180, level: 1, orbitLevelOneMembers: 80 },
  { members: 120, level: 2, orbitLevelTwoMembers: 160 },
  { members: 680, level: 3, orbitLevelThreeMembers: 580 },
  { members: 1200, level: 4, orbitLevelFourMembers: 1200 },
];

let planets = [];

function setupPlanets() {
  for (let i = 0; i < membersAtLevel.length; i++) {
    const members = membersAtLevel[i];
    const memberCount = members.proportionMembers ? members.proportionMembers : members.members;

    let color;
    if (members.level == 1) color = PLANET_1_COLOR;
    else if (members.level == 2) color = PLANET_2_COLOR;
    else if (members.level == 3) color = PLANET_3_COLOR;
    else if (members.level == 4) color = PLANET_4_COLOR;
    else color = { r: 255, g: 255, b: 255, a: 1.0 };

    const orbitLevel = [];
    for (let j = 0; j < Math.min(memberCount, particleConfig.maxParticlesDrawn); j++) {
      orbitLevel.push(new Planet(color, members.level));
    }
    planets.push(orbitLevel);
  }
}

class PlanetSpeed {
  constructor() {
    this.speed = 0.00005;
  }
}

class PlanetScale {
  constructor() {
    this.scale = 2.6;
  }
}

class ParticleConfig {
  constructor() {
    this.maxParticlesDrawn = MAX_PARTICLES_DRAWN;
  }
}

/* =========================
   ASSETS
========================= */
let Heart, arrow;

function preload() {
  Heart = loadModel("Heart.obj");
  arrow = loadModel("arrow.obj");
}

/* =========================
   SETUP
========================= */
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  planetSpeed = new PlanetSpeed();
  planetScale = new PlanetScale();
  particleConfig = new ParticleConfig();

  if (isMobileDevice()) {
    particleConfig.maxParticlesDrawn = 6000;
  }

  createSnowflakes();
  ensureInfoModal();

  scheduleReload();

  window.addEventListener("mousemove", scheduleReload);
  window.addEventListener("touchstart", scheduleReload);
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createSnowflakes();
}

/* =========================
   STARS  (was SNOWFLAKES)
========================= */

// 별 공간 스케일
const STAR_FIELD_SIZE = 2200;     // x,y 퍼짐
const STAR_FIELD_DEPTH = 2200;    // z 퍼짐
const STAR_DRIFT = 0.08;          // 별이 살짝 떠다니는 정도


function createSnowflakes() {
  // 누적 방지
  SNOWFLAKES.length = 0;
  planets = [];

  for (let k = 0; k < LAYER_COUNT; k++) {
    const layer = [];
const thickness = map(
  k,
  0,
  LAYER_COUNT - 1,
  10,
  60
);

    for (let i = 0; i < SNOWFLAKES_PER_LAYER; i++) {
      // 레이어별로 크기와 밀도 차이를 주기 위한 factor
      const layerFactor = (k + 1) / LAYER_COUNT;

       // 🔑 Gaussian + 안전 클램프
      let z =
        randomGaussian() * (thickness * 0.35);

      z = constrain(
        z,
        -STAR_FIELD_DEPTH,
        STAR_FIELD_DEPTH
      );
      layer.push({
        // 화면 좌표 기준이 아니라 월드 좌표 기준
        x: random(-STAR_FIELD_SIZE, STAR_FIELD_SIZE),
        y: random(-STAR_FIELD_SIZE, STAR_FIELD_SIZE),
        z: random(-STAR_FIELD_DEPTH, STAR_FIELD_DEPTH),

        // 별 크기와 반짝임용
        mass: random(0.75, 1.25),
        tw: random(TWO_PI),        // twinkle phase
        sp: random(0.4, 1.2),      // twinkle speed
        k: k + 1,
        lf: layerFactor
      });
    }
    SNOWFLAKES.push(layer);
  }

  orbit1Diameter = min(
    windowWidth * ORBIT_1_MULTIPLIER * DIAMETER_INCREASE,
    windowHeight * ORBIT_1_MULTIPLIER * DIAMETER_INCREASE
  );
  orbit2Diameter = min(
    windowWidth * ORBIT_2_MULTIPLIER * DIAMETER_INCREASE,
    windowHeight * ORBIT_2_MULTIPLIER * DIAMETER_INCREASE
  );
  orbit3Diameter = min(
    windowWidth * ORBIT_3_MULTIPLIER * DIAMETER_INCREASE,
    windowHeight * ORBIT_3_MULTIPLIER * DIAMETER_INCREASE
  );
  orbit4Diameter = min(
    windowWidth * ORBIT_4_MULTIPLIER * DIAMETER_INCREASE,
    windowHeight * ORBIT_4_MULTIPLIER * DIAMETER_INCREASE
  );

  setupPlanets();
}

// 더 이상 “눈처럼 떨어지는” 로직은 쓰지 않음
function updateSnowflake(snowflake) {
  // 아주 미세한 공간 drift만 주기
  snowflake.tw += 0.01 * snowflake.sp;

  // 살짝 떠다니는 느낌
  snowflake.x += STAR_DRIFT * 0.02 * sin(snowflake.tw + snowflake.z * 0.001);
  snowflake.y += STAR_DRIFT * 0.02 * cos(snowflake.tw + snowflake.x * 0.001);

  // 공간 밖으로 너무 멀리 가면 다시 안으로
  const lim = STAR_FIELD_SIZE * 1.2;
  if (snowflake.x > lim) snowflake.x = -lim;
  if (snowflake.x < -lim) snowflake.x = lim;
  if (snowflake.y > lim) snowflake.y = -lim;
  if (snowflake.y < -lim) snowflake.y = lim;
}

/* =========================
   DRAW
========================= */
function draw() {
  background(20, 25, 40);

  // ✅ 모바일 카메라 뒤로
  if (isMobileDevice()) {
    camera(
      0,
      0,
      max(windowWidth, windowHeight) * 1.6,
      0,
      0,
      0,
      0,
      1,
      0
    );
  }

  orbitControl(
    isMobileDevice() ? 2.5 : 1,
    isMobileDevice() ? 2.5 : 1,
    isMobileDevice() ? 0.5 : 0.2
  );

  ambientLight(170);
  directionalLight(255, 0, 0, 0.25, 0.25, 0);

  /* =========================
     STARS
  ========================= */
  noFill();
  beginShape(POINTS);

  for (let k = 0; k < SNOWFLAKES.length; k++) {
    const LAYER = SNOWFLAKES[k];
    for (let i = 0; i < LAYER.length; i++) {
      const star = LAYER[i];
      const size = (star.k * MAX_SIZE) / LAYER_COUNT;
      const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * sin(star.tw));

      strokeWeight(size * 1.6);
      stroke(255, 255, 255, 140 * twinkle);
      vertex(star.x, star.y, star.z);

      updateSnowflake(star);
    }
  }
  endShape();

  /* =========================
     PLANETS
  ========================= */
  for (let i = 0; i < planets.length; i++) {
    const ring = planets[i];
    for (let j = 0; j < ring.length; j++) {
      ring[j].drawPlanet();
    }
  }

  /* =========================
     CENTER MODELS
  ========================= */
  push();
  scale(65);
  noStroke();
  rotateX(2.8);
  rotateY(3.0);
  rotateZ(0.2);
  rotateY(frameCount * 0.005);
  rotateZ(frameCount * 0.001);
  fill(250, 50, 150);
  model(Heart);
  normalMaterial();
  model(arrow);
  pop();

  translate(0, -20, 0);

  /* =========================
     ORBIT SYSTEM
  ========================= */
// orbit 1
const r = height / 80;
const x = r * 16 * pow(sin(a), 3);
const y = -r * (13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
const z = -r * sin(a) * random(3, 4);

heart.push(createVector(x, y, z));

stroke(235, 190, 230, frameCount % 1100);
strokeWeight(1.4);
beginShape(POINTS);
for (let v of heart) vertex(v.x, v.y, v.z);
endShape();

a += 0.007;

// ✅ 여기 안에 있어야 함
push();
noStroke();
fill(180, 255, 120);
translate(x, y, 0);
rotateZ(frameCount * 0.01);
rotateX(frameCount * 0.01);
rotateY(frameCount * 0.01);
box(20, 20, 20);
pop();

// hover 체크
if (!isMobileDevice()) {
  const hoveringNow = isMouseOverCenterHeart();
  if (hoveringNow !== isModalOpen) setInfoModalOpen(hoveringNow);
  cursor(hoveringNow ? "pointer" : "default");
}

if (heart.length > 4000) heart.splice(0, 2000);

  // orbit 2
  const g2 = height / 60;
  const h2 = g2 * 16 * pow(sin(f), 3);
  const k2 = -g2 * (13 * cos(f) - 5 * cos(2 * f) - 2 * cos(3 * f) - cos(4 * f));
  const z2 = g2 * sin(f) * random(4, 4.5);

  heart.push(createVector(h2, k2, z2));
  strokeWeight(0.4);
  stroke(100, 100, 100, frameCount % 600);
  beginShape(POINTS);
  for (let v of heart) vertex(v.x, v.y, v.z);
  endShape();
  f += 0.003;

  push();
  noStroke();
  fill(150, 130, 255);
  translate(h2, k2, 0);
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.04);
  rotateY(frameCount * 0.01);
  cone(10, 20);
  pop();

  // orbit 3
  const q3 = height / 30;
  const w3 = q3 * 16 * pow(sin(t), 3);
  const e3 = -q3 * (13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t));
  const z3 = q3 * sin(t) * random(2, 2.6);

  heart.push(createVector(w3, e3, z3));
  strokeWeight(0.4);
  stroke(0, 0, 0, frameCount % 600);
  beginShape(POINTS);
  for (let v of heart) vertex(v.x, v.y, v.z);
  endShape();
  t -= 0.009;

  push();
  noStroke();
  fill(150, 250, 255);
  translate(w3, e3, 0);
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  sphere(15);
  pop();

  push();
  noStroke();
  fill(100, 100, 255);
  translate(w3, e3, 0);
  rotate(sat);
  translate(0, 40);
  box(4);
  sat += 0.1;
  pop();

  push();
  noStroke();
  fill(100, 250, 150);
  translate(w3, e3, 0);
  rotate(sat2);
  translate(0, 35);
  sphere(2);
  sat2 += 0.15;
  pop();

  push();
  noStroke();
  fill(250, 150, 150);
  translate(w3, e3, 0);
  rotate(sat3);
  translate(0, 60);
  cone(3, 2);
  sat3 += 0.05;
  pop();

  // orbit 4
  const p4 = height / 28;
  const no4 = p4 * 16 * pow(sin(j), 3);
  const i4 = -p4 * (13 * cos(j) - 5 * cos(2 * j) - 2 * cos(3 * j) - cos(4 * j));
  const z4 = -p4 * sin(j) * random(3, 3.2);

  heart.push(createVector(no4, i4, z4));
  strokeWeight(0.4);
  stroke(0, 0, 0, frameCount % 600);
  beginShape(POINTS);
  for (let v of heart) vertex(v.x, v.y, v.z);
  endShape();
  j += 0.008;

  push();
  noStroke();
  normalMaterial();
  translate(no4, i4, 0);
  rotateZ(frameCount * 0.04);
  rotateX(frameCount * 0.04);
  rotateY(frameCount * 0.04);
  sphere(9);
  pop();

 if (!isMobileDevice()) {
    const hoveringNow = isMouseOverCenterHeart();
    if (hoveringNow !== isModalOpen) setInfoModalOpen(hoveringNow);
    cursor(hoveringNow ? "pointer" : "default");
  }

  if (heart.length > 4000) heart.splice(0, 2000);
}



/* =========================
   INPUT
========================= */
function mousePressed() {
  // 클릭은 사용하지 않음
  return false;
}

function touchStarted() {
  if (!isMobileDevice()) return false;

  // 🔑 하트 근처만 설명 열기
  if (isMouseOverCenterHeart()) {
    setInfoModalOpen(!isModalOpen);
    return false; // 설명 열 때만 이벤트 소비
  }

  // 그 외 영역은 orbitControl에 양보
  return true;
}


/* =========================
   AUTO RELOAD
========================= */
let reloadTimer = null;

function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    window.location.reload();
  }, 120000);
}

