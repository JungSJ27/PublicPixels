window.addEventListener("load", () => {
  const header =
    document.querySelector("header.pp-header") ||
    document.querySelector("header");

  const listToggle = document.querySelector(".list-toggle");
  if (!header) return;

  let lastY = window.scrollY;

  function toggle(hidden) {
    header.style.opacity = hidden ? 0 : 1;
    if (listToggle) listToggle.style.opacity = hidden ? 0 : 1;
  }

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    if (y < 10) {
      toggle(false);
    } else if (y > lastY) {
      toggle(true);
    } else {
      toggle(false);
    }

    lastY = y;
  });
});
