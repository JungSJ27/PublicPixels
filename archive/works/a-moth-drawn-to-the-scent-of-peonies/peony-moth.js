/* =======================================================
   PAGE INIT
======================================================= */

window.addEventListener("DOMContentLoaded", () => {
  // headerLoader로 헤더가 늦게 들어올 수 있으니 존재 체크
  requestAnimationFrame(() => {
    if (typeof initHeaderScroll === "function") initHeaderScroll();
  });

  // 비디오 초기화
  initVideoPlayback();
});

/* =======================================================
   HEADER SHOW / HIDE  (scroll up = show, scroll down = hide)
======================================================= */

window.addEventListener("load", () => {
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector(".pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");
  if (!header) return;

  function applyHidden(isHidden) {
    header.classList.toggle("header-hidden", isHidden);
    if (listToggle) listToggle.classList.toggle("header-hidden", isHidden);
  }

  let lastY = window.scrollY;

  // 첫 로딩 시 상태
  applyHidden(window.scrollY > 10);

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;

      // 맨 위 근처면 항상 보이게
      if (y < 10) {
        applyHidden(false);
        lastY = y;
        return;
      }

      // 스크롤 방향에 따라 토글
      if (y < lastY - 2) applyHidden(false);      // 위로
      else if (y > lastY + 2) applyHidden(true);  // 아래로

      lastY = y;
    },
    { passive: true }
  );
});

/* =======================================================
   VIDEO PLAYBACK (iOS + Mobile SAFE, no crash)
======================================================= */

function initVideoPlayback() {
  const video = document.getElementById("peonyVideo");
  const wrapper = document.querySelector(".split-video");
  if (!video || !wrapper) return;

  // 이전 실패 상태 제거
  wrapper.classList.remove("video-failed");

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // iOS에서 더 안정적으로 만들기
  if (isIOS) {
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.playsInline = true;
    video.preload = "auto";
  }

  let attempted = false;

  const tryPlay = () => {
    if (attempted) return;        // 무한 재시도 방지
    attempted = true;

    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        wrapper.classList.add("video-failed");
      });
    }
  };

  // 1) 즉시 1회 시도
  tryPlay();

  // 2) iOS에서 첫 시도가 막히는 경우가 많아서 "첫 인터랙션"에서 한 번 더 시도
  // (이미 attempted=true이면 실행 안 됨)
  const tryOnFirstInteraction = () => {
    wrapper.classList.remove("video-failed");
    attempted = false; // 첫 시도 실패했을 수도 있으니, 인터랙션 때만 한 번 더 기회
    tryPlay();
  };

  window.addEventListener("touchstart", tryOnFirstInteraction, { passive: true, once: true });
  window.addEventListener("click", tryOnFirstInteraction, { once: true, capture: true });

  // 영상 자체가 에러 나면 fallback
  video.addEventListener(
    "error",
    () => {
      wrapper.classList.add("video-failed");
    },
    { once: true }
  );
}
