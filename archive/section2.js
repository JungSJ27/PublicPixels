// archive/section2.js
// Cloud Dream World for PublicPixels
// walk on floating cloud islands
// stepping into sky triggers falling and respawn on another island
// fog layers + soft trail
// E or Enter to enter door

const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");
const commissionBtn = document.getElementById("btn-commission");
const introUi = document.getElementById("pixel-intro-ui");

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: true });

/* internal resolution */
const VW = 640;
const VH = 360;

const buffer = document.createElement("canvas");
buffer.width = VW;
buffer.height = VH;
const btx = buffer.getContext("2d", { alpha: true });

btx.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

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

/* base url (works without module) */
const SCRIPT_URL = new URL(document.currentScript?.src || window.location.href);
const BASE = new URL(".", SCRIPT_URL);

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function pickRandom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function dist2(ax,ay,bx,by){ const dx=ax-bx; const dy=ay-by; return dx*dx+dy*dy; }

async function loadJson(path){
  const url = new URL(path, BASE);
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("fetch failed " + url);
  return await res.json();
}

/* palette */
const palette = {
  sky0: "#070a18",
  sky1: "#0b1230",
  sky2: "#101b44",

  cloudA: "#f7fbff",
  cloudB: "#e9f2ff",
  cloudC: "#d6e7ff",

  lilacA: "#efe6ff",
  lilacB: "#e2d2ff",

  glowPink: "rgba(255,119,233,0.16)",
  glowCyan: "rgba(122,252,255,0.14)",
  glowGold: "rgba(255,224,102,0.14)",

  neonPink: "rgba(255,119,233,0.90)",
  neonCyan: "rgba(122,252,255,0.92)",
  neonLilac: "rgba(255,214,255,0.86)",
  gold: "rgba(255,224,102,0.92)"
};

const TILE = 16;

/*
tile types
0 sky (void)
1 cloud solid (walkable)
2 cloud edge sparkle detail (walkable)
3 thin mist detail (walkable)
*/
const mapW = 140;
const mapH = 92;
const map = new Array(mapW * mapH).fill(0);

function setTile(x,y,v){
  if(x < 0 || y < 0 || x >= mapW || y >= mapH) return;
  map[y*mapW + x] = v;
}
function getTile(x,y){
  if(x < 0 || y < 0 || x >= mapW || y >= mapH) return 0;
  return map[y*mapW + x];
}
function isCloud(tx,ty){
  const t = getTile(tx,ty);
  return t === 1 || t === 2 || t === 3;
}
function hash2(x,y){
  const n = x * 374761393 + y * 668265263;
  return (n ^ (n >> 13)) >>> 0;
}

/* world */
const world = {
  w: mapW * TILE,
  h: mapH * TILE,
  doors: [],
  snacks: [],
  effects: [],
  fogBack: [],
  fogFront: [],
  spawns: [],
  trails: [],
  specialDoor: null,
  specialCooldown: 0
};

const player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  r: 10,
  speed: 640,
  friction: 0.84,
  facing: "down",
  state: "walk",     // walk | fall
  fallT: 0
};

const reward = { score: 0, snack: 0 };

/* build dreamy cloud islands */
function carveBlob(cx, cy, rx, ry){
  for(let y = cy - ry; y <= cy + ry; y++){
    for(let x = cx - rx; x <= cx + rx; x++){
      const dx = (x - cx) / Math.max(1, rx);
      const dy = (y - cy) / Math.max(1, ry);
      const d = dx*dx + dy*dy;
      if(d <= 1.0){
        setTile(x, y, 1);
      }
    }
  }
}

function addIslandDetails(){
  // edges and sparkles
  for(let y=1; y<mapH-1; y++){
    for(let x=1; x<mapW-1; x++){
      if(!isCloud(x,y)) continue;

      const n0 = isCloud(x+1,y) ? 1 : 0;
      const n1 = isCloud(x-1,y) ? 1 : 0;
      const n2 = isCloud(x,y+1) ? 1 : 0;
      const n3 = isCloud(x,y-1) ? 1 : 0;

      const edge = (n0+n1+n2+n3) < 4;
      const h = hash2(x,y);

      if(edge && (h % 3 === 0)){
        setTile(x,y,2);
      }else if(!edge && (h % 29 === 0)){
        setTile(x,y,3);
      }
    }
  }
}

