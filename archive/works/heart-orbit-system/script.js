
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



// constants
const DIAMETER_INCREASE = 0.15;
const ORBIT_1_MULTIPLIER = 2.1;
const ORBIT_2_MULTIPLIER = 3.8;
const ORBIT_3_MULTIPLIER = 4.5;
const ORBIT_4_MULTIPLIER = 7.8;

// sets max particles rendered on load -- overridden by any menu edits
const MAX_PARTICLES_DRAWN = 20000; 

// edit these to create your own color scheme! each one corresponds to an expanding level!
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
    4: { r: 100, g: 71, b: 96, a: 1.0 }
  }
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
  }

  drawPlanet() {
    const angleVector = this.computeVector();
    fill(
      `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`
    );
    noStroke();
    circle(
      angleVector.x + this.xOffset,
      angleVector.y + this.yOffset,
      planetScale.scale
    );
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
        r = 100; // 기본 반경 설정
        break;
    }

    const angle = ((millis() * planetSpeed.speed) % 360) + this.startAngleOffset;
    const x = r * 16 * pow(sin(angle), 3);
    const y = -r * (13 * cos(angle) - 5 * cos(2 * angle) - 2 * cos(3 * angle) - cos(4 * angle));
    const z = random(-50, 50);

    return createVector(x/11, y/11 - 40, z/11);
  
  }
}
// NB: third key ORBIT_LEVEL_MEMBERS is used to make the GUI more descriptive and is displayed on the tooltip. The members key will modify on user input
let membersAtLevel = [
  {
    members: 180,
    level: 1,
    orbitLevelOneMembers: 80,
  },
  {
    members: 120,
    level: 2,
    orbitLevelTwoMembers: 160,
  },
  {
    members: 680,
    level: 3,
    orbitLevelThreeMembers: 580,
  },
  {
    members: 1200,
    level: 4,
    orbitLevelFourMembers: 1200,
  },
];

let planets = [];


function setProportions(membersAtLevel) {
  const members = [];
  for (let i = 0; i < membersAtLevel.length; i++) {
    members.push(membersAtLevel[i].members);
  }

  let overMaxParticles = false;
  let max = members[0];
  let maxIndex = 0;

  for (let i = 0; i < members.length; i++) {
    if (members[i] > MAX_PARTICLES_DRAWN) overMaxParticles = true;
    // fetch max number and max index
    if (members[i] > max) {
      maxIndex = i;
      max = members[i];
    }
  }

  if (overMaxParticles) {
    const originalProportions = [];
    for (let i = 0; i < members.length; i++) {
      originalProportions.push(members[i] / max);
    }

    // put in proportions capped at MAX_PARTICLES_DRAWN and reload how many members are in the group
    for (let i = 0; i < originalProportions.length; i++) {
      membersAtLevel[i].proportionMembers = Math.round(
        MAX_PARTICLES_DRAWN * originalProportions[i]
      );
    }
  }

  return membersAtLevel;
}

function setupPlanets() {
  // membersAtLevel = setProportions(membersAtLevel);
  for (let i = 0; i < membersAtLevel.length; i++) {
    const members = membersAtLevel[i];
    const memberCount = members.proportionMembers
      ? members.proportionMembers
      : members.members;
    let color;
    if (members.level == 1) {
      color = PLANET_1_COLOR;
    } else if (members.level == 2) {
      color = PLANET_2_COLOR;
    } else if (members.level == 3) {
      color = PLANET_3_COLOR;
    } else if (members.level == 4) {
      color = PLANET_4_COLOR;
    } else {
      color = { r: 255, g: 255, b: 255, a: 1.0 };
    }

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
  constructor () {
    this.maxParticlesDrawn = MAX_PARTICLES_DRAWN;
  }
}



// load in google font
let interFont;
function preload() {
  interFont = loadFont('Inter-VariableFont_slnt,wght.ttf');
}

function preload(){
  Heart = loadModel('Heart.obj');
  arrow = loadModel('arrow.obj');
}



function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  

  
  planetSpeed = new PlanetSpeed();
  planetScale = new PlanetScale();
  particleConfig = new ParticleConfig();
  createSnowflakes();
}

// 화면 크기가 변경될 때 호출되는 함수
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createSnowflakes();
}

