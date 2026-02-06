const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");
const commissionBtn = document.getElementById("btn-commission");
const introUi = document.getElementById("pixel-intro-ui");

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: true });

/* internal resolution for more detail */
const VW = 640;
const VH = 360;

const buffer = document.createElement("canvas");
buffer.width = VW;
buffer.height = VH;
const btx = buffer.getContext("2d");
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

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function pickRandom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function dist2(ax,ay,bx,by){ const dx=ax-bx; const dy=ay-by; return dx*dx+dy*dy; }

async function loadJson(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error("fetch failed " + path);
  return await res.json();
}

/* special links live in js */
const SPECIAL_LINKS = [
  { href: "/archive/works/hidden-room-01/", title: "Secret 01" },
  { href: "/archive/works/hidden-room-02/", title: "Secret 02" }
];

/* palette */
const palette = {
  void: "#0b1224",
  floorA: "#cfe0ff",
  floorB: "#bcd3ff",
  floorC: "#dbe7ff",
  wallA: "#7f8eff",
  wallB: "#6b78ea",
  wallC: "#5864d8",
  neonPink: "rgba(255,119,233,0.90)",
  neonCyan: "rgba(122,252,255,0.92)",
  neonLilac: "rgba(255,214,255,0.86)",
  gold: "rgba(255,224,102,0.92)",
  glowPink: "rgba(255,119,233,0.18)",
  glowCyan: "rgba(122,252,255,0.18)",
  glowGold: "rgba(255,224,102,0.18)"
};

/* tile map */
const TILE = 16;
const mapW = 140;
const mapH = 90;
const map = new Array(mapW * mapH).fill(0);
/*
0 floor
1 wall
2 detail
3 sparkle
*/

function setTile(x,y,v){
  if(x < 0 || y < 0 || x >= mapW || y >= mapH) return;
  map[y*mapW + x] = v;
}
function getTile(x,y){
  if(x < 0 || y < 0 || x >= mapW || y >= mapH) return 1;
  return map[y*mapW + x];
}
function isWallTile(tx,ty){ return getTile(tx,ty) === 1; }
function isFloorTile(tx,ty){ return getTile(tx,ty) !== 1; }

/* new map generation: roads first, blocks second, always navigable */
function buildTileMap(){
  map.fill(1);

  /* carve main roads */
  const roadXs = [12, 34, 56, 78, 100, 122];
  const roadYs = [10, 26, 42, 58, 74];

  for(const x of roadXs){
    for(let y=2; y<mapH-2; y++){
      setTile(x, y, 0);
      setTile(x+1, y, 0);
      setTile(x-1, y, 0);
    }
  }

  for(const y of roadYs){
    for(let x=2; x<mapW-2; x++){
      setTile(x, y, 0);
      setTile(x, y+1, 0);
      setTile(x, y-1, 0);
    }
  }

  /* open up neighborhoods around intersections */
  for(const x of roadXs){
    for(const y of roadYs){
      for(let oy=-3; oy<=3; oy++){
        for(let ox=-3; ox<=3; ox++){
          if(Math.abs(ox) + Math.abs(oy) <= 5) setTile(x+ox, y+oy, 0);
        }
      }
    }
  }

  /* carve random alleys connecting roads */
  for(let i=0; i<18; i++){
    const x = roadXs[Math.floor(Math.random()*roadXs.length)] + (Math.random() < 0.5 ? -8 : 8);
    const y0 = 4 + Math.floor(Math.random() * (mapH-8));
    for(let t=0; t<10 + Math.floor(Math.random()*22); t++){
      const y = clamp(y0 + t, 2, mapH-3);
      setTile(x, y, 0);
      if(Math.random() < 0.35) setTile(x+1, y, 0);
    }
  }

  /* add details on floor */
  for(let i=0; i<420; i++){
    const x = 2 + Math.floor(Math.random() * (mapW-4));
    const y = 2 + Math.floor(Math.random() * (mapH-4));
    if(getTile(x,y) !== 0) continue;
    if(Math.random() < 0.35) setTile(x,y,2);
    if(Math.random() < 0.08) setTile(x,y,3);
  }

  /* keep borders walls */
  for(let x=0; x<mapW; x++){
    setTile(x,0,1);
    setTile(x,mapH-1,1);
  }
  for(let y=0; y<mapH; y++){
    setTile(0,y,1);
    setTile(mapW-1,y,1);
  }
}