function pickSpawnFromCloud(){
  // pick a tile that is cloud and not near void too much
  for(let tries=0; tries<2000; tries++){
    const tx = 4 + Math.floor(Math.random() * (mapW - 8));
    const ty = 4 + Math.floor(Math.random() * (mapH - 8));
    if(!isCloud(tx,ty)) continue;

    // require some neighbors also cloud
    let ok = 0;
    for(const d of [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]){
      if(isCloud(tx + d[0], ty + d[1])) ok++;
    }
    if(ok < 6) continue;

    return { x: tx*TILE + TILE/2, y: ty*TILE + TILE/2 };
  }
  return { x: world.w * 0.5, y: world.h * 0.5 };
}

function buildCloudWorld(){
  map.fill(0);
  world.spawns = [];

  // create multiple floating islands
  const islandCount = 14;
  for(let i=0; i<islandCount; i++){
    const cx = 10 + Math.floor(Math.random() * (mapW - 20));
    const cy = 10 + Math.floor(Math.random() * (mapH - 20));
    const rx = 8 + Math.floor(Math.random() * 14);
    const ry = 6 + Math.floor(Math.random() * 10);
    carveBlob(cx, cy, rx, ry);

    // carve holes for weirdness
    if(Math.random() < 0.55){
      const hx = cx + Math.floor(Math.random()*6 - 3);
      const hy = cy + Math.floor(Math.random()*6 - 3);
      carveBlob(hx, hy, Math.max(2, Math.floor(rx*0.25)), Math.max(2, Math.floor(ry*0.25)));
      // turn some of that hole back into sky
      for(let y=hy-3; y<=hy+3; y++){
        for(let x=hx-3; x<=hx+3; x++){
          if(hash2(x,y) % 2 === 0) setTile(x,y,0);
        }
      }
    }
  }

  // add a thin dreamy bridge sometimes
  for(let i=0; i<4; i++){
    const a = pickSpawnFromCloud();
    const b = pickSpawnFromCloud();
    const ax = Math.floor(a.x / TILE);
    const ay = Math.floor(a.y / TILE);
    const bx = Math.floor(b.x / TILE);
    const by = Math.floor(b.y / TILE);
    const steps = 36 + Math.floor(Math.random()*50);
    for(let s=0; s<=steps; s++){
      const t = s / steps;
      const x = Math.floor(ax + (bx-ax)*t);
      const y = Math.floor(ay + (by-ay)*t);
      if(hash2(x,y) % 4 !== 0) setTile(x,y,1);
      if(hash2(x,y) % 9 === 0) setTile(x,y,0);
    }
  }

  addIslandDetails();

  // build spawn points
  for(let i=0; i<10; i++){
    world.spawns.push(pickSpawnFromCloud());
  }
}

/* fog layers */
function makeFogLayer(count, depth){
  const arr = [];
  for(let i=0; i<count; i++){
    arr.push({
      x: Math.random() * world.w,
      y: Math.random() * world.h,
      r: 24 + Math.random()*72,
      vx: (Math.random()*2 - 1) * (12 + depth*10),
      vy: (Math.random()*2 - 1) * (6 + depth*6),
      a: 0.05 + Math.random()*0.07 + depth*0.02
    });
  }
  return arr;
}

/* collision and falling */
function tileAtWorld(px, py){
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  return { tx, ty, t: getTile(tx,ty) };
}

function insideWorld(px, py){
  return px >= 0 && py >= 0 && px < world.w && py < world.h;
}

function shouldFall(px, py){
  if(!insideWorld(px,py)) return true;
  const { tx, ty } = tileAtWorld(px,py);
  return !isCloud(tx,ty);
}

