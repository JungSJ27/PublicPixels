// ===============================
// Front/script.js  (clean & stable; Phototaxis = session-once auto + logo force)
// ===============================
// ====== API ENDPOINT (최상단) ======
const NEWSLETTER_API = 'https://script.google.com/macros/s/AKfycbyuVBEtkz8FwPGCGyx8tgHcLoI2JyWzP1Dz2w8BYVTxV1mggr1fmLjNVpYGn2XVchOG/exec';

// ---- Page guard ------------------------------------------------
const IS_HOME =
  document.body?.dataset?.page === 'home' ||
  /(?:^|\/)(index\.html?)?(?:$|[?#])/.test(location.pathname);

// ---- BASE path (GitHub Pages 호환) -----------------------------
const BASE = (() => {
  const meta = document.querySelector('meta[name="site-base"]')?.content;
  if (meta) return meta.endsWith('/') ? meta : meta + '/';
  const parts = location.pathname.split('/').filter(Boolean);
  if (location.hostname.endsWith('github.io') && parts.length > 0) {
    return `/${parts[0]}/`;
  }
  return '/';
})();

// ---- DOM Ready helper -----------------------------------------
function onReady(fn){
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once:true });
  } else {
    fn();
  }
}

// ===============================================================
// SAFETY: toggleSearch가 없더라도 오류 안 나게 no-op 제공
// ===============================================================
window.toggleSearch ||= function(){};

// ==================
// (선택) HEADER 폴백 주입 — 이미 잘 동작하면 생략 가능
// ==================
async function ensureHeaderInjected(){
  if (document.querySelector('header')) return;
  const anchor = document.querySelector('[data-include="header"]');
  if (!anchor) return;

  const VER = '2025-09-30c';
  const candidates = [
    `${BASE}front/header.html?v=${VER}`,
    `/front/header.html?v=${VER}`,
    `front/header.html?v=${VER}`,
    `../front/header.html?v=${VER}`,
    `../../front/header.html?v=${VER}`
  ];

  let html = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { credentials:'same-origin', cache:'no-store' });
      if (res.ok) { html = await res.text(); break; }
    } catch {}
  }
  if (!html) return;

  anchor.insertAdjacentHTML('afterbegin', html);
  window.dispatchEvent(new CustomEvent('header:ready'));
}
let __headerFallbackTimer = null;
onReady(() => { __headerFallbackTimer = setTimeout(ensureHeaderInjected, 200); });
window.addEventListener('header:ready', () => {
  if (__headerFallbackTimer) clearTimeout(__headerFallbackTimer);
}, { once:true });

// ==================
// NEWSLETTER API
// ==================

// ===== Newsletter popup (HTML: #newsletter-popup.popup-overlay / .popup-box) =====

// 전역 바인딩 (인라인 onclick 지원)
function openPopup() {
  const pop = document.getElementById('newsletter-popup');
  if (!pop) return console.warn('[newsletter] #newsletter-popup not found');

  // 강하게 표시 (CSS 건드리지 않고 inline style로만)
  pop.style.setProperty('display', 'flex', 'important');
  pop.style.setProperty('visibility', 'visible', 'important');
  pop.style.setProperty('opacity', '1', 'important');
  pop.style.setProperty('position', 'fixed', 'important'); // 오버레이 보장
  pop.style.setProperty('inset', '0', 'important');
  pop.style.setProperty('z-index', '99999', 'important');
  // 포커스 편의
  const input = document.getElementById('newsletter-email');
  if (input) setTimeout(() => input.focus(), 0);
}
function closePopup() {
  const pop = document.getElementById('newsletter-popup');
  if (!pop) return;
  pop.style.setProperty('display', 'none', 'important');

  const msg = document.getElementById('newsletter-msg'); // 있으면 초기화
  const input = document.getElementById('newsletter-email');
  if (msg) msg.textContent = '';
  if (input) input.value = '';
}

// 오버레이 바깥 클릭시 닫기 (디자인 안건드림)
document.addEventListener('click', (e) => {
  const pop = document.getElementById('newsletter-popup');
  if (!pop || getComputedStyle(pop).display === 'none') return;
  const box = pop.querySelector('.popup-box');
  if (box && !box.contains(e.target) && e.target === pop) {
    closePopup();
  }
}, { passive: true });

// ESC로 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePopup();
}, { passive: true });

