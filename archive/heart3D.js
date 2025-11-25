// Heart3D.js — icon-accurate rendering, DPR-safe, clean dispose
import {
  Scene, PerspectiveCamera, WebGLRenderer,
  AmbientLight, DirectionalLight,
  Box3, Sphere,
  MeshPhysicalMaterial, DoubleSide, ACESFilmicToneMapping, SRGBColorSpace
 } from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Heart3D {
  static gltfModel = null;
  static loading = false;
  static loadCallbacks = [];

  static loadModel(callback){
    if (this.gltfModel) { callback(this.gltfModel.clone(true)); return; }
    if (this.loading)   { this.loadCallbacks.push(callback);    return; }
    this.loading = true;

    const loader = new GLTFLoader();
    loader.load('secass2/Sec2Heart.glb', (gltf)=>{
      const model = gltf.scene;

    // 기본 유리 재질 (파란 유리)
    const blueMaterial = new MeshPhysicalMaterial({
        color: 0x28D9B8,          // 표면 틴트
        transmission: 0.02,       // 유리 투명도(0~1) ← 핵심
        thickness: 0.35,          // 두께(굴절감)
        ior: 1.5,                 // 굴절률(유리 1.45~1.52)
        roughness: 0.05,          // 표면 거칠기(0이면 매끈)
        metalness: 0.0,           // 유리는 금속성 0
        attenuationColor: 0x2ea8ff,   // 내부 색(흡수 색)
        attenuationDistance: 1.2,     // 색이 사라지는 거리
        side: DoubleSide,
        transparent: false,       // transmission 쓸 땐 보통 false
        opacity: 1
    });
    
    model.traverse(n => { if (n.isMesh) n.material = blueMaterial; });

      Heart3D.gltfModel = model;
      Heart3D.loading   = false;
      const cbs = Heart3D.loadCallbacks.splice(0);
      cbs.forEach(cb => cb(model.clone(true)));
      callback(model.clone(true));
    }, undefined, (err)=>{
      console.error('Failed to load heart model:', err);
      Heart3D.loading = false;
      Heart3D.loadCallbacks = [];
    });
  }

    constructor(canvas, model, opts = {}){
    this.canvas = canvas;
    this.scene  = new Scene();
    this.opts = Object.assign({
      color: 0x5A46FF,        // 표면 틴트
      transmission: 0.8,     // 유리 투명도(핵심)
      thickness: 0.5,
      ior: 2,
      roughness: 0.5,
      metalness: 0.0,
      attenuationColor: 0x9E8CFF,
      attenuationDistance: 0.4
    }, opts);

    // 카메라
    const rect = canvas.getBoundingClientRect();
    this.camera = new PerspectiveCamera(45, rect.width/rect.height, 0.1, 1000);

    // 모델 중심/스케일
    const bbox    = new Box3().setFromObject(model);
    const sphere  = new Sphere(); bbox.getBoundingSphere(sphere);
    model.position.sub(sphere.center);
    const SAFE_SCALE = 0.9; model.scale.setScalar(SAFE_SCALE);

    const radius = sphere.radius * SAFE_SCALE;
    const dist   = radius * 2.05;
    this.camera.position.set(0, 0, dist);
    this.camera.near = Math.max(0.01, dist - radius * 3);
    this.camera.far  = dist + radius * 4;
    this.camera.updateProjectionMatrix();

    // 조명
    const ambient = new AmbientLight(0xffffff, 0.6);
    const dir     = new DirectionalLight(0xffffff, 0.85); dir.position.set(1,1,2);
    this.scene.add(ambient, dir);

    // 모델
    this.model = model;
    this.scene.add(this.model);
    this.applyMaterialOptions();


    // 렌더러 (DPR 적용)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new WebGLRenderer({ canvas, alpha:true, antialias:true });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(rect.width, rect.height, false);
    this.renderer.setClearColor(0x000000, 0);

    // 리사이즈 핸들러(회전/줌 변화에도 선명도 유지)
    this._onResize = () => {
      const r = canvas.getBoundingClientRect();
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      this.renderer.setPixelRatio(nextDpr);
      this.renderer.setSize(r.width, r.height, false);
      this.camera.aspect = r.width / r.height;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);

     this._animationId = null;
     this._last = null;
     this._burstTargetY = null;   // 회전 목표 각
     this._burstSpeed   = 0;      // rad/sec
     // "정면" 각도(모델이 처음 로드됐을 때의 방향을 정면으로 사용)
     this.frontYaw = (model?.rotation?.y ?? 0);
     // 전역 오버라이드가 있으면 사용(필요시 미세 튠)
     if (typeof window.Heart3D_FRONT === 'number') this.frontYaw = window.Heart3D_FRONT;
  }
  applyMaterialOptions(){
      const {
        color, transmission, thickness, ior,
        roughness, metalness, attenuationColor, attenuationDistance
      } = this.opts;    this.model?.traverse(o=>{
      if (!o.isMesh || !o.material) return;

    // ✅ 재질 공유 방지: 인스턴스별로 1회만 복제
      if (!o.material.__heartCloned){
      o.material = o.material.clone();
      o.material.__heartCloned = true;
    }
    const m = o.material;      
    if (m.color) m.color.set(color);
    if ('transmission' in m && typeof transmission === 'number') m.transmission = transmission;
    if ('thickness'    in m && typeof thickness    === 'number') m.thickness    = thickness;
    if ('ior'          in m && typeof ior          === 'number') m.ior          = ior;
    if ('roughness'    in m && typeof roughness    === 'number') m.roughness    = roughness;
    if ('metalness'    in m && typeof metalness    === 'number') m.metalness    = metalness;
    if ('attenuationColor'     in m && attenuationColor != null)  m.attenuationColor.set(attenuationColor);
    if ('attenuationDistance'  in m && typeof attenuationDistance === 'number') m.attenuationDistance = attenuationDistance;
    // transmission 기반에선 보통 transparent=false, opacity=1 유지
    if ('transparent' in m) m.transparent = false;
    if ('opacity'     in m) m.opacity     = 1;
      
      m.needsUpdate = true;
    });
  }

  setOptions(next){
    Object.assign(this.opts, next || {});
    this.applyMaterialOptions();
  }

 start(){
  const tick = (t) => {
    this._animationId = requestAnimationFrame(tick);
    if (this._last == null) this._last = t;
    const dt = Math.min(0.05, (t - this._last) / 1000); // 안전 dt
    this._last = t;

    // 버스트 회전 중이면 목표 각까지 진행
    if (this.model && this._burstTargetY != null){
      const cur   = this.model.rotation.y;
      const step  = this._burstSpeed * dt;      // 매 프레임 이동량(양수)
      const remain = this._burstTargetY - cur;  // 남은 각도

      if (remain <= step){
        this.model.rotation.y = this._burstTargetY; // 딱 정면에서 멈춤
        this._burstTargetY = null;
        this._burstSpeed   = 0;
      }else{
        this.model.rotation.y = cur + step;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
  this._animationId = requestAnimationFrame(tick);
}

/** 빠르게 N바퀴 돌고 '정면'에서 정지
 *  finalYaw: 정면 각도(라디안). 미지정 시 this.frontYaw 또는 0 사용.
 */
spinBurst(revolutions = 3, seconds = 0.9, finalYaw = (this.frontYaw ?? 0)){
  if (!this.model) return;

  const TWO_PI = Math.PI * 2;
  const norm = (x)=>((x % TWO_PI) + TWO_PI) % TWO_PI; // [0,2π)

  const curAbs   = this.model.rotation.y; // 절대 현재 각
  const cur      = norm(curAbs);
  const target   = norm(finalYaw);

  // 현재 각에서 정면까지의 +방향 최단각 (0~2π)
  const snap = norm(target - cur);

  // 총 이동각 = N바퀴 + 정면까지 스냅
  const total = revolutions * TWO_PI + snap;

  this._burstTargetY = curAbs + total;                 // 절대 목표 각
  this._burstSpeed   = total / Math.max(0.2, seconds); // rad/sec
}


  dispose(){
    if (this._animationId) { cancelAnimationFrame(this._animationId); this._animationId = null; }
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);

    if (this.model) { this.scene.remove(this.model); this.model = null; }
    this.renderer.dispose();
    const c = this.renderer.domElement;
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }
}
