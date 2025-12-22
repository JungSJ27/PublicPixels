// ar.phototaxis.js
(function () {
  const KEY = "seenThisSession";
  let rafId = 0;

  // 누르고 있는 동안 손전등 키우기
  let PRESSING = false;

  const ptActive = () => document.body.classList.contains("phototaxis-active");

  function startVisual() {
    const canvas = document.getElementById("overlay");
    if (!canvas) return false;

    // 오버레이 표시만 하고 클릭은 통과시키기
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";
    document.body.classList.add("phototaxis-active");
    window.lightHidden = false;

    const ctx = canvas.getContext("2d");
    const DPR = Math.min(1.5, window.devicePixelRatio || 1);

    function resize() {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // 커서 위치는 문서에서 읽기
    const m = { x: innerWidth / 2, y: innerHeight / 2 };
    const setPos = (x, y) => {
      m.x = x;
      m.y = y;
    };

    // 누름 상태는 문서에서 읽기
    function onPointerDown(e) {
      PRESSING = true;
      setPos(e.clientX, e.clientY);
    }
    function onPointerUp() {
      PRESSING = false;
    }
    function onPointerMove(e) {
      setPos(e.clientX, e.clientY);
    }

    // 링크 클릭을 막지 않기 위해 preventDefault 하지 않음
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointercancel", onPointerUp, { passive: true });
    document.addEventListener("pointermove", onPointerMove, { passive: true });

    // 폴백: 터치 환경에서도 누름 상태 유지
    document.addEventListener(
      "touchstart",
      (e) => {
        PRESSING = true;
        const t = e.touches && e.touches[0];
        if (t) setPos(t.clientX, t.clientY);
      },
      { passive: true }
    );
    document.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches && e.touches[0];
        if (t) setPos(t.clientX, t.clientY);
      },
      { passive: true }
    );
    document.addEventListener("touchend", () => (PRESSING = false), { passive: true });
    document.addEventListener("touchcancel", () => (PRESSING = false), { passive: true });

    // assets
    const mothImg = new Image();
    mothImg.src = "/front/Moth.png";

    const GLOW_NEAR = "rgba(148, 115, 155, 0.88)";
    const GLOW_FAR = "rgba(97, 54, 165, 0.64)";

    // moths
    const points = [];
    const numMoths = 9;
    const blinkCycle = 21;

    for (let i = 0; i < numMoths; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 150 + Math.random() * 100;
      const sx = m.x + Math.cos(ang) * dist;
      const sy = m.y + Math.sin(ang) * dist;
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

    const BASE_RADIUS = 60;
    const PRESS_RADIUS = 200;

    const LIGHT = {
      radius: BASE_RADIUS,
      innerStop: 0.0,
      midStop: 0.5,
      centerOpacity: 1.0,
      midOpacity: 0.3,
      edgeOpacity: 0.0,
      showTint: true,
      tint: "rgba(230, 0, 226, 0.08)",
    };

    function clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }

    function drawFlashlight(x, y) {
      const r = LIGHT.radius;
      const inner = clamp01(LIGHT.innerStop);
      const mid = clamp01(LIGHT.midStop);
      const cA = clamp01(LIGHT.centerOpacity);
      const mA = clamp01(LIGHT.midOpacity);
      const eA = clamp01(LIGHT.edgeOpacity);

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
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
        ctx.globalCompositeOperation = "lighter";
        const h = ctx.createRadialGradient(x, y, 0, x, y, r * 1.1);
        h.addColorStop(0, LIGHT.tint);
        h.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = h;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // dust sprite
    const dotSprite = document.createElement("canvas");
    dotSprite.width = dotSprite.height = 32;
    const dctx = dotSprite.getContext("2d");
    const gdot = dctx.createRadialGradient(16, 16, 0, 16, 16, 14);
    gdot.addColorStop(0, "rgb(88, 59, 128)");
    gdot.addColorStop(0.4, "rgba(223, 140, 170, 0.55)");
    gdot.addColorStop(1, "rgba(255,255,255,0)");
    dctx.fillStyle = gdot;
    dctx.beginPath();
    dctx.arc(16, 16, 14, 0, Math.PI * 2);
    dctx.fill();

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
              ? "rgba(255,220,235,0.7)"
              : Math.random() < 0.5
              ? "rgba(225,215,255,0.65)"
              : "rgba(230,242,255,0.7)",
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
        tint: Math.random() < 0.5 ? "rgba(255,240,230,0.6)" : "rgba(220,215,255,0.55)",
      });
    }

    let frame = 0;

    function loop() {
      frame++;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, w, h);

      // 누르고 있는 동안 radius 커지기
      LIGHT.radius = PRESSING ? PRESS_RADIUS : BASE_RADIUS;
      drawFlashlight(m.x, m.y);

      for (const p of points) {
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        const d = Math.hypot(dx, dy);

        const glowColor = d < 220 ? GLOW_NEAR : GLOW_FAR;

        const blinking = (frame + p.blinkOffset) % blinkCycle < p.blinkDuration;
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

        const noise = 0.01 * p.speedFactor;
        const attract = 0.0004;
        const maxD = 60;

        p.vx += (Math.random() - 0.07) * noise;
        p.vy += (Math.random() - 0.07) * noise;

        if (d < maxD) {
          p.vx += dx * attract;
          p.vy += dy * attract;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (d > maxD) {
          const a = Math.atan2(dy, dx) + 0.8;
          const spd = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(a) * spd;
          p.vy = Math.sin(a) * spd;
        }

        p.burstCD -= 1;
        if (d < maxD + 18 && p.burstCD <= 0) {
          const near = clamp01(1 - d / LIGHT.radius);
          const strength = 1 + near * 1.6;
          const count = 8 + Math.round(near * 10);

          const norm = Math.atan2(p.vy, p.vx) + Math.PI / 2;
          const bx = p.x + Math.cos(norm) * 6;
          const by = p.y + Math.sin(norm) * 6;

          emitBurst(bx, by, strength, count);

          const cdMin = 14;
          const cdMax = 40;
          p.burstCD = Math.round(cdMax - near * (cdMax - cdMin));
        } else if (Math.random() < 0.15) {
          emitTinyTrail(p.x, p.y, p.vx, p.vy);
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

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

    // 이미지 로드 타이밍 안전 처리
    if (mothImg.complete) loop();
    else {
      let startedLoop = false;
      const safeStart = () => {
        if (startedLoop) return;
        startedLoop = true;
        loop();
      };
      mothImg.onload = safeStart;
      setTimeout(safeStart, 300);
    }

    return true;
  }

  window.phototaxisStart = function ({ force = false } = {}) {
    if (!force && sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, "true");
    return startVisual();
  };

  window.phototaxisHide = function () {
    const canvas = document.getElementById("overlay");
    if (canvas) {
      canvas.style.display = "none";
      canvas.style.pointerEvents = "none";
    }
    document.body.classList.remove("phototaxis-active");
    window.lightHidden = true;
    cancelAnimationFrame(rafId);
  };
})();
