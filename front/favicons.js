// /Front/favicons.js
(function ensureFavicons(){
  const HEAD = document.head;
  const VERSION = "v=2025-10-28";

  const defs = [
    { rel:"icon", type:"image/png", sizes:"16x16",  href:"/front/favicon-16.png" },
    { rel:"icon", type:"image/png", sizes:"24x24",  href:"/front/favicon-24.png" },
    { rel:"icon", type:"image/png", sizes:"32x32",  href:"/front/favicon-32.png" },
    { rel:"icon", type:"image/png", sizes:"48x48",  href:"/front/favicon-48.png" },
    { rel:"icon", type:"image/png", sizes:"64x64",  href:"/front/favicon-64.png" },
    { rel:"icon", type:"image/png", sizes:"192x192", href:"/front/android-chrome-192x192.png" },
    { rel:"icon", type:"image/png", sizes:"512x512", href:"/front/android-chrome-512x512.png" },
    { rel:"apple-touch-icon", sizes:"180x180", href:"/front/apple-touch-icon.png" },
    { rel:"shortcut icon", href:"/front/favicon.ico" },
    { rel:"manifest", href:"/front/site.webmanifest" }
  ];

  const upsert = (d) => {
    const sel = `link[rel="${d.rel}"]` + (d.sizes?`[sizes="${d.sizes}"]`:"") + (d.type?`[type="${d.type}"]`:"");
    let el = HEAD.querySelector(sel) || document.createElement("link");
    el.setAttribute("rel", d.rel);
    if (d.type)  el.setAttribute("type", d.type);
    if (d.sizes) el.setAttribute("sizes", d.sizes);
    const url = new URL(d.href, location.origin);
    if (d.rel !== "manifest") url.searchParams.set("v", VERSION);
    el.setAttribute("href", url.href);
    if (!el.isConnected) HEAD.appendChild(el);
  };
  defs.forEach(upsert);

  const meta = (name, content) => {
    let m = HEAD.querySelector(`meta[name="${name}"]`);
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", name); HEAD.appendChild(m); }
    m.setAttribute("content", content);
  };
  meta("theme-color", "#ffffff");
  meta("apple-mobile-web-app-capable", "yes");
  meta("apple-mobile-web-app-status-bar-style", "default");
})();
