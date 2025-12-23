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
   HEADER SHOW / HIDE
======================================================= */

function initHeaderScroll() {
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");
  if (!header) return;

  let lastY = window.scrollY;

  function applyHidden(isHidden) {
    header.classList.toggle("header-hidden", isHidden);
    if (listToggle) listToggle.classList.toggle("header-hidden", isHidden);
  }

  applyHidden(window.scrollY > 10);

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    if (y < 10) {
      applyHidden(false);
    } else if (y > lastY + 2) {
      applyHidden(true);
    } else if (y < lastY - 2) {
      applyHidden(false);
    }

    lastY = y;
  });
}

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
