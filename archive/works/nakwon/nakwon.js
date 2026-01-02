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

async function initBooklet() {
  const bookEl = document.getElementById("book");
  if (!bookEl) return;

  // 너의 실제 pdf 파일 경로로 바꿔줘
  // 예: 같은 폴더면 "./무제-2.pdf"
  // 예: /archive/works/nakwon/ 안이면 "/archive/works/nakwon/무제-2.pdf"
  const pdfUrl = "https://pub-7ab3678ff1cb45fd9bc95ef16f0d8b39.r2.dev/archive/nakwon/%E1%84%86%E1%85%AE%E1%84%8C%E1%85%A6-2.pdf";

  // pdfjs 기본 설정
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.js";

  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;

  // 너무 무거우면 12쪽 정도까지만 먼저 보여주고 필요하면 늘리기
  const pageCount = pdf.numPages;

  // 페이지를 이미지 캔버스로 렌더링해서 div에 넣기
  const pages = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);

    // 화면 크기에 따라 렌더 스케일을 조절
    const viewport = page.getViewport({ scale: 1.6 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const pageDiv = document.createElement("div");
    pageDiv.className = "page";

    const img = document.createElement("img");
    img.alt = `Booklet page ${i}`;
    img.src = canvas.toDataURL("image/jpeg", 0.9);
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.background = "#fff";

    pageDiv.appendChild(img);
    pages.push(pageDiv);
  }

  // 페이지플립 생성
  const pageFlip = new St.PageFlip(bookEl, {
    width: 460,
    height: 620,
    size: "stretch",
    minWidth: 320,
    maxWidth: 920,
    minHeight: 420,
    maxHeight: 720,
    showCover: true,
    mobileScrollSupport: true
  });

  pageFlip.loadFromHTML(pages);
}

initBooklet().catch((err) => {
  console.error("Booklet init failed:", err);
});