/* world */
const world = {
  w: mapW * TILE,
  h: mapH * TILE,
  doors: [],
  snacks: [],
  effects: [],
  specialDoor: null,
  specialCooldown: 0,
  callTicketFound: false
};

const player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  r: 10,
  speed: 640,
  friction: 0.84,
  facing: "down"
};

const reward = { score: 0, snack: 0 };

/* collision */
function isWallAt(px, py){
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  return isWallTile(tx,ty);
}

function resolveTileCollision(nx, ny){
  let x = nx;
  let y = ny;

  for(let i=0; i<10; i++){
    const corners = [
      { x: x - player.r, y: y - player.r },
      { x: x + player.r, y: y - player.r },
      { x: x - player.r, y: y + player.r },
      { x: x + player.r, y: y + player.r }
    ];
    let hit = false;
    for(const c of corners){
      if(isWallAt(c.x, c.y)){ hit = true; break; }
    }
    if(!hit) break;

    const pushX = player.vx === 0 ? 0 : (player.vx > 0 ? -1 : 1);
    const pushY = player.vy === 0 ? 0 : (player.vy > 0 ? -1 : 1);
    x += pushX * 2.0;
    y += pushY * 2.0;
  }

  return { x, y };
}

/* doors and pools */
async function loadPools(){
  let artworks = [];
  let commission = [];
  let doorCfg = [];

  try{
    const a = await loadJson("./artworks.json");
    if(Array.isArray(a)) artworks = a.filter(it => it && typeof it.href === "string")
      .map(it => ({ href: it.href, title: it.title || "Artwork" }));
  }catch(e){ console.warn(e); }

  try{
    const c = await loadJson("./commission.json");
    if(Array.isArray(c)) commission = c.filter(it => it && typeof it.href === "string")
      .map(it => ({ href: it.href, title: it.title || "Commission" }));
  }catch(e){ console.warn(e); }

  try{
    const d = await loadJson("./doors.json");
    if(Array.isArray(d)) doorCfg = d;
  }catch(e){ console.warn(e); }

  return { artworks, commission, doorCfg };
}

function buildDoors(linkPool){
  world.doors = [];
  const doorCount = 26 + Math.floor(Math.random()*10);

  let tries = 0;
  while(world.doors.length < doorCount && tries < 12000){
    tries++;
    const tx = 2 + Math.floor(Math.random()*(mapW-4));
    const ty = 2 + Math.floor(Math.random()*(mapH-4));
    if(!isFloorTile(tx,ty)) continue;

    const wx = tx*TILE + 3;
    const wy = ty*TILE + 2;

    let ok = true;
    for(const d of world.doors){
      if(dist2(wx,wy,d.x,d.y) < 160*160){ ok = false; break; }
    }
    if(!ok) continue;

    const pick = linkPool.length ? pickRandom(linkPool) : { href: "/archive/", title: "Door" };
    const rare = Math.random() < 0.18;

    world.doors.push({
      x: wx,
      y: wy,
      w: 28,
      h: 36,
      href: pick.href,
      title: pick.title || "Door",
      glow: 0,
      tier: rare ? "rare" : "normal"
    });
  }
}

/* snacks */
function spawnSnack(){
  const tx = 2 + Math.floor(Math.random()*(mapW-4));
  const ty = 2 + Math.floor(Math.random()*(mapH-4));
  if(!isFloorTile(tx,ty)) return;

  world.snacks.push({
    x: tx*TILE + 8,
    y: ty*TILE + 8,
    kind: Math.random() < 0.01 ? "call" : "snack",
    t: 0
  });
}

/* effects */
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

