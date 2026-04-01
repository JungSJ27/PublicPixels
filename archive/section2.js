/* archive/section2.js */
(() => {
  const GAME_PARENT_ID = "game-root";

  const R2_ROOT = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/";
  const R2_PIXELS_DIR = R2_ROOT + "archive/pixels/";
  const BG_TILE_URL = R2_PIXELS_DIR + "bg_tile.png";

  const MAP_KEY = "map";
  const MAP_JSON = "/archive/pixels.json";

  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 4.0;
  const PLAY_ZOOM_MIN = 1.8;
  const PLAYER_SPEED = 220;

  const introEl = document.getElementById("pp2-intro");
  const sectionEl = document.getElementById("section2");
  const hudHearts = document.getElementById("pp2-hearts");

  const playBtn = document.getElementById("btn-play");
  const archiveBtn = document.getElementById("btn-archive");
  const commissionBtn = document.getElementById("btn-commission");

  let started = false;

  let game;
  let player;
  let cursors;
  let collisionLayer;
  let currentMap;

  function setPausedUI(isPaused) {
    if (!sectionEl) return;
    if (isPaused) sectionEl.classList.add("is-paused");
    else sectionEl.classList.remove("is-paused");
  }

  const LS_HEARTS = "pp2_hearts_v1";
  function getHearts() {
    const v = Number(localStorage.getItem(LS_HEARTS) || "0");
    return Number.isFinite(v) ? v : 0;
  }
  function setHearts(v) {
    const n = Math.max(0, Math.floor(Number(v) || 0));
    localStorage.setItem(LS_HEARTS, String(n));
    if (hudHearts) hudHearts.textContent = String(n);
    return n;
  }
  setHearts(getHearts());

  function toR2TilesetUrl(tiledImagePath) {
    if (!tiledImagePath) return "";
    let s = String(tiledImagePath).replace(/\\/g, "/");
    if (/^https?:\/\//i.test(s)) return s;
    const file = s.split("/").pop();
    return R2_PIXELS_DIR + file;
  }

  function resumeAudioIfAny() {
    try {
      const scenes = game.scene.getScenes(true);
      const activeScene = scenes && scenes.length ? scenes[0] : null;
      if (!activeScene || !activeScene.sound) return;

      const ctx = activeScene.sound.context;
      if (ctx && ctx.state === "suspended") ctx.resume();
    } catch (e) {}
  }

  if (archiveBtn) {
    archiveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      location.href = "/archive/";
    });
  }

  if (commissionBtn) {
    commissionBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      location.href = "/commission/";
    });
  }

  if (playBtn) {
    playBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      started = true;
      if (introEl) introEl.style.display = "none";
      setPausedUI(false);
      resumeAudioIfAny();
      console.log("START pressed, started = true");
    });
  }

  started = false;
  if (introEl) introEl.style.display = "";
  setPausedUI(true);

  const config = {
    type: Phaser.AUTO,
    parent: GAME_PARENT_ID,
    backgroundColor: "#000000",
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: {
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
      preload,
      create,
      update
    }
  };

  game = new Phaser.Game(config);

  window.__pp2_game = game;
  window.__pp2_setKeyboardEnabled = (enabled) => {
    try {
      const g = window.__pp2_game;
      if (!g || !g.input || !g.input.keyboard) return;
      g.input.keyboard.enabled = !!enabled;
    } catch (e) {}
  };

  function preload() {
    this.load.setCORS("anonymous");

    this.load.on("loaderror", (file) => {
      console.error("loaderror", file && file.key, file && file.src);
    });

    this.load.tilemapTiledJSON(MAP_KEY, MAP_JSON + "?v=" + Date.now());
    this.load.image("bg_tile", BG_TILE_URL + "?v=" + Date.now());
  }

  function create() {
    const scene = this;

    const bg = scene.add.tileSprite(0, 0, scene.scale.width, scene.scale.height, "bg_tile");
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0);
    bg.setDepth(-1000);

    scene.scale.on("resize", (s) => {
      bg.width = s.width;
      bg.height = s.height;
    });

    const cached = scene.cache.tilemap.get(MAP_KEY);
    const raw = cached && cached.data ? cached.data : null;
    if (!raw) {
      console.error("map raw json not found in cache");
      return;
    }

    const rawTilesets = Array.isArray(raw.tilesets) ? raw.tilesets : [];
    if (!rawTilesets.length) {
      console.error("tilesets is empty");
      return;
    }

    for (const ts of rawTilesets) {
      if (!ts || !ts.name) continue;
      if (ts.source) continue;
      if (!ts.image) continue;

      const key = "ts_" + ts.name;
      const url = toR2TilesetUrl(ts.image);

      console.log("tileset png load", ts.name, url);
      scene.load.image(key, url + "?v=" + Date.now());
      ts.__phaserKey = key;
    }

    scene.load.once("complete", () => {
      const map = scene.make.tilemap({ key: MAP_KEY });
      currentMap = map;

      if (!map) {
        console.error("tilemap create failed");
        return;
      }

      const phaserTilesets = [];
      for (const ts of rawTilesets) {
        if (!ts || !ts.__phaserKey) continue;

        const phTs = map.addTilesetImage(
          ts.name,
          ts.__phaserKey,
          ts.tilewidth,
          ts.tileheight,
          ts.margin || 0,
          ts.spacing || 0
        );

        if (phTs) phaserTilesets.push(phTs);
      }

      if (!phaserTilesets.length) {
        console.error("tileset create failed. png 404인지 위 로그 확인");
        return;
      }

      const createdLayers = [];
      for (const layer of map.layers || []) {
        const l = map.createLayer(layer.name, phaserTilesets, 0, 0);
        if (!l) continue;

        l.setAlpha(1);
        l.setVisible(true);
        l.setDepth(0);
        createdLayers.push(l);

        if (layer.name === "Collision") {
          collisionLayer = l;
        }
      }

      if (!createdLayers.length) {
        console.error("tile layer create failed");
        return;
      }

      if (collisionLayer) {
        collisionLayer.setCollisionByExclusion([-1]);
        collisionLayer.setVisible(false);
      } else {
        console.warn("Collision layer not found");
      }

      const tileBounds = getNonEmptyTileBounds(map);

      const startX = tileBounds ? (tileBounds.minX + tileBounds.maxX) / 2 : map.widthInPixels / 2;
      const startY = tileBounds ? (tileBounds.minY + tileBounds.maxY) / 2 : map.heightInPixels / 2;

      const cam = scene.cameras.main;
      cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      const zoomFill = Math.max(scene.scale.width / map.widthInPixels, scene.scale.height / map.heightInPixels);
      const startZoom = Phaser.Math.Clamp(Math.max(PLAY_ZOOM_MIN, zoomFill), MIN_ZOOM, MAX_ZOOM);

      cam.setZoom(startZoom);

      player = scene.physics.add.sprite(startX, startY, null);
      player.setSize(16, 16);
      player.body.setSize(10, 6);
      player.body.setCollideWorldBounds(true);
      player.setDepth(10);

      const gfx = scene.add.graphics();
      gfx.fillStyle(0x66ccff, 1);
      gfx.fillRect(0, 0, 18, 18);
      gfx.generateTexture("playerBlock", 18, 18);
      gfx.destroy();

      player.setTexture("playerBlock");

      if (collisionLayer) {
        scene.physics.add.collider(player, collisionLayer);
      }

      scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      cam.startFollow(player, true, 0.12, 0.12);

      cursors = scene.input.keyboard.addKeys({
        up: "W",
        down: "S",
        left: "A",
        right: "D",
        up2: "UP",
        down2: "DOWN",
        left2: "LEFT",
        right2: "RIGHT"
      });

      scene.input.on("wheel", (pointer, dx, dy) => {
        const next = Phaser.Math.Clamp(cam.zoom - dy * 0.001, MIN_ZOOM, MAX_ZOOM);
        cam.setZoom(next);
      });

      console.log("map ok", {
        w: map.widthInPixels,
        h: map.heightInPixels,
        layers: createdLayers.map((l) => l.layer.name),
        tilesets: map.tilesets.map((t) => t.name),
        collisionLayerFound: !!collisionLayer
      });
    });

    scene.load.start();
  }

  function update() {
    if (!started || !player || !cursors) return;

    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown || cursors.left2.isDown) vx -= 1;
    if (cursors.right.isDown || cursors.right2.isDown) vx += 1;
    if (cursors.up.isDown || cursors.up2.isDown) vy -= 1;
    if (cursors.down.isDown || cursors.down2.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx /= len;
      vy /= len;
    }

    player.body.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);
  }

  function getNonEmptyTileBounds(map) {
    const tw = map.tileWidth;
    const th = map.tileHeight;

    let minTX = Infinity;
    let minTY = Infinity;
    let maxTX = -Infinity;
    let maxTY = -Infinity;
    let found = false;

    for (const layer of map.layers || []) {
      const data = layer && layer.data ? layer.data : null;
      if (!data) continue;

      for (let y = 0; y < data.length; y++) {
        const row = data[y];
        if (!row) continue;

        for (let x = 0; x < row.length; x++) {
          const tile = row[x];
          if (tile && tile.index > 0) {
            found = true;
            if (x < minTX) minTX = x;
            if (y < minTY) minTY = y;
            if (x > maxTX) maxTX = x;
            if (y > maxTY) maxTY = y;
          }
        }
      }
    }

    if (!found) return null;

    return {
      minX: minTX * tw,
      minY: minTY * th,
      maxX: (maxTX + 1) * tw,
      maxY: (maxTY + 1) * th
    };
  }
})();