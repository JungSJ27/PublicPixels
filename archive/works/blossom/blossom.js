/* =======================================================
   PAGE INIT
======================================================= */
window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    if (typeof initHeaderScroll === "function") initHeaderScroll();
  });

  if (typeof initVideoFade === "function") initVideoFade();
  if (typeof initImageSlider === "function") initImageSlider();
});


/* =======================================================
   HEADER SHOW / HIDE  (scroll up = show, scroll down = hide)
======================================================= */

window.addEventListener("load", () => {
  // headerLoader로 include된 헤더 잡기
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");
  const listToggle = document.querySelector(".list-toggle");

  if (!header) return;

  function applyHidden(isHidden) {
    if (isHidden) {
      header.classList.add("header-hidden");
      if (listToggle) listToggle.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
      if (listToggle) listToggle.classList.remove("header-hidden");
    }
  }

  let lastY = window.scrollY;

  // 첫 로딩 시 상태
  if (window.scrollY > 10) applyHidden(true);
  else applyHidden(false);

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    // 맨 위 근처면 항상 보이게
    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    // 스크롤 방향에 따라 토글
    if (y < lastY - 2) {
      // 위로 스크롤 = 보이기
      applyHidden(false);
    } else if (y > lastY + 2) {
      // 아래로 스크롤 = 숨기기
      applyHidden(true);
    }

    lastY = y;
  });
});

// blossom.js

(function(){
  const base = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/blossom/";

  const patterns = [
    { id: "blossom3", src: base + "blossom3.jpg", alt: "Blossom 3 pattern" },
    { id: "blossom4", src: base + "blossom4.jpg", alt: "Blossom 4 pattern" },
    { id: "blossom5", src: base + "blossom5.jpg", alt: "Blossom 5 pattern" },
    { id: "blossom6", src: base + "blossom6.jpg", alt: "Blossom 6 pattern" },
    { id: "blossom7", src: base + "blossom7.jpg", alt: "Blossom 7 pattern" },
    { id: "blossom8", src: base + "blossom8.jpg", alt: "Blossom 8 pattern" },
    { id: "blossom9", src: base + "blossom9.jpg", alt: "Blossom 9 pattern" }
  ];

  const bg = document.getElementById("patternBg");
  const grid = document.getElementById("patternGrid");
  const resetBtn = document.getElementById("resetBg");

  if(!bg || !grid) return;

  function setPattern(url, tileW, tileH){
    if(!url){
      bg.style.backgroundImage = "none";
      bg.style.backgroundColor = "#ffffff";
      return;
    }

    bg.style.backgroundImage = `url("${url}")`;
    bg.style.backgroundColor = "#ffffff";
    bg.style.backgroundRepeat = "repeat";
    bg.style.backgroundPosition = "0 0";

    // 핵심: 클릭한 썸네일에 보이는 크기 그대로 반복되게
    if(tileW && tileH){
      bg.style.backgroundSize = `${Math.round(tileW)}px ${Math.round(tileH)}px`;
    }else{
      // 혹시 값이 없으면 적당한 기본값
      bg.style.backgroundSize = "240px 170px";
    }
  }

  function render(){
    const frag = document.createDocumentFragment();

    patterns.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "patternTile";
      btn.setAttribute("data-pattern", p.src);
      btn.setAttribute("aria-label", `Set background to ${p.id}`);

      const img = document.createElement("img");
      img.src = p.src;
      img.alt = p.alt;
      img.loading = "lazy";

      btn.appendChild(img);
      frag.appendChild(btn);
    });

    grid.appendChild(frag);
  }

  function bind(){
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".patternTile");
      if(!btn) return;

      const url = btn.getAttribute("data-pattern");
      if(!url) return;

      // 클릭된 타일 안의 img가 화면에 표시되는 실제 크기
      const img = btn.querySelector("img");
      if(img){
        const r = img.getBoundingClientRect();
        setPattern(url, r.width, r.height);
      }else{
        setPattern(url);
      }
    });

    if(resetBtn){
      resetBtn.addEventListener("click", () => setPattern(null));
    }

    // 창 크기 바뀌면 현재 배경도 새로운 타일 크기에 맞춰 갱신
    window.addEventListener("resize", () => {
      const current = bg.style.backgroundImage;
      if(!current || current === "none") return;

      const activeImg = grid.querySelector(".patternTile img");
      if(!activeImg) return;

      const r = activeImg.getBoundingClientRect();
      // backgroundImage 문자열에서 url 추출
      const match = current.match(/url\(["']?(.*?)["']?\)/);
      if(!match) return;
      setPattern(match[1], r.width, r.height);
    });
  }

  render();
  bind();

  setPattern(null);
})();