function startFalling(){
  if(player.state === "fall") return;
  player.state = "fall";
  player.fallT = 0;
  player.vx = 0;
  player.vy = 0;

  for(let i=0; i<32; i++){
    world.effects.push({
      x: player.x,
      y: player.y,
      vx: (Math.random()*2 - 1) * 120,
      vy: (Math.random()*2 - 1) * 120,
      life: 1.1 + Math.random()*0.8,
      kind: Math.random() < 0.5 ? "cyan" : "pink"
    });
  }
}

function respawnOnAnotherIsland(){
  const p = pickRandom(world.spawns.length ? world.spawns : [pickSpawnFromCloud()]);
  player.x = p.x;
  player.y = p.y;
  player.vx = 0;
  player.vy = 0;
  player.state = "walk";
  player.fallT = 0;

  for(let i=0; i<22; i++){
    world.effects.push({
      x: player.x,
      y: player.y,
      vx: (Math.random()*2 - 1) * 120,
      vy: (Math.random()*2 - 1) * 120,
      life: 0.7 + Math.random()*0.7,
      kind: Math.random() < 0.5 ? "gold" : "pink"
    });
  }
}

/* doors */
async function loadDoorsConfig(){
  const candidates = [
    "./archive/doors.json",
    "/archive/doors.json",
    "./doors.json",
    "/doors.json"
  ];

  for(const p of candidates){
    try{
      const cfg = await loadJson(p);
      if(Array.isArray(cfg)) return cfg;
    }catch(e){
      // try next
    }
  }
  return [];
}

function normalizeDoor(def){
  const w = Number(def.w || 52);
  const h = Number(def.h || 52);

  const door = {
    id: def.id || ("door_" + Math.random().toString(16).slice(2)),
    type: def.type || "normal",
    label: def.label || "Door",
    x: Number(def.x || 0),
    y: Number(def.y || 0),
    w,
    h,
    glow: 0,
    tier: "normal",
    href: "",
    pool: []
  };

  if(door.type === "random" && Array.isArray(def.pool)){
    door.pool = def.pool.filter(v => typeof v === "string");
  }else if(typeof def.to === "string"){
    door.href = def.to;
  }

  if(door.type === "bonus") door.tier = "special";
  else if(door.type === "random") door.tier = "rare";
  else door.tier = "normal";

  return door;
}

function placeDoorsOnCloud(doors){
  // Instead of using door x y exactly, snap doors to nearest cloud spawn.
  // This makes doors always reachable in the floating world.
  for(const d of doors){
    const p = pickRandom(world.spawns.length ? world.spawns : [pickSpawnFromCloud()]);
    d.x = clamp(p.x - d.w*0.5, 12, world.w - d.w - 12);
    d.y = clamp(p.y - d.h*0.5, 12, world.h - d.h - 12);
  }
}

function buildDoorsFromConfig(cfg){
  world.doors = cfg.map(normalizeDoor);
  placeDoorsOnCloud(world.doors);
}

/* collectibles and trail */
function spawnSnack(){
  const p = pickRandom(world.spawns.length ? world.spawns : [pickSpawnFromCloud()]);
  world.snacks.push({
    x: clamp(p.x + (Math.random()*2 - 1)*120, 24, world.w-24),
    y: clamp(p.y + (Math.random()*2 - 1)*120, 24, world.h-24),
    kind: Math.random() < 0.12 ? "spark" : "snack",
    t: 0
  });
}

function burstItems(x, y){
  for(let i=0; i<18; i++){
    world.effects.push({
      x, y,
      vx: (Math.random()*2 - 1) * 170,
      vy: (Math.random()*2 - 1) * 170,
      life: 0.8 + Math.random()*0.7,
      kind: Math.random() < 0.18 ? "gold" : "pink"
    });
  }
}

function addTrail(px, py){
  // soft footprint glow on clouds
  world.trails.push({ x: px, y: py, life: 1.0 });
  if(world.trails.length > 220) world.trails.shift();
}

