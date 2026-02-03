// Pixel Playground topdown mini game
// Put artworks.json at /archive/artworks.json
// Controls: WASD or arrow keys, E or Enter to enter gate

const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");
const commissionBtn = document.getElementById("btn-commission");

const introUi = document.getElementById("pixel-intro-ui");
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", () => {
  resizeCanvas();
});
resizeCanvas();

if (archiveBtn) {
  archiveBtn.addEventListener("click", () => {
    location.href = "/archive/";
  });
}

if (commissionBtn) {
  commissionBtn.addEventListener("click", () => {
    location.href = "/commission/";
  });
}

let running = false;

if (playBtn) {
  playBtn.addEventListener("click", async () => {
    if (introUi) introUi.style.display = "none";
    await startGame();
  });
}

async function loadArtworks() {
  try {
    const res = await fetch("./artworks.json", { cache: "no-store" });
    if (!res.ok) throw new Error("artworks.json fetch failed");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("artworks.json is not an array");
    return data.filter((a) => a && typeof a.href === "string" && a.href.length > 1);
  } catch (e) {
    console.warn(e);
    return [];
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

const keys = new Set();
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter"].includes(k)) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

const world = {
  w: 1600,
  h: 1100,
  tile: 16,
  solids: [],
  gates: [],
  butterflies: [],
  portal: null,
  hiddenGateSpawned: false,
  teleportZones: [],
  breakTiles: []
};

const player = {
  x: world.w * 0.5,
  y: world.h * 0.6,
  r: 10,
  vx: 0,
  vy: 0,
  speed: 520,
  friction: 0.84,
  facing: "down"
};

let artworks = [];
let lastTime = 0;

function makeRect(x, y, w, h) {
  return { x, y, w, h };
}

function rectContains(r, px, py) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function circleRectCollide(cx, cy, cr, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  return dist2(cx, cy, nx, ny) <= cr * cr;
}

function resolveCollisions(nx, ny) {
  let x = nx;
  let y = ny;

  for (const s of world.solids) {
    if (!circleRectCollide(x, y, player.r, s)) continue;

    const leftDist = Math.abs((x + player.r) - s.x);
    const rightDist = Math.abs((s.x + s.w) - (x - player.r));
    const topDist = Math.abs((y + player.r) - s.y);
    const bottomDist = Math.abs((s.y + s.h) - (y - player.r));

    const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

    if (minDist === leftDist) x = s.x - player.r;
    else if (minDist === rightDist) x = s.x + s.w + player.r;
    else if (minDist === topDist) y = s.y - player.r;
    else y = s.y + s.h + player.r;
  }

  return { x, y };
}

function buildWorld() {
  world.solids = [];
  world.gates = [];
  world.butterflies = [];
  world.portal = null;
  world.hiddenGateSpawned = false;
  world.teleportZones = [];
  world.breakTiles = [];

  // Borders
  world.solids.push(makeRect(0, 0, world.w, 20));
  world.solids.push(makeRect(0, world.h - 20, world.w, 20));
  world.solids.push(makeRect(0, 0, 20, world.h));
  world.solids.push(makeRect(world.w - 20, 0, 20, world.h));

  // Some walls for paths
  world.solids.push(makeRect(280, 140, 40, 520));
  world.solids.push(makeRect(520, 320, 520, 40));
  world.solids.push(makeRect(1040, 180, 40, 560));
  world.solids.push(makeRect(640, 720, 520, 40));

  // Teleport zones
  world.teleportZones.push({
    rect: makeRect(120, 860, 120, 120),
    target: { x: 1340, y: 220 }
  });
  world.teleportZones.push({
    rect: makeRect(1380, 860, 120, 120),
    target: { x: 260, y: 220 }
  });

  // Break tiles area (bridge)
  world.breakTiles.push(makeRect(760, 520, 80, 60));

  // Gates
  const gateCount = 10 + Math.floor(Math.random() * 3);
  const gateSpots = [
    { x: 160, y: 220 },
    { x: 220, y: 560 },
    { x: 420, y: 220 },
    { x: 620, y: 180 },
    { x: 900, y: 220 },
    { x: 1220, y: 260 },
    { x: 1360, y: 520 },
    { x: 1160, y: 860 },
    { x: 540, y: 860 },
    { x: 300, y: 880 },
    { x: 920, y: 880 },
    { x: 1420, y: 220 }
  ];

  const shuffled = gateSpots.sort(() => Math.random() - 0.5).slice(0, gateCount);
  for (let i = 0; i < shuffled.length; i++) {
    const a = artworks.length ? pickRandom(artworks) : null;
    world.gates.push({
      x: shuffled[i].x,
      y: shuffled[i].y,
      w: 26,
      h: 34,
      href: a ? a.href : "/archive/",
      title: a ? a.title : "Archive Gate",
      glow: 0
    });
  }
}

function spawnButterfly() {
  const b = {
    x: 200 + Math.random() * (world.w - 400),
    y: 200 + Math.random() * (world.h - 400),
    r: 8,
    vx: (Math.random() * 2 - 1) * 80,
    vy: (Math.random() * 2 - 1) * 80,
    t: 0
  };
  world.butterflies.push(b);
}

function maybeSpawnPortal(dt) {
  if (world.portal) {
    world.portal.time -= dt;
    if (world.portal.time <= 0) world.portal = null;
    return;
  }
  // small chance to spawn
  if (Math.random() < dt * 0.03) {
    const a = artworks.length ? pickRandom(artworks) : null;
    world.portal = {
      x: 240 + Math.random() * (world.w - 480),
      y: 240 + Math.random() * (world.h - 480),
      r: 14,
      time: 8,
      href: a ? a.href : "/archive/",
      title: a ? a.title : "Random Portal"
    };
  }
}

function tryEnterGate() {
  const px = player.x;
  const py = player.y;

  for (const g of world.gates) {
    const gx = g.x + g.w * 0.5;
    const gy = g.y + g.h * 0.5;
    if (dist2(px, py, gx, gy) < 44 * 44) {
      location.href = g.href;
      return;
    }
  }

  if (world.portal) {
    if (dist2(px, py, world.portal.x, world.portal.y) < 46 * 46) {
      location.href = world.portal.href;
    }
  }
}

function update(dt) {
  // movement intent
  let ix = 0;
  let iy = 0;

  if (keys.has("w") || keys.has("arrowup")) iy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) iy += 1;
  if (keys.has("a") || keys.has("arrowleft")) ix -= 1;
  if (keys.has("d") || keys.has("arrowright")) ix += 1;

  if (ix !== 0 || iy !== 0) {
    const len = Math.hypot(ix, iy) || 1;
    ix /= len;
    iy /= len;

    player.vx += ix * player.speed * dt;
    player.vy += iy * player.speed * dt;

    if (Math.abs(ix) > Math.abs(iy)) player.facing = ix > 0 ? "right" : "left";
    else player.facing = iy > 0 ? "down" : "up";
  }

  // friction
  player.vx *= Math.pow(player.friction, dt * 60);
  player.vy *= Math.pow(player.friction, dt * 60);

  // move and collide
  const nx = clamp(player.x + player.vx * dt, 40, world.w - 40);
  const ny = clamp(player.y + player.vy * dt, 40, world.h - 40);
  const resolved = resolveCollisions(nx, ny);
  player.x = resolved.x;
  player.y = resolved.y;

  // enter gate
  const enterPressed = keys.has("e") || keys.has("enter");
  if (enterPressed) {
    keys.delete("e");
    keys.delete("enter");
    tryEnterGate();
  }

  // gates glow
  for (const g of world.gates) {
    const gx = g.x + g.w * 0.5;
    const gy = g.y + g.h * 0.5;
    const near = dist2(player.x, player.y, gx, gy) < 52 * 52;
    g.glow += (near ? 1 : 0 - g.glow) * dt * 8;
    g.glow = clamp(g.glow, 0, 1);
  }

  // butterflies
  for (const b of world.butterflies) {
    b.t += dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x < 80 || b.x > world.w - 80) b.vx *= -1;
    if (b.y < 80 || b.y > world.h - 80) b.vy *= -1;

    // slight wobble
    b.vx += Math.sin(b.t * 3.1) * dt * 30;
    b.vy += Math.cos(b.t * 2.6) * dt * 30;

    // catch
    if (dist2(player.x, player.y, b.x, b.y) < 22 * 22) {
      // spawn one hidden gate
      if (!world.hiddenGateSpawned) {
        world.hiddenGateSpawned = true;
        const a = artworks.length ? pickRandom(artworks) : null;
        world.gates.push({
          x: 860,
          y: 120,
          w: 26,
          h: 34,
          href: a ? a.href : "/archive/",
          title: a ? a.title : "Hidden Gate",
          glow: 1
        });
      }
      b.x = -9999;
      b.y = -9999;
    }
  }
  world.butterflies = world.butterflies.filter((b) => b.x > -1000);

  // teleport zones
  for (const tz of world.teleportZones) {
    if (rectContains(tz.rect, player.x, player.y)) {
      player.x = tz.target.x;
      player.y = tz.target.y;
      player.vx *= 0.2;
      player.vy *= 0.2;
    }
  }

  // break tiles event
  for (const br of world.breakTiles) {
    if (rectContains(br, player.x, player.y)) {
      // instant drop to another spot
      player.x = 1180;
      player.y = 520;
      player.vx = 0;
      player.vy = 0;
    }
  }

  // portal spawn
  maybeSpawnPortal(dt);

  // butterfly spawn sometimes
  if (world.butterflies.length < 1 && Math.random() < dt * 0.25) {
    spawnButterfly();
  }
}

