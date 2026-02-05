// ===============================
// News.js
// long sliding ruler track
// year width grows by event count with a minimum width
// no hiding, no second scrollbar
// ===============================
(() => {
  /* ===== helpers ===== */
  const $  = (s, el=document)=> el.querySelector(s);
  const $$ = (s, el=document)=> [...el.querySelectorAll(s)];
  const fmtMonYr = iso => new Date(iso + "T00:00:00")
    .toLocaleString("en-US",{month:"short",year:"numeric"}).toUpperCase();
  const isFutureDate = iso => {
    if (!iso) return false;
    const d=new Date(iso+"T00:00:00");
    const today=new Date(); today.setHours(0,0,0,0);
    return d>today;
  };
  const cssNum = name =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

  const addMonths = (y, m, delta) => {
    const t = y*12 + m + delta;
    const ny = Math.floor(t/12);
    const nm = ((t%12)+12)%12;
    return { y: ny, m: nm };
  };

  /* ===== cards ===== */
  function makeCard(item){
    const img = item.image
      ? `<img class="ph" src="${item.image}" alt="${item.title} preview" />`
      : `<div class="ph"></div>`;
    const futureClass = isFutureDate(item.date) ? " card--future" : "";
    const placeBlock = item.location
      ? `<div class="fill" aria-hidden="true"></div><p class="place">${item.location}</p>`
      : "";

    return `
      <a class="card${futureClass}" href="${item.href || "#"}" data-date="${item.date}" aria-label="${item.title}">
        <figure class="fig">${img}</figure>
        <p class="meta">${fmtMonYr(item.date)}</p>
        <h3>${item.title}</h3>
        ${placeBlock}
      </a>`;
  }

  /* ===== reveal ===== */
  function isInView(el, root){
    const rv=root?root.getBoundingClientRect():{left:0,width:window.innerWidth};
    const r=el.getBoundingClientRect();
    const left=r.left-(root?rv.left:0), right=left+r.width;
    return right>0 && left<(root?rv.width:window.innerWidth);
  }
  function setupReveal(){
    const cards=$$(".card"); if(!cards.length) return;
    if(!("IntersectionObserver" in window)){
      cards.forEach(c=>c.classList.add("is-visible")); return;
    }
    const root=$("#news-wrap");
    const io=new IntersectionObserver((ents)=>{
      ents.forEach(e=>{
        if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    },{root,threshold:.05});
    cards.forEach(c=>{ io.observe(c); if(isInView(c,root)) c.classList.add("is-visible"); });
    setTimeout(()=>{
      if(!document.querySelector(".card.is-visible")) cards.forEach(c=>c.classList.add("is-visible"));
    },300);
  }

  /* ===== ruler: long px track, year width depends on event count ===== */
  function buildRulerFixedTrack(items, {
    minYearPx = 180,            // 연도 최소 폭
    extraPerEventPx = 34,       // 이벤트 1개당 추가 폭
    minMonthPx = 10,            // 월 간격이 너무 좁아지지 않게
    padOldestMonths = 8,        // 가장 오래된 쪽에 약간 여백
    minExtraBeyondViewport = 320 // 큰 화면에서도 viewport보다 더 길게 만들기
  } = {}){
    const ticksEl = $("#ticks");
    const rulerEl = $(".ruler");
    if (!ticksEl || !rulerEl || !items?.length) return null;

    // newest to oldest 가정
    const newest = new Date(items[0].date + "T00:00:00");
    const oldest = new Date(items[items.length-1].date + "T00:00:00");

    const newestY = newest.getFullYear();
    const oldestY = oldest.getFullYear();

    // 연도별 이벤트 개수
    const countByYear = {};
    items.forEach(it=>{
      const y = new Date(it.date + "T00:00:00").getFullYear();
      countByYear[y] = (countByYear[y] || 0) + 1;
    });

    // 연도 세그먼트 생성 (이벤트 없는 연도는 제외)
    const years = [];
    for (let y = newestY; y >= oldestY; y--){
      const c = countByYear[y] || 0;
      if (c <= 0) continue;
      const w = Math.max(minYearPx, minYearPx + c * extraPerEventPx);
      years.push({ year: y, count: c, widthPx: w });
    }

    // 혹시 데이터가 한 해에만 몰려있는 경우 대비
    if (!years.length){
      years.push({ year: newestY, count: (countByYear[newestY] || 0), widthPx: minYearPx });
    }

    // 누적 x 범위 계산
    let acc = 0;
    years.forEach(seg=>{
      seg.x0 = acc;
      seg.x1 = acc + seg.widthPx;
      acc = seg.x1;
    });

    // 가장 오래된 쪽 패딩은 "개월" 단위로 뒤에 추가 (월 간격은 마지막 연도 기준)
    let approxPxPerMonthLast = Math.max(minMonthPx, years.at(-1).widthPx / 12);
    const padPx = Math.max(0, padOldestMonths) * approxPxPerMonthLast;

    // track 길이
    let trackW = Math.max(1, acc + padPx);

    // 큰 화면에서도 track이 viewport보다 확실히 길도록 보정
    const viewW = Math.max(1, rulerEl.getBoundingClientRect().width);
    const minTrackW = viewW + Math.max(0, minExtraBeyondViewport);
    if (trackW < minTrackW){
      const scale = minTrackW / trackW;
      years.forEach(seg=>{
        seg.widthPx *= scale;
      });
      acc = 0;
      years.forEach(seg=>{
        seg.x0 = acc;
        seg.x1 = acc + seg.widthPx;
        acc = seg.x1;
      });
      approxPxPerMonthLast = Math.max(minMonthPx, years.at(-1).widthPx / 12);
      trackW = Math.max(1, acc + Math.max(0, padOldestMonths) * approxPxPerMonthLast);
    }

    // 렌더
    ticksEl.innerHTML = "";
    ticksEl.style.width = trackW + "px";

    years.forEach(seg=>{
      const step = Math.max(minMonthPx, seg.widthPx / 12);

      for (let i=0; i<=12; i++){
        const x = seg.x0 + i * step;

        const t = document.createElement("div");
        t.className = "tick";
        t.style.left = x + "px";

        // year boundary는 해당 연도 시작점 (여기서는 i===12를 Jan 라인으로 취급)
        const isYearBoundary = (i === 12);
        if (isYearBoundary){
          t.classList.add("tick--year");
          t.dataset.year = String(seg.year);

          const lab = document.createElement("div");
          lab.className = "tick-label";
          lab.textContent = String(seg.year);
          lab.style.left = x + "px";
          lab.dataset.year = String(seg.year);
          ticksEl.appendChild(lab);
        }

        ticksEl.appendChild(t);
      }
    });

    // 맨 마지막(가장 오래된) 패딩 부분에도 작은 tick 몇 개 추가 (선택)
    if (padPx > 0){
      const baseX = acc;
      const step = Math.max(minMonthPx, approxPxPerMonthLast);
      const n = Math.floor(padPx / step);
      for (let i=1; i<=n; i++){
        const t = document.createElement("div");
        t.className = "tick";
        t.style.left = (baseX + i * step) + "px";
        ticksEl.appendChild(t);
      }
    }

    return {
      years,
      trackW,
      newestYear: years[0].year,
      oldestYear: years.at(-1).year,
      dateAtProgress(p){
        // progress -> 어느 연도 구간인지 역산
        const rp = Math.min(1, Math.max(0, p));
        const x = rp * trackW;

        // years 범위 내에서 찾기
        let seg = years.find(s => x >= s.x0 && x <= s.x1) || years.at(-1);
        const local = (x - seg.x0) / Math.max(1e-9, (seg.x1 - seg.x0));
        const monthIdx = 11 - Math.floor(Math.min(0.999999, Math.max(0, local)) * 12);
        return new Date(seg.year, monthIdx, 1);
      }
    };
  }

  /* ===== sync: card scroll drives ruler sliding + heart position ===== */
  function makeSyncSlidingTrack(model){
    if(!model) return;

    const wrap   = $("#news-wrap");
    const heart  = $("#indicator");
    const label  = $("#indicator-label");
    const rulerEl= $(".ruler");
    const ticksEl= $("#ticks");
    if (!wrap || !heart || !label || !rulerEl || !ticksEl) return;

    const getMaxScroll = () => Math.max(0, wrap.scrollWidth - wrap.clientWidth);

    function setProgress(p){
      const rp = Math.min(1, Math.max(0, p));

      // slide the long ticks track inside fixed viewport
      const viewW = Math.max(1, rulerEl.getBoundingClientRect().width);
      const maxShift = Math.max(0, model.trackW - viewW);
      const shiftX = rp * maxShift;

      ticksEl.style.transform = `translateX(${-shiftX}px)`;

      // heart moves within viewport
      const safe = Math.max(10, Math.floor((heart.clientWidth || 42) * 0.5));
      const x = safe + rp * (viewW - safe*2);

      heart.style.left = x + "px";
      label.style.left = x + "px";
      label.style.transform = "translateX(calc(-50% + var(--label-offset-x)))";

      const d = model.dateAtProgress(rp);
      label.textContent = d.toLocaleString("en-US",{month:"short",year:"numeric"}).toUpperCase();

      window.__newsHeart?.setProgress?.(rp);
    }

    let rAF = 0;
    function update(){
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(()=>{
        const maxScroll = getMaxScroll();
        const p = maxScroll ? (wrap.scrollLeft / maxScroll) : 0;
        setProgress(p);
      });
    }

    // init
    setProgress(0);

    wrap.addEventListener("scroll", update, { passive:true });
    window.addEventListener("resize", update, { passive:true });
    window.addEventListener("orientationchange", update, { passive:true });
    document.addEventListener("visibilitychange", update, { passive:true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update).catch(()=>{});
    window.addEventListener("load", update, { passive:true });

    return { updateUI: update, setProgress };
  }

  /* ===== Vertical-first row controller ===== */
  function makeVerticalLayoutController(){
    const grid = $("#news-grid");
    if (!grid) return { apply(){}, destroy(){} };

    const SAFE_PAD = 8;

    function getAvailableZoneH(){
      const headerH = cssNum("--header-h") || 56;
      const topGap  = cssNum("--grid-top") || 0;
      const rulerH  = cssNum("--ruler-h")  || 85;
      const extraBottom = cssNum("--cards-bottom-gap") || 0;
      const vh = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
      return Math.max(0, vh - (headerH + topGap) - (rulerH + SAFE_PAD + extraBottom));
    }

    function setRows(mode){
      grid.classList.toggle("one-row", mode === 1);
      grid.classList.toggle("two-row", mode === 2);
    }

    function apply(){
      const zoneH = getAvailableZoneH();
      document.documentElement.style.setProperty("--zone-h", `${zoneH}px`);

      const GAP      = cssNum("--grid-gap")   || 18;
      const ROW_MIN  = cssNum("--card-minh")  || 280;

      const SWITCH_NEED = ROW_MIN * 2 + GAP;
      const isNarrowW = window.innerWidth <= 880;
      const isShortH  = zoneH < SWITCH_NEED;

      if (isNarrowW || isShortH){
        setRows(1);
        document.documentElement.style.setProperty("--row-h", `${zoneH}px`);
      } else {
        const row = Math.floor((zoneH - GAP) / 2);
        setRows(2);
        document.documentElement.style.setProperty("--row-h", `${row}px`);
      }

      window.__newsSync?.updateUI?.();
    }

    const onResize = () => apply();
    window.addEventListener("resize", onResize, { passive:true });
    window.addEventListener("orientationchange", onResize, { passive:true });
    window.addEventListener("load", onResize, { passive:true });

    grid.querySelectorAll("img").forEach(img=>{
      if (!img.complete){
        img.addEventListener("load", apply,  { once:true });
        img.addEventListener("error", apply, { once:true });
      }
    });

    return {
      apply,
      destroy(){
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
        window.removeEventListener("load", onResize);
      }
    };
  }

  /* ===== wheel drag scroll ===== */
  function enableHScrollGestures(el){
    if (!el) return;

    el.addEventListener("wheel", (e)=>{
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.1;
      }
    }, { passive:false });

    let pid=null, startX=0, startLeft=0, dragging=false, movedPx=0;

    el.addEventListener("pointerdown", (e)=>{
      if (e.button !== 0) return;
      if (e.target.closest("a, button, input, textarea, select")) return;
      pid = e.pointerId;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      movedPx = 0;
      dragging = false;
    }, { passive:true });

    el.addEventListener("pointermove", (e)=>{
      if (pid == null) return;
      movedPx = Math.max(movedPx, Math.abs(e.clientX - startX));

      if (!dragging && movedPx > 8) {
        dragging = true;
        try { el.setPointerCapture(pid); } catch {}
        el.classList.add("is-dragging");
      }

      if (dragging) {
        el.scrollLeft = startLeft - (e.clientX - startX);
        e.preventDefault();
      }
    }, { passive:false });

    function endDrag(){
      if (pid != null) { try{ el.releasePointerCapture(pid); }catch(_){} }
      pid = null;
      dragging = false;
      el.classList.remove("is-dragging");
    }

    el.addEventListener("pointerup", endDrag, { passive:true });
    el.addEventListener("pointercancel", endDrag, { passive:true });
    el.addEventListener("mouseleave", endDrag, { passive:true });
  }

  /* ===== boot ===== */
  document.addEventListener("DOMContentLoaded", async ()=>{
    const header = $("header");
    const setHeaderVars = () => {
      const h = header ? header.offsetHeight : 56;
      document.documentElement.style.setProperty("--header-h", h + "px");
      document.documentElement.style.setProperty("--top-gap", (h + 8) + "px");
    };
    setHeaderVars();

    const grid = $("#news-grid");

    // load data
    let data = [];
    try{
      const res = await fetch("./current.data.json",{ cache:"no-store" });
      data = await res.json();
      if (!Array.isArray(data)) data = [];
    }catch(e){ console.error("Failed to load current.data.json", e); }

    if (!data.length){
      grid.innerHTML = `<div style="opacity:.7;padding:24px">No news items.</div>`;
      return;
    }

    data.sort((a,b)=> a.date < b.date ? 1 : -1);
    grid.innerHTML = data.map(makeCard).join("");

    setupReveal();

    // layout
    const layout = makeVerticalLayoutController();

    // ruler track build
    const model = buildRulerFixedTrack(data, {
      minYearPx: 180,
      extraPerEventPx: 34,
      minMonthPx: 10,
      padOldestMonths: 8,
      minExtraBeyondViewport: 320
    });

    // sync
    window.__newsSync = makeSyncSlidingTrack(model);

    // gestures
    enableHScrollGestures($("#news-wrap"));

    // first fit after images
    const firstFit = ()=>{
      layout.apply();
      window.__newsSync?.updateUI?.();
    };

    const imgs = grid.querySelectorAll("img");
    let pending = imgs.length;
    if (!pending) firstFit();
    imgs.forEach(img=>{
      if (img.complete){
        if (--pending === 0) firstFit();
      }else{
        img.addEventListener("load", ()=>{ if(--pending===0) firstFit(); }, { once:true });
        img.addEventListener("error",()=>{ if(--pending===0) firstFit(); }, { once:true });
      }
    });

    // resize
    const onResizeAll = ()=>{
      setHeaderVars();
      layout.apply();

      // resize 시 track이 viewport보다 짧아질 수 있어서 rebuild
      const rebuilt = buildRulerFixedTrack(data, {
        minYearPx: 180,
        extraPerEventPx: 34,
        minMonthPx: 10,
        padOldestMonths: 8,
        minExtraBeyondViewport: 320
      });
      window.__newsSync = makeSyncSlidingTrack(rebuilt);

      window.__newsSync?.updateUI?.();
    };

    window.addEventListener("resize", onResizeAll, { passive:true });
    window.addEventListener("orientationchange", onResizeAll, { passive:true });
    window.addEventListener("load", onResizeAll, { passive:true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResizeAll).catch(()=>{});

    setTimeout(onResizeAll, 0);
  });
})();
