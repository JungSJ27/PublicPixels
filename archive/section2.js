(() => {
  const archiveBtn = document.getElementById("btn-archive");
  const commissionBtn = document.getElementById("btn-commission");

  if (archiveBtn) {
    archiveBtn.addEventListener("click", () => {
      location.href = "/archive/";
    });
  }

  if (commissionBtn) {
    commissionBtn.addEventListener("click", () => {
      location.href = "/commission/";
    });
  }
})();