function drawPixelText(text, x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `${Math.floor(12 * dpr)}px monospace`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function render() {
  const w = canvas.width;
  const h = canvas.height;

  // camera follows player
  const camX = clamp(player.x - (w / dpr) * 0.5, 0, world.w - (w / dpr));
  const camY = clamp(player.y - (h / dpr) * 0.5, 0, world.h - (h / dpr));

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w / dpr, h / dpr);

  // background
  ctx.fillStyle = "#0b1224";
  ctx.fillRect(0, 0, w / dpr, h / dpr);

  // world base
  ctx.translate(-camX, -camY);

  // grass
  ctx.fillStyle = "#182a3a";
  ctx.fillRect(0, 0, world.w, world.h);
  ctx.fillStyle = "rgba(154,255,220,0.08)";
  for (let i = 0; i < 1200; i++) {
    const gx = (i * 37) % world.w;
    const gy = (i * 91) % world.h;
    ctx.fillRect(gx, gy, 2, 2);
  }

  // teleport pools
  for (const tz of world.teleportZones) {
    ctx.fillStyle = "rgba(155,246,255,0.18)";
    ctx.fillRect(tz.rect.x, tz.rect.y, tz.rect.w, tz.rect.h);
    ctx.strokeStyle = "rgba(255,214,255,0.55)";
    ctx.strokeRect(tz.rect.x + 2, tz.rect.y + 2, tz.rect.w - 4, tz.rect.h - 4);
  }

  // break bridge tiles
  for (const br of world.breakTiles) {
    ctx.fillStyle = "rgba(255,224,102,0.16)";
    ctx.fillRect(br.x, br.y, br.w, br.h);
    ctx.strokeStyle = "rgba(255,143,171,0.55)";
    ctx.strokeRect(br.x + 2, br.y + 2, br.w - 4, br.h - 4);
  }

  // solids
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (const s of world.solids) {
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }

  // gates
  for (const g of world.gates) {
    const glow = g.glow;
    const base = 0.25 + glow * 0.55;

    ctx.fillStyle = `rgba(255,214,255,${base})`;
    ctx.fillRect(g.x, g.y, g.w, g.h);

    ctx.fillStyle = `rgba(162,210,255,${0.22 + glow * 0.45})`;
    ctx.fillRect(g.x + 4, g.y + 6, g.w - 8, g.h - 10);

    ctx.strokeStyle = `rgba(255,119,233,${0.35 + glow * 0.55})`;
    ctx.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2);
  }

  // portal
  if (world.portal) {
    ctx.beginPath();
    ctx.arc(world.portal.x, world.portal.y, world.portal.r + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(122,252,255,0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,119,233,0.65)";
    ctx.stroke();
  }

  // butterflies
  for (const b of world.butterflies) {
    ctx.fillStyle = "rgba(255,119,233,0.65)";
    ctx.fillRect(b.x - 6, b.y - 2, 4, 4);
    ctx.fillRect(b.x + 2, b.y - 2, 4, 4);
    ctx.fillStyle = "rgba(162,210,255,0.75)";
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
  }

  // player draw, simple version
  drawPlayer();

  // interaction hint
  drawHints(camX, camY);

  ctx.restore();

  function drawPlayer() {
    const px = player.x;
    const py = player.y;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px - 9, py + 10, 18, 4);

    // wings
    const flap = Math.sin(Date.now() * 0.02) * 2;
    ctx.fillStyle = "rgba(255,119,233,0.85)";
    ctx.fillRect(px - 16, py - 6 + flap, 8, 12);
    ctx.fillRect(px + 8, py - 6 - flap, 8, 12);

    ctx.fillStyle = "rgba(189,178,255,0.9)";
    ctx.fillRect(px - 14, py - 4 + flap, 4, 8);
    ctx.fillRect(px + 10, py - 4 - flap, 4, 8);

    // hair
    ctx.fillStyle = "rgba(140,74,35,0.95)";
    ctx.fillRect(px - 8, py - 14, 16, 10);

    // head
    ctx.fillStyle = "rgba(255,205,178,0.95)";
    ctx.fillRect(px - 6, py - 12, 12, 10);

    // body
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(px - 7, py - 2, 14, 12);

    // jeans
    ctx.fillStyle = "rgba(162,210,255,0.92)";
    ctx.fillRect(px - 7, py + 10, 14, 8);

    // tiny flower band
    ctx.fillStyle = "rgba(255,224,102,0.85)";
    ctx.fillRect(px - 6, py - 14, 12, 2);
  }

  function drawHints(camX, camY) {
    const screenX = (player.x - camX);
    const screenY = (player.y - camY);

    let hint = "";
    let title = "";

    // near gate
    for (const g of world.gates) {
      const gx = g.x + g.w * 0.5;
      const gy = g.y + g.h * 0.5;
      if (dist2(player.x, player.y, gx, gy) < 52 * 52) {
        hint = "E or Enter";
        title = g.title || "";
        break;
      }
    }

    // near portal
    if (!hint && world.portal && dist2(player.x, player.y, world.portal.x, world.portal.y) < 56 * 56) {
      hint = "E or Enter";
      title = world.portal.title || "Portal";
    }

    if (!hint) return;

    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(screenX - 80, screenY - 56, 160, 34);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "12px monospace";
    ctx.fillText("ENTER GATE", screenX - 44, screenY - 34);
    ctx.fillText(hint, screenX - 34, screenY - 18);

    if (title) {
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText(title.slice(0, 24), screenX - 74, screenY - 66);
    }
  }
}

function loop(t) {
  if (!running) return;
  const now = t * 0.001;
  const dt = Math.min(0.033, now - lastTime || 0);
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

async function startGame() {
  artworks = await loadArtworks();
  buildWorld();

  player.x = world.w * 0.5;
  player.y = world.h * 0.6;
  player.vx = 0;
  player.vy = 0;

  running = true;
  lastTime = 0;
  requestAnimationFrame(loop);
}
