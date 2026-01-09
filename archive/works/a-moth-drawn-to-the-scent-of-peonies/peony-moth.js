/* =======================================================
   PAGE INIT
======================================================= */

window.addEventListener("DOMContentLoaded", () => {
  // headerLoader 이후 헤더 스크롤 초기화
  requestAnimationFrame(() => {
    initHeaderScroll();
  });

  initVideoPlayback();
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
   VIDEO PLAYBACK (iOS SAFE)
======================================================= */

function initVideoPlayback() {
  const video = document.getElementById("peonyVideo");
  const wrapper = document.querySelector(".split-video");
  if (!video || !wrapper) return;

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // 🔥 iOS 또는 모바일에서는 video 포기하고 fallback
  if (isMobile || isIOS) {
    wrapper.classList.add("video-failed");
    try { video.pause(); } catch(e) {}
    video.removeAttribute("src");  // 메모리 해제에 도움
    video.load();
    return;
  }

  // 데스크탑만 autoplay 시도
  video.play().catch(() => {
    wrapper.classList.add("video-failed");
  });
}




