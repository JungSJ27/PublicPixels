/* =======================================================
   PAGE INIT
======================================================= */

window.addEventListener("DOMContentLoaded", () => {
  // headerLoader가 header를 DOM에 넣은 다음 프레임에 실행
  requestAnimationFrame(() => {
    initHeaderScroll();
  });

  initVideoFade();
  initImageSlider();
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
/* =======================================================
   BLOSSOM PATTERN BACKGROUND
======================================================= */
(function () {
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
  if (!bg || !grid) return;

  let currentUrl = null;

  function setPattern(url, tileW, tileH) {
    currentUrl = url || null;

    if (!url) {
      bg.style.backgroundImage = "none";
      bg.style.backgroundColor = "#ffffff";
      return;
    }

    bg.style.backgroundImage = `url("${url}")`;
    bg.style.backgroundColor = "#ffffff";
    bg.style.backgroundRepeat = "repeat";
    bg.style.backgroundPosition = "0 0";

    if (tileW && tileH) {
      bg.style.backgroundSize = `${Math.round(tileW)}px ${Math.round(tileH)}px`;
    } else {
      bg.style.backgroundSize = "240px 170px";
    }
  }

  function render() {
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

  function bind() {
    // 타일 클릭 하면 배경 적용
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".patternTile");
      if (!btn) return;

      const url = btn.getAttribute("data-pattern");
      if (!url) return;

      const img = btn.querySelector("img");
      if (img) {
        const r = img.getBoundingClientRect();
        setPattern(url, r.width, r.height);
      } else {
        setPattern(url);
      }
    });

    // 패턴 섹션 밖 아무 곳 클릭 하면 리셋
    document.addEventListener("click", (e) => {
      if (!currentUrl) return;

      const clickedInsidePanel = e.target.closest(".patternSection");
      if (clickedInsidePanel) return;

      const clickedTile = e.target.closest(".patternTile");
      if (clickedTile) return;

      setPattern(null);
    });

    // 리사이즈 시 현재 패턴이면 타일 크기에 맞춰 다시 계산
    window.addEventListener("resize", () => {
      if (!currentUrl) return;

      const anyImg = grid.querySelector(".patternTile img");
      if (!anyImg) return;

      const r = anyImg.getBoundingClientRect();
      setPattern(currentUrl, r.width, r.height);
    });
  }

  render();
  bind();
  setPattern(null);
})();