/* special door (bonus bloom) */
function maybeSpawnSpecialDoor(){
  if(world.specialDoor) return;
  if(world.specialCooldown > 0) return;
  if(reward.score < 140) return;

  const p = pickRandom(world.spawns.length ? world.spawns : [pickSpawnFromCloud()]);
  world.specialDoor = {
    id: "special_spawn",
    type: "bonus",
    label: "BONUS",
    x: clamp(p.x - 16, 12, world.w - 46),
    y: clamp(p.y - 22, 12, world.h - 56),
    w: 34,
    h: 44,
    glow: 1,
    tier: "special",
    openTime: 14
  };

  burstItems(world.specialDoor.x + 12, world.specialDoor.y + 12);
}

function enterBonusBurst(x,y){
  for(let i=0; i<28; i++){
    const a = Math.random() * Math.PI * 2;
    const r = 12 + Math.random()*100;
    world.snacks.push({
      x: clamp(x + Math.cos(a)*r, 24, world.w-24),
      y: clamp(y + Math.sin(a)*r, 24, world.h-24),
      kind: Math.random() < 0.20 ? "spark" : "snack",
      t: 0
    });
  }
  reward.score += 70;
  burstItems(x,y);
}

/* entering doors */
function tryEnter(){
  const px = player.x;
  const py = player.y;

  if(world.specialDoor){
    const gx = world.specialDoor.x + world.specialDoor.w*0.5;
    const gy = world.specialDoor.y + world.specialDoor.h*0.5;
    if(dist2(px,py,gx,gy) < 56*56){
      enterBonusBurst(px,py);
      world.specialDoor = null;
      world.specialCooldown = 12;
      return;
    }
  }

  for(const d of world.doors){
    const gx = d.x + d.w*0.5;
    const gy = d.y + d.h*0.5;

    if(dist2(px,py,gx,gy) < 56*56){
      if(d.type === "random" && d.pool.length){
        location.href = pickRandom(d.pool);
        return;
      }
      if(d.type === "bonus"){
        enterBonusBurst(px,py);
        return;
      }
      if(d.href){
        location.href = d.href;
        return;
      }
      return;
    }
  }
}

/* drawing */
let running = false;
let lastTime = 0;
let animTime = 0;

function skyColorAt(px, py){
  // gentle sky gradient with tiny pulse
  const y = py / world.h;
  const pulse = 0.5 + 0.5*Math.sin(animTime*0.25);
  if(y < 0.33) return palette.sky0;
  if(y < 0.66) return pulse > 0.5 ? palette.sky1 : palette.sky2;
  return palette.sky2;
}

function drawTile(sx, sy, tx, ty, type){
  if(type === 0){
    // sky tile
    btx.fillStyle = skyColorAt(tx*TILE, ty*TILE);
    btx.fillRect(sx, sy, TILE, TILE);

    const h = hash2(tx,ty);
    if(h % 43 === 0){
      btx.fillStyle = "rgba(255,255,255,0.06)";
      btx.fillRect(sx + 7, sy + 4, 1, 1);
    }
    return;
  }

  // cloud tones
  const h = hash2(tx,ty);
  const v = h % 3;
  let c = v === 0 ? palette.cloudA : (v === 1 ? palette.cloudB : palette.cloudC);

  btx.fillStyle = c;
  btx.fillRect(sx, sy, TILE, TILE);

  // soft edge highlight for dreamy puff
  btx.fillStyle = "rgba(255,255,255,0.10)";
  btx.fillRect(sx, sy, TILE, 2);
  btx.fillRect(sx, sy, 2, TILE);

  if(type === 2){
    // edge sparkle
    const blink = (Math.floor(animTime * 6) % 2) ? 1 : 0;
    btx.fillStyle = blink ? "rgba(122,252,255,0.14)" : "rgba(255,214,255,0.10)";
    btx.fillRect(sx+4, sy+3, 1, 1);
    btx.fillRect(sx+11, sy+9, 1, 1);
    btx.fillRect(sx+7, sy+12, 1, 1);
  }else if(type === 3){
    // mist freckles
    btx.fillStyle = "rgba(255,214,255,0.08)";
    btx.fillRect(sx+6, sy+6, 2, 2);
  }
}

