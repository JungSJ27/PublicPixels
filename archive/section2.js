(() => {
  const MAP_KEY = "map";

  // 로컬에서 테스트할 때는 false
  // 배포 환경에서만 true로 바꿔
  const USE_R2_ASSETS = false;

  // 맵 json은 로컬에 있는 게 정석
  // PublicPixels 루트 기준으로 확정 경로로 잡기
  const MAP_JSON_URL = "pixels.json";

  // R2 base
  const R2_BASE = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/";

  // 배경 타일
  // 로컬이면 /archive/pixels/bg_tile.png
  // R2면 R2_BASE + archive/pixels/bg_tile.png
  const BG_TILE_LOCAL = "/archive/pixels/bg_tile.png";
  const BG_TILE_R2 = R2_BASE + "archive/pixels/bg_tile.png";

  const PLAY_ZOOM_MIN = 1.8;
  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 4.0;
  const PLAYER_SPEED = 220;

  function normPath(p) {
    if (!p) return p;
    let s = String(p);
    s = s.replace(/\\/g, "/");
    s = s.replace(/^\.\/+/, "");
    s = s.replace(/\/{2,}/g, "/");
    return s;
  }

  function withCacheBust(url) {
    return url + (url.includes("?") ? "&" : "?") + "v=" + Date.now();
  }

  function toAssetUrl(imagePath) {
    const path = normPath(imagePath);

    // json 안에 image가 "archive/pixels/Tile.png" 같이 들어있으면
    // 로컬에서는 "/archive/pixels/Tile.png" 로
    // R2에서는 "https://.../archive/pixels/Tile.png" 로
    if (USE_R2_ASSETS) return R2_BASE + path;

    return path.startsWith("/") ? path : "/" + path;
  }

  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-root",
    backgroundColor: "#000000",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: { preload, create }
  };

  const game = new Phaser.Game(config);

  window.addEventListener("resize", () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });

  function preload() {
    this.load.on("loaderror", (file) => {
      console.error("loaderror", file && file.key, file && file.src);
    });

    // 1 맵 json 로드
    this.load.tilemapTiledJSON(MAP_KEY, withCacheBust(MAP_JSON_URL));

    // 2 배경 타일 로드
    const bgUrl = USE_R2_ASSETS ? BG_TILE_R2 : BG_TILE_LOCAL;
    this.load.image("bg_tile", withCacheBust(bgUrl));
  }

  function create() {
    const scene = this;

    // 배경 타일 반복
    const bg = scene.add.tileSprite(0, 0, scene.scale.width, scene.scale.height, "bg_tile");
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0);
    bg.setDepth(-1000);

    scene.scale.on("resize", (s) => {
      bg.width = s.width;
      bg.height = s.height;
    });

    // raw json 읽기
    const cached = scene.cache.tilemap.get(MAP_KEY);
    const raw = cached && cached.data ? cached.data : null;
    if (!raw) {
      console.error("map raw json not found in cache", MAP_JSON_URL);
      return;
    }

    const rawTilesets = Array.isArray(raw.tilesets) ? raw.tilesets : [];
    if (!rawTilesets.length) {
      console.error("tilesets is empty");
      return;
    }

    // tileset 이미지 로드
    for (const ts of rawTilesets) {
      if (!ts || !ts.name) continue;

      if (ts.source) {
        console.warn("external tsx detected, embed tilesets in tiled export", ts.source);
        continue;
      }

      if (!ts.image) {
        console.warn("tileset image missing", ts.name);
        continue;
      }

      const key = "ts_" + ts.name;
      const url = toAssetUrl(ts.image);

      console.log("tileset png load", ts.name, url);
      scene.load.image(key, withCacheBust(url));
      ts.__phaserKey = key;
    }

    scene.load.once("complete", () => {
      const map = scene.make.tilemap({ key: MAP_KEY });
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
        console.error("tileset create failed, check png url, cors, 404");
        return;
      }

      const createdLayers = [];
      for (const layer of map.layers || []) {
        const l = map.createLayer(layer.name, phaserTilesets, 0, 0);
        if (l) createdLayers.push(l);
      }

      if (!createdLayers.length) {
        console.error("tile layer create failed, check layer type in tiled");
        return;
      }

      // 시작 위치 계산
      const tileBounds = getNonEmptyTileBounds(map);
      const startX = tileBounds ? (tileBounds.minX + tileBounds.maxX) / 2 : map.widthInPixels / 2;
      const startY = tileBounds ? (tileBounds.minY + tileBounds.maxY) / 2 : map.heightInPixels / 2;

      const cam = scene.cameras.main;
      cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

      const zoomFill = Math.max(
        scene.scale.width / map.widthInPixels,
        scene.scale.height / map.heightInPixels
      );

      const startZoom = Phaser.Math.Clamp(Math.max(PLAY_ZOOM_MIN, zoomFill), MIN_ZOOM, MAX_ZOOM);

      cam.setZoom(startZoom);
      cam.centerOn(startX, startY);

      const player = scene.add.rectangle(startX, startY, 18, 18, 0x66ccff);
      player.setDepth(9999);

      cam.startFollow(player, true, 0.12, 0.12);

      const keys = scene.input.keyboard.addKeys({
        up: "W",
        down: "S",
        left: "A",
        right: "D",
        up2: "UP",
        down2: "DOWN",
        left2: "LEFT",
        right2: "RIGHT"
      });

      scene.events.on("update", () => {
        const dt = scene.game.loop.delta / 1000;

        let vx = 0;
        let vy = 0;

        if (keys.left.isDown || keys.left2.isDown) vx -= 1;
        if (keys.right.isDown || keys.right2.isDown) vx += 1;
        if (keys.up.isDown || keys.up2.isDown) vy -= 1;
        if (keys.down.isDown || keys.down2.isDown) vy += 1;

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy);
          vx /= len;
          vy /= len;

          player.x += vx * PLAYER_SPEED * dt;
          player.y += vy * PLAYER_SPEED * dt;

          player.x = Phaser.Math.Clamp(player.x, 0, map.widthInPixels);
          player.y = Phaser.Math.Clamp(player.y, 0, map.heightInPixels);
        }
      });

      scene.input.on("wheel", (pointer, dx, dy) => {
        const next = Phaser.Math.Clamp(cam.zoom - dy * 0.001, MIN_ZOOM, MAX_ZOOM);
        cam.setZoom(next);
      });
    });

    scene.load.start();
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