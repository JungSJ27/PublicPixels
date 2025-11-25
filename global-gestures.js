// global-gestures.js — 페이지 전역 가로 제스처 차단 (+ 허용 영역 예외)

(() => {
  // ✅ 허용 영역 셀렉터 (섹션3/뉴스/플래그)
  const ALLOW_SEL = '[data-allow-horizontal="true"], #s3-track, #section3, #news-wrap, .news-wrap';

  // 포인터 좌표로 정확히 판단(오버레이/형제/캔버스 위여도 OK)
  function inAllowAreaByPoint(e){
    const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const y = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    const els = document.elementsFromPoint(x, y) || [];
    return els.some(el => el.closest(ALLOW_SEL));
  }

  // ---- Wheel: 좌우 제스처를 기본적으로 막되, 허용영역이면 통과 ----
  window.addEventListener('wheel', (e) => {
    if (inAllowAreaByPoint(e)) return;   // ✅ 섹션3/뉴스 위면 통과

    // deltaMode 보정
    const LINE=1, PAGE=2;
    const k  = e.deltaMode===LINE?16:(e.deltaMode===PAGE?800:1);
    const dx = Math.abs(e.deltaX * k);
    const dy = Math.abs(e.deltaY * k);

    // 가로 성분이 의미 있으면 차단 (사이트 전환/가로 내비 방지)
    if (dx > dy && dx > 2) {
      e.preventDefault();
    }
  }, { passive:false, capture:true });

  // ---- Touch move: 가로 스와이프 차단(허용영역 제외) ----
  window.addEventListener('touchmove', (e) => {
    if (inAllowAreaByPoint(e)) return;   // ✅ 허용영역 통과

    const t1 = e.touches[0], t2 = e.touches[1];
    if (!t1 || t2) return; // 두 손가락 이상은 패스(핀치 줌 등)

    // 간단한 힌트: 이동 방향 추정 (이전 값 없으면 패스)
    // 전역에서 강하게 막고 있지 않다면 이 블록은 생략해도 됨.
    // e.preventDefault();
  }, { passive:false, capture:true });
})();
