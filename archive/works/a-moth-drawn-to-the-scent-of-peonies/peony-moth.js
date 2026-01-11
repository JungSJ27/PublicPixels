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

  wrapper.classList.remove("video-failed");

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // iOS 안정 세팅
  video.muted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.playsInline = true;

  // iOS는 과한 preload가 크래시 유발하는 경우가 있어서 줄임
  video.preload = isIOS ? "metadata" : "auto";

  let hasPlayed = false;

  const playOnce = async () => {
    if (hasPlayed) return;
    try {
      await video.play();
      hasPlayed = true;
    } catch (err) {
      // 여기서 fallback으로 넘기지 말기
      // autoplay 정책, 네트워크 지연 등 흔한 상황이라 깜빡임만 생김
    }
  };

  // 데스크톱은 바로 1회 시도
  if (!isIOS) {
    playOnce();
  }

  // iOS는 첫 인터랙션에서만 1회 시도
  const onFirstInteraction = () => {
    playOnce();
  };

  window.addEventListener("touchstart", onFirstInteraction, { passive: true, once: true });
  window.addEventListener("click", onFirstInteraction, { once: true });

  // 진짜 미디어 에러일 때만 fallback
  video.addEventListener(
    "error",
    () => {
      wrapper.classList.add("video-failed");
    },
    { once: true }
  );
}
