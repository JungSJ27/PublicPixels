// News.heart.js — clear glass shell + locked heart edges + wide-gamut soft core
import { Heart3D } from './heart3D.s4.js';
import * as THREE from 'three';

function mountNewsHeart(){
  const host = document.getElementById('indicator');
  if (!host) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'heart3d';
  host.appendChild(canvas);

  Heart3D.loadModel((model)=>{
    // 1) 유리 셸
    const heart = new Heart3D(canvas, model, {
      transmission: 1.0,
      thickness: 1,
      ior: 1.46,
      roughness: 0.01,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.15,
      color: 0xffffff,
      attenuationColor: 0xffffff,
      attenuationDistance: 8.0,
      transparent: true,
      opacity: 0.3,
      iridescence: 0.12,
      iridescenceIOR: 1.2,
      iridescenceThicknessRange: [210, 240]
    });

    heart.start();
    heart.setRotation(0, 0, 0);

    // 2) 하트 모서리 라인 — 메시에 직접 부착해서 분리 현상 방지
    let edgesDone = false;
    heart.group.traverse(m=>{
      if (edgesDone) return;
      if (m.isMesh && m.geometry){
        const egeo = new THREE.EdgesGeometry(m.geometry, 20);
        const emat = new THREE.LineBasicMaterial({
          color: 0xaad0ff,
          opacity: 1,            // 윤곽 강조
          transparent: true,
          depthTest: true,
          depthWrite: false,
          toneMapped: false
        });
        const edges = new THREE.LineSegments(egeo, emat);
        edges.renderOrder = 3300;
        edges.userData.__isInner = true;
        m.add(edges);
        edgesDone = true;
      }
    });

    // 3) 내부 코어 그룹 — 경계가 퍼지는 다층 구조
    const group = new THREE.Group();

    // 중심 코어: 살짝 투명
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    core.position.y = 3.3;            // 하트 중심보다 약간 위
    core.renderOrder = 3000;
    core.userData.__isInner = true;
    group.add(core);

    // 소프트 글로우 레이어 1
    const glow1 = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      })
    );
    glow1.position.y = core.position.y;
    glow1.renderOrder = 3010;
    glow1.userData.__isInner = true;
    group.add(glow1);

    // 소프트 글로우 레이어 2
    const glow2 = new THREE.Mesh(
      new THREE.SphereGeometry(2.9, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      })
    );
    glow2.position.y = core.position.y;
    glow2.renderOrder = 3011;
    glow2.userData.__isInner = true;
    group.add(glow2);

    // 전면 라디얼 안개 2겹
    function makeRadial(size=256){
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
      grd.addColorStop(0.00,'rgba(255,255,255,0.95)');
      grd.addColorStop(0.35,'rgba(255,255,255,0.42)');
      grd.addColorStop(0.80,'rgba(255,255,255,0.00)');
      g.fillStyle = grd; g.fillRect(0,0,size,size);
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      return tex;
    }

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeRadial(256),
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false
    }));
    halo.scale.set(1.05, 1.05, 1.05);
    halo.position.y = core.position.y;
    halo.renderOrder = 3200;
    halo.userData.__isInner = true;
    group.add(halo);

    const haloSoft = halo.clone();
    haloSoft.material = halo.material.clone();
    haloSoft.material.opacity = 0.22;
    haloSoft.scale.set(1.35, 1.35, 1.35);
    haloSoft.renderOrder = 3195;
    group.add(haloSoft);

    // 가짜 분산 느낌: 아주 옅은 RGB 홀로
    function makeTint(hOffDeg, opacity, scale){
      const sp = halo.clone();
      sp.material = halo.material.clone();
      const base = new THREE.Color().setHSL(0, 0, 1);
      base.offsetHSL(hOffDeg/360, 0, 0);
      sp.material.color.copy(base);
      sp.material.opacity = opacity;
      sp.scale.set(scale, scale, scale);
      return sp;
    }
    const holoR = makeTint(+10, 0.10, 1.12);
    const holoB = makeTint(-10, 0.10, 1.08);
    group.add(holoR, holoB);

    // 등록
    group.traverse(o => { o.userData.__isInner = true; });
    heart.addChild(group);

    // 4) 애니메이션과 스크롤 컬러
    const wobX = 0.06, wobZ = 0.035;
    let hue = 0, sat = 0.9, lum = 0.58, kick = 0;
    let last = performance.now();

    function loop(now){
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (heart.group){
        heart.group.rotation.y += 0.35 * dt;
        heart.group.rotation.x  = Math.sin(now*0.0008) * wobX;
        heart.group.rotation.z  = Math.sin(now*0.0013 + 0.7) * wobZ;
      }

      // 넓은 색역 적용
      const col   = new THREE.Color().setHSL(hue/360, sat, lum);
      const haloC = new THREE.Color().setHSL(hue/360, Math.min(0.98, sat+0.05), Math.min(0.85, lum+0.08));

      core.material.color.copy(col);
      glow1.material.color.copy(col);
      glow2.material.color.copy(col);
      halo.material.color.copy(haloC);
      haloSoft.material.color.copy(haloC);
      holoR.material.color.setHSL((hue+10)/360, sat, lum);
      holoB.material.color.setHSL((hue-10)/360, sat, lum);

      // 호흡과 킥
      const breathe = 0.9 + Math.sin(now*0.0012) * 0.1;
      kick = Math.max(0, kick - dt*1.6);
      halo.material.opacity     = 0.42 + 0.18*breathe + 0.18*kick;
      haloSoft.material.opacity = 0.22 + 0.16*breathe + 0.16*kick;

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // 스크롤 진행도 → 스펙트럼 2.2바퀴 순환, 채도 고정 높게
    let lastP = 0;
    function setProgress(p){
      const dp = p - lastP; lastP = p;
      const rounds = 2.6;      // 색 범위 확장
      hue = (p * 360 * rounds) % 360;
      sat = 0.95;
      // 노랑 구간이 탁해 보이지 않도록 살짝 보정
      const yellowGuard = 0.60 + 0.04 * Math.cos(p * Math.PI);
      lum = yellowGuard;

      if (Math.abs(dp) > 0.02){
        kick = Math.min(1, kick + Math.min(0.6, Math.abs(dp) * 8));
        heart.spinBurst(1.0, 0.5);
      }
    }

    const ro = new ResizeObserver(()=> heart.resize());
    ro.observe(host);
    window.addEventListener('resize', ()=> heart.resize(), { passive:true });

    window.__newsHeart = {
      setProgress,
      spin(){ heart.spinBurst(1.2, 0.8); },
      setGlass(o){ heart.setOptions(o || {}); },
      _dbg: { core, glow1, glow2, halo, haloSoft, holoR, holoB, heart }
    };
  }, err => console.error('[Heart3D] model load failed', err));
}

document.addEventListener('DOMContentLoaded', mountNewsHeart);