/* special door */
function maybeSpawnSpecialDoor(){
  if(world.specialDoor) return;
  if(world.specialCooldown > 0) return;
  if(reward.score < 120) return;

  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);

  const candidates = [];
  for(let i=0; i<24; i++){
    const ox = Math.floor(Math.random()*16 - 8);
    const oy = Math.floor(Math.random()*16 - 8);
    const cx = clamp(tx + ox, 3, mapW-4);
    const cy = clamp(ty + oy, 3, mapH-4);
    if(isFloorTile(cx,cy)) candidates.push({ x: cx, y: cy });
  }

  const place = candidates.length ? pickRandom(candidates) : { x: clamp(tx+4, 3, mapW-4), y: clamp(ty-4, 3, mapH-4) };

  world.specialDoor = {
    x: place.x*TILE + 3,
    y: place.y*TILE + 2,
    w: 30,
    h: 40,
    glow: 1,
    tier: "special",
    openTime: 14
  };

  burstItems(world.specialDoor.x + 10, world.specialDoor.y + 10);
}

/* enter */
function tryEnter(){
  const px = player.x;
  const py = player.y;

  if(world.specialDoor){
    const gx = world.specialDoor.x + world.specialDoor.w*0.5;
    const gy = world.specialDoor.y + world.specialDoor.h*0.5;
    if(dist2(px,py,gx,gy) < 54*54){
      /* special door means bonus room */
      spawnBonusBurst(px,py);
      world.specialDoor = null;
      world.specialCooldown = 12;
      return;
    }
  }

  for(const d of world.doors){
    const gx = d.x + d.w*0.5;
    const gy = d.y + d.h*0.5;
    if(dist2(px,py,gx,gy) < 54*54){
      location.href = d.href;
      return;
    }
  }
}

function spawnBonusBurst(x,y){
  /* shower snacks */
  for(let i=0; i<26; i++){
    const a = Math.random() * Math.PI * 2;
    const r = 10 + Math.random()*90;
    world.snacks.push({
      x: clamp(x + Math.cos(a)*r, 24, world.w-24),
      y: clamp(y + Math.sin(a)*r, 24, world.h-24),
      kind: Math.random() < 0.06 ? "call" : "snack",
      t: 0
    });
  }
  reward.score += 60;
  burstItems(x,y);
}

/* drawing */
let running = false;
let lastTime = 0;
let animTime = 0;

function drawTile(sx, sy, tx, ty, type){
  if(type === 0){
    const v = (tx*7 + ty*11) % 3;
    const c = v === 0 ? palette.floorA : (v === 1 ? palette.floorB : palette.floorC);
    btx.fillStyle = c;
    btx.fillRect(sx, sy, TILE, TILE);

    /* tiny dithering */
    if(((tx*9 + ty*5) % 13) === 0){
      btx.fillStyle = "rgba(255,255,255,0.10)";
      btx.fillRect(sx+3, sy+4, 1, 1);
      btx.fillRect(sx+11, sy+10, 1, 1);
    }
    return;
  }

  if(type === 1){
    btx.fillStyle = palette.wallA;
    btx.fillRect(sx, sy, TILE, TILE);

    btx.fillStyle = palette.wallB;
    btx.fillRect(sx, sy, TILE, 4);
    btx.fillRect(sx, sy, 4, TILE);

    btx.fillStyle = palette.wallC;
    btx.fillRect(sx+1, sy+1, TILE-2, 1);

    btx.fillStyle = "rgba(255,255,255,0.12)";
    btx.fillRect(sx+6, sy+6, 2, 2);

    btx.fillStyle = "rgba(0,0,0,0.10)";
    btx.fillRect(sx+10, sy+10, 4, 4);
    return;
  }

  if(type === 2){
    btx.fillStyle = "rgba(162,210,255,0.14)";
    btx.fillRect(sx+6, sy+6, 2, 2);
    return;
  }

  if(type === 3){
    btx.fillStyle = "rgba(255,214,255,0.12)";
    btx.fillRect(sx+2, sy+2, TILE-4, 1);
    btx.fillRect(sx+2, sy+TILE-3, TILE-4, 1);
  }
}