// 인라인이 혹시 막혔을 때 대비용 대체 트리거 (선택)
document.addEventListener('click', (e) => {
  const trg = e.target.closest('[data-open="newsletter"]');
  if (trg) { e.preventDefault(); openPopup(); }
}, { passive: true });


async function subscribeEmail() {
  const emailInput = document.getElementById('newsletter-email');
  const email = (emailInput?.value || '').trim();
  if (!email) return closePopup();

  const emailPattern = /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/;
  if (!emailPattern.test(email)) {
    alert("Invalid email format. Please enter a valid email address.");
    return;
  }

  try {
    // ✅ 폼 인코딩으로 전송 (preflight 회피)
    const res = await fetch(NEWSLETTER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ email })  // e.parameter.email 로 수신됨
    });

    // 디버그: 실패 시 내용을 보기 위해 먼저 텍스트로 읽고 JSON 파싱 시도
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* not JSON */ }

    console.log('[newsletter][subscribe] status=', res.status, 'body=', text);

    if (res.ok && data.ok) {
      alert(data.duplicated ? "This email is already subscribed." : "Subscription successful!");
      closePopup();
    } else {
      alert("Failed to subscribe. Please try again.");
    }
  } catch (e) {
    console.error('[newsletter][subscribe] error=', e);
    alert("Network error. Please try again.");
  }
}

async function unsubscribeEmail() {
  const email = (document.getElementById('newsletter-email')?.value || '').trim();
  if (!email) return closePopup();

  try {
    const res = await fetch(NEWSLETTER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ email, action: 'unsubscribe' })
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}

    console.log('[newsletter][unsubscribe] status=', res.status, 'body=', text);

    if (res.ok && data.ok) {
      alert(data.removed ? "Successfully unsubscribed." : "This email was not found.");
      closePopup();
    } else {
      alert("Failed to unsubscribe. Please try again.");
    }
  } catch (e) {
    console.error('[newsletter][unsubscribe] error=', e);
    alert("Network error. Please try again.");
  }
}



// ==============================================
// Phototaxis 제어 (shim API 사용)
//  - 홈 진입: shim이 세션당 1회 자동 실행
//  - 아무 곳이나 클릭하면 끄기 (홈만)
//  - 로고 클릭: 세션 제한 무시하고 항상 실행
// ==============================================
document.addEventListener('click', (e) => {
  const link = e.target.closest('header .logo a');
  if (!link) return;

  // 깃헙 페이지/로컬 모두 동작하는 BASE 계산
  const BASE = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    return location.hostname.endsWith('github.io') && parts.length ? `/${parts[0]}/` : '/';
  })();
  const HOME = `${BASE}index.html`;

  if (!document.body?.dataset?.page || document.body.dataset.page !== 'home') {
    // 서브페이지: 기본 동작 막고 절대경로로 직접 이동
    e.preventDefault();
    location.href = HOME;
    return;
  }

  // 홈: phototaxis 재실행
  e.preventDefault();
  const ok = typeof window.Phototaxis?.start === 'function' && window.Phototaxis.start({ force:true });
  if (!ok) location.href = HOME + '?r=' + Date.now();
});


// ==============================================
// Header height Fallback (선택)
// ==============================================
function setHeaderVarFallback(){
  const h = document.querySelector('header')?.offsetHeight || 56;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
onReady(() => {
  const cur = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
  if (!cur || !cur.trim()) setHeaderVarFallback();
  window.addEventListener('resize', setHeaderVarFallback, { passive: true });
});

// ==============================================
// (옵션) Section2 전용
// ==============================================
onReady(() => {
  if (typeof window.loadVideo === 'function' && typeof window.artworkIndex !== 'undefined') {
    window.loadVideo(window.artworkIndex);
  }
});


// ==============================================
// Page Wrapper Scale (index.html 전용)
// ==============================================
function resizePage() {
  const wrapper = document.getElementById('page-wrapper');
  if (!wrapper) return;  // 다른 서브페이지일 땐 무시

  const baseWidth = 1200;   // 네가 디자인한 기준 가로
  const baseHeight = 800;   // 네가 디자인한 기준 세로
  const scaleX = window.innerWidth / baseWidth;
  const scaleY = window.innerHeight / baseHeight;
  const scale = Math.min(scaleX, scaleY);  // 비율 유지

  wrapper.style.transform = `scale(${scale})`;
}

// home(index)에서만 실행
onReady(() => {
  if (IS_HOME) {
    resizePage();
    window.addEventListener('resize', resizePage);
  }
});
