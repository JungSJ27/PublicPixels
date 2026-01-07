// ===== Section 4: 연속 트랙 + 중앙 강조 + 비순환 + 마지막 CTA =====

const NEWS = [
  {
    hero: "studiolog/secass4/NewsKorUS.png",
    href: "studiolog/log/202606/",
    bg: "#0a0a0a",
    title: "-",
    host:  "-",
    when:  "JUN 2026",
    where: "Seoul, South Korea",
    rw:6, rh:7, shift:0
  },
  {
    hero: "studiolog/secass4/NewsAfterlives.jpg",
    href: "studiolog/log/202505.N2/",
    bg:   "#0a0a0a",
    title: "Afterlives",
    host: "Digital Arts, Pratt Institute",
    when:  "May 19, 2025",
    where: "New york, USA ",
    rw:6, rh:7, shift:0
  },
  {
    hero: "studiolog/secass4/NewsMetaMorphosis.png",
    href: "studiolog/log/202505.N1/",
    bg:   "#0a0a0a",
    title: "Meta-Morphosis",
    host: "Digital Arts, Pratt Institute",
    when:  "May 12, 2025",
    where: "New York, USA",
    cta:  "studiolog/",
    rw:6, rh:7, shift:0
  }
];

// 유틸
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function renderS4(){
  const root  = document.getElementById("section4");
  const track = document.getElementById("s4-track");
  if (!root || !track) return;

  // 트랙 비우고 새로 구성
  track.innerHTML = "";
  const N = NEWS.length;

  for (let i = 0; i < N; i++){
    const it = NEWS[i];
    const li = document.createElement("li");
    li.className = "s4__slide";
    li.dataset.rw    = it.rw ?? "";
    li.dataset.rh    = it.rh ?? "";
    li.dataset.shift = it.shift ?? "";
    if (i === N - 1) li.dataset.link = it.cta || "studiolog/";

    li.innerHTML = `
      <div class="s4__bg" style="background:${it.bg || '#0a0a0a'}"></div>
      <a class="s4__heroLink" href="${it.href || '#'}" aria-label="${(it.title || 'Event') + ' — details'}">
        <div class="s4__heroPh" style="background-image:url('${it.hero}')"></div>
        <div class="s4__meta">
          <div class="s4__metaL">
            ${(it.when  || '').replaceAll('\\n','\n')}
            \n${(it.where || '').replaceAll('\\n','\n')}
          </div>
          <div class="s4__metaR">
            ${(it.title || '').replaceAll('\\n','\n')}
            \n${(it.host  || '').replaceAll('\\n','\n')}
          </div>
        </div>
      </a>
    `;
    track.appendChild(li);
  }

  // 화살표 주입 (없을 때만)
  if (!root.querySelector('.s4__sep--left')) {
    const nav = document.createElement('div');
    nav.className = 's4__nav';
    nav.innerHTML = `
      <button class="s4__sep s4__sep--left"  type="button" aria-label="Previous">‹</button>
      <button class="s4__sep s4__sep--right" type="button" aria-label="Next">›</button>
    `;
    root.appendChild(nav);
  }

  makeTrainCarousel(root);
}

