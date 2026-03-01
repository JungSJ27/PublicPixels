// /front/search.js
// PublicPixels 전체 화면 검색 오버레이

export function ensureSearchPanel() {
  if (window.__ppSearchInit) return;
  window.__ppSearchInit = true;

  if (!Array.isArray(window.SEARCH_SOURCES) || window.SEARCH_SOURCES.length === 0) {
    const ROOT = location.pathname.startsWith("/PublicPixels/") ? "/PublicPixels" : "";
    window.SEARCH_SOURCES = [
      `${ROOT}/archive/artworks.json`,
      `${ROOT}/pixelshop/shop.json`,
      `${ROOT}/studiolog/current.data.json`,
    ];
  }

  let backdrop = document.getElementById("search-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "search-backdrop";
    document.body.appendChild(backdrop);
  }

  let panel = document.getElementById("search");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "search";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="search-inner">
        <div class="search-input-wrapper">
          <input type="text"
                 id="search-input"
                 placeholder="Search through Public Pixels"
                 autocomplete="off" />
          <span id="clear-search"
                class="clear-btn"
                aria-label="Clear or close search"
                role="button">&times;</span>
        </div>
        <div id="search-results" class="search-results"></div>
      </div>
    `;
    document.body.appendChild(panel);
  }

  const input      = panel.querySelector("#search-input");
  const clear      = panel.querySelector("#clear-search");
  const results    = panel.querySelector("#search-results");
  const icon       = document.querySelector("header .search-icon");
  const cartToggle = document.querySelector("[data-cart-open]");

  if (!input || !clear || !results || !icon) {
    console.warn("[search] Missing required elements");
    return;
  }

  let DATA = [];
  let loaded = false;
  let loading = false;

  function toAbs(u) {
    if (!u) return "";
    try {
      return new URL(u, document.baseURI).href;
    } catch {
      return u;
    }
  }

  function norm(x = {}) {
    const title = String(x.title ?? x.name ?? "Untitled");
    const url   = toAbs(x.url ?? x.link ?? x.href ?? x.page ?? "#");
    const image = toAbs(
      (x.image && typeof x.image === "string") ? x.image :
      (x.thumb && typeof x.thumb === "string") ? x.thumb :
      (x.thumb && x.thumb.src) ? x.thumb.src :
      (x.img && typeof x.img === "string") ? x.img :
      (x.images && typeof x.images === "string") ? x.images :
      (x.picture && typeof x.picture === "string") ? x.picture :
      (x.thumbnail ?? x.media ?? "")
    );

    const price  = Number(x.price ?? 0);
    const date   = x.date ?? "";
    const type   = String(x.type ?? x.category ?? x.kind ?? "");
    const medium = Array.isArray(x.medium) ? x.medium : [];
    const year   = x.year ?? "";
    const status = typeof x.status === "string" ? x.status : "";

    const hay = (
      (x.title ?? "") +
      (x.type ?? "") +
      (x.description ?? "") +
      (x.medium ?? "") +
      (x.year ?? "")
    ).toLowerCase().replace(/\s+/g, "");

    return { title, url, image, price, date, type, medium, year, status, _hay: hay };
  }

  function pushAny(rows, val) {
    if (!val) return;

    if (Array.isArray(val)) {
      rows.push(...val.map(norm));
      return;
    }

    if (Array.isArray(val.items)) {
      rows.push(...val.items.map(norm));
      return;
    }

    for (const k in val) {
      const v = val[k];
      if (Array.isArray(v)) rows.push(...v.map(norm));
    }
  }

  async function loadAll() {
    if (loaded || loading) return DATA;
    loading = true;

    const urls = window.SEARCH_SOURCES || [];
    const rows = [];

    const settled = await Promise.allSettled(
      urls.map((u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject())))
    );

    settled.forEach((s) => {
      if (s.status === "fulfilled") pushAny(rows, s.value);
    });

    const uniq = new Set();
    DATA = rows.filter((r) => {
      if (r.status && r.status.toLowerCase() === "private") return false;

      const k = (r.title + "|" + r.url).toLowerCase();
      if (uniq.has(k)) return false;
      uniq.add(k);
      return true;
    });

    loaded = true;
    loading = false;
    return DATA;
  }

  const DEMO = [
    { title: "SJ1",                 url: "/about/",                             image: "/front/SJ1.png" },
    { title: "Still, Life goes on", url: "/archive/works/still-life-goes-on/",  image: "/front/recstill.png" },
    { title: "Rent-a-JJ Chat",      url: "/pixelshop/shop/rent-a-jjchat/",      image: "/front/jjchat.png" },
    { title: "Brooklyn to Gangnam Magazine Volume 2", url: "/studiolog/log/202603/",   image: "/front/0315.png" },
  ];

  function renderDemo() {
    results.innerHTML = `
      <div class="search-results-images">
        ${DEMO.map((d) => `
          <a class="search-card" href="${d.url}">
            ${d.image
              ? `<img class="search-image" src="${d.image}" alt="${d.title}">`
              : `<div class="search-image search-image--empty">NO IMAGE</div>`
            }
            <div class="card-body">
              <div class="card-title">${d.title}</div>
            </div>
          </a>
        `).join("")}
      </div>
    `;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const m = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return `${m} ${d.getFullYear()}`;
  }

  function renderResults(list) {
    if (!list.length) {
      results.innerHTML = `<div class="search-results-empty">No results</div>`;
      return;
    }

    results.innerHTML = `
      <div class="search-results-grid">
        ${list.map((it) => {
          let meta = "";
          if (it.date) {
            meta = formatDate(it.date);
          } else if (it.price) {
            meta = `$${it.price}`;
          } else {
            const m = it.medium && it.medium[0] ? it.medium[0] : "";
            const y = it.year || "";
            if (m && y) meta = `${m}, ${y}`;
            else if (y) meta = y;
          }

          const imgHtml = it.image
            ? `<img class="search-image" src="${it.image}" alt="${it.title}">`
            : `<div class="search-image search-image--empty">NO IMAGE</div>`;

          return `
            <a class="search-card" href="${it.url}">
              ${imgHtml}
              <div class="card-body">
                <div class="card-title">${it.title}</div>
                <div class="card-meta">${meta}</div>
              </div>
            </a>
          `;
        }).join("")}
      </div>
    `;
  }

  function setGameKeyboardEnabled(enabled) {
    try {
      if (typeof window.__pp2_setKeyboardEnabled === "function") {
        window.__pp2_setKeyboardEnabled(enabled);
        return;
      }
      const g = window.__pp2_game;
      if (g && g.input && g.input.keyboard) g.input.keyboard.enabled = !!enabled;
    } catch (e) {}
  }

  function openSearch() {
    panel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    panel.classList.remove("full");
    panel.classList.add("half");

    renderDemo();

    if (backdrop) {
      backdrop.classList.add("visible");
      backdrop.addEventListener("click", closeSearch);
    }

    input.value = "";
    renderDemo();

    loadAll();

    icon.setAttribute("aria-expanded", "true");

    // 검색이 열려있는 동안 Phaser 키보드를 꺼서 WASD가 input에 입력되게 함
    setGameKeyboardEnabled(false);

    setTimeout(() => input.focus(), 10);
  }

  function closeSearch() {
    panel.setAttribute("aria-hidden", "true");
    panel.classList.remove("half", "full");

    if (backdrop) {
      backdrop.classList.remove("visible");
    }

    document.body.style.overflow = "";
    icon.setAttribute("aria-expanded", "false");
    input.blur();

    // 검색 닫히면 Phaser 키보드 다시 켬
    setGameKeyboardEnabled(true);
  }

  icon.addEventListener("click", (e) => {
    e.preventDefault();
    const hidden = panel.getAttribute("aria-hidden") === "true";
    hidden ? openSearch() : closeSearch();
  });

  icon.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const hidden = panel.getAttribute("aria-hidden") === "true";
      hidden ? openSearch() : closeSearch();
    }
  });

  clear.addEventListener("click", () => {
    if (input.value.trim()) {
      input.value = "";
      panel.classList.remove("full");
      panel.classList.add("half");
      renderDemo();
      input.focus();
    } else {
      closeSearch();
    }
  });

  clear.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      clear.click();
    }
  });

  if (cartToggle) {
    cartToggle.addEventListener("click", () => {
      if (panel.getAttribute("aria-hidden") === "false") {
        closeSearch();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.getAttribute("aria-hidden") === "false") {
      closeSearch();
    }
  });

  panel.addEventListener("click", (e) => {
    const inner = panel.querySelector(".search-inner");
    if (inner && !inner.contains(e.target)) {
      closeSearch();
    }
  });

  // input에서 타이핑할 때는 다른 전역 keydown 리스너가 키를 못 먹게 보호
  input.addEventListener("keydown", (e) => {
    e.stopImmediatePropagation();
  });

  input.addEventListener("input", async () => {
    const q = input.value.trim().toLowerCase();

    if (!q) {
      panel.classList.remove("full");
      panel.classList.add("half");
      renderDemo();
      return;
    }

    panel.classList.remove("half");
    panel.classList.add("full");

    if (!loaded) await loadAll();

    const key = q.replace(/\s+/g, "");
    const list = DATA.filter((d) =>
      d.title.toLowerCase().replace(/\s+/g, "").includes(key) ||
      d._hay.includes(key)
    );

    if (!list.length) {
      panel.classList.remove("full");
      panel.classList.add("half");
    }

    renderResults(list);
  });
}