  import { Heart3D } from './heart3D.s3.js';
  import { toggle as cartToggle, add as cartAdd, remove as cartRemove,
           getItems as cartGetItems, onChange as onCartChange } from "/front/cartstore.js";

/* =================== Cart (object store, single-bridge) =================== */
const LS_KEY = 'pp.cart';
const getCart = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
};
const setCart = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));
const inCart  = (id) => getCart().some(x => String(x.id) === String(id));

function addCart(item){                 // {id,title,price,thumb,qty}
  const map = new Map(getCart().map(x => [String(x.id), x]));
  map.set(String(item.id), { ...(map.get(String(item.id))||{}), ...item });
  const arr = [...map.values()];
  setCart(arr);
  window.dispatchEvent(new CustomEvent('cart:add', { detail:item }));
  window.Cart?.addItem?.(item);   // 카트에 실제로 반영
  window.Cart?.open?.();          // 지원하면 드로어 열기
  if (!window.Cart) console.info('[HeartFX] Cart API not found — using events only.');
  return arr;
}
function removeCart(id){
  id = String(id);
  const arr = getCart().filter(x => String(x.id) !== id);
  setCart(arr);
  window.dispatchEvent(new CustomEvent('cart:remove', { detail:{ id } }));
  window.Cart?.removeItem?.(id);
  return arr;
}

/* =================== Heart injection =================== */
function injectHearts(){
  document.querySelectorAll('.card').forEach(card=>{
    const id = card.dataset.id || '';
    // ⓐ 헤더 래퍼 보장 (.card__head) — 타이틀은 왼쪽, 버튼은 오른쪽 정렬
    let head = card.querySelector('.card__head');
    const titleEl = card.querySelector('.card__title');
    if (!titleEl) return;

    if (!head){
      head = document.createElement('div');
      head.className = 'card__head';
      titleEl.replaceWith(head);
      head.appendChild(titleEl);
    }

    // ⓑ 버튼 중복 생성 방지
    if (head.querySelector('.heart-button')) return;

    // ⓒ 버튼 생성 (중앙 24px 아이콘, 원은 40px)
    const btn = document.createElement('button');
    btn.className = 'heart-button';
    btn.setAttribute('aria-label','Toggle favorite');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" class="heart-icon" aria-hidden="true">
        <defs>
          <!-- 가장자리 비네트: 중앙 밝음 → 가장자리 어둠 -->
          <radialGradient id="heartShade" cx="50%" cy="45%" r="72%">
            <stop offset="20%"   stop-color="rgba(0,0,0,0.05)"/>
            <stop offset="40%"  stop-color="rgba(0,0,0,0.09)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
          </radialGradient>

          <!-- 하트 모양 내부 글로우(하트 경로를 축소+블러) -->
          <filter id="innerGlow" filterUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="b"/>
          </filter>
        </defs>

        <!-- 테두리 -->
        <path class="stroke"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
            C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
            c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>

        <!-- 1) 가장자리 어둡게(비네트) -->
        <path class="fill" fill="url(#heartShade)"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
            C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
            c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>

        <!-- 2) 하트 모양 내부 글로우(하트 경로를 중심 기준으로 축소 후 블러) -->
        <path class="glow" filter="url(#innerGlow)"
          transform="translate(12,12) scale(0.86) translate(-12,-12)"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
            C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
            c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;


    // 버튼 위치 미세조정: 글로벌/개별 둘 다 가능
    // (CSS에서 translate: var(--heart-x,0) var(--heart-y,0) 가 적용됨)
    if (card.dataset.heartX) btn.style.setProperty('--heart-x', card.dataset.heartX);
    if (card.dataset.heartY) btn.style.setProperty('--heart-y', card.dataset.heartY);

    head.appendChild(btn);

    const inCartNow = cartGetItems().some(x => String(x.id) === String(id));
    if (inCartNow){ btn.classList.add('is-on'); ensure3D(btn, card, id); }


  // 전역 카트 변경시 동기화 (다른 UI/탭에서 바뀌어도 즉시 반영)
  if (!window.__heartCartSyncBound){
    window.__heartCartSyncBound = true;
    onCartChange(({items})=>{
      document.querySelectorAll('.card').forEach(c=>{
        const cid = String(c.dataset.id || '');
        if (!cid) return;
        const on = items.some(x => String(x.id) === cid);
        const b = c.querySelector('.heart-button');
        if (!b) return;
        if (on){ b.classList.add('is-on'); ensure3D(b, c, cid); }
        else{
          b.classList.remove('is-on');
          if (b._heart3D){ b._heart3D.dispose(); b._heart3D = null; }
          b.querySelector('canvas.heart-canvas')?.remove();
        }
      });
    });
  }  
  
  // 토글 동작
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
    // 토글 = CartStore에 위임 (true=추가, false=제거)
    const title = card.querySelector('.card__title')?.textContent?.trim() || id;
    const price = Number(card.getAttribute('data-price') || 0);
    const thumb = card.querySelector('.card__img')?.getAttribute('src') || '';
    const nowOn = cartToggle({ id, title, price, media: thumb, type:"product" });
    if (nowOn){
    btn.classList.add('is-on');
    ensure3D(btn, card, id);           // 빈 버튼 방지
    }else{
    if (btn._heart3D){ btn._heart3D.dispose(); btn._heart3D=null; }
    btn.querySelector('canvas.heart-canvas')?.remove();
    btn.classList.remove('is-on');
    perfume(btn);
    }
    });
  });
}

  /* =================== 3D 보장 (레이아웃 안정화 + 재시도) =================== */
