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

  const attemptPlay = () => {
    video.play().catch(() => {
      // ❗ 여기서 fallback 트리거
      wrapper.classList.add("video-failed");
    });
  };

  // 데스크탑 시도
  attemptPlay();

  // iOS Safari: 사용자 제스처 이후 1회 허용
  const onUserGesture = () => {
    attemptPlay();
    document.removeEventListener("touchstart", onUserGesture);
    document.removeEventListener("click", onUserGesture);
  };

  document.addEventListener("touchstart", onUserGesture, { once: true });
  document.addEventListener("click", onUserGesture, { once: true });
}