function drawDoor(door, camX, camY){
  const gx = Math.floor(door.x - camX);
  const gy = Math.floor(door.y - camY);

  const glow = door.glow || 0;
  const tier = door.tier;

  if(glow > 0.05){
    btx.fillStyle = tier === "special" ? palette.glowCyan : (tier === "rare" ? palette.glowGold : palette.glowPink);
    btx.fillRect(gx - 5, gy - 5, door.w + 10, door.h + 10);
  }

  const outer = tier === "special" ? palette.neonCyan : (tier === "rare" ? palette.gold : palette.neonLilac);
  const inner = tier === "special" ? "rgba(255,214,255,0.30)" : "rgba(162,210,255,0.34)";

  btx.fillStyle = outer;
  btx.fillRect(gx, gy, door.w, door.h);

  btx.fillStyle = inner;
  btx.fillRect(gx+2, gy+2, door.w-4, door.h-4);

  btx.fillStyle = "rgba(0,0,0,0.18)";
  btx.fillRect(gx+6, gy+7, door.w-12, door.h-13);

  btx.fillStyle = "rgba(255,255,255,0.78)";
  btx.fillRect(gx + door.w - 7, gy + Math.floor(door.h/2), 2, 2);
}

function drawSnack(s, camX, camY){
  const x = Math.floor(s.x - camX);
  const y = Math.floor(s.y - camY);

  const blink = (Math.floor(animTime * 10) % 2) ? 1 : 0;

  if(s.kind === "call"){
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
    btx.fillStyle = e.kind === "gold" ? palette.gold : palette.neonPink;
    btx.fillRect(x, y, 2, 2);
  }
}

function drawPlayerSprite(px, py, facing, moving){
  const w = 18;
  const h = 22;
  const step = moving ? (Math.floor(animTime * 10) % 2) : 0;

  const x = Math.floor(px - w/2);
  const y = Math.floor(py - h + 2);

  btx.fillStyle = "rgba(0,0,0,0.22)";
  btx.fillRect(x+4, y+h-3, 10, 2);

  const flap = step ? 1 : 0;

  btx.fillStyle = "rgba(255,119,233,0.86)";
  btx.fillRect(x-4, y+8-flap, 6, 8);
  btx.fillRect(x+w-2, y+8+flap, 6, 8);

  btx.fillStyle = "rgba(162,210,255,0.86)";
  btx.fillRect(x-2, y+10-flap, 3, 5);
  btx.fillRect(x+w, y+10+flap, 3, 5);

  btx.fillStyle = "#8c4a23";
  btx.fillRect(x+3, y+1, 12, 7);
  btx.fillRect(x+2, y+3, 14, 6);

  btx.fillStyle = "#ffceb2";
  btx.fillRect(x+5, y+5, 8, 7);

  btx.fillStyle = "#ffffff";
  btx.fillRect(x+5, y+12, 8, 5);

  btx.fillStyle = "#a2d2ff";
  btx.fillRect(x+5, y+17, 8, 4);

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
  btx.fillStyle = "rgba(0,0,0,0.34)";
  btx.fillRect(10, 10, 260, 34);

  btx.fillStyle = "rgba(255,255,255,0.92)";
  btx.font = "12px monospace";
  btx.fillText(`SCORE ${reward.score}  SNACK ${reward.snack}`, 16, 26);

  btx.fillStyle = "rgba(255,255,255,0.70)";
  btx.font = "10px monospace";
  btx.fillText("E OR ENTER TO ENTER DOOR", 16, 40);
}

