(function () {
  const img = document.getElementById("pageImage");
  if (!img) return;

  function setAltForSafety() {
    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;
    if (w && h) img.alt = `Mothong page image ${w} by ${h}`;
  }

  if (img.complete) setAltForSafety();
  else img.addEventListener("load", setAltForSafety, { once: true });

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "f") return;
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  });
})();