function drawFogParticle(p, camX, camY, front){
  const x = p.x - camX;
  const y = p.y - camY;
  const r = p.r;

  // pixelated soft blob by stacking rectangles
  const alpha = p.a * (front ? 1.2 : 0.9);
  btx.fillStyle = `rgba(255,255,255,${alpha})`;

  const rx = Math.max(10, Math.floor(r));
  const ry = Math.max(8, Math.floor(r * 0.62));

  // a few puffs
  btx.fillRect(Math.floor(x - rx), Math.floor(y - 3), rx*2, 6);
  btx.fillRect(Math.floor(x - rx*0.7), Math.floor(y - ry*0.4), Math.floor(rx*1.4), Math.floor(ry*0.8));
  btx.fillRect(Math.floor(x - rx*0.5), Math.floor(y - ry*0.65), Math.floor(rx*1.0), Math.floor(ry*0.45));
}

function drawDoor(door, camX, camY){
  const gx = Math.floor(door.x - camX);
  const gy = Math.floor(door.y - camY);

  const glow = door.glow || 0;
  const tier = door.tier;

  if(glow > 0.05){
    btx.fillStyle = tier === "special" ? palette.glowCyan : (tier === "rare" ? palette.glowGold : palette.glowPink);
    btx.fillRect(gx - 6, gy - 6, door.w + 12, door.h + 12);
  }

  const outer = tier === "special" ? palette.neonCyan : (tier === "rare" ? palette.gold : palette.neonLilac);
  const inner = tier === "special" ? "rgba(255,214,255,0.30)" : "rgba(162,210,255,0.32)";

  btx.fillStyle = outer;
  btx.fillRect(gx, gy, door.w, door.h);

  btx.fillStyle = inner;
  btx.fillRect(gx+2, gy+2, door.w-4, door.h-4);

  btx.fillStyle = "rgba(0,0,0,0.18)";
  btx.fillRect(gx+6, gy+7, door.w-12, door.h-13);

  btx.fillStyle = "rgba(255,255,255,0.78)";
  btx.fillRect(gx + door.w - 7, gy + Math.floor(door.h/2), 2, 2);

  const near = glow > 0.4;
  if(near && door.label){
    const text = String(door.label).slice(0, 18);
    btx.fillStyle = "rgba(0,0,0,0.34)";
    btx.fillRect(gx - 4, gy - 14, 8 + text.length * 6, 12);
    btx.fillStyle = "rgba(255,255,255,0.90)";
    btx.font = "10px monospace";
    btx.fillText(text, gx, gy - 5);
  }
}

function drawSnack(s, camX, camY){
  const x = Math.floor(s.x - camX);
  const y = Math.floor(s.y - camY);

  const blink = (Math.floor(animTime * 10) % 2) ? 1 : 0;

  if(s.kind === "spark"){
    btx.fillStyle = palette.gold;
    btx.fillRect(x-4, y-4, 8, 8);
    btx.fillStyle = "rgba(0,0,0,0.18)";
    btx.fillRect(x-2, y-2, 4, 4);
    btx.fillStyle = palette.neonPink;
    btx.fillRect(x-1+blink, y-6, 2, 2);
  }else{
    btx.fillStyle = palette.neonPink;
    btx.fillRect(x-3, y-3, 6, 6);
    btx.fillStyle = "rgba(162,210,255,0.90)";
    btx.fillRect(x-1, y-1, 2, 2);
  }
}

function drawEffects(camX, camY){
  for(const e of world.effects){
    const x = Math.floor(e.x - camX);
    const y = Math.floor(e.y - camY);

    let col = palette.neonPink;
    if(e.kind === "cyan") col = palette.neonCyan;
    if(e.kind === "gold") col = palette.gold;

    btx.fillStyle = col;
    btx.fillRect(x, y, 2, 2);
  }
}

function drawTrails(camX, camY){
  for(const t of world.trails){
    const x = Math.floor(t.x - camX);
    const y = Math.floor(t.y - camY);
    const a = clamp(t.life, 0, 1);
    btx.fillStyle = `rgba(255,214,255,${0.10 * a})`;
    btx.fillRect(x-6, y-2, 12, 4);
    btx.fillStyle = `rgba(122,252,255,${0.08 * a})`;
    btx.fillRect(x-3, y-1, 6, 2);
  }
}

