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

  // 초기 상태: 위쪽이면 보이고, 아래쪽이면 숨김
  if (window.scrollY > 10) {
    applyHidden(true);
  } else {
    applyHidden(false);
  }

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    // 맨 위 근처면 항상 보이게
    if (y < 10) {
      applyHidden(false);
      lastY = y;
      return;
    }

    if (y < lastY - 2) {
      // 위로 올리는 중 → 헤더 나타나기
      applyHidden(false);
    } else if (y > lastY + 2) {
      // 아래로 내리는 중 → 헤더 숨기기
      applyHidden(true);
    }

    lastY = y;
  });
});
