// Heart3D.s4.js — thin clear glass shell with safe updates for inner overlays
import {
  Scene, PerspectiveCamera, WebGLRenderer,
  AmbientLight, DirectionalLight,
  Box3, Sphere, PMREMGenerator,
  MeshPhysicalMaterial, DoubleSide,
  ACESFilmicToneMapping, SRGBColorSpace, Color
} from 'three';
import { GLTFLoader }      from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class Heart3D {
  static gltfModel = null;
  static loading = false;
  static q = [];

  static loadModel(cb){
    if (this.gltfModel){ cb(this.gltfModel.clone(true)); return; }
    if (this.loading){ this.q.push(cb); return; }
    this.loading = true;

    const loader = new GLTFLoader();
    loader.load('secass4/Sec4Heart.glb', g=>{
      const model = g.scene;

      const base = new MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 1.0,
        thickness: 0.35,
        ior: 1.46,
        roughness: 0.015,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        attenuationColor: 0xffffff,
        attenuationDistance: 5.0,
        side: DoubleSide,
        transparent: true,
        opacity: 0.22,
        iridescence: 0.10,
        iridescenceIOR: 1.2,
        iridescenceThicknessRange: [210, 240]
      });
      model.traverse(o=>{ if (o.isMesh) o.material = base.clone(); });

      Heart3D.gltfModel = model;
      Heart3D.loading   = false;
      const q = this.q.splice(0);
      q.forEach(fn => fn(model.clone(true)));
      cb(model.clone(true));
    }, undefined, err=>{
      console.error('[Heart3D] load fail', err);
      this.loading = false; this.q = [];
    });
  }

  constructor(canvas, model, opts={}){
    this.canvas = canvas;
    this.scene  = new Scene();

    this.opts = Object.assign({
      color: 0xffffff,
      transmission: 1.0,
      thickness: 0.35,
      ior: 1.46,
      roughness: 0.015,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.1,
      attenuationColor: 0xffffff,
      attenuationDistance: 5.0,
      iridescence: 0.10,
      iridescenceIOR: 1.2,
      iridescenceThicknessRange: [210, 240],
      transparent: true,
      opacity: 0.22
    }, opts);

    const rect = canvas.getBoundingClientRect();
    this.camera = new PerspectiveCamera(45, Math.max(1, rect.width) / Math.max(1, rect.height), 0.01, 1000);

    // 모델 센터링
    const bbox = new Box3().setFromObject(model);
    const sphere = new Sphere(); bbox.getBoundingSphere(sphere);
    model.position.sub(sphere.center);
    const SAFE = 0.9; model.scale.setScalar(SAFE);

    const r = Math.max(0.0001, sphere.radius * SAFE);
    const dist = r * 2.05;
    this.camera.position.set(0, 0.03, dist);
    this.camera.near = Math.max(0.001, dist - r * 3);
    this.camera.far  = dist + r * 4;
    this.camera.updateProjectionMatrix();

    // 라이트
    const amb = new AmbientLight(0xffffff, 0.55);
    const dir = new DirectionalLight(0xffffff, 0.95); dir.position.set(1,1,2);
    this.scene.add(amb, dir);

    this.group = model;
    this.scene.add(this.group);
    this.applyMaterialOptions(this.opts);

    // 렌더러
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new WebGLRenderer({ canvas, alpha:true, antialias:true });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    this.renderer.setClearColor(0x000000, 0);

    // 환경맵
    const pmrem = new PMREMGenerator(this.renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.1);
    this.scene.environment = envRT.texture;

    // 리스너
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize, { passive:true });
    window.addEventListener('orientationchange', this._onResize, { passive:true });

    // 애니 상태
    this._raf = null;
    this._last = null;
    this._burstTargetY = null;
    this._burstSpeed   = 0;

    this.frontYaw = (model?.rotation?.y ?? 0);
    if (typeof window.Heart3D_FRONT === 'number') this.frontYaw = window.Heart3D_FRONT;
  }

  // 유리만 옵션 적용  내부 오브젝트는 건드리지 않음
  applyMaterialOptions(o = {}){
    if (!this.group) return;
    this.group.traverse(n=>{
      if (!n.isMesh || !n.material) return;
      if (n.userData && n.userData.__isInner) return;
      if (!n.material.isMeshPhysicalMaterial) return;

      if (!n.material.__heartCloned){
        n.material = n.material.clone();
        n.material.__heartCloned = true;
      }
      const m = n.material;

      if (m.color && o.color != null) m.color.set(o.color);
      if (o.transmission != null) m.transmission = o.transmission;
      if (o.ior != null) m.ior = o.ior;
      if (o.roughness != null) m.roughness = o.roughness;
      if (o.metalness != null) m.metalness = o.metalness;
      if (o.clearcoat != null) m.clearcoat = o.clearcoat;
      if (o.clearcoatRoughness != null) m.clearcoatRoughness = o.clearcoatRoughness;
      if (o.envMapIntensity != null) m.envMapIntensity = o.envMapIntensity;
      if (o.attenuationColor != null) m.attenuationColor = new Color(o.attenuationColor);
      if (o.attenuationDistance != null) m.attenuationDistance = o.attenuationDistance;
      if (o.iridescence != null) m.iridescence = o.iridescence;
      if (o.iridescenceIOR != null) m.iridescenceIOR = o.iridescenceIOR;
      if (o.iridescenceThicknessRange) m.iridescenceThicknessRange = [...o.iridescenceThicknessRange];
      if (o.transparent != null) m.transparent = o.transparent;
      if (o.opacity != null) m.opacity = o.opacity;

      // 내부가 보이도록
      m.depthWrite = false;

      m.needsUpdate = true;
    });
  }

  setOptions(next){ Object.assign(this.opts, next || {}); this.applyMaterialOptions(this.opts); }
  setRotation(x=0,y=0,z=0){ if (this.group){ this.group.rotation.set(x,y,z); this.frontYaw = y; } }
  addChild(obj){ if (this.group) this.group.add(obj); }

  resize(){
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start(){
    const loop = (t)=>{
      this._raf = requestAnimationFrame(loop);
      if (this._last == null) this._last = t;
      const dt = Math.min(0.05, (t - this._last)/1000); this._last = t;

      if (this.group && this._burstTargetY != null){
        const cur = this.group.rotation.y;
        const step = this._burstSpeed * dt;
        const remain = this._burstTargetY - cur;
        if (remain <= step){ this.group.rotation.y = this._burstTargetY; this._burstTargetY = null; this._burstSpeed = 0; }
        else { this.group.rotation.y = cur + step; }
      }

      this.renderer.render(this.scene, this.camera);
    };
    this._raf = requestAnimationFrame(loop);
  }

  spinBurst(revolutions=3, seconds=0.9, finalYaw=(this.frontYaw ?? 0)){
    if (!this.group) return;
    const TAU = Math.PI * 2;
    const norm = x => ((x % TAU)+TAU)%TAU;
    const curAbs = this.group.rotation.y;
    const cur = norm(curAbs), target = norm(finalYaw);
    const snap = norm(target - cur);
    const total = revolutions * TAU + snap;
    this._burstTargetY = curAbs + total;
    this._burstSpeed   = total / Math.max(0.2, seconds);
  }

  dispose(){
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
    if (this.group){ this.scene.remove(this.group); this.group = null; }
    this.renderer.dispose();
    const c = this.renderer.domElement; if (c && c.parentNode) c.parentNode.removeChild(c);
  }
}
