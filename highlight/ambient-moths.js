(function(){
  const cvs = document.getElementById('ambient-moths');
  if(!cvs) return;
  const ctx = cvs.getContext('2d');

  // ===== 옵션 (필요한 것만 남김: glow 1가지 색) =====
  const OPT = {
    count: Math.floor(Math.random()*8), // 0~7 랜덤
    mothSize: 11,
    mothAlpha: 1,                     // 0~1
    glow: 'rgba(60, 228, 203, 0.92)',

    shadowBlur: 10,

    // steering
    baseSpeed: 1.2,
    baseTurnEase: 0.05,
    baseNoise: 0.1,

    edgePad: 15,

    // dust
    dustMax: 400,
    dustPerSec: [6,14],
    dustLife: [0.6, 1.4],  // sec
    dustSize: [0.5, 1.2],  // px
    dustGravity: 0.012
  };

  // === canvas DPR
  const DPR = Math.min(1.5, window.devicePixelRatio || 1);
  function resizeViewport(){
    cvs.width  = Math.floor(innerWidth  * DPR);
    cvs.height = Math.floor(innerHeight * DPR);
    cvs.style.width  = innerWidth  + 'px';
    cvs.style.height = innerHeight + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resizeViewport();
  addEventListener('resize', resizeViewport, {passive:true});

  // === world size (문서 전체)
  function worldSize(){
    const de = document.documentElement, b = document.body;
    return {
      w: Math.max(de.scrollWidth,  b.scrollWidth,  de.clientWidth),
      h: Math.max(de.scrollHeight, b.scrollHeight, de.clientHeight)
    };
  }
  let WORLD = worldSize();
  let _rs=0;
  addEventListener('scroll', ()=>{ if((++_rs%10)===0) WORLD = worldSize(); }, {passive:true});
  const mo = new MutationObserver(()=>{ WORLD = worldSize(); });
  mo.observe(document.body, {childList:true, subtree:true});

  // === assets
  const mothImg = new Image();
  mothImg.src = '/front/Moth.png';
  let mothReady=false; mothImg.onload=()=>mothReady=true;

  // === util
  const rand = (a,b)=> a + Math.random()*(b-a);
  const pick = a => a[(Math.random()*a.length)|0];

  // === moths
  const moths = [];
  for(let i=0;i<OPT.count;i++){
    moths.push({
      x: Math.random()*WORLD.w,
      y: Math.random()*WORLD.h,
      ang: Math.random()*Math.PI*2,
      speed: OPT.baseSpeed * rand(0.7,1.4),
      turnEase: OPT.baseTurnEase * rand(0.5,1.5),
      noise: OPT.baseNoise * rand(0.5,1.5),
      t: Math.random()*1000,
      dustTimer: 0,
      targetX: Math.random()*WORLD.w,
      targetY: Math.random()*WORLD.h,
      changeTarget: Math.floor(rand(150, 400)),
      edgeCool: 0 // ★ 가장자리 팡팡 쿨다운
    });
  }

  // === dust sprite (Phototaxis 느낌)
  const dotSprite = document.createElement('canvas');
  dotSprite.width = dotSprite.height = 32;
  const dctx = dotSprite.getContext('2d');
  const gdot = dctx.createRadialGradient(16,16,0,16,16,14);
  gdot.addColorStop(0,'rgb(126, 48, 189)');
  gdot.addColorStop(0.4,'rgba(250, 180, 200, 0.55)');
  gdot.addColorStop(1,'rgba(255,255,255,0)');
  dctx.fillStyle = gdot;
  dctx.beginPath(); dctx.arc(16,16,14,0,Math.PI*2); dctx.fill();

  // === dust system
  const dust=[];
  function spawnDust(x,y,vx,vy,n){
    for(let i=0; i<n && dust.length<OPT.dustMax; i++){
      dust.push({
        x, y,
        vx: vx*0.1 + (Math.random()-0.5)*0.6,
        vy: vy*0.1 + (Math.random()-0.5)*0.6,
        life: rand(OPT.dustLife[0], OPT.dustLife[1]) * 60,
        r: rand(OPT.dustSize[0], OPT.dustSize[1]),
        tint: pick([
          'rgba(255,240,230,0.8)',
          'rgba(232,226,255,0.75)',
          'rgba(210,205,255,0.7)'
        ]),
        sprite:false
      });
    }
  }

  function emitBurst(x,y){
    // ★ 반경/세기/수명 축소 (가장자리/충돌 모두 공통)
    const count = 12 + Math.random()*6;        // 12~20 -> 8~14
    const strength = 1 + Math.random()*0.9; // 1~2.5 -> 0.6~1.5
    for (let i=0; i<count && dust.length<OPT.dustMax; i++){
      const ang = Math.random()*Math.PI*2;
      const sp  = strength*(0.4 + Math.random()*0.6); // 속도 약화
      dust.push({
        x,y,
        vx: Math.cos(ang)*sp,
        vy: Math.sin(ang)*sp,
        life: 35 + Math.random()*50,           // 50~130 -> 30~80 (더 빨리 사라짐)
        r: rand(0.4,0.9),                      // 크기 소폭 축소
        tint: pick([
          'rgba(255,220,235,0.7)',
          'rgba(225,215,255,0.65)',
          'rgba(230,242,255,0.7)'
        ]),
        sprite:true
      });
    }
  }

  // === loop
  let raf=0, prev=0;
  function tick(ts){
    const dt = (ts - (prev||ts)) / 16.6667; prev = ts;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,cvs.width/DPR, cvs.height/DPR);

    const camX = scrollX, camY = scrollY;
    ctx.translate(-camX, -camY);

    // ---- moth update
    for(const p of moths){
      p.t += dt;
      if (p.edgeCool > 0) p.edgeCool -= dt; // ★ 쿨다운 감소

      // 목적지 갱신
      if (--p.changeTarget <= 0){
        p.targetX = Math.random()*WORLD.w;
        p.targetY = Math.random()*WORLD.h;
        p.changeTarget = Math.floor(rand(150, 400));
      }

      // steering
      const dx = p.targetX - p.x, dy = p.targetY - p.y;
      const targetAng = Math.atan2(dy, dx);
      const da = Math.atan2(Math.sin(targetAng - p.ang), Math.cos(targetAng - p.ang));
      p.ang += da * p.turnEase + (Math.random()-0.5) * p.noise;

      // 이동
      const vx = Math.cos(p.ang) * p.speed;
      const vy = Math.sin(p.ang) * p.speed;
      p.x += vx * dt;
      p.y += vy * dt;

      // ★ 가장자리 처리: 한 번만 팡! + 되밀기 + 각도 크게 틀기 + 위치 클램프
      const atEdge = (p.x < OPT.edgePad || p.x > WORLD.w-OPT.edgePad ||
                      p.y < OPT.edgePad || p.y > WORLD.h-OPT.edgePad);
      if (atEdge && p.edgeCool <= 0){
        emitBurst(p.x, p.y);
        p.ang += Math.PI * 0.85;              // 급선회(더 크게)
        // 살짝 안쪽으로 밀기
        if (p.x < OPT.edgePad) p.x = OPT.edgePad + 2;
        if (p.x > WORLD.w-OPT.edgePad) p.x = WORLD.w-OPT.edgePad - 2;
        if (p.y < OPT.edgePad) p.y = OPT.edgePad + 2;
        if (p.y > WORLD.h-OPT.edgePad) p.y = WORLD.h-OPT.edgePad - 2;
        // 중심 쪽 임시 타겟
        p.targetX = Math.min(Math.max(p.x, OPT.edgePad+50), WORLD.w-OPT.edgePad-50);
        p.targetY = Math.min(Math.max(p.y, OPT.edgePad+50), WORLD.h-OPT.edgePad-50);
        p.edgeCool = 45; // 프레임 기준 약 0.75초 쿨다운(60fps 가정) ★
      }

      // trail
      const rate = rand(OPT.dustPerSec[0], OPT.dustPerSec[1]);
      p.dustTimer += rate*dt/60;
      if (p.dustTimer >= 1){
        const n = p.dustTimer|0; p.dustTimer -= n;
        spawnDust(p.x-vx*2, p.y-vy*2, vx, vy, n);
      }

      // draw moth
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang+Math.PI/2);
      ctx.shadowColor = OPT.glow;
      ctx.shadowBlur  = OPT.shadowBlur;
      ctx.globalAlpha = OPT.mothAlpha;

      if (mothReady){
        const s = OPT.mothSize;
        ctx.drawImage(mothImg,-s/2,-s/2,s,s);
      } else {
        ctx.fillStyle='#fff';
        ctx.beginPath();
        ctx.arc(0,0,OPT.mothSize/2,0,Math.PI*2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      ctx.restore();
    }

    // ---- 충돌 시 팡팡
    for (let i=0; i<moths.length; i++){
      for (let j=i+1; j<moths.length; j++){
        const a=moths[i], b=moths[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const dist=Math.hypot(dx,dy);
        if (dist < OPT.mothSize*1.5){
          emitBurst((a.x+b.x)/2,(a.y+b.y)/2);
          const angle=Math.atan2(dy,dx);
          a.ang = angle + Math.PI/2;
          b.ang = angle - Math.PI/2;
          a.edgeCool = b.edgeCool = 15; // ★ 충돌 직후도 잠깐 쿨다운
        }
      }
    }

    // ---- dust render
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(let i=dust.length-1;i>=0;i--){
      const q=dust[i]; q.life-=dt;
      if(q.life<=0){ dust[i]=dust[dust.length-1]; dust.pop(); continue; }
      q.x+=q.vx*dt; q.y+=q.vy*dt+OPT.dustGravity*dt;

      const alpha = Math.max(0, Math.min(1, q.life/(OPT.dustLife[1]*60)));
      if (q.sprite){
        const size = q.r*7;          // ★ 스프라이트 크기 소폭 축소(8 -> 7배)
        ctx.globalAlpha = 0.2 + alpha*0.5;
        ctx.drawImage(dotSprite, q.x - size/2, q.y - size/2, size, size);
      }
      ctx.globalAlpha = 0.15 + alpha*0.25;
      ctx.fillStyle = q.tint;
      ctx.beginPath(); ctx.arc(q.x,q.y,q.r,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha=1;

    ctx.setTransform(DPR,0,0,DPR,0,0);
    raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);

  // === 외부 API: 불투명도 조절 ===
  window.setMothAlpha = (a)=>{ OPT.mothAlpha=Math.max(0,Math.min(1,a)); };
})();