function drawPlayerSprite(px, py, moving){
  // dreamy walker with soft scarf flutter
  const w = 18;
  const h = 22;
  const step = moving ? (Math.floor(animTime * 10) % 2) : 0;

  const x = Math.floor(px - w/2);
  const y = Math.floor(py - h + 2);

  // shadow
  btx.fillStyle = "rgba(0,0,0,0.18)";
  btx.fillRect(x+4, y+h-3, 10, 2);

  // scarf ribbon
  const sway = (Math.floor(animTime * 6) % 2) ? 1 : 0;
  btx.fillStyle = "rgba(255,214,255,0.75)";
  btx.fillRect(x+2, y+10, 4, 2);
  btx.fillRect(x-1, y+10+sway, 3, 1);

  // hair
  btx.fillStyle = "#8c4a23";
  btx.fillRect(x+3, y+1, 12, 7);
  btx.fillRect(x+2, y+3, 14, 6);

  // face
  btx.fillStyle = "#ffceb2";
  btx.fillRect(x+5, y+5, 8, 7);

  // eyes
  btx.fillStyle = "rgba(0,0,0,0.40)";
  btx.fillRect(x+7, y+8, 1, 1);
  btx.fillRect(x+11, y+8, 1, 1);

  // shirt
  btx.fillStyle = "#ffffff";
  btx.fillRect(x+5, y+12, 8, 5);

  // pants
  btx.fillStyle = "#a2d2ff";
  btx.fillRect(x+5, y+17, 8, 4);

  // feet
  btx.fillStyle = "rgba(0,0,0,0.18)";
  if(step){
    btx.fillRect(x+6, y+20, 3, 1);
    btx.fillRect(x+10, y+19, 3, 1);
  }else{
    btx.fillRect(x+6, y+19, 3, 1);
    btx.fillRect(x+10, y+20, 3, 1);
  }
}

function drawHUD(){
  btx.fillStyle = "rgba(0,0,0,0.30)";
  btx.fillRect(10, 10, 320, 34);

  btx.fillStyle = "rgba(255,255,255,0.92)";
  btx.font = "12px monospace";
  btx.fillText(`SCORE ${reward.score}  LIGHT ${reward.snack}`, 16, 26);

  btx.fillStyle = "rgba(255,255,255,0.70)";
  btx.font = "10px monospace";
  btx.fillText("E OR ENTER TO ENTER DOOR", 16, 40);
}

function drawEnterHintIfNear(){
  if(player.state !== "walk") return;

  const px = player.x;
  const py = player.y;
  let near = false;

  if(world.specialDoor){
    const gx = world.specialDoor.x + world.specialDoor.w*0.5;
    const gy = world.specialDoor.y + world.specialDoor.h*0.5;
    if(dist2(px,py,gx,gy) < 86*86) near = true;
  }

  if(!near){
    for(const d of world.doors){
      const gx = d.x + d.w*0.5;
      const gy = d.y + d.h*0.5;
      if(dist2(px,py,gx,gy) < 86*86){ near = true; break; }
    }
  }

  if(!near) return;

  btx.fillStyle = "rgba(0,0,0,0.26)";
  btx.fillRect(10, VH-32, 230, 22);
  btx.fillStyle = "rgba(255,255,255,0.90)";
  btx.font = "12px monospace";
  btx.fillText("PRESS E OR ENTER", 16, VH-16);
}

function drawFallOverlay(){
  if(player.state !== "fall") return;
  const a = clamp(player.fallT / 0.9, 0, 1);

  btx.fillStyle = `rgba(11,18,48,${0.28 * a})`;
  btx.fillRect(0,0,VW,VH);

  btx.fillStyle = `rgba(255,214,255,${0.25 * a})`;
  btx.font = "12px monospace";
  btx.fillText("FALLING THROUGH CLOUDS", 16, 56);
}

/* input */
const keys = new Set();
window.addEventListener("keydown", (e)=>{
  const k = e.key.toLowerCase();
  keys.add(k);
  if(["arrowup","arrowdown","arrowleft","arrowright"," ","enter"].includes(k)) e.preventDefault();
});
window.addEventListener("keyup", (e)=>{ keys.delete(e.key.toLowerCase()); });