// 눈송이 배열을 생성하는 함수
function createSnowflakes() {
  for (let k = 0; k < LAYER_COUNT; k++) {
    const layer = [];
    for (let i = 0; i < SNOWFLAKES_PER_LAYER; i++) {
      layer.push({
        x: random(windowWidth),
        y: random(windowHeight),
        z: random(-50, 50), // Z 축 값 추가
        mass: random(0.75, 1.25),
        k: k + 1
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


// hover tooltip that displays member count for each orbit level

function draw() {
  background(20,25,40);
  orbitControl();
  ambientLight(170);
  directionalLight(255, 0, 0, 0.25, 0.25, 0);

  noStroke();
  fill(random(100,250),random(100,250),random(100,250));
  for (let k = 0; k < SNOWFLAKES.length; k++) {
    const LAYER = SNOWFLAKES[k];
    for (let i = 0; i < LAYER.length; i++) {
      const snowflake = LAYER[i];
      circle(snowflake.x-windowWidth/2, snowflake.y-windowHeight/2, (snowflake.k * MAX_SIZE) / LAYER_COUNT);
      updateSnowflake(snowflake);
    }
  }

  for (let i = 0; i < planets.length; i++) {
    let ring = planets[i];
    for (let j = 0; j < ring.length; j++) {
      let planet = planets[i][j];
      planet.drawPlanet();
    }
  }

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
  

  translate(0,-20,0);

//1st heart orbit
const r = height / 80;
const x = r * 16 * pow(sin(a), 3);
const y = -r * (13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
const z = -r * sin(a) * random(3,4); // Z 축 좌표 추가

heart.push(createVector(x, y, z)); // Z 축 좌표를 포함하여 벡터 생성
stroke(235, 190, 230, frameCount % 1100);
strokeWeight(1.4);
beginShape(POINTS);
for (let v of heart) {
  vertex(v.x, v.y, v.z); // vertex 함수를 사용하여 3D 점 그리기
}
endShape();
  a += 0.007;
  
  push();
  noStroke();
  fill(180, 255, 120);
  translate(x, y, 0);
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  box(20, 20, 20);
  pop(); 
  
  
  
  
//2st heart orbit

  const g = height/60;
  const h = g * 16 * pow(sin(f), 3);
  const k = -g*(13 * cos(f) - 5*cos(2*f) - 2*cos(3*f)- cos(4*f));
  const z2 = g * sin(f) * random(4,4.5); // Z 축 좌표 추가

  
  heart.push(createVector(h, k, z2));
  strokeWeight(0.4);
  stroke(100,100,100,frameCount%600); 
  beginShape(); 
  for (let s of heart) {
    point(s.h, s.k, s.z2);
  }
  f += 0.003;
  endShape();


  
  push();
  noStroke();
  fill(150, 130, 255);
  translate(h, k, 0);
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.04);
  rotateY(frameCount * 0.01);
  cone(10, 20);
  pop(); 
  
  
  
  
  
    
//3st heart orbit

  const q = height/30;
  const w = q * 16 * pow(sin(t), 3);
  const e = -q*(13 * cos(t) - 5*cos(2*t) - 2*cos(3*t)- cos(4*t));
  const z3 = q * sin(f) * random(2,2.6); // Z 축 좌표 추가


  beginShape();
  heart.push(createVector(w, e, z3));
  strokeWeight(0.4);
  stroke(0,0,0,frameCount%600);  
  for (let s of heart) {
    point(s.w, s.e, s.z3);
  }
  t -= 0.009;
  endShape();

  
  push();
  noStroke();
  fill(150, 250, 255);
  translate(w, e, 0);
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  sphere(15);
  pop(); 
  
  push();
  noStroke();
  fill(100,100, 255);
  translate(w,e,0);
  rotate(sat);
  translate(0,40);
  box(4);
  sat = sat+0.1;
  pop();
  
  push();
  noStroke();
  fill(100,250, 150);
  translate(w,e,0);
  rotate(sat2);
  translate(0,35);
  sphere(2);
  sat2 = sat2+0.15;
  pop();
  
    
  push();
  noStroke();
  fill(250,150,150);
  translate(w,e,0);
  rotate(sat3);
  translate(0,60);
  cone(3,2);
  sat3 = sat3+0.05;
  pop();
  
  
  const p = height/28;
  const no = p * 16 * pow(sin(j), 3);
  const i = -p*(13 * cos(j) - 5*cos(2*j) - 2*cos(3*j)- cos(4*j));
  const z4 = -p * sin(f) * random(3,3.2); // Z 축 좌표 추가

  
  beginShape();
  heart.push(createVector(no, i, z4));
  strokeWeight(0.4);
  stroke(0,0,0,frameCount%600);  
  for (let s of heart) {
    point(s.no, s.i, s.z4);
  }
  j += 0.008;
  endShape();

  
  
  
  push();
  noStroke();
  normalMaterial();
  translate(no, i, 0);
  rotateZ(frameCount * 0.04);
  rotateX(frameCount * 0.04);
  rotateY(frameCount * 0.04);
  sphere(9);
  pop(); 
}


function mousePressed() {
  // 화면 중앙 좌표
  const centerX = windowWidth / 2;
  const centerY = windowHeight / 2;

  // 클릭 감지 범위 (가로/세로)
  const clickRange = 100;

  // 마우스 위치가 하트 모델 위치 근처인지 확인
  if (mouseX >= centerX - clickRange && mouseX <= centerX + clickRange &&
      mouseY >= centerY - clickRange && mouseY <= centerY + clickRange) {
    window.open('https://sjung220.github.io/truelovepink/', '_blank'); // 새 탭에서 링크 열기
  }
}

function touchStarted() {
  // 화면 중앙 좌표
  const centerX = width / 2;
  const centerY = height / 2;

  // 터치 감지 범위 확대
  const clickRange = 200; // 이전에는 100이었음

  // 터치 이벤트가 발생했을 경우
  if (touches.length > 0) {
    const touchX = touches[0].x;
    const touchY = touches[0].y;

    // 터치 위치가 확대된 감지 범위 내에 있는지 확인
    if (touchX >= centerX - clickRange && touchX <= centerX + clickRange &&
        touchY >= centerY - clickRange && touchY <= centerY + clickRange) {
      window.open('https://sjung220.github.io/truelovepink/', '_blank');
      return false; // 기본 동작 방지
    }
  }
}



function updateSnowflake(snowflake) {
    const diameter = (snowflake.k * MAX_SIZE) / LAYER_COUNT;
    if (snowflake.y > windowHeight + diameter) snowflake.y = -diameter;
    else snowflake.y += GRAVITY * snowflake.k * snowflake.mass;
  }