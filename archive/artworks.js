// ===== Artworks.js =====================================================
const DATA_URL = './artworks.json';
const DETAIL_BASE = './';

const els = {
  grid:   document.getElementById('grid'),
  empty:  document.getElementById('empty'),
  q:      document.getElementById('q'),
  year:   document.getElementById('year'),
  medium: document.getElementById('medium'),
  sort:   document.getElementById('sort'),
  tpl:    document.getElementById('card-tpl'),
  chips:  document.getElementById('active-filters'), // 없으면 null일 수 있음
};

let ART = [];
let VIEW = [];

ready(init);

function ready(fn){
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

async function init(){
  try {
    ART = await fetchJSON(DATA_URL);
  } catch(e){
    console.error(e);
    if (els.empty){
      els.empty.hidden = false;
      els.empty.textContent = 'Failed to load artworks.json';
    }
    return;
  }
  hydrateFilters(ART);
  hydrateFromQuery();
  render();
  bindUI();

  // 화면 리사이즈 시 정렬 자동 보정
  window.addEventListener('resize', debounce(autoJustifyGrid, 100));
}

async function fetchJSON(url){
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
  return res.json();
}

function bindUI(){
  const rerender = () => { render(); pushQuery(); };
  els.q?.addEventListener('input', debounce(rerender, 120));
  els.year?.addEventListener('change', rerender);
  els.medium?.addEventListener('change', rerender);
  els.sort?.addEventListener('change', rerender);
}

// ===== Artworks.js 상단 어딘가에(전역) 추가 =====
const YEAR_SPAN = 3;  // 2로 바꾸면 2년 묶음

// ===== 기존 hydrateFilters 교체 =====
function hydrateFilters(data){
  // 고유 연도 목록
  const years = Array.from(new Set(data.map(d => Number(d.year)).filter(Boolean)))
                .sort((a,b)=>b-a);

  if (!years.length) return;

  const maxY = years[0];
  const minY = years[years.length - 1];

  // 기존처럼 medium 드롭다운은 그대로
  const media = new Set();
  data.forEach(d => (d.medium||[]).forEach(m => media.add(m)));
  [...media].sort((a,b)=>a.localeCompare(b)).forEach(m => addOption(els.medium, m, m));

  // year 드롭다운은 "범위" 옵션으로 구성
  // (HTML에 이미 All Years가 있으니 여기서는 추가 안 함)
  for (let start = maxY; start >= minY; start -= YEAR_SPAN){
    const end = Math.max(minY, start - (YEAR_SPAN - 1)); // inclusive
    const lo  = Math.min(start, end);
    const hi  = Math.max(start, end);

    // 값은 파싱 쉽도록 "lo-hi"
    const value = `${lo}-${hi}`;
    // 레이블은 "lo – hi" (보기 전용)
    const label = (lo === hi) ? String(lo) : `${lo} – ${hi}`;
    addOption(els.year, value, label);
  }
}

function addOption(sel, value, label){
  if (!sel) return;
  const o = document.createElement('option');
  o.value = value; o.textContent = label; sel.appendChild(o);
}
function dateKey(a){
  // 1) top-level a.date가 있으면 우선 (YYYY-MM 또는 YYYY-MM-DD)
  if (a.date){
    const iso = /^\d{4}-\d{2}$/.test(a.date) ? a.date + '-01' : a.date;
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return t;
  }
  // 2) exhibition.date(YYYY-MM) 사용
  if (a.exhibition?.date){
    const iso = /^\d{4}-\d{2}$/.test(a.exhibition.date)
      ? a.exhibition.date + '-01'
      : a.exhibition.date;
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return t;
  }
  // 3) year/month/day 합성 (없으면 연말/말일로 보정)
  const y = Number(a.year)  || 0;
  const m = Number(a.month) || 12;
  const d = Number(a.day)   || 28;
  return new Date(y, m - 1, d).getTime();
}

function render(){
  const qRaw   = (els.q?.value || '').trim();
  const q      = qRaw.toLowerCase();
  const yearV  = els.year?.value || '';   // 예: "2023-2025" 또는 ""(전체)
  const medium = els.medium?.value || '';
  const sort   = els.sort?.value || 'new';

  els.grid?.classList.add('is-updating');

  VIEW = ART.filter(a => {
    if (a.status === 'draft') return false;

    // ① 연도 범위 필터
    if (yearV){
      if (yearV.includes('-')){
        const [lo, hi] = yearV.split('-').map(n => parseInt(n, 10)).sort((A,B)=>A-B);
        const y = Number(a.year);
        if (!(y >= lo && y <= hi)) return false;
      }else{
        if (String(a.year) !== String(yearV)) return false; // 호환용
      }
    }

    // ② 매체 필터
    if (medium && !(a.medium||[]).includes(medium)) return false;

    // ③ 검색어
    if (q){
      const hay = [
        a.title, a.slug, a.description?.short, a.description?.long,
        ...(a.tags||[]), ...(a.medium||[])
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // sort — 연/월/일까지 반영
  VIEW.sort((A, B) => {
    switch (sort) {
      case 'old':
        return dateKey(A) - dateKey(B) || A.title.localeCompare(B.title);
      case 'az':
        return A.title.localeCompare(B.title);
      case 'za':
        return B.title.localeCompare(A.title);
      case 'featured':
        return (Number(B.featured || 0) - Number(A.featured || 0))
            || (dateKey(B) - dateKey(A))
            || A.title.localeCompare(B.title);
      case 'new':
      default:
        return dateKey(B) - dateKey(A) || A.title.localeCompare(B.title);
    }
  });



  // 렌더
  els.grid?.replaceChildren();
  if (!VIEW.length){
    if (els.empty) els.empty.hidden = false;
    requestAnimationFrame(()=>{
      els.grid?.classList.remove('is-updating');
      autoJustifyGrid(); // 빈 상태에서도 정렬 클래스 정리
    });

    // HeartFX가 이전 잔재를 만지지 않게 빈 상태도 알려줌(옵션)
    document.dispatchEvent(new Event('productsRendered'));

    updateActiveChips({ q, year, medium, sort });
    return;
  }
  if (els.empty) els.empty.hidden = true;

  const frag = document.createDocumentFragment();
  VIEW.forEach((a, i) => {
    const el = card(a);
    el.classList.add('card--enter');
    el.style.setProperty('--i', i);
    frag.appendChild(el);
  });
  els.grid?.appendChild(frag);

  // 👉 HeartFX에게 “카드가 준비됨” 알림 (하트 주입 트리거)
  document.dispatchEvent(new Event('productsRendered'));

  // 칩 상태 업데이트
  updateActiveChips({ q, qLabel: qRaw, year, medium, sort });

  // 전환 종료 + 정렬 자동 보정
  requestAnimationFrame(()=>{
    els.grid?.classList.remove('is-updating');
    autoJustifyGrid(); // ✅ 남는 여백에 따라 좌/중앙 정렬 자동 전환
  });
}

function card(a){
  const el = els.tpl.content.firstElementChild.cloneNode(true);
  const link   = el.querySelector('.card__media');
  const img    = el.querySelector('.card__img');
  const title  = el.querySelector('.card__title');
  const year   = el.querySelector('.card__year');
  const medium = el.querySelector('.card__medium');
  const tags   = el.querySelector('.card__tags');
  const badge  = el.querySelector('.featured-badge');

  // 기본 링크
  if (link) {
    link.href = a.href;
  }

  /* ========================================================
      🔐 PRIVATE 작품이면 링크 클릭 → 비번 모달 띄우기
     ======================================================== */
  if (a.status === 'private' && link) {
    link.addEventListener('click', (e) => {
      e.preventDefault();      // 페이지 이동 막기
      openPasswordModal(a);   // 비번창 열기
    });
  }

  // 이미지
  if (img){
    img.src = a.thumb?.src || a.hero?.src || '';
    img.alt = a.thumb?.alt || a.title || '';
  }

  // 텍스트들
  if (title)  title.textContent  = a.title || '';
  if (year)   year.textContent   = a.year || '';
  if (medium) medium.textContent = (a.medium||[]).join(', ');

  // Featured 배지
  if (badge){
    badge.hidden = !a.featured;
  }

  // 태그
  if (tags){
    tags.replaceChildren();
    (a.tags||[]).slice(0,5).forEach(t=>{
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = t;
      s.addEventListener('click', ()=>{
        if (els.q) els.q.value = t;
        render();
        pushQuery();
      });
      tags.appendChild(s);
    });
  }

  // 하트 key
  el.dataset.id = a.id || a.slug;
  if (a.price != null) el.setAttribute('data-price', a.price);

  return el;
}


// 표시 라벨 헬퍼: 선택된 option의 텍스트를 가져옴
function labelOf(sel, fallback){
  return sel?.selectedOptions?.[0]?.textContent ?? fallback;
}

// ✅ 활성 필터칩 UI
function updateActiveChips(state){
  if (!els.chips) return;
  els.chips.replaceChildren();

  // 현재 선택 상태 읽기
  const yearVal   = els.year?.value ?? '';
  const yearLabel = labelOf(els.year, state.year);
  const yearIsAll = (!yearVal) || /^all(\s*years?)?$/i.test(yearLabel || '');

  const chips = [];
  if (state.q)      chips.push({ k:'q',      v: state.qLabel ?? state.q });
  // ✅ 'All Years'일 땐 칩 생성하지 않음
  if (state.year && !yearIsAll) chips.push({ k:'year',   v: yearLabel });
  if (state.medium) chips.push({ k:'medium', v: labelOf(els.medium, state.medium) });

  // sort가 'new'가 아닐 때만 칩 표시
  if (state.sort && state.sort !== 'new') {
    chips.push({ k:'sort', v: labelOf(els.sort, state.sort) });
  }

  if (!chips.length){ els.chips.hidden = true; return; }
  els.chips.hidden = false;

  chips.forEach(c=>{
    const span = document.createElement('span');
    span.className = 'filter-chip';
    span.textContent = c.v + ' ×';
    span.addEventListener('click', ()=>{
      if (!els[c.k]) return;
      if (c.k === 'sort') els.sort.value = 'new';
      else if (c.k === 'year') els.year.value = '';     // ← All Years로 복귀
      else if (c.k === 'medium') els.medium.value = '';
      else if (c.k === 'q') els.q.value = '';
      render();
      pushQuery();
    });
    els.chips.appendChild(span);
  });
}

let PW_ART = null;

function openPasswordModal(a){
  PW_ART = a;

  const modal = document.getElementById('pwModal');
  const input = document.getElementById('pwInput');
  const error = document.getElementById('pwError');

  modal.hidden = false;
  input.value = '';
  error.hidden = true;
  input.focus();
}

function checkPassword(){
  const input = document.getElementById('pwInput').value;

  if (input === PW_ART.password){
    window.location.href = PW_ART.href;
  } else {
    document.getElementById('pwError').hidden = false;
  }
}

// Enter 버튼
document.getElementById('pwSubmit').onclick = checkPassword;

// Enter key
document.getElementById('pwInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

// X 버튼
document.querySelector('.pw-close').onclick = () => {
  document.getElementById('pwModal').hidden = true;
};

// Cancel 버튼
document.getElementById('pwCancel').onclick = () => {
  document.getElementById('pwModal').hidden = true;
};

// 모달 바깥 클릭하면 닫기
document.getElementById('pwModal').addEventListener('click', (e) => {
  if (e.target.id === 'pwModal') {
    document.getElementById('pwModal').hidden = true;
  }
});


// ✅ querystring sync
function pushQuery(){
  const p = new URLSearchParams();
  if (els.q?.value) p.set('q', els.q.value);
  if (els.year?.value) p.set('year', els.year.value);
  if (els.medium?.value) p.set('medium', els.medium.value);
  if (els.sort?.value && els.sort.value !== 'new') p.set('sort', els.sort.value);
  const q = p.toString();
  const url = q ? `?${q}` : location.pathname;
  history.replaceState(null, '', url);
}

function hydrateFromQuery(){
  const p = new URLSearchParams(location.search);
  if (p.has('q') && els.q) els.q.value = p.get('q');
  if (p.has('year') && els.year) els.year.value = p.get('year');
  if (p.has('medium') && els.medium) els.medium.value = p.get('medium');
  if (p.has('sort') && els.sort) els.sort.value = p.get('sort');
}

/* =========================
   여백 기준 자동 정렬 토글
   =========================
   규칙: 그리드 내부 남는 공간이 "카드 최대폭(= --tile-max)" 이상이면
        그리드를 왼쪽 정렬(grid-left)로 전환한다.
*/
function autoJustifyGrid(){
  const grid = els.grid;
  if (!grid) return;

  const rootStyle = getComputedStyle(document.documentElement);
  const max = parseFloat(rootStyle.getPropertyValue('--tile-min')) || 280;
  const gap = parseFloat(getComputedStyle(grid).gap) || 0;
  const w   = grid.clientWidth;
  const n   = grid.children.length;
  if (!n || !w){ grid.classList.remove('grid-left'); return; }

  // 현재 화면에서 최대폭 카드가 몇 칸 들어갈 수 있는지
  const cols = Math.min(n, Math.max(1, Math.floor((w + gap) / (max + gap))));
  const used = cols * max + (cols - 1) * gap;
  const leftover = w - used;

  // 남는 여백이 카드 한 장 폭 이상이면 왼쪽 정렬
  grid.classList.toggle('grid-left', leftover * 0.5 >= max);
}

// ✅ debounce
function debounce(fn, ms){
  let t;
  return (...a)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...a), ms);
  };
}

// 뒤로가기(bfcache) 복귀 시 카드 다시 주입 트리거
window.addEventListener('pageshow', () => {
  document.dispatchEvent(new Event('productsRendered'));
});
