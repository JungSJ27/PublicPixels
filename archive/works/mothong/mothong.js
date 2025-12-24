// mothong.js
(function () {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Mobile nav
  const menuBtn = qs("#menuBtn");
  const mobileNav = qs("#mobileNav");

  function setMenu(open) {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
  }

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", () => {
      const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });

    qsa("a", mobileNav).forEach((a) => {
      a.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // Reveal on scroll
  const items = qsa(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) ent.target.classList.add("on");
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));

  // Smooth anchor scroll
  qsa('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href.length < 2) return;
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", href);
    });
  });

  // Slogan modal helper
  const openSlogan = qs("#openSlogan");
  const modal = qs("#modal");
  const modalTitle = qs("#modalTitle");
  const closeModal = qs("#closeModal");

  function openModal(title) {
    if (!modal) return;
    if (modalTitle) modalTitle.textContent = title || "상세";
    modal.showModal();
  }
  function closeIt() {
    if (!modal) return;
    modal.close();
  }

  if (openSlogan) {
    openSlogan.addEventListener("click", () => {
      openModal("Moth to a flame");
      const p = qs(".modalText");
      if (p) {
        p.textContent =
          "불꽃에 이끌려 나아가는 나방의 모습에서 비롯된 표현으로, 매력적이고 끌리는 것에 대한 욕구를 나타내는 관용구야. 모통은 불나방이 이끌리는 불꽃처럼 매력적인 브랜드가 되겠다는 신념을 담아.";
      }
    });
  }

  // Gallery modal
  qsa('[data-modal="true"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.getAttribute("data-title") || "아카이브";
      openModal(title);
      const p = qs(".modalText");
      if (p) {
        p.textContent =
          "이 카드에 실제 이미지 경로를 연결하면 바로 갤러리가 돼. 원본 사진이나 PDF에서 추출한 이미지로 교체해서 사용하면 좋아.";
      }
    });
  });

  if (closeModal) closeModal.addEventListener("click", closeIt);
  if (modal) {
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inDialog) closeIt();
    });
  }
})();
