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

  // 초기 상태: fallback 이미지는 보이게
  wrapper.classList.remove("video-failed");
  wrapper.classList.remove("is-playing");

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // iOS 안전 세팅
  video.muted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.playsInline = true;

  // preload 과부하 방지
  video.preload = isIOS ? "metadata" : "auto";

  let hasTriedPlay = false;

  const playOnce = async () => {
    if (hasTriedPlay) return;
    hasTriedPlay = true;

    try {
      await video.play();
      // iOS에서 play() promise가 먼저 resolve 될 수 있어서
      // is-playing은 playing 이벤트에서만 붙이기
    } catch (err) {
    }
  };

  // 비디오가 실제로 재생되기 시작하면 fallback 숨김
  video.addEventListener("playing", () => {
    wrapper.classList.add("is-playing");
  });

  // 비디오가 멈추면 fallback 다시 보이게
  video.addEventListener("pause", () => {
    wrapper.classList.remove("is-playing");
  });

  // 데스크톱은 즉시 1회 시도
  if (!isIOS) {
    playOnce();
  }

  // iOS는 첫 사용자 인터랙션에서만 재생 시도
  const firstInteraction = () => {
    playOnce();
  };

  window.addEventListener("touchstart", firstInteraction, { passive: true, once: true });
  window.addEventListener("click", firstInteraction, { once: true });

  // 진짜 파일 에러일 때만 fallback 모드
  video.addEventListener(
    "error",
    () => {
      wrapper.classList.add("video-failed");
      wrapper.classList.remove("is-playing");
    },
    { once: true }
  );
}
