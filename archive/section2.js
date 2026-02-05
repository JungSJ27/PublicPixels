// Pixel Playground mini game
// Controls: WASD or Arrow keys
// Enter gate: E or Enter
// Rewards: Dust from butterflies, Shards from gates
// Dust 5: Treasure Gate spawns near you
// Gate 3: Wings upgrade visual

const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");
const commissionBtn = document.getElementById("btn-commission");
const introUi = document.getElementById("pixel-intro-ui");

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// Internal resolution fixed for pixel look
const VW = 384;
const VH = 216;

const buffer = document.createElement("canvas");
buffer.width = VW;
buffer.height = VH;
const btx = buffer.getContext("2d");
btx.imageSmoothingEnabled = false;

function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

if(archiveBtn){
  archiveBtn.addEventListener("click", ()=>{
    location.href = "/archive/";
  });
}

if(commissionBtn){
  commissionBtn.addEventListener("click", ()=>{
location.href = "../commission/";
  });
}

const keys = new Set();
window.addEventListener("keydown", (e)=>{
  const k = e.key.toLowerCase();
  keys.add(k);
  if(["arrowup","arrowdown","arrowleft","arrowright"," ","enter"].includes(k)){
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e)=>{
  keys.delete(e.key.toLowerCase());
});

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function pickRandom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function dist2(ax,ay,bx,by){ const dx=ax-bx; const dy=ay-by; return dx*dx+dy*dy; }

async function loadArtworks(){
  try{
    const res = await fetch("./artworks.json", { cache: "no-store" });
    if(!res.ok) throw new Error("artworks.json fetch failed");
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("artworks.json must be an array");
    return data.filter(a => a && typeof a.href === "string" && a.href.length > 1);
  }catch(e){
    console.warn(e);
    return [];
  }
}

let artworks = [];
let running = false;
let lastTime = 0;
let animTime = 0;

const palette = {
  void: "#0b1224",
  floor1: "#dbe7ff",
  floor2: "#c9dbff",
  floor3: "#b7cdfa",
  wall1: "#9aa7ff",
  wall2: "#7f8eff",
  wall3: "#6b78ea",
  frame1: "#ffd6ff",
  frame2: "#a2d2ff",
  pink: "#ff77e9",
  gold: "#ffe066",
  glowPink: "rgba(255,119,233,0.18)",
  glowGold: "rgba(255,224,102,0.22)"
};

// Tile map
const TILE = 16;
const mapW = 120;
const mapH = 80;
const map = new Array(mapW * mapH).fill(0);
// 0 floor
// 1 wall
// 2 decor
// 3 bridge trigger

function setTile(x,y,v){
  if(x < 0 || y < 0 || x >= mapW || y >= mapH) return;
  map[y*mapW + x] = v;
}

function buildTileMap(){
  map.fill(0);

  // Outer walls
  for(let x=0; x<mapW; x++){
    setTile(x, 0, 1);
    setTile(x, mapH-1, 1);
  }
  for(let y=0; y<mapH; y++){
    setTile(0, y, 1);
    setTile(mapW-1, y, 1);
  }

  // Interior room structure
  for(let y=10; y<64; y++){
    setTile(18, y, 1);
    setTile(96, y, 1);
  }
  for(let x=26; x<92; x++){
    setTile(x, 18, 1);
    setTile(x, 56, 1);
  }

  // Pillars
  for(let y=14; y<30; y++){
    setTile(32, y, 1);
    setTile(82, y, 1);
  }

  // Small frame decor patch
  for(let x=42; x<46; x++){
    for(let y=20; y<22; y++){
      setTile(x, y, 2);
    }
  }

  // Bridge trigger zone
  for(let x=56; x<60; x++){
    for(let y=36; y<38; y++){
      setTile(x, y, 3);
    }
  }
}
buildTileMap();

const world = {
  w: mapW * TILE,
  h: mapH * TILE,
  gates: [],
  butterflies: [],
  portal: null,
  hiddenGateSpawned: false
};

const player = {
  x: world.w * 0.5,
  y: world.h * 0.6,
  vx: 0,
  vy: 0,
  r: 10,
  speed: 560,
  friction: 0.84,
  facing: "down"
};

const reward = {
  dust: 0,
  shards: 0,
  treasureReady: false,
  wingsUpgraded: false
};

function isWallAt(px, py){
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if(tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return true;
  const t = map[ty*mapW + tx];
  return t === 1;
}

function resolveTileCollision(nx, ny){
  let x = nx;
  let y = ny;

  const checks = [
    { x: x - player.r, y: y - player.r },
    { x: x + player.r, y: y - player.r },
    { x: x - player.r, y: y + player.r },
    { x: x + player.r, y: y + player.r }
  ];

  for(let i=0; i<12; i++){
    let hit = false;
    for(const c of checks){
      if(isWallAt(c.x, c.y)){
        hit = true;
        break;
      }
    }
    if(!hit) break;

    const pushX = player.vx === 0 ? 0 : (player.vx > 0 ? -1 : 1);
    const pushY = player.vy === 0 ? 0 : (player.vy > 0 ? -1 : 1);

    x += pushX * 1.6;
    y += pushY * 1.6;

    checks[0].x = x - player.r; checks[0].y = y - player.r;
    checks[1].x = x + player.r; checks[1].y = y - player.r;
    checks[2].x = x - player.r; checks[2].y = y + player.r;
    checks[3].x = x + player.r; checks[3].y = y + player.r;
  }

  return { x, y };
}

function isFloorTile(tx, ty){
  if(tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return false;
  const t = map[ty*mapW + tx];
  return t === 0 || t === 2 || t === 3;
}

function buildGates(){
  world.gates = [];
  world.hiddenGateSpawned = false;

  const gateCount = 10 + Math.floor(Math.random() * 3);

  let tries = 0;
  while(world.gates.length < gateCount && tries < 5000){
    tries++;

    const radius = 220 + Math.random() * 520;
    const ang = Math.random() * Math.PI * 2;

    const wx = clamp(player.x + Math.cos(ang) * radius, 80, world.w - 80);
    const wy = clamp(player.y + Math.sin(ang) * radius, 80, world.h - 80);

    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);

    if(!isFloorTile(tx, ty)) continue;

    let ok = true;
    for(const g of world.gates){
      if(dist2(wx, wy, g.x, g.y) < 140 * 140){
        ok = false;
        break;
      }
    }
    if(!ok) continue;

    const a = artworks.length ? pickRandom(artworks) : null;
    const isRare = Math.random() < 0.2;

    world.gates.push({
      x: tx * TILE + 3,
      y: ty * TILE + 2,
      w: 26,
      h: 34,
      href: a ? a.href : "/archive/",
      title: a ? (a.title || "Artwork") : "Archive Gate",
      glow: 0,
      tier: isRare ? "rare" : "normal"
    });
  }
}

function spawnButterfly(){
  world.butterflies.push({
    x: 140 + Math.random() * (world.w - 280),
    y: 140 + Math.random() * (world.h - 280),
    vx: (Math.random()*2 - 1) * 90,
    vy: (Math.random()*2 - 1) * 90,
    t: 0
  });
}

function maybeSpawnPortal(dt){
  if(world.portal){
    world.portal.time -= dt;
    if(world.portal.time <= 0) world.portal = null;
    return;
  }
  if(Math.random() < dt * 0.028){
    const a = artworks.length ? pickRandom(artworks) : null;
    world.portal = {
      x: 160 + Math.random() * (world.w - 320),
      y: 160 + Math.random() * (world.h - 320),
      time: 9,
      href: a ? a.href : "/archive/",
      title: a ? (a.title || "Artwork") : "Random Portal"
    };
  }
}

function spawnTreasureGateNearPlayer(){
  const a = artworks.length ? pickRandom(artworks) : null;

  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);

  const candidates = [
    { x: tx + 2, y: ty - 3 },
    { x: tx - 2, y: ty - 3 },
    { x: tx + 3, y: ty + 2 },
    { x: tx - 3, y: ty + 2 }
  ];

  for(const c of candidates){
    if(!isFloorTile(c.x, c.y)) continue;
    world.gates.push({
      x: c.x * TILE + 3,
      y: c.y * TILE + 2,
      w: 26,
      h: 34,
      href: a ? a.href : "/archive/",
      title: "Treasure Gate",
      glow: 1,
      tier: "rare"
    });
    return;
  }

  // fallback
  world.gates.push({
    x: clamp(player.x + 40, 80, world.w - 80),
    y: clamp(player.y - 60, 80, world.h - 80),
    w: 26,
    h: 34,
    href: a ? a.href : "/archive/",
    title: "Treasure Gate",
    glow: 1,
    tier: "rare"
  });
}

function tryEnter(){
  for(const g of world.gates){
    const gx = g.x + g.w * 0.5;
    const gy = g.y + g.h * 0.5;
    if(dist2(player.x, player.y, gx, gy) < 44*44){
      reward.shards += 1;
      if(reward.shards >= 3) reward.wingsUpgraded = true;
      location.href = g.href;
      return;
    }
  }
  if(world.portal){
    if(dist2(player.x, player.y, world.portal.x, world.portal.y) < 46*46){
      reward.shards += 1;
      if(reward.shards >= 3) reward.wingsUpgraded = true;
      location.href = world.portal.href;
    }
  }
}

function update(dt){
  animTime += dt;

  let ix = 0;
  let iy = 0;

  if(keys.has("w") || keys.has("arrowup")) iy -= 1;
  if(keys.has("s") || keys.has("arrowdown")) iy += 1;
  if(keys.has("a") || keys.has("arrowleft")) ix -= 1;
  if(keys.has("d") || keys.has("arrowright")) ix += 1;

  if(ix !== 0 || iy !== 0){
    const len = Math.hypot(ix, iy) || 1;
    ix /= len;
    iy /= len;

    player.vx += ix * player.speed * dt;
    player.vy += iy * player.speed * dt;

    if(Math.abs(ix) > Math.abs(iy)) player.facing = ix > 0 ? "right" : "left";
    else player.facing = iy > 0 ? "down" : "up";
  }

  player.vx *= Math.pow(player.friction, dt * 60);
  player.vy *= Math.pow(player.friction, dt * 60);

  const nx = clamp(player.x + player.vx * dt, 24, world.w - 24);
  const ny = clamp(player.y + player.vy * dt, 24, world.h - 24);
  const resolved = resolveTileCollision(nx, ny);
  player.x = resolved.x;
  player.y = resolved.y;

  // Enter gate
  if(keys.has("e") || keys.has("enter")){
    keys.delete("e");
    keys.delete("enter");
    tryEnter();
  }

  // Gate glow
  for(const g of world.gates){
    const gx = g.x + g.w * 0.5;
    const gy = g.y + g.h * 0.5;
    const near = dist2(player.x, player.y, gx, gy) < 60*60;
    g.glow += ((near ? 1 : 0) - g.glow) * dt * 8;
    g.glow = clamp(g.glow, 0, 1);
  }

  // Butterflies
  for(const b of world.butterflies){
    b.t += dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if(b.x < 80 || b.x > world.w - 80) b.vx *= -1;
    if(b.y < 80 || b.y > world.h - 80) b.vy *= -1;

    b.vx += Math.sin(b.t * 3.1) * dt * 32;
    b.vy += Math.cos(b.t * 2.6) * dt * 32;

    // Catch butterfly reward
    if(dist2(player.x, player.y, b.x, b.y) < 22*22){
      reward.dust += 1;

      if(!world.hiddenGateSpawned){
        world.hiddenGateSpawned = true;
        const a = artworks.length ? pickRandom(artworks) : null;
        world.gates.push({
          x: clamp(player.x + 120, 80, world.w - 80),
          y: clamp(player.y - 120, 80, world.h - 80),
          w: 26,
          h: 34,
          href: a ? a.href : "/archive/",
          title: "Hidden Gate",
          glow: 1,
          tier: "rare"
        });
      }

      if(reward.dust >= 5 && !reward.treasureReady){
        reward.treasureReady = true;
        spawnTreasureGateNearPlayer();
      }

      b.x = -9999;
      b.y = -9999;
    }
  }
  world.butterflies = world.butterflies.filter(b => b.x > -1000);

  // Portal spawn
  maybeSpawnPortal(dt);

  // Keep butterflies
  if(world.butterflies.length < 2 && Math.random() < dt * 0.28){
    spawnButterfly();
  }

  // Bridge trigger teleport
  const ptx = Math.floor(player.x / TILE);
  const pty = Math.floor(player.y / TILE);
  const t = map[pty*mapW + ptx];
  if(t === 3){
    player.x = 1160;
    player.y = 520;
    player.vx *= 0.15;
    player.vy *= 0.15;
  }
}

function drawTile(screenX, screenY, tx, ty, type){
  if(type === 0){
    const c = ((tx + ty) % 2 === 0) ? palette.floor1 : palette.floor2;
    btx.fillStyle = c;
    btx.fillRect(screenX, screenY, TILE, TILE);

    if(((tx*7 + ty*11) % 13) === 0){
      btx.fillStyle = "rgba(255,255,255,0.14)";
      btx.fillRect(screenX+3, screenY+4, 1, 1);
      btx.fillRect(screenX+11, screenY+10, 1, 1);
    }
    return;
  }

  if(type === 1){
    btx.fillStyle = palette.wall1;
    btx.fillRect(screenX, screenY, TILE, TILE);

    btx.fillStyle = palette.wall2;
    btx.fillRect(screenX, screenY, TILE, 4);
    btx.fillRect(screenX, screenY, 4, TILE);

    btx.fillStyle = "rgba(255,255,255,0.18)";
    btx.fillRect(screenX+5, screenY+6, 2, 2);

    btx.fillStyle = "rgba(0,0,0,0.10)";
    btx.fillRect(screenX+10, screenY+10, 4, 4);
    return;
  }

  if(type === 2){
    btx.fillStyle = palette.frame2;
    btx.fillRect(screenX, screenY, TILE, TILE);

    btx.fillStyle = palette.pink;
    btx.fillRect(screenX+2, screenY+2, TILE-4, TILE-4);

    btx.fillStyle = "rgba(0,0,0,0.22)";
    btx.fillRect(screenX+4, screenY+4, TILE-8, TILE-8);
    return;
  }

  if(type === 3){
    const c = ((tx + ty) % 2 === 0) ? palette.floor2 : palette.floor3;
    btx.fillStyle = c;
    btx.fillRect(screenX, screenY, TILE, TILE);
    btx.fillStyle = "rgba(255,224,102,0.25)";
    btx.fillRect(screenX+2, screenY+2, TILE-4, TILE-4);

    btx.fillStyle = "rgba(0,0,0,0.12)";
    btx.fillRect(screenX+5, screenY+5, 6, 6);
  }
}

function drawPlayerSprite(px, py, facing, moving){
  const w = 16;
  const h = 20;

  const step = moving ? (Math.floor(animTime * 10) % 2) : 0;
  const x = Math.floor(px - w/2);
  const y = Math.floor(py - h + 2);

  // Shadow
  btx.fillStyle = "rgba(0,0,0,0.26)";
  btx.fillRect(x+4, y+h-3, 8, 2);

  // Wings upgrade
  const wingOuter = reward.wingsUpgraded ? "rgba(255,224,102,0.95)" : palette.pink;
  const wingInner = reward.wingsUpgraded ? "rgba(255,214,255,0.90)" : "#bdb2ff";

  // Wings
  const flap = step ? 1 : 0;
  btx.fillStyle = wingOuter;
  btx.fillRect(x-3, y+7-flap, 5, 7);
  btx.fillRect(x+w-2, y+7+flap, 5, 7);
  btx.fillStyle = wingInner;
  btx.fillRect(x-2, y+8-flap, 3, 5);
  btx.fillRect(x+w-1, y+8+flap, 3, 5);

  // Hair
  btx.fillStyle = "#8c4a23";
  btx.fillRect(x+3, y+1, 10, 6);
  btx.fillRect(x+2, y+3, 12, 5);

  // Head
  btx.fillStyle = "#ffceb2";
  btx.fillRect(x+4, y+4, 8, 6);

  // Band
  btx.fillStyle = palette.gold;
  btx.fillRect(x+4, y+3, 8, 1);

  // Body
  btx.fillStyle = "#ffffff";
  btx.fillRect(x+4, y+10, 8, 5);

  // Jeans
  btx.fillStyle = "#a2d2ff";
  btx.fillRect(x+4, y+15, 8, 4);

  // Feet step
  btx.fillStyle = "rgba(0,0,0,0.18)";
  if(step){
    btx.fillRect(x+5, y+18, 3, 1);
    btx.fillRect(x+9, y+17, 3, 1);
  }else{
    btx.fillRect(x+5, y+17, 3, 1);
    btx.fillRect(x+9, y+18, 3, 1);
  }

  // Tiny face dot
  btx.fillStyle = "rgba(0,0,0,0.22)";
  if(facing === "left") btx.fillRect(x+6, y+6, 1, 1);
  if(facing === "right") btx.fillRect(x+9, y+6, 1, 1);
  if(facing === "down") btx.fillRect(x+7, y+7, 1, 1);
  if(facing === "up") btx.fillRect(x+7, y+5, 1, 1);
}

function drawHUD(){
  // Top left HUD
  btx.fillStyle = "rgba(0,0,0,0.36)";
  btx.fillRect(6, 6, 168, 28);

  btx.fillStyle = "rgba(255,255,255,0.92)";
  btx.font = "12px monospace";
  btx.fillText(`DUST ${reward.dust}  SHARD ${reward.shards}`, 12, 24);

  // Small hint
  btx.fillStyle = "rgba(255,255,255,0.72)";
  btx.font = "10px monospace";
  btx.fillText("E OR ENTER TO ENTER", 12, 44);
}

function drawHintIfNear(){
  let near = false;

  for(const g of world.gates){
    const gx = g.x + g.w * 0.5;
    const gy = g.y + g.h * 0.5;
    if(dist2(player.x, player.y, gx, gy) < 60*60){
      near = true;
      break;
    }
  }

  if(!near && world.portal){
    if(dist2(player.x, player.y, world.portal.x, world.portal.y) < 70*70){
      near = true;
    }
  }

  if(!near) return;

  btx.fillStyle = "rgba(0,0,0,0.34)";
  btx.fillRect(8, VH-28, 160, 20);
  btx.fillStyle = "rgba(255,255,255,0.92)";
  btx.font = "12px monospace";
  btx.fillText("E OR ENTER  ENTER", 14, VH-14);
}

function render(){
  const screenW = VW;
  const screenH = VH;

  const camX = clamp(Math.floor(player.x - screenW/2), 0, world.w - screenW);
  const camY = clamp(Math.floor(player.y - screenH/2), 0, world.h - screenH);

  btx.clearRect(0,0,screenW,screenH);

  // Base void
  btx.fillStyle = palette.void;
  btx.fillRect(0,0,screenW,screenH);

  // Visible tiles
  const startTX = Math.floor(camX / TILE);
  const startTY = Math.floor(camY / TILE);
  const endTX = startTX + Math.ceil(screenW / TILE) + 2;
  const endTY = startTY + Math.ceil(screenH / TILE) + 2;

  for(let ty=startTY; ty<endTY; ty++){
    for(let tx=startTX; tx<endTX; tx++){
      if(tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) continue;
      const type = map[ty*mapW + tx];
      const sx = (tx*TILE) - camX;
      const sy = (ty*TILE) - camY;
      drawTile(sx, sy, tx, ty, type);
    }
  }

  // Gates, more visible
  for(const g of world.gates){
    const gx = Math.floor(g.x - camX);
    const gy = Math.floor(g.y - camY);
    const glow = g.glow;
    const isRare = g.tier === "rare";

    if(glow > 0.05){
      btx.fillStyle = isRare ? palette.glowGold : palette.glowPink;
      btx.fillRect(gx - 4, gy - 4, g.w + 8, g.h + 8);
    }

    // Frame outer
    btx.fillStyle = isRare ? "rgba(255,224,102,0.90)" : "rgba(255,214,255,0.80)";
    btx.fillRect(gx, gy, g.w, g.h);

    // Frame inner
    btx.fillStyle = isRare ? "rgba(255,143,171,0.85)" : "rgba(162,210,255,0.58)";
    btx.fillRect(gx + 2, gy + 2, g.w - 4, g.h - 4);

    // Door inside
    btx.fillStyle = "rgba(0,0,0,0.22)";
    btx.fillRect(gx + 5, gy + 7, g.w - 10, g.h - 12);

    // Handle pixel
    btx.fillStyle = "rgba(255,255,255,0.80)";
    btx.fillRect(gx + g.w - 7, gy + Math.floor(g.h/2), 2, 2);

    // Top icon
    btx.fillStyle = isRare ? "rgba(255,224,102,0.95)" : "rgba(255,119,233,0.92)";
    btx.fillRect(gx + Math.floor(g.w/2) - 1, gy - 3, 3, 3);

    // Outline
    btx.strokeStyle = isRare ? "rgba(255,224,102,0.95)" : "rgba(255,119,233,0.92)";
    btx.strokeRect(gx + 1, gy + 1, g.w - 2, g.h - 2);
  }

  // Portal
  if(world.portal){
    const px = Math.floor(world.portal.x - camX);
    const py = Math.floor(world.portal.y - camY);
    const wobble = Math.sin(animTime * 6) > 0 ? 1 : 0;

    btx.fillStyle = "rgba(122,252,255,0.22)";
    btx.fillRect(px-8, py-8, 16, 16);

    btx.strokeStyle = "rgba(255,119,233,0.88)";
    btx.strokeRect(px-9-wobble, py-9+wobble, 18, 18);

    btx.fillStyle = "rgba(255,224,102,0.14)";
    btx.fillRect(px-12, py-12, 24, 24);
  }

  // Butterflies
  for(const b of world.butterflies){
    const bx = Math.floor(b.x - camX);
    const by = Math.floor(b.y - camY);

    const flick = (Math.floor(animTime * 12) % 2) ? 1 : 0;

    btx.fillStyle = "rgba(255,119,233,0.90)";
    btx.fillRect(bx-4, by-1, 3, 3);
    btx.fillRect(bx+1, by-1, 3, 3);

    btx.fillStyle = "rgba(162,210,255,0.92)";
    btx.fillRect(bx + flick, by, 1, 1);
  }

  // Player
  const moving = Math.hypot(player.vx, player.vy) > 6;
  drawPlayerSprite(Math.floor(screenW/2), Math.floor(screenH/2), player.facing, moving);

  // HUD and hints
  drawHUD();
  drawHintIfNear();

  // Draw buffer to screen with integer scaling
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const scale = Math.max(1, Math.floor(Math.min(canvas.width / VW, canvas.height / VH)));
  const drawW = VW * scale;
  const drawH = VH * scale;
  const dx = Math.floor((canvas.width - drawW) / 2);
  const dy = Math.floor((canvas.height - drawH) / 2);
  ctx.drawImage(buffer, dx, dy, drawW, drawH);
}

function loop(t){
  if(!running) return;

  const now = t * 0.001;
  const dt = Math.min(0.033, (now - lastTime) || 0);
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

async function startGame(){
  artworks = await loadArtworks();

  reward.dust = 0;
  reward.shards = 0;
  reward.treasureReady = false;
  reward.wingsUpgraded = false;

  player.x = world.w * 0.5;
  player.y = world.h * 0.6;
  player.vx = 0;
  player.vy = 0;

  buildGates();
  world.butterflies = [];
  world.portal = null;

  // Start with some butterflies
  spawnButterfly();
  spawnButterfly();

  running = true;
  lastTime = 0;
  animTime = 0;

  requestAnimationFrame(loop);
}

if(playBtn){
  playBtn.addEventListener("click", async ()=>{
    if(introUi) introUi.style.display = "none";
    await startGame();
  });
}
