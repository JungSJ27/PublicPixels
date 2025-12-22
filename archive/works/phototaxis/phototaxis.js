

// Phototaxis.js — moths chase light + firework bursts + soft trails
(function () {
  const KEY = 'seenThisSession';
  let rafId = 0, started = false;

  // === 자동 종료 타이머 & 오버레이 이벤트 블로커 ===
  let autoOffTimer = null;
  let overlayBlockerAdded = false;

  const ptActive = () => document.body.classList.contains('phototaxis-active');

  function startVisual() {
    const canvas = document.getElementById('overlay');
    if (!canvas) return false;

    // 오버레이 표시 & 차단 모드 진입
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'auto'; // 클릭 이벤트 캡처
    document.body.classList.add('phototaxis-active');
    window.lightHidden = false;

    // === 오버레이 자체에서 클릭/터치 이벤트 가로채기 (capture 단계) ===
    if (!overlayBlockerAdded) {
      const blocker = (e) => {
        const cv = document.getElementById('overlay');
        if (!cv || cv.style.display === 'none') return;

        // 링크 네비게이션/버튼 동작 완전 차단
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        e.stopPropagation();

      };

      // pointerdown/click/touchstart 모두 잡아서 안전하게 차단
      canvas.addEventListener('pointerdown', blocker, { capture: true, passive: false });
      canvas.addEventListener('click', blocker, { capture: true, passive: false });
      canvas.addEventListener('touchstart', blocker, { capture: true, passive: false });
      overlayBlockerAdded = true;
    }

    const ctx = canvas.getContext('2d');
    const DPR = Math.min(1.5, window.devicePixelRatio || 1);
    function resize() {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

// ✅ 모바일: 전역 '즉시 종료' 제거 → '탭'일 때만 종료
let _t0 = 0, _sx = 0, _sy = 0;
const _isCoarse = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;

// ✅ 모바일: 탭일 때만 종료 (활성일 때만 동작)
document.addEventListener('touchstart', (e) => {
  const cv = document.getElementById('overlay');
  // 오버레이가 꺼져있으면 아무것도 안 함
  if (!cv || cv.style.display === 'none' || !document.body.classList.contains('phototaxis-active')) return;

  // iOS 제스처 방지
  e.preventDefault();
  e.stopPropagation();

  // 탭 시작 기록
  const t = e.touches && e.touches[0];
  if (!t) return;
  window.__pt_t0 = performance.now();
  window.__pt_sx = t.clientX;
  window.__pt_sy = t.clientY;
}, { capture: true, passive: false });

document.addEventListener('touchend', (e) => {
  const cv = document.getElementById('overlay');
  if (!cv || cv.style.display === 'none' || !document.body.classList.contains('phototaxis-active')) return;

  const t = e.changedTouches && e.changedTouches[0];
  if (!t) return;
  const dt = performance.now() - (window.__pt_t0 || 0);
  const moved = Math.hypot(t.clientX - (window.__pt_sx || 0), t.clientY - (window.__pt_sy || 0));
  if (dt <= 220 && moved <= 10) window.phototaxisHide();
}, { capture: true, passive: true });


// ---- cursor (mouse + touch + pointer) — desktop 그대로, 모바일만 안전 처리
const m = { x: innerWidth / 2, y: innerHeight / 2 };
const setPos = (x, y) => { m.x = x; m.y = y; };

function onPointerDown(e) {
  if (e.pointerType === 'touch' && ptActive()) { e.preventDefault(); }
  setPos(e.clientX, e.clientY);
}

function onPointerMove(e) {
  if (e.pointerType === 'touch' && ptActive()) { e.preventDefault(); }
  setPos(e.clientX, e.clientY);
}


if (window.PointerEvent) {
  // (기존 유지) 데스크톱/모바일 공통 포인터 이동 — 문서 전역 바인딩 그대로
  document.addEventListener('pointerdown', onPointerDown, { passive: false });
  document.addEventListener('pointermove', onPointerMove, { passive: false });
} else {
  // 폴백: 구형 iOS/안드로이드 — 위치 업데이트만, 종료는 위의 touchend가 담당
  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; if (t) setPos(t.clientX, t.clientY); e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0]; if (t) setPos(t.clientX, t.clientY); e.preventDefault();
  }, { passive: false });

  document.addEventListener('mousemove', (e) => setPos(e.clientX, e.clientY), { passive: true });
}

    // ---- assets
    const mothImg = new Image();
    mothImg.src = 'front/Moth.png';

    // ---- palette (moth glow)
    const GLOW_NEAR = 'rgba(148, 115, 155, 0.88)';
    const GLOW_FAR = 'rgba(97, 54, 165, 0.64)';

    // ---- moths
    const points = [];
    const numMoths = 9;
    const blinkCycle = 21;

    for (let i = 0; i < numMoths; i++) {
      const ang = Math.random() * Math.PI * 2,
        dist = 150 + Math.random() * 100;
      const sx = m.x + Math.cos(ang) * dist,
        sy = m.y + Math.sin(ang) * dist;
      const sp = 0.5 + Math.random() * 0.5;
      const vx = Math.cos(Math.atan2(m.y - sy, m.x - sx)) * sp;
      const vy = Math.sin(Math.atan2(m.y - sy, m.x - sx)) * sp;
      points.push({
        x: sx,
        y: sy,
        vx,
        vy,
        blinkOffset: (Math.random() * blinkCycle) | 0,
        blinkDuration: ((Math.random() * 3) | 0) + 1,
        speedFactor: 0.2 + Math.random() * 1.1,
        burstCD: 20 + Math.random() * 40,
      });
    }

    // === Light (A-Style: 클래식 손전등) ===
    const LIGHT = {
      radius: 60,
      innerStop: 0.0,
      midStop: 0.5,
      centerOpacity: 1.0,
      midOpacity: 0.3,
      edgeOpacity: 0.0,
      showTint: true,
      tint: 'rgba(230, 0, 226, 0.08)',
    };

    function clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }

    function drawFlashlight(ctx, x, y) {
      const r = LIGHT.radius;
      const inner = clamp01(LIGHT.innerStop);
      const mid = clamp01(LIGHT.midStop);
      const cA = clamp01(LIGHT.centerOpacity);
      const mA = clamp01(LIGHT.midOpacity);
      const eA = clamp01(LIGHT.edgeOpacity);

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(x, y, r * inner, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${cA})`);
      g.addColorStop(mid, `rgba(0,0,0,${mA})`);
      g.addColorStop(1, `rgba(0,0,0,${eA})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (LIGHT.showTint) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const h = ctx.createRadialGradient(x, y, 0, x, y, r * 1.1);
        h.addColorStop(0, LIGHT.tint);
        h.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = h;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ---- cached glow dot (for dust)
    const dotSprite = document.createElement('canvas');
    dotSprite.width = dotSprite.height = 32;
    const dctx = dotSprite.getContext('2d');
    const gdot = dctx.createRadialGradient(16, 16, 0, 16, 16, 14);
    gdot.addColorStop(0, 'rgb(88, 59, 128)');
    gdot.addColorStop(0.4, 'rgba(223, 140, 170, 0.55)');
    gdot.addColorStop(1, 'rgba(255,255,255,0)');
    dctx.fillStyle = gdot;
    dctx.beginPath();
    dctx.arc(16, 16, 14, 0, Math.PI * 2);
    dctx.fill();

    // ---- dust model
    const dust = [];
    const DUST_MAX = 150;

    function emitBurst(cx, cy, strength = 0.8, count = 3) {
      for (let i = 0; i < count && dust.length < DUST_MAX; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = strength * (0.6 + Math.random() * 0.9);
        dust.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 0.02,
          life: 40 + Math.random() * 60,
          r: 0.45 + Math.random() * 0.5,
          tint:
            Math.random() < 0.33
              ? 'rgba(255,220,235,0.7)'
              : Math.random() < 0.5
              ? 'rgba(225,215,255,0.65)'
              : 'rgba(230,242,255,0.7)',
        });
      }
    }

    function emitTinyTrail(x, y, vx, vy) {
      if (dust.length >= DUST_MAX) return;
      const ang = Math.atan2(-vy, -vx) + (Math.random() * 0.6 - 0.3);
      const sp = 0.25 + Math.random() * 0.35;
      dust.push({
        x,
        y,
        vx: Math.cos(ang) * sp * 0.5,
        vy: Math.sin(ang) * sp * 0.5 + (Math.random() * 0.04 - 0.02),
        life: 45 + Math.random() * 60,
        r: 0.25 + Math.random() * 0.28,
        tint:
          Math.random() < 0.5
            ? 'rgba(255,240,230,0.6)'
            : 'rgba(220,215,255,0.55)',
      });
    }

    let frame = 0;
    function loop() {
      frame++;

      // trails
      const w = canvas.width,
        h = canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, w, h);

      // flashlight
      drawFlashlight(ctx, m.x, m.y);

      // moths
      for (const p of points) {
        const dx = m.x - p.x,
          dy = m.y - p.y,
          d = Math.hypot(dx, dy);

        const glowColor = d < 220 ? GLOW_NEAR : GLOW_FAR;

        const blinking =
          (frame + p.blinkOffset) % blinkCycle < p.blinkDuration;
        if (!blinking) {
          const ang = Math.atan2(p.y - m.y, p.x - m.x) - Math.PI / 2;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(ang);
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 6;
          ctx.drawImage(mothImg, -4, -4, 8, 8);
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        const noise = 0.01 * p.speedFactor,
          attract = 0.0004,
          maxD = 60;
        p.vx += (Math.random() - 0.07) * noise;
        p.vy += (Math.random() - 0.07) * noise;
        if (d < maxD) {
          p.vx += dx * attract;
          p.vy += dy * attract;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (d > maxD) {
          const a = Math.atan2(dy, dx) + 0.8,
            spd = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(a) * spd;
          p.vy = Math.sin(a) * spd;
        }

        // 폭죽
        p.burstCD -= 1;
        if (d < maxD + 18 && p.burstCD <= 0) {
          const near = clamp01(1 - d / LIGHT.radius);
          const strength = 1 + near * 1.6;
          const count = 8 + Math.round(near * 10);

          const norm = Math.atan2(p.vy, p.vx) + Math.PI / 2;
          const bx = p.x + Math.cos(norm) * 6;
          const by = p.y + Math.sin(norm) * 6;

          emitBurst(bx, by, strength, count);

          const cdMin = 14,
            cdMax = 40;
          p.burstCD = Math.round(cdMax - near * (cdMax - cdMin));
        } else if (Math.random() < 0.15) {
          emitTinyTrail(p.x, p.y, p.vx, p.vy);
        }
      }

      // dust render
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = dust.length - 1; i >= 0; i--) {
        const q = dust[i];
        q.life -= 1;
        if (q.life <= 0) {
          const last = dust.pop();
          if (i < dust.length) dust[i] = last;
          continue;
        }

        q.x += q.vx;
        q.y += q.vy;
        q.vy += 0.0015;

        const alpha = Math.max(0, Math.min(1, q.life / 70));
        const s = q.r * 3.5;
        ctx.globalAlpha = 0.18 + alpha * 0.42;
        ctx.drawImage(dotSprite, q.x - q.r * 2, q.y - q.r * 2, s, s);

        ctx.globalAlpha = 0.1 + alpha * 0.25;
        ctx.fillStyle = q.tint;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      rafId = requestAnimationFrame(loop);
    }

    // 이미지가 이미 캐시되어 있으면 즉시 사용 가능
  if (mothImg.complete) {
    loop();
  } else {
    // onload가 오지 않는 환경 대비: 타임아웃/readyState 체크 병행
    let startedLoop = false;
    const safeStart = () => {
      if (!startedLoop) {
        startedLoop = true;
        loop();
      }
    };
    mothImg.onload = safeStart;
    // iOS 캐시/타이밍 이슈 대비: 300ms 내 onload가 안 오면 그냥 시작
    setTimeout(safeStart, 300);
  }

  // 중복 루프 방지
  started = true;
  return true;
  }
  // API
  window.phototaxisStart = function ({ force = false } = {}) {
    if (!force && sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, 'true');
    return startVisual();
  };

  window.phototaxisHide = function () {
    const canvas = document.getElementById('overlay');
    if (canvas) {
      canvas.style.display = 'none';
      canvas.style.pointerEvents = 'none'; // 차단 해제
    }
    document.body.classList.remove('phototaxis-active');
    window.lightHidden = true;
    cancelAnimationFrame(rafId);
    if (autoOffTimer) {
      clearTimeout(autoOffTimer);
      autoOffTimer = null;
    }
  };
})();

/* =========================================
   Reading Assist: Hold to Brighten
========================================= */

(function () {
  let holding = false;

  function enableReading() {
    if (holding) return;
    holding = true;
    document.body.classList.add("pt-reading");
  }

  function disableReading() {
    if (!holding) return;
    holding = false;
    document.body.classList.remove("pt-reading");
  }

  // Desktop: mouse hold
  document.addEventListener("mousedown", enableReading);
  document.addEventListener("mouseup", disableReading);
  document.addEventListener("mouseleave", disableReading);

  // Mobile: touch hold
  document.addEventListener("touchstart", enableReading, { passive: true });
  document.addEventListener("touchend", disableReading);
  document.addEventListener("touchcancel", disableReading);
})();
