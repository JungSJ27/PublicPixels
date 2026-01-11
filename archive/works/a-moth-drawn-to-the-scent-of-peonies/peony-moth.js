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
   VIDEO PLAYBACK (iOS + Mobile SAFE, no blank, no crash)
======================================================= */

function initVideoPlayback() {
  const video = document.getElementById("peonyVideo");
  const wrapper = document.querySelector(".split-video");
  if (!video || !wrapper) return;

  wrapper.classList.remove("video-failed");
  wrapper.classList.remove("is-playing");

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  video.muted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.playsInline = true;

  video.preload = isIOS ? "metadata" : "auto";

  let hasTriedPlay = false;

  const playOnce = async () => {
    if (hasTriedPlay) return;
    hasTriedPlay = true;

    try {
      await video.play();
      // 여기서는 is-playing 붙이지 말기
    } catch (err) {
      // 실패해도 fallback 유지
    }
  };

  // 실제 프레임이 재생될 때만 포스터 숨김
  video.addEventListener("playing", () => {
    wrapper.classList.add("is-playing");
  });

  video.addEventListener("pause", () => {
    wrapper.classList.remove("is-playing");
  });

  // iOS 포함: "비디오 영역"을 누르면 재생 시도
  const tryStart = () => playOnce();
  wrapper.addEventListener("click", tryStart, { passive: true });
  wrapper.addEventListener("touchstart", tryStart, { passive: true });

  // 데스크톱은 로드 직후 1회 시도
  if (!isIOS) playOnce();

  // 진짜 에러일 때만 fail
  video.addEventListener(
    "error",
    () => {
      wrapper.classList.add("video-failed");
      wrapper.classList.remove("is-playing");
    },
    { once: true }
  );
}
