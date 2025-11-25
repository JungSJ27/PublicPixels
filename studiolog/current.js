// ===============================
// News.js — vertical first, fixed-ratio cards, no scale glitch
// ===============================
(() => {
/* ===== helpers ===== */
const $  = (s, el=document)=> el.querySelector(s);
const $$ = (s, el=document)=> [...el.querySelectorAll(s)];
const clamp = (v,a,b)=> Math.min(b, Math.max(a,v));
const fmtMonYr = iso => new Date(iso+"T00:00:00")
  .toLocaleString("en-US",{month:"short",year:"numeric"}).toUpperCase();
const fmtMonYrFromMs = ms => new Date(ms)
  .toLocaleString("en-US",{month:"short",year:"numeric"}).toUpperCase();
const isFutureDate = iso => {
  if (!iso) return false;
  const d=new Date(iso+"T00:00:00");
  const today=new Date(); today.setHours(0,0,0,0);
  return d>today;
};
const cssNum = name =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

/* ===== cards ===== */
// News.js
function makeCard(item){
  const img = item.image
    ? `<img class="ph" src="${item.image}" alt="${item.title} preview" />`
    : `<div class="ph"></div>`;
  const futureClass = isFutureDate(item.date) ? ' card--future' : '';
  const placeBlock = item.location
    ? `<div class="fill" aria-hidden="true"></div><p class="place">${item.location}</p>`
    : '';

  // 핵심: article 대신 a.card 사용
  return `
    <a class="card${futureClass}" href="${item.href || '#'}" data-date="${item.date}" aria-label="${item.title}">
      <figure class="fig">${img}</figure>
      <p class="meta">${fmtMonYr(item.date)}</p>
      <h3>${item.title}</h3>
      ${placeBlock}
    </a>`;
}


/* ===== ruler (weighted ticks) ===== */
function buildRulerWeightedTicks(items, {
  minWeight = 0.5,
  padNewestMonths = 10,
  padOldestMonths = 10
} = {}){
  if (!items?.length) return null;

  const newestDate  = new Date(items[0].date);   // newest → oldest 가정
  const oldestDate  = new Date(items[items.length-1].date);

  const newestYear  = newestDate.getFullYear();
  const oldestYear  = oldestDate.getFullYear();
  const newestMonth = newestDate.getMonth();
  const oldestMonth = oldestDate.getMonth();

  // 연도별 개수 → 가중치
  const countByYear = {};
  items.forEach(it=>{
    const y = new Date(it.date).getFullYear();
    countByYear[y] = (countByYear[y] || 0) + 1;
  });

  const years = [];
  for(let y=newestYear; y>=oldestYear; y--){
    const c = countByYear[y] || 0;
    const w = c>0 ? c : minWeight;
    years.push({year:y, count:c, weight:w});
  }
  const totalW = years.reduce((s,r)=>s+r.weight, 0);
  let acc = 0;
  years.forEach(seg=>{
    seg.start = acc / totalW;
    seg.end   = (acc + seg.weight) / totalW;
    acc += seg.weight;
  });

  const byYear = new Map(years.map(s=>[s.year, s]));
  const monthToRaw = (y,m)=>{
    const seg = byYear.get(y); if(!seg) return null;
    const t = (11 - m)/12;  // Dec(11)=0 → Jan(0)=1
    return seg.start + t * (seg.end - seg.start);
  };

  // 실제 데이터 스팬
  const rawStart = monthToRaw(newestYear, newestMonth);
  const rawEnd   = monthToRaw(oldestYear, oldestMonth);
  const span     = Math.max(1e-9, rawEnd - rawStart);
  const norm     = r => (r - rawStart) / span;
  const denorm   = u => rawStart + u * span;

  // month +/- helper
  const addYM = (y,m,delta)=>{
    let tot = y*12 + m + delta;
    const ny = Math.floor(tot/12);
    const nm = ((tot%12)+12)%12;
    return {y:ny, m:nm};
  };

  // 눈금은 데이터 바깥까지
  const padStart = addYM(newestYear, newestMonth, +padNewestMonths);
  const padEnd   = addYM(oldestYear, oldestMonth, -padOldestMonths);

  const ticksEl = $('#ticks'); if(!ticksEl) return null;
  ticksEl.innerHTML = '';

  const newestStr = fmtMonYrFromMs(new Date(newestYear, newestMonth, 1).getTime());
  const oldestStr = fmtMonYrFromMs(new Date(oldestYear, oldestMonth, 1).getTime());

  for(let y=padStart.y, m=padStart.m;;){
    const r = monthToRaw(y,m);
    if (r!=null){
      const leftPct = norm(r) * 100;
      const isYearBoundary = (m===0);

      const t = document.createElement('div');
      t.className = 'tick' + (isYearBoundary ? ' tick--year' : '');
      t.style.left = leftPct + '%';
      ticksEl.appendChild(t);

      if (isYearBoundary){
        const lab = document.createElement('div');
        lab.className = 'tick-label';
        lab.textContent = String(y);
        lab.style.left = leftPct + '%';
        ticksEl.appendChild(lab);
      }
    }
    if (y===padEnd.y && m===padEnd.m) break;
    m -= 1; if (m<0){ y -= 1; m=11; }
  }

  return {
    years, monthToRaw, norm, denorm,
    labelMinRatio: 0, labelMaxRatio: 1,
    newestStr, oldestStr
  };
}

/* ===== reveal ===== */
function isInView(el, root){
  const rv=root?root.getBoundingClientRect():{left:0,width:window.innerWidth};
  const r=el.getBoundingClientRect();
  const left=r.left-(root?rv.left:0), right=left+r.width;
  return right>0 && left<(root?rv.width:window.innerWidth);
}
function setupReveal(){
  const cards=$$('.card'); if(!cards.length) return;
  if(!('IntersectionObserver' in window)){
    cards.forEach(c=>c.classList.add('is-visible')); return;
  }
  const root=$('#news-wrap');
  const io=new IntersectionObserver((ents)=>{
    ents.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  },{root,threshold:.05});
  cards.forEach(c=>{ io.observe(c); if(isInView(c,root)) c.classList.add('is-visible'); });
  setTimeout(()=>{ if(!document.querySelector('.card.is-visible')) cards.forEach(c=>c.classList.add('is-visible')); },300);
}

/* ===== heart + label sync ===== */
function makeSyncWeighted(model){
  if(!model) return;
  const wrap   = document.getElementById('news-wrap');   // 스크롤 컨테이너
  const grid   = document.getElementById('news-grid');   // 내용물
  const heart  = document.getElementById('indicator');
  const label  = document.getElementById('indicator-label');
  const rulerEl= document.querySelector('.ruler');
  const ticksEl= document.getElementById('ticks');
  if (!wrap || !grid || !heart || !label || !rulerEl || !ticksEl) return;

  const OVERSHOOT = Math.max(480, window.innerWidth * 0.6);
  const EDGE_SAFE_EXTRA = -30;

  function getBounds(){
    const rr = rulerEl.getBoundingClientRect();
    const tr = ticksEl.getBoundingClientRect();
    return { offset: tr.left - rr.left, width: tr.width, rulerW: rr.width };
  }
  const ratioToX = u => {
    const { offset, width } = getBounds();
    return offset + u * Math.max(1, width);
  };

  function labelTextAtX(x){
    const { offset, width } = getBounds();
    const w = Math.max(1, width);
    const u = (x - offset) / w;

    if (u <= 0)  return model.newestStr;
    if (u >= 1)  return model.oldestStr;

    const ratio = model.denorm ? model.denorm(u) : u;
    const seg = model.years.find(s => ratio >= s.start && ratio <= s.end)
             || model.years.find(s => ratio <= s.end) || model.years.at(-1);
    const local = (ratio - seg.start) / Math.max(1e-9, (seg.end - seg.start));
    const monthIdx = 11 - Math.floor(Math.min(0.999999, Math.max(0, local)) * 12);
    return new Date(seg.year, monthIdx, 1)
      .toLocaleString("en-US",{month:"short",year:"numeric"}).toUpperCase();
  }

  // 핵심: maxScroll을 wrap 기준으로 계산 (스케일/오버플로우 변화에 안전)
  const getMaxScroll = () => Math.max(0, wrap.scrollWidth - wrap.clientWidth);
  const edgeSafePx   = () => Math.max(-5, Math.floor(heart.clientWidth/2) + EDGE_SAFE_EXTRA);

  function placeByProgress(p){
    const { rulerW } = getBounds();
    const safe = edgeSafePx();

    const xLeftSnap  = ratioToX(model.labelMinRatio ?? 0);
    const xRightSnap = ratioToX(model.labelMaxRatio ?? 1);

    const minX = Math.max(safe,          xLeftSnap  - OVERSHOOT);
    const maxX = Math.min(rulerW - safe, xRightSnap + OVERSHOOT);

    const x = minX + p * (maxX - minX);
    heart.style.left = x + 'px';
    label.style.left = x + 'px';
    label.style.transform = 'translateX(calc(-50% + var(--label-offset-x)))';

    if (p <= 0.001) label.textContent = model.newestStr;
    else if (p >= 0.999) label.textContent = model.oldestStr;
    else label.textContent = labelTextAtX(x);
  }

  let rAF = 0;
  function update(){
    cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(()=>{
      const maxScroll = getMaxScroll();
      const pRaw = maxScroll ? (wrap.scrollLeft / maxScroll) : 0;
      const p = Math.min(1, Math.max(0, pRaw));
      placeByProgress(p);
      window.__newsHeart?.setProgress?.(p);
    });
  }

  placeByProgress(0);
  window.__newsHeart?.setProgress?.(0);

  // 리스너
  wrap.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update, { passive:true });
  document.addEventListener('visibilitychange', update, { passive:true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update).catch(()=>{});
  window.addEventListener('load', update, { passive:true });

  // 키/휠 보조
  window.addEventListener('wheel', update, { passive:true });
  window.addEventListener('keydown', e=>{
    if (["ArrowLeft","ArrowRight","Home","End","PageUp","PageDown"].includes(e.key)) update();
  }, { passive:true });

  return { updateUI: update };
}

/* ===== Vertical-first row controller =====
   세로 px 기준으로 1열 또는 2열을 결정
   카드 영역은 헤더 아래 ~ 룰러 위까지 꽉 채움
*/
function makeVerticalLayoutController(){
  const wrap = $('#news-wrap');
  const grid = $('#news-grid');
  if (!wrap || !grid) return { apply(){}, destroy(){} };

  const SAFE_PAD = 8;

  function getAvailableZoneH(){
    const headerH = cssNum('--header-h') || 56;
    const topGap  = cssNum('--grid-top') || 0;
    const rulerH  = cssNum('--ruler-h')  || 85;
    const extraBottom = cssNum('--cards-bottom-gap') || 0;
    const vh = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
    return Math.max(0, vh - (headerH + topGap) - (rulerH + SAFE_PAD + extraBottom));
  }

  function setRows(mode){
    grid.classList.toggle('one-row', mode === 1);
    grid.classList.toggle('two-row', mode === 2);
  }

  function apply(){
  const zoneH = getAvailableZoneH();
  document.documentElement.style.setProperty('--zone-h', `${zoneH}px`);

  const GAP      = cssNum('--grid-gap')   || 18;
  const ROW_MIN  = cssNum('--card-minh')  || 280;

  // 세로가 두 줄 만들기에 모자라면 1줄
  const SWITCH_NEED = ROW_MIN * 2 + GAP;

  const isNarrowW = window.innerWidth <= 880;
  const isShortH  = zoneH < SWITCH_NEED;

  if (isNarrowW || isShortH){
    setRows(1);
    document.documentElement.style.setProperty('--row-h', `${zoneH}px`);
  } else {
    const row = Math.floor((zoneH - GAP) / 2);
    setRows(2);
    document.documentElement.style.setProperty('--row-h', `${row}px`);
  }

  const grid = document.getElementById('news-grid');
  if (grid) grid.style.transform = 'none';
  window.__newsSync?.updateUI?.();
}


  const onResize = () => apply();
  window.addEventListener('resize', onResize, { passive:true });
  window.addEventListener('orientationchange', onResize, { passive:true });
  window.addEventListener('load', onResize, { passive:true });

  grid.querySelectorAll('img').forEach(img=>{
    if (!img.complete){
      img.addEventListener('load', apply,  { once:true });
      img.addEventListener('error', apply, { once:true });
    }
  });

  return {
    apply,
    destroy(){
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('load', onResize);
    }
  };
}


// =============================================
// boot — 렌더 → 리빌 → 룰러/하트 → 레이아웃/스케일 → 리스너
// =============================================
document.addEventListener('DOMContentLoaded', async ()=>{
  // A. 헤더 높이 → CSS 변수 반영
  const header = document.querySelector('header');
  const setHeaderVars = () => {
    const h = header ? header.offsetHeight : 56;
    document.documentElement.style.setProperty('--header-h', h + 'px');
    document.documentElement.style.setProperty('--top-gap', (h + 8) + 'px');
  };
  setHeaderVars();

  const grid = document.getElementById('news-grid');

  // B. 데이터 로드/렌더
  let data = [];
  try{
    const res = await fetch('./current.data.json',{ cache:'no-store' });
    data = await res.json();
    if (!Array.isArray(data)) data = [];
  }catch(e){ console.error('Failed to load News.data.json', e); }

  if (!data.length){
    grid.innerHTML = `<div style="opacity:.7;padding:24px">No news items.</div>`;
  }else{
    data.sort((a,b)=> a.date < b.date ? 1 : -1); // newest → oldest
    grid.innerHTML = data.map(makeCard).join('');
  }

  // C. 리빌
  setupReveal();

  // D. 룰러/하트 세팅(전역 저장)
  let model = null;
  try{
    model = buildRulerWeightedTicks(data, {
      minWeight: 0.5, padNewestMonths: 10, padOldestMonths: 10
    });
    window.__newsSync = makeSyncWeighted(model);   // <- 전역
  }catch(e){ console.error('[ruler/sync init error]', e); }

  // E. 세로 우선 레이아웃 컨트롤러
  const layout = makeVerticalLayoutController();

  // F. 높이 맞춰 스케일(세로 꽉 채움)
  window.fitNewsGridByScale = function fitNewsGridByScale(){
    const wrap = document.getElementById('news-wrap');
    const grid = document.getElementById('news-grid');
    if(!wrap || !grid) return;

    const cssVar = n => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)) || 0;
    const headerH = cssVar('--header-h') || 56;
    const gridTop = cssVar('--grid-top') || 30;
    const rulerH  = cssVar('--ruler-h')  || 85;
    const availH  = Math.max(0, window.innerHeight - (headerH + gridTop) - (rulerH + 8));

    // zone 고정
    document.documentElement.style.setProperty('--zone-h', `${availH}px`);

    // 자연 높이 측정
    const prev = grid.style.transform;
    grid.style.transform = 'none';
    void grid.offsetHeight; // reflow
    const naturalH = grid.getBoundingClientRect().height;
    grid.style.transform = prev;

    if (naturalH > 0){
      const s = availH / naturalH;
      const sClamped = Math.max(0.65, Math.min(3.0, s));
      grid.style.transformOrigin = '0 0';
      grid.style.transform = `scale(${sClamped})`;
    }
  };

  // 최초 맞춤
  const firstFit = ()=>{
    layout.apply();
    window.__newsSync?.updateUI?.();
  };

  // ===== wheel/drag → horizontal scroll =====
  function enableHScrollGestures(el){
  if (!el) return;

  // 세로 휠 → 가로 스크롤
  el.addEventListener('wheel', (e)=>{
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.1;
    }
  }, { passive:false });

  let pid=null, startX=0, startLeft=0, dragging=false, movedPx=0;

  el.addEventListener('pointerdown', (e)=>{
    // 좌클릭만, a/button/input 위 클릭은 기본 동작 우선
    if (e.button !== 0) return;
    if (e.target.closest('a, button, input, textarea, select')) return;

    pid = e.pointerId;
    startX = e.clientX;
    startLeft = el.scrollLeft;
    movedPx = 0;
    dragging = false;
    // ❌ 여기서는 setPointerCapture 하지 않음 (클릭 살리기)
  }, { passive:true });

  el.addEventListener('pointermove', (e)=>{
    if (pid == null) return;

    movedPx = Math.max(movedPx, Math.abs(e.clientX - startX));

    // 드래그로 판정되는 순간에만 캡처 시작
    if (!dragging && movedPx > 8) {
      dragging = true;
      try { el.setPointerCapture(pid); } catch {}
      el.classList.add('is-dragging');
    }

    if (dragging) {
      el.scrollLeft = startLeft - (e.clientX - startX);
      e.preventDefault(); // 드래그일 때만 기본 막음
    }
  }, { passive:false });

  function endDrag(e){
    if (pid != null) { try{ el.releasePointerCapture(pid); }catch(_){} }

    // 드래그가 아니면: 아무 것도 하지 않음 → 기본 클릭이 그대로 동작
    // 드래그였다면: 클래스만 정리
    pid = null;
    dragging = false;
    el.classList.remove('is-dragging');
  }

  el.addEventListener('pointerup', endDrag, { passive:true });
  el.addEventListener('pointercancel', endDrag, { passive:true });
  el.addEventListener('mouseleave', endDrag, { passive:true });
}


  // DOMContentLoaded 내부에서…
  enableHScrollGestures(document.getElementById('news-wrap'));

  // 이미지가 모두 준비되면 한 번 더
  const imgs = grid.querySelectorAll('img');
  let pending = imgs.length;
  if (!pending) firstFit();
  imgs.forEach(img=>{
    if (img.complete){
      if (--pending === 0) firstFit();
    }else{
      img.addEventListener('load', ()=>{ if(--pending===0) firstFit(); }, { once:true });
      img.addEventListener('error',()=>{ if(--pending===0) firstFit(); }, { once:true });
    }
  });

  // H. 리스너 — 여기만 기억해
  const onResizeAll = ()=>{
    setHeaderVars();          // 헤더 변화 반영
    layout.apply();           // 1↔2열 재판정
   //window.fitNewsGridByScale(); // 세로 꽉 채우기
    window.__newsSync?.updateUI?.(); // 하트 위치 재계산
  };
  window.addEventListener('resize', onResizeAll, { passive:true });
  window.addEventListener('orientationchange', onResizeAll, { passive:true });
  window.addEventListener('load', onResizeAll, { passive:true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResizeAll).catch(()=>{});

  // I. 마지막 안전망
  setTimeout(onResizeAll, 0);
});
})();

