/* archive/section2.js */
(() => {
  const GAME_PARENT_ID = "game-root";

  // R2 루트
  const R2_ROOT = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/";

  // R2에 올라간 경로들
  const MAP_URL = R2_ROOT + "archive/pixels.json";
  const R2_PIXELS_DIR = R2_ROOT + "archive/pixels/";
  const BG_TILE_URL = R2_PIXELS_DIR + "bg_tile.png";

  const PLAY_ZOOM = 1.8;

  const introEl = document.getElementById("pp2-intro");
  const sectionEl = document.getElementById("section2");
  const hudHearts = document.getElementById("pp2-hearts");

  const playBtn = document.getElementById("btn-play");
  const archiveBtn = document.getElementById("btn-archive");
  const commissionBtn = document.getElementById("btn-commission");

  // 버튼은 게임 로딩이 터져도 항상 동작하게 맨 위에서 먼저 연결
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

  function setPausedUI(isPaused) {
    if (!sectionEl) return;
    if (isPaused) sectionEl.classList.add("is-paused");
    else sectionEl.classList.remove("is-paused");
  }

  // Tiled json 안의 image 경로를 어떤 형태로 넣었든
  // 최종적으로 R2의 archive/pixels 폴더의 파일명만 쓰도록 정리
  function toR2TilesetUrl(tiledImagePath) {
    if (!tiledImagePath) return "";
    let s = String(tiledImagePath).replace(/\\/g, "/");

    // 이미 URL이면 그대로
    if (/^https?:\/\//i.test(s)) return s;

    // 경로가 섞여 있어도 파일명만 추출
    const file = s.split("/").pop();
    return R2_PIXELS_DIR + file;
  }

  let started = false;
  setPausedUI(true);

  const config = {
    type: Phaser.AUTO,
    parent: GAME_PARENT_ID,
    backgroundColor: "#000000",
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scene: { preload, create, update }
  };

  const game = new Phaser.Game(config);

  let cursors;
  let player;
  let map;
  let camera;
  let bg;

  function preload() {
    this.load.setCORS("anonymous");

    this.load.on("loaderror", (file) => {
      console.error("loaderror", file && file.key, file && file.src);
    });

    // 배경 타일
    this.load.image("bg_tile", BG_TILE_URL);

    // 타일맵 json
    this.load.tilemapTiledJSON("map", MAP_URL);

    // 타일셋 로딩용 raw json도 한번 더 읽기
    this.load.json("map_raw", MAP_URL);

    // raw json을 받은 뒤 tileset png들을 로더에 추가
    this.load.once("filecomplete-json-map_raw", () => {
      const raw = this.cache.json.get("map_raw");
      const tilesets = raw && raw.tilesets ? raw.tilesets : [];

      for (const ts of tilesets) {
        if (!ts || ts.source) continue;
        if (!ts.name || !ts.image) continue;

        const key = `ts_${ts.name}`;
        const url = toR2TilesetUrl(ts.image);
        this.load.image(key, url);
      }
    });

    // 임시 플레이어
    this.textures.generate("player_box", {
      data: ["2222", "2222", "2222", "2222"],
      pixelWidth: 6,
      palette: { 2: 0x66ccff }
    });
  }

  function create() {
    // 배경 타일 반복
    bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "bg_tile");
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0);
    bg.setDepth(-1000);

    this.scale.on("resize", (s) => {
      if (!bg) return;
      bg.width = s.width;
      bg.height = s.height;
    });

    cursors = this.input.keyboard.createCursorKeys();

    map = this.make.tilemap({ key: "map" });
    if (!map) {
      console.error("tilemap 생성 실패. MAP_URL 확인", MAP_URL);
      return;
    }

    // tileset 연결
    const phaserTilesets = [];
    for (const ts of map.tilesets) {
      const key = `ts_${ts.name}`;
      const phTs = map.addTilesetImage(ts.name, key);
      if (phTs) phaserTilesets.push(phTs);
    }

    // 레이어 생성
    const createdLayers = [];
    for (const layer of map.layers) {
      const l = map.createLayer(layer.name, phaserTilesets, 0, 0);
      if (l) createdLayers.push(l);
    }

    if (!createdLayers.length) {
      console.error("Tile layer 생성 실패. tileset png 로드 여부 확인 필요");
      return;
    }

    camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.setZoom(PLAY_ZOOM);

    player = this.physics.add.sprite(120, 120, "player_box");
    player.setCollideWorldBounds(true);

    // 충돌은 일단 첫 레이어 전체로 잡아두고 나중에 정교화
    const baseLayer = createdLayers[0];
    baseLayer.setCollisionByExclusion([-1]);
    this.physics.add.collider(player, baseLayer);

    camera.startFollow(player, true, 0.12, 0.12);

    // START 버튼
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        started = true;
        if (introEl) introEl.style.display = "none";
        setPausedUI(false);
      });
    }

    // 시작 전에는 멈춤
    started = false;
    if (introEl) introEl.style.display = "";
    setPausedUI(true);
  }

  function update() {
    if (!started || !player) {
      if (player) player.setVelocity(0, 0);
      return;
    }

    const speed = 160;
    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown) vx = -speed;
    else if (cursors.right.isDown) vx = speed;

    if (cursors.up.isDown) vy = -speed;
    else if (cursors.down.isDown) vy = speed;

    player.setVelocity(vx, vy);
  }
})();