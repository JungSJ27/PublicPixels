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
   VIDEO PLAYBACK (iOS + Mobile SAFE, but still tries video)
======================================================= */

function initVideoPlayback() {
  const video = document.getElementById("peonyVideo");
  const wrapper = document.querySelector(".split-video");
  if (!video || !wrapper) return;

  // 혹시 이전에 실패 클래스가 남아있으면 제거
  wrapper.classList.remove("video-failed");

  // iOS 감지 (아이패드OS 포함)
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // iOS는 자동재생이 더 까다로워서 속성 재확인
  if (isIOS) {
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.playsInline = true;
    video.preload = "auto";
  }

  // 모든 기기에서 일단 재생을 시도
  const tryPlay = () => {
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => wrapper.classList.add("video-failed"));
    }
  };

  // 1) 즉시 시도
  tryPlay();

  // 2) iOS에서 첫 시도가 막히는 경우가 많아서, 사용자 첫 터치에서 한 번 더 시도
  // (사용자 인터랙션이 생기면 재생이 풀리는 경우 많음)
  const resumeOnFirstTouch = () => {
    wrapper.classList.remove("video-failed");
    tryPlay();
    window.removeEventListener("touchstart", resumeOnFirstTouch, { passive: true });
    window.removeEventListener("click", resumeOnFirstTouch, true);
  };

  window.addEventListener("touchstart", resumeOnFirstTouch, { passive: true });
  window.addEventListener("click", resumeOnFirstTouch, true);
}



