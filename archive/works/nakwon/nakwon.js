/* =========================
   HEADER
========================= */
(function () {
  const body = document.body;
  const zoneDesktop = document.querySelector(".header-hover-zone");
  const zoneMobile = document.querySelector(".mobile-header-zone");
  const header = document.querySelector("header");

  let hideTimer = null;

  function revealFor(ms = 3000) {
    clearTimeout(hideTimer);
    body.classList.add("header-reveal");

    hideTimer = setTimeout(() => {
      body.classList.remove("header-reveal");
    }, ms);
  }

  /* 모바일 판별: hover 없는 환경 */
  const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  /* ==========================
     📱 MOBILE
  ========================== */
  if (isMobile) {
    body.classList.remove("header-reveal");

    const onTopTap = (e) => {
      revealFor(3000);
    };

    /* 상단 터치 존 */
    zoneMobile?.addEventListener("touchstart", onTopTap, {
      passive: true,
    });

    /* 헤더 자체 터치해도 유지 */
    header?.addEventListener("touchstart", onTopTap, {
      passive: true,
    });

    return;
  }

  /* ==========================
     🖥 DESKTOP
  ========================== */
  if (!zoneDesktop) return;

  function show() {
    clearTimeout(hideTimer);
    body.classList.add("header-reveal");
  }

  function hide(delay = 500) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      body.classList.remove("header-reveal");
    }, delay);
  }

  zoneDesktop.addEventListener("mouseenter", show);
  zoneDesktop.addEventListener("mouseleave", () => hide(500));
  header?.addEventListener("mouseenter", show);
  header?.addEventListener("mouseleave", () => hide(500));
})();




/* =======================================================
   VIDEO FADE-IN
======================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.querySelector("iframe");
  if (!iframe) return;

  iframe.setAttribute("allow", "autoplay");
  iframe.style.opacity = 0;

  setTimeout(() => {
    iframe.style.transition = "opacity 0.8s ease";
    iframe.style.opacity = 1;
  }, 200);
});


function initBookletEmbed() {
  const bookEl = document.getElementById("book");
  if (!bookEl) return;

  const flipUrl = "https://online.fliphtml5.com/ufzja/ujtc/";

  // 기존에 남아있을 수 있는 내용 비우기
  bookEl.innerHTML = "";

  const iframe = document.createElement("iframe");
  iframe.src = flipUrl;
  iframe.title = "Nakwon booklet flipbook";
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("scrolling", "no");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";

  bookEl.appendChild(iframe);
}

document.addEventListener("DOMContentLoaded", initBookletEmbed);

(function initAudioRecord() {
  const audio = document.getElementById("nakwonAudio");
  const stage = document.getElementById("recordStage");
  const playBtn = document.getElementById("togglePlay");
  const vinyl = document.querySelector(".vinyl");
  const dlBtn = document.getElementById("downloadAudio");

  if (!audio || !stage || !playBtn || !vinyl || !dlBtn) return;

  const audioUrl = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/pure19.m4a";

  function setUI(isPlaying){
    stage.classList.toggle("is-playing", isPlaying);
    vinyl.classList.toggle("is-spinning", isPlaying);
    playBtn.setAttribute("aria-pressed", String(isPlaying));
  }

  async function togglePlay(){
    if (audio.paused){
      try{
        await audio.play();
        setUI(true);
      } catch (e){
        setUI(false);
      }
    } else {
      audio.pause();
      setUI(false);
    }
  }

  playBtn.addEventListener("click", (e) => {
    e.preventDefault();
    togglePlay();
  });

  stage.addEventListener("click", (e) => {
    if (e.target && e.target.closest && e.target.closest("#downloadAudio")) return;
    if (e.target && e.target.closest && e.target.closest("#togglePlay")) return;
  });

  stage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " "){
      e.preventDefault();
      togglePlay();
    }
  });

  audio.addEventListener("play", () => setUI(true));
  audio.addEventListener("pause", () => setUI(false));
  audio.addEventListener("ended", () => setUI(false));

 async function forceDownload(){
  try{
    const res = await fetch(audioUrl, { mode: "cors" });
    if(!res.ok) throw new Error("Download failed");

    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objUrl;
    a.download = "nakwon-pure19.m4a";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(objUrl);
  } catch (err){
    // fetch가 막히면 fallback: 새 탭으로 열기
    window.open(audioUrl, "_blank", "noopener");
  }
}


  dlBtn.addEventListener("click", (e) => {
    e.preventDefault();
    forceDownload();
  });

  async function tryAutoplay(){
    try{
      await audio.play();
      setUI(true);
    } catch (e){
      setUI(false);
    }
  }

  window.addEventListener("load", tryAutoplay);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden){
      audio.pause();
      setUI(false);
    }
  });
})();


(function initPhotoStream(){
  const grid = document.getElementById("photoGrid");
  const sentinel = document.getElementById("photoSentinel");
  if(!grid || !sentinel) return;

  // TODO: 남은 사진들 URL을 여기에 넣어줘
  const PHOTOS = [
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060001.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/DSC_0028.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/DSC_0009.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/DSC_0016.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060002.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060003.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060004.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060008.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/DSC_0007.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060009.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060010.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060011.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060012.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080013.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060020.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060023.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/DSC_0019.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11060027.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080002.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080003.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080008.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080012.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080013.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080017.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11080021.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/DSC_0021.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11110003.JPG",
    "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/11110006.JPG"
  ];

  const BATCH = 12;
  let cursor = 0;
  let loading = false;

  function renderBatch(){
    if(loading) return;
    if(cursor >= PHOTOS.length) return;

    loading = true;

    const end = Math.min(cursor + BATCH, PHOTOS.length);
    for(let i = cursor; i < end; i++){
      const wrap = document.createElement("div");
      wrap.className = "photo-item";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = PHOTOS[i];
      img.alt = "";

      wrap.appendChild(img);
      grid.appendChild(wrap);
    }

    cursor = end;
    loading = false;
  }

  // 첫 로드
  renderBatch();

  // 아래로 내려가면 자동 로드
  const io = new IntersectionObserver((entries) => {
    if(entries.some(e => e.isIntersecting)){
      renderBatch();
    }
  }, { root: null, rootMargin: "600px 0px", threshold: 0 });

  io.observe(sentinel);
})();

const images = document.querySelectorAll('.photo-masonry img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

images.forEach(img => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightbox.style.display = 'flex';
  });
});

lightbox.addEventListener('click', () => {
  lightbox.style.display = 'none';
  lightboxImg.src = '';
});