/* quit button */
let quitBtn = document.getElementById("pixels-quit");
if(!quitBtn){
  quitBtn = document.createElement("button");
  quitBtn.id = "pixels-quit";
  quitBtn.textContent = "QUIT";
  canvas.parentElement.appendChild(quitBtn);
}
quitBtn.addEventListener("click", ()=>{
  stopGameToIntro();
});

/* loop */
function updateFog(dt, arr){
  for(const p of arr){
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if(p.x < -120) p.x = world.w + 120;
    if(p.x > world.w + 120) p.x = -120;
    if(p.y < -120) p.y = world.h + 120;
    if(p.y > world.h + 120) p.y = -120;
  }
}

function update(dt){
  animTime += dt;

  updateFog(dt, world.fogBack);
  updateFog(dt, world.fogFront);

  // fade trails
  for(const t of world.trails){
    t.life -= dt * 0.7;
  }
  world.trails = world.trails.filter(t => t.life > 0);

  // fall state
  if(player.state === "fall"){
    player.fallT += dt;

    // spiral pull
    for(let i=0; i<4; i++){
      world.effects.push({
        x: player.x + (Math.random()*2 - 1) * 10,
        y: player.y + (Math.random()*2 - 1) * 10,
        vx: (Math.random()*2 - 1) * 70,
        vy: (Math.random()*2 - 1) * 70,
        life: 0.55 + Math.random()*0.4,
        kind: Math.random() < 0.5 ? "cyan" : "pink"
      });
    }

    if(player.fallT >= 1.0){
      respawnOnAnotherIsland();
    }
    return;
  }

  // movement
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

  const nx = clamp(player.x + player.vx * dt, 0, world.w);
  const ny = clamp(player.y + player.vy * dt, 0, world.h);
  player.x = nx;
  player.y = ny;

  // falling check
  if(shouldFall(player.x, player.y)){
    startFalling();
  }else{
    // add trail occasionally when walking
    const moving = Math.hypot(player.vx, player.vy) > 18;
    if(moving && (Math.floor(animTime * 14) % 2 === 0)){
      addTrail(player.x, player.y);
    }
  }

  if(keys.has("e") || keys.has("enter")){
    keys.delete("e");
    keys.delete("enter");
    tryEnter();
  }

  if(world.specialCooldown > 0) world.specialCooldown = Math.max(0, world.specialCooldown - dt);

  for(const d of world.doors){
    const gx = d.x + d.w*0.5;
    const gy = d.y + d.h*0.5;
    const near = dist2(player.x, player.y, gx, gy) < 86*86;
    d.glow += ((near ? 1 : 0) - d.glow) * dt * 8;
    d.glow = clamp(d.glow, 0, 1);
  }

  if(world.specialDoor){
    const gx = world.specialDoor.x + world.specialDoor.w*0.5;
    const gy = world.specialDoor.y + world.specialDoor.h*0.5;
    const near = dist2(player.x, player.y, gx, gy) < 102*102;
    world.specialDoor.glow += ((near ? 1 : 0) - world.specialDoor.glow) * dt * 8;
    world.specialDoor.glow = clamp(world.specialDoor.glow, 0, 1);

    world.specialDoor.openTime -= dt;
    if(world.specialDoor.openTime <= 0){
      world.specialDoor = null;
      world.specialCooldown = 12;
    }
  }

  if(world.snacks.length < 16 && Math.random() < dt * 1.0) spawnSnack();

  for(const s of world.snacks){
    s.t += dt;
    if(dist2(player.x, player.y, s.x, s.y) < 20*20){
      reward.snack += 1;
      reward.score += (s.kind === "spark" ? 18 : 10);
      burstItems(s.x, s.y);
      s.x = -9999;
      s.y = -9999;
    }
  }
  world.snacks = world.snacks.filter(s => s.x > -1000);

  for(const e of world.effects){
    e.life -= dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vx *= Math.pow(0.88, dt * 60);
    e.vy *= Math.pow(0.88, dt * 60);
  }
  world.effects = world.effects.filter(e => e.life > 0);

  maybeSpawnSpecialDoor();
}