// 기차형 캐러셀
function makeTrainCarousel(root){
  const frame  = $(".s4__frame") || root;  // 프레임 역할
  const track  = $("#s4-track", root);
  const slides = $$(".s4__slide", track);
  if (!slides.length) return;

  const btnPrev = root.querySelector(".s4__sep--left");
  const btnNext = root.querySelector(".s4__sep--right");

  // 스타일 파라미터 읽기
  function getScaleMin(){
    const cs = getComputedStyle(document.documentElement);
    const v = parseFloat(cs.getPropertyValue("--scale-min"));
    return Number.isFinite(v) ? v : 0.82;
  }

  // 헬퍼
  const slideRect = el => el.getBoundingClientRect();
  const centerX   = el => {
    const r = slideRect(el);
    return r.left + r.width / 2;
  };
  const frameCenterX = () => {
    const r = frame.getBoundingClientRect();
    return r.left + r.width / 2;
  };

  // 트랙 위치 상태
  let iActive = 0;
  let trackX = 0;      // px
  function setTrackX(px){
    trackX = px;
    // 데스크탑/모바일 변수 둘 다 지원
    const cs = getComputedStyle(root);
    const y = cs.getPropertyValue("--m-track-shift").trim() || cs.getPropertyValue("--track-shift").trim() || "0px";
    track.style.transform = `translate3d(${px}px, ${y}, 0)`;
  }
  function xToCenterIndex(idx){
    // idx 슬라이드 중심이 프레임 중앙에 오도록 필요한 이동량
    const sc = frameCenterX();
    const cc = centerX(slides[idx]);
    return trackX + (sc - cc);
  }

  // 중앙 강조
  function updateScales(){
    const sc = frameCenterX();
    slides.forEach((el) => {
      const c = centerX(el);
      const w = slideRect(el).width;
      const dist = Math.abs(c - sc);
      const t = Math.min(1, dist / (w * 0.95));         // 0..1
      const smin = getScaleMin();
      const scale = 1 - (1 - smin) * t;
      const alpha = 1 - 0.15 * t;
      el.style.setProperty("--scale", scale.toFixed(3));
      el.style.setProperty("--alpha", alpha.toFixed(3));
      el.style.zIndex = String(1000 - Math.round(dist));
    });

    // 현재 슬라이드 변수 반영
    const cur = slides[iActive];
    if (cur){
      const rw = cur.dataset.rw, rh = cur.dataset.rh, sh = cur.dataset.shift;
      if (rw) root.style.setProperty("--rw", rw);
      if (rh) root.style.setProperty("--rh", rh);
      root.style.setProperty("--hero-shift-x", `${Number(sh)||0}%`);
    }
  }

  // 네비 상태 (1번 숨김, 마지막은 » 로)
  function setNavState(){
    const atFirst = iActive === 0;
    const atLast  = iActive === slides.length - 1;

    root.classList.toggle('is-first', atFirst);
    
    root.classList.toggle('is-last', atLast);

    if (btnPrev){
      btnPrev.style.visibility = atFirst ? 'hidden' : 'visible';
      btnPrev.tabIndex = atFirst ? -1 : 0;
      btnPrev.onclick = atFirst ? null : () => snapTo(iActive - 1, true);
    }
    if (btnNext){
      if (atLast){
        btnNext.textContent = '»';
        btnNext.setAttribute('aria-label', 'Open all news');
        btnNext.onclick = () => {
          const href = slides[slides.length - 1]?.dataset?.link || 'studiolog/';
          window.location.assign(href);
        };
      } else {
        btnNext.textContent = '›';
        btnNext.setAttribute('aria-label', 'Next');
        btnNext.onclick = () => snapTo(iActive + 1, true);
      }
      btnNext.style.visibility = 'visible';
      btnNext.tabIndex = 0;
    }
  }

  // 스냅
  function snapTo(idx, animate = true){
    iActive = Math.max(0, Math.min(slides.length - 1, idx));
    const toX = xToCenterIndex(iActive);
    track.style.transition = animate ? "transform .45s cubic-bezier(.22,.61,.36,1)" : "none";
    setTrackX(toX);
    const done = () => {
      track.style.transition = "none";
      updateScales();
      setNavState();
    };
    if (animate){
      track.addEventListener("transitionend", done, {once:true});
    }else{
      done();
    }
  }

  // 드래그
  let dragging = false, startX = 0, baseX = 0, dx = 0;
  function onDown(e){
    if (e.target.closest(".s4__sep")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    startX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
    baseX = trackX;
    track.style.transition = "none";
  }
  function onMove(e){
    if (!dragging) return;
    const x = e.clientX ?? (e.touches && e.touches[0].clientX) ?? startX;
    dx = x - startX;
    // 가장자리에서 저항감
    const atFirst = iActive === 0 && dx > 0;
    const atLast  = iActive === slides.length - 1 && dx < 0;
    const damp = (atFirst || atLast) ? 0.35 : 1;
    setTrackX(baseX + dx * damp);
    updateScales();
  }
  function onUp(){
    if (!dragging) return;
    dragging = false;

    // 마지막에서 왼쪽으로 넘기면 CTA 이동
    if (iActive === slides.length - 1 && dx < -10) {
      const href = slides[slides.length - 1]?.dataset?.link || "studiolog/";
      window.location.assign(href);
      return;
    }
    const width = slideRect(slides[iActive]).width;
    const threshold = Math.max(40, width * 0.12);
    if (dx <= -threshold) iActive++;
    else if (dx >= threshold) iActive--;
    snapTo(iActive, true);
  }

  // 포인터/터치
  frame.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  frame.addEventListener("touchstart", onDown, {passive:true});
  frame.addEventListener("touchmove", onMove, {passive:true});
  frame.addEventListener("touchend", onUp, {passive:true});
  frame.addEventListener("touchcancel", onUp, {passive:true});

  // 키보드
  if (!frame.hasAttribute("tabindex")) frame.tabIndex = 0;
  frame.addEventListener("keydown", (e)=>{
    if (e.key === "ArrowLeft")  snapTo(iActive - 1, true);
    if (e.key === "ArrowRight"){
      if (iActive === slides.length - 1){
        const href = slides[slides.length - 1]?.dataset?.link || "studiolog/";
        window.location.assign(href);
      } else {
        snapTo(iActive + 1, true);
      }
    }
  });

  // 리사이즈 안정화 (디바운스 + 이중 재스냅)
  let rezTimer = null;
  window.addEventListener("resize", () => {
    if (rezTimer) clearTimeout(rezTimer);
    rezTimer = setTimeout(() => {
      snapTo(iActive, false);
      setTimeout(() => snapTo(iActive, false), 80);
    }, 50);
  }, { passive:true });

  // 초기 정렬: 두 프레임 지연 + 안전 재스냅
  const initCenter = () => snapTo(0, false);
  requestAnimationFrame(() => requestAnimationFrame(initCenter));
  setTimeout(initCenter, 120);

  // 초기 네비 상태
  setNavState();
}

document.addEventListener("DOMContentLoaded", renderS4);

// ===== 구형 브라우저 비율 폴백(그대로 유지) =====
(function keepS4Ratio(){
  const root  = document.getElementById('section4');
  const stage = root?.querySelector('.s4__stage');
  if(!root || !stage) return;

  const okSVH = CSS.supports?.('height', '100svh');
  const okMin = CSS.supports?.('width', 'min(100svw, 100px)');
  if (okSVH && okMin) return;

  const readRatio = ()=>{
    const cs = getComputedStyle(root);
    const rw = parseFloat(cs.getPropertyValue('--ratio-w')) || 20;
    const rh = parseFloat(cs.getPropertyValue('--ratio-h')) || 9;
    return rw / rh;
  };
  const fit = ()=>{
    const ratio = readRatio();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w  = Math.min(vw, vh * ratio);
    const h  = w / ratio;
    stage.style.width  = w + 'px';
    stage.style.height = h + 'px';
  };

  window.addEventListener('resize', fit, { passive:true });
  window.addEventListener('orientationchange', fit, { passive:true });
  fit();
})();