function drawEnterHintIfNear(){
  const px = player.x;
  const py = player.y;
  let near = false;

  if(world.specialDoor){
    const gx = world.specialDoor.x + world.specialDoor.w*0.5;
    const gy = world.specialDoor.y + world.specialDoor.h*0.5;
    if(dist2(px,py,gx,gy) < 78*78) near = true;
  }

  if(!near){
    for(const d of world.doors){
      const gx = d.x + d.w*0.5;
      const gy = d.y + d.h*0.5;
      if(dist2(px,py,gx,gy) < 78*78){ near = true; break; }
    }
  }

  if(!near) return;

  btx.fillStyle = "rgba(0,0,0,0.30)";
  btx.fillRect(10, VH-32, 210, 22);
  btx.fillStyle = "rgba(255,255,255,0.90)";
  btx.font = "12px monospace";
  btx.fillText("PRESS E OR ENTER", 16, VH-16);
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

  if(keys.has("e") || keys.has("enter")){
    keys.delete("e");
    keys.delete("enter");
    tryEnter();
  }

  if(world.specialCooldown > 0) world.specialCooldown = Math.max(0, world.specialCooldown - dt);

  for(const d of world.doors){
    const gx = d.x + d.w*0.5;
    const gy = d.y + d.h*0.5;
    const near = dist2(player.x, player.y, gx, gy) < 72*72;
    d.glow += ((near ? 1 : 0) - d.glow) * dt * 8;
    d.glow = clamp(d.glow, 0, 1);
  }

  if(world.specialDoor){
    const gx = world.specialDoor.x + world.specialDoor.w*0.5;
    const gy = world.specialDoor.y + world.specialDoor.h*0.5;
    const near = dist2(player.x, player.y, gx, gy) < 92*92;
    world.specialDoor.glow += ((near ? 1 : 0) - world.specialDoor.glow) * dt * 8;
    world.specialDoor.glow = clamp(world.specialDoor.glow, 0, 1);

    world.specialDoor.openTime -= dt;
    if(world.specialDoor.openTime <= 0){
      world.specialDoor = null;
      world.specialCooldown = 12;
    }
  }

  if(world.snacks.length < 14 && Math.random() < dt * 1.1) spawnSnack();

  for(const s of world.snacks){
    s.t += dt;
    if(dist2(player.x, player.y, s.x, s.y) < 20*20){
      if(s.kind === "call"){
        world.callTicketFound = true;
        reward.score += 90;
        burstItems(s.x, s.y);
      }else{
        reward.snack += 1;
        reward.score += 10;
      }
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
  const camX = clamp(Math.floor(player.x - VW/2), 0, world.w - VW);
  const camY = clamp(Math.floor(player.y - VH/2), 0, world.h - VH);

  btx.clearRect(0,0,VW,VH);
  btx.fillStyle = palette.void;
  btx.fillRect(0,0,VW,VH);

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

  for(const s of world.snacks) drawSnack(s, camX, camY);
  for(const d of world.doors) drawDoor(d, camX, camY);
  if(world.specialDoor) drawDoor(world.specialDoor, camX, camY);
  drawEffects(camX, camY);

  const moving = Math.hypot(player.vx, player.vy) > 6;
  drawPlayerSprite(Math.floor(VW/2), Math.floor(VH/2), player.facing, moving);

  drawHUD();
  drawEnterHintIfNear();

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
  const { artworks, commission, doorCfg } = await loadPools();

  const fixedDoors = [];
  const randomSources = { artworks, commission };

  for(const d of doorCfg){
    if(d.type === "fixed" && d.to){
      fixedDoors.push({ href: d.to, title: d.label || "Door" });
    }
  }

  let randomPool = [];
  const randomDef = doorCfg.find(d => d.type === "random");
  if(randomDef && Array.isArray(randomDef.sources)){
    for(const s of randomDef.sources){
      const arr = randomSources[s] || [];
      randomPool = randomPool.concat(arr);
    }
  }

  const linkPool = fixedDoors.concat(randomPool);
  if(!linkPool.length) linkPool.push({ href: "/archive/", title: "Archive" });

  reward.score = 0;
  reward.snack = 0;

  world.snacks = [];
  world.effects = [];
  world.specialDoor = null;
  world.specialCooldown = 0;
  world.callTicketFound = false;

  buildTileMap();
  buildDoors(linkPool);

  /* place player on a road for sure */
  player.x = 34 * TILE;
  player.y = 42 * TILE;
  player.vx = 0;
  player.vy = 0;
  player.facing = "down";

  for(let i=0; i<8; i++) spawnSnack();

  introUi.style.display = "none";
  quitBtn.style.display = "block";

  running = true;
  lastTime = 0;
  animTime = 0;
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
  playBtn.addEventListener("click", ()=>{ startGame(); });
}