function render(){
  // camera with gentle float
  const targetX = clamp(Math.floor(player.x - VW/2), 0, world.w - VW);
  const targetY = clamp(Math.floor(player.y - VH/2), 0, world.h - VH);

  // simple camera smoothing
  if(!render.camX && render.camX !== 0){
    render.camX = targetX;
    render.camY = targetY;
  }
  render.camX += (targetX - render.camX) * 0.10;
  render.camY += (targetY - render.camY) * 0.10;

  const camX = Math.floor(render.camX);
  const camY = Math.floor(render.camY);

  btx.clearRect(0,0,VW,VH);

  // draw sky base
  btx.fillStyle = palette.sky1;
  btx.fillRect(0,0,VW,VH);

  // fog back
  for(const p of world.fogBack) drawFogParticle(p, camX, camY, false);

  // tiles
  const startTX = Math.floor(camX / TILE);
  const startTY = Math.floor(camY / TILE);
  const endTX = startTX + Math.ceil(VW / TILE) + 2;
  const endTY = startTY + Math.ceil(VH / TILE) + 2;

  for(let ty=startTY; ty<endTY; ty++){
    for(let tx=startTX; tx<endTX; tx++){
      if(tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) continue;
      const type = map[ty*mapW + tx];
      const sx = (tx*TILE) - camX;
      const sy = (ty*TILE) - camY;
      drawTile(sx, sy, tx, ty, type);
    }
  }

  // trails under player
  drawTrails(camX, camY);

  // collectibles and doors
  for(const s of world.snacks) drawSnack(s, camX, camY);
  for(const d of world.doors) drawDoor(d, camX, camY);
  if(world.specialDoor) drawDoor(world.specialDoor, camX, camY);

  drawEffects(camX, camY);

  // fog front
  for(const p of world.fogFront) drawFogParticle(p, camX, camY, true);

  // player centered
  const moving = player.state === "walk" && (Math.hypot(player.vx, player.vy) > 10);
  drawPlayerSprite(Math.floor(VW/2), Math.floor(VH/2), moving);

  drawHUD();
  drawEnterHintIfNear();
  drawFallOverlay();

  // present scaled
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const scale = Math.max(canvas.width / VW, canvas.height / VH);
  const drawW = VW * scale;
  const drawH = VH * scale;

  const dx = Math.floor((canvas.width - drawW) / 2);
  const dy = Math.floor((canvas.height - drawH) / 2);

  ctx.imageSmoothingEnabled = false;
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

/* start and stop */
async function startGame(){
  const doorsCfg = await loadDoorsConfig();

  reward.score = 0;
  reward.snack = 0;

  world.snacks = [];
  world.effects = [];
  world.trails = [];
  world.specialDoor = null;
  world.specialCooldown = 0;

  buildCloudWorld();

  world.fogBack = makeFogLayer(16, 0.2);
  world.fogFront = makeFogLayer(12, 0.6);

  buildDoorsFromConfig(doorsCfg);

  // spawn on a cloud island
  const spawn = pickRandom(world.spawns.length ? world.spawns : [pickSpawnFromCloud()]);
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = "down";
  player.state = "walk";
  player.fallT = 0;

  for(let i=0; i<10; i++) spawnSnack();

  introUi.style.display = "none";
  quitBtn.style.display = "block";

  running = true;
  lastTime = 0;
  animTime = 0;
  render.camX = undefined;
  render.camY = undefined;

  requestAnimationFrame(loop);
}

function stopGameToIntro(){
  running = false;
  quitBtn.style.display = "none";
  introUi.style.display = "grid";
}

if(archiveBtn) archiveBtn.addEventListener("click", ()=>{ location.href = "/archive/"; });
if(commissionBtn) commissionBtn.addEventListener("click", ()=>{ location.href = "/commission/"; });

if(playBtn){
  playBtn.addEventListener("click", async ()=>{
    try{
      await startGame();
    }catch(err){
      console.error(err);
      alert(err?.message || String(err));
    }
  });
}