function ensure3D(btn, card, id){
  if (btn._heart3D) return;

  const icon = btn.querySelector('.heart-icon') || btn;

  // 측정 + 1~5회 재시도 유틸
  const tryMount = (attempt = 0) => {
    const rect = icon.getBoundingClientRect();
    const ok = rect.width >= 2 && rect.height >= 2;

    // 더 안전하게: 마지막까지 0이면 기본값 사용
    const w = ok ? rect.width : 28;
    const h = ok ? rect.height: 28;

    // 캔버스 준비
    let canvas = btn.querySelector('canvas.heart-canvas');
    if (!canvas){
      canvas = document.createElement('canvas');
      canvas.className = 'heart-canvas';
      btn.appendChild(canvas);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width  = Math.max(2, Math.round(w * dpr));
    canvas.height = Math.max(2, Math.round(h * dpr));

    if (!ok && attempt < 5){
      // 레이아웃이 아직이면 다음 프레임에 재시도
      requestAnimationFrame(()=> tryMount(attempt + 1));
      return;
    }

    // 여기서부터 Heart3D 생성
    Heart3D.loadModel(model=>{
      // 이미 다른 재시도가 붙였으면 중복 방지
      if (btn._heart3D) return;

      const h3 = new Heart3D(canvas, model);
      btn._heart3D = h3;

      // 정면 정렬 + 가벼운 wobble
      safeStopSpin(h3);
      h3.start?.();

      const FRONT_DEG = 90;
      const FRONT_YAW = FRONT_DEG * Math.PI / 180;
      setFront(h3, FRONT_YAW);
      wobbleAlign(h3, { cycles: 2, base: FRONT_YAW });

      startTwinkleFor(btn);
      btn.classList.add('is-on');

      // 리사이즈 시에도 0 사이즈 방지
      const onResize = () => {
        const r = icon.getBoundingClientRect();
        const ok2 = r.width >= 2 && r.height >= 2;
        const d = Math.min(window.devicePixelRatio || 1, 2);
        const W = ok2 ? r.width : 28;
        const H = ok2 ? r.height: 28;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width  = Math.max(2, Math.round(W * d));
        canvas.height = Math.max(2, Math.round(H * d));
      };
      // 버튼에 달아두면 GC될 때 같이 정리됨
      btn._heartResize = onResize;
      window.addEventListener('resize', onResize);
    });
  };

  tryMount(0);
}

/* 내부 스핀 억제 (그대로) */
function safeStopSpin(h){
  if ('spin' in h) try{ h.spin = 0; }catch{}
  if (typeof h.setSpin === 'function') try{ h.setSpin(0); }catch{}
  if (typeof h.stop === 'function') try{ h.stop(); }catch{}
}
function setFront(h, yaw = 0){
  try{ h.model.rotation.y = yaw; h.frontYaw = yaw; }catch{}
}
function wobbleAlign(h, { cycles = 2, base = 0 } = {}){
  const amp = 0.14;
  const steps = [-1, +0.8, -0.5, +0.25, 0];
  let cycle = 0;
  const runOne = ()=>{
    const kf = steps.map(v => base + v * amp);
    tweenRotationY(h, kf, [120,100,100,120,160], ()=>{
      if (++cycle < cycles) runOne(); else setFront(h, base);
    });
  };
  runOne();
}
function tweenRotationY(h, values, durations, onEnd){
  let i = 0; const model = h.model;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const step = (from, to, ms, cb)=>{
    const t0 = performance.now();
    const loop = t=>{
      const k = Math.min(1, (t - t0)/ms);
      const e = easeOutCubic(k);
      model.rotation.y = from + (to - from) * e;
      if (k < 1) requestAnimationFrame(loop); else cb && cb();
    };
    requestAnimationFrame(loop);
  };
  const run = ()=>{
    if (i === 0){ model.rotation.y = values[0]; i = 1; }
    if (i >= values.length){ onEnd && onEnd(); return; }
    const from = model.rotation.y;
    const to   = values[i];
    const ms   = durations[Math.min(i-1, durations.length-1)] || 120;
    i++; step(from, to, ms, run);
  };
  run();
}


  // ===== 카트 전역 이벤트와 하트 동기화 =====
  window.addEventListener('cart:add', (e)=>{
    const id = String(e.detail?.id ?? '');
    if (!id) return;
    const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
    const btn  = card?.querySelector('.heart-button');
    if (!btn) return;
    btn.classList.add('is-on');
    ensure3D(btn, card, id);
  });
  window.addEventListener('cart:remove', (e)=>{
    const id = String(e.detail?.id ?? '');
    if (!id) return;
    const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
    const btn  = card?.querySelector('.heart-button');
    if (!btn) return;
    if (btn._heart3D){
      btn._heart3D.dispose(); btn._heart3D = null;
      btn.querySelector('canvas.heart-canvas')?.remove();
    }
    btn.classList.remove('is-on');
    stopTwinkleFor(btn);      // ← 추가
    perfume(btn, { count:5, hue:330 })
  });

  /* =================== FX: perfume =================== */
  function perfume(btn, opts = {}){
  const icon = btn.querySelector('.heart-icon') || btn;
  const r    = icon.getBoundingClientRect();
  const x    = r.left + r.width  * 0.5;
  const y    = r.top  + r.height * 0.4;

  const root = document.createElement('div');
  root.className = 'heart-plume';
  root.style.left = x + 'px';
  root.style.top  = y + 'px';

  const n = opts.count ?? 4;
  for (let i=0;i<n;i++){
    const w = document.createElement('div');
    w.className = 'wisp';
    const hue = opts.hue ?? 155; // green-mint
    const sat = opts.sat ?? 70;
    const lig = opts.lig ?? 88;
    w.style.setProperty('--w', `oklch(${lig}% ${sat/100*0.15} ${hue})`);
    const dx = (Math.random()*10 - 5);   // 좌우 출발 편차
    const rot = (-10 + Math.random()*20) + 'deg';
    w.style.setProperty('--rot', rot);
    w.style.left = dx + 'px';
    w.style.animation = `wisp-up ${600 + Math.random()*400}ms ease-out ${i*70}ms forwards`;
    root.appendChild(w);
  }
  document.body.appendChild(root);
  setTimeout(()=> root.remove(), 1200);
  }

  /* =================== boot =================== */
  function run(){ injectHearts(); }
  document.addEventListener('productsRendered', run);
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
  const grid = document.getElementById('grid');
  if (grid){ new MutationObserver(()=>injectHearts()).observe(grid, { childList:true }); }

  function bootTwinkleOnce(){
  if (window.__twinkleStarted) return;
  window.__twinkleStarted = true;
  window.stopIdleTwinkles = startIdleTwinklesBody();
  }

  document.addEventListener('DOMContentLoaded', bootTwinkleOnce);
  document.addEventListener('productsRendered', bootTwinkleOnce);


  /* =================== Public API: 버튼 위치 넛지 =================== */
  window.HeartUI = {
    setNudge(x='0px', y='0px'){
      document.documentElement.style.setProperty('--heart-x', x);
      document.documentElement.style.setProperty('--heart-y', y);
    }
  };


   /* ===== sparkle util (버튼 안에 붙이는 버전) ===== */
function sparkle(btn, opts = {}){
  const icon = btn.querySelector('.heart-icon') || btn;
  if (!icon) return;

  const rBtn  = btn.getBoundingClientRect();
  const rIcon = icon.getBoundingClientRect();

  const relX = opts.relX ?? 0.78;
  const relY = opts.relY ?? 0.22;

  const x = (rIcon.left - rBtn.left) + rIcon.width  * relX + (opts.offsetX || 0);
  const y = (rIcon.top  - rBtn.top)  + rIcon.height * relY + (opts.offsetY || 0);

  const s = document.createElement('div');
  s.className = 'heart-sparkle';
  if (opts.style) s.dataset.style = opts.style;          // 'tall' or 'soft'
  if (opts.vThick) s.style.setProperty('--ray-v-thick', `${opts.vThick}px`);
  if (opts.hThick) s.style.setProperty('--ray-h-thick', `${opts.hThick}px`);

  // 고정 좌표
  s.style.position = 'fixed';
  // 버튼 좌상단 기준이 아니라 뷰포트 기준 좌표로 설정
  const btnVP = btn.getBoundingClientRect();
  s.style.left = `${btnVP.left + (x)}px`;
  s.style.top  = `${btnVP.top  + (y)}px`;

  if (opts.w)     s.style.setProperty('--sparkle-w', `${opts.w}px`);
  if (opts.h)     s.style.setProperty('--sparkle-h', `${opts.h}px`);
  if (opts.color) s.style.setProperty('--sparkle-color', opts.color);

  document.body.appendChild(s);
  setTimeout(()=> s.remove(), opts.duration ?? 900);
}


/* ===== sparkleBody (권장: body에 붙이는 안전 버전) ===== */

function findAttachRoot(el){
  let cur = el;
  while (cur && cur !== document.documentElement){
    const cs = getComputedStyle(cur);
    const hasTransform = cs.transform && cs.transform !== 'none';
    const hasFilter    = cs.filter && cs.filter !== 'none';
    const willChange   = cs.willChange && /transform|filter/.test(cs.willChange);
    if (hasTransform || hasFilter || willChange){
      return cur; // 이 컨테이너에 붙이면 좌표가 정확히 맞음
    }
    cur = cur.parentElement;
  }
  return null;
}

function sparkleBody(btn, opts = {}) {
  const icon = btn.querySelector('.heart-icon') || btn;
  if (!icon) return;

  const rIcon = icon.getBoundingClientRect();
  const relX = opts.relX ?? 0.84;   // 우상단 고정 기본
  const relY = opts.relY ?? 0.20;

  // 기준 좌표는 항상 뷰포트 절대좌표로
  const vx = rIcon.left + rIcon.width  * relX + (opts.offsetX || 0);
  const vy = rIcon.top  + rIcon.height * relY + (opts.offsetY || 0);

  // 변형 상위 컨테이너가 있으면 그 컨테이너에 붙인다
  const root = findAttachRoot(btn);
  const useContainer = !!root;

  const s = document.createElement('div');
  s.className = 'heart-sparkle';
  s.dataset.style = opts.style || 'tall';

  if (useContainer){
    // 컨테이너 기준 좌표로 환산
    const rc = root.getBoundingClientRect();
    s.style.position = 'absolute';
    s.style.left = (vx - rc.left + root.scrollLeft) + 'px';
    s.style.top  = (vy - rc.top  + root.scrollTop)  + 'px';
    root.appendChild(s);
  }else{
    // 뷰포트 기준
    s.style.position = 'fixed';
    s.style.left = vx + 'px';
    s.style.top  = vy + 'px';
    document.body.appendChild(s);
  }

  if (opts.w)       s.style.setProperty('--sparkle-w', `${opts.w}px`);
  if (opts.h)       s.style.setProperty('--sparkle-h', `${opts.h}px`);
  if (opts.color)   s.style.setProperty('--sparkle-color', opts.color);
  if (opts.vThick)  s.style.setProperty('--ray-v-thick', `${opts.vThick}px`);
  if (opts.hThick)  s.style.setProperty('--ray-h-thick', `${opts.hThick}px`);
  if (opts.hLen)    s.style.setProperty('--h-len', typeof opts.hLen === 'string' ? opts.hLen : `${opts.hLen}%`);
  if (opts.angle!=null) s.style.setProperty('--cross-angle', typeof opts.angle === 'number' ? `${opts.angle}deg` : opts.angle);

  setTimeout(()=> s.remove(), opts.duration ?? 900);
}


/* ===== idle twinkle (기본 OFF: 디자인 작업용) ===== */
function startIdleTwinklesBody(active = false){
  if (!active) return () => {};   // 지금은 랜덤 끔

  let on = true;

  function pickRandomButton(){
    const list = document.querySelectorAll('.heart-button');
    if (!list.length) return null;
    const i = Math.floor(Math.random() * list.length);
    return list[i];
  }

  (function loop(){
    if (!on) return;
    const delay = 1200 + Math.random() * 5000;
    setTimeout(()=>{
      if (!on) return;
      const btn = pickRandomButton();
      if (btn){
        sparkleBody(btn, {
          style: 'tall', // 세로 긴 버전으로 랜덤
          relX: 0.35 + Math.random()*0.3,
          relY: 0.30 + Math.random()*0.3,
          w: 14 + Math.random()*6,
          h: 22 + Math.random()*6,
          vThick: 2,
          hThick: 1
        });
      }
      loop();
    }, delay);
  })();

  document.addEventListener('visibilitychange', ()=>{
    on = document.visibilityState === 'visible';
    if (on) startIdleTwinklesBody(true);
  }, { once:true });

  return () => { on = false; };
}

// 파일 맨 아래 쪽 어딘가에 전역 핸들 저장
window.__sparkleAlwaysTimer = null;

function startSparkleAlways(){
  stopSparkleAlways();
  window.__sparkleAlwaysTimer = setInterval(()=>{
    document.querySelectorAll('.heart-button').forEach(btn=>{
      sparkleBody(btn, {
        style: 'tall',
        relX: -1,
        relY: 0.26,
        w: 30,
        h: 30,
        vThick: 1,
        hThick: 1,
        hLen: '56%',
        angle: -30,  
        color: '#a9c9ff',
        duration: 900
      });
    });
  }, 1200); // 주기 조절
}

function stopSparkleAlways(){
  if (window.__sparkleAlwaysTimer){
    clearInterval(window.__sparkleAlwaysTimer);
    window.__sparkleAlwaysTimer = null;
  }
}


// ========== per-button twinkle manager ==========
const __twinkleMap = new WeakMap();   // btn -> {on, timer, pause}

function startTwinkleFor(btn){
  // 이미 시작돼 있으면 스킵
  const st = __twinkleMap.get(btn);
  if (st?.on) return;

  const state = { on:true, timer:null, pause:false };
  __twinkleMap.set(btn, state);

  // 뷰포트 안에 있을 때만 반짝이게
  const io = new IntersectionObserver((entries)=>{
    state.pause = !entries[0]?.isIntersecting;
  }, { root:null, threshold:0.01 });
  io.observe(btn);
  state.io = io;

  const getDensity = () => window.__twinkleDensity ?? 1; // 1은 보통, 2는 더 드묾

  function jitter(min, max){ return min + Math.random() * (max - min); }

  (function loop(){
  if (!state.on) return;
  const baseMin = 1000;   // 3초
  const baseMax = 1800;  // 18초
  const delay = jitter(baseMin, baseMax) * getDensity();
  state.timer = setTimeout(()=>{
    if (!state.on) return;

    const chance = 0.35; // 35%만 발사
    const okGate = Math.random() < chance;

    const ok = btn.isConnected && btn.classList.contains('is-on') && btn._heart3D && !state.pause;

    if (ok && okGate){
      sparkleBody(btn, {
        style: 'tall',
        relX: 0.35,          // 위치 고정
        relY: -0.25,
        w: 16 + Math.random()*4,
        h: 24 + Math.random()*6,
        vThick: 1,
        hThick: 1,
        angle: -6 + Math.random()*12,
        color: '#a9c9ff',
        duration: 420 + Math.random()*260
      });
    }
    loop();
  }, delay);
})();


  // 탭 비가시화 시 일시 정지
  state.onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      state.pause = true;
    } else {
      state.pause = false;
    }
  };
  document.addEventListener('visibilitychange', state.onVisibility);
}

function stopTwinkleFor(btn){
  const st = __twinkleMap.get(btn);
  if (!st) return;
  st.on = false;
  if (st.timer) clearTimeout(st.timer);
  if (st.io) st.io.disconnect();
  if (st.onVisibility) document.removeEventListener('visibilitychange', st.onVisibility);
  __twinkleMap.delete(btn);
}
