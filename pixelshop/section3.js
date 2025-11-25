document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('s3-track');
  if (!track) return;

  // 1) 데이터
  const BASE_DIR = 'pixelshop/secass3';
  const FILES = [
    { id: 6, name: 'img6.png',         alt: 'Necklace' },
    { id: 7, name: 'Sequence07.mp4',   alt: 'Reel 07',  poster: 'Sequence07.png' }, // video
    { id: 3, name: 'img3.png',         alt: 'Scrunchie' },
    { id: 4, name: 'img4.png',         alt: 'Scrunchie' },
    { id: 5, name: 'Sequence05.mp4',   alt: 'Necklace', poster: 'Sequence05.png' },         // video
    { id: 2, name: 'Sequence02.mp4',   alt: 'Robe', poster: 'Sequence02.png'},             // video
    { id: 1, name: 'img1.png',         alt: 'Robe' },
  ];
  const ITEMS = FILES.map((f, i) => ({
    id: f.id ?? (i + 1),
    src: `${BASE_DIR}/${f.name}`,
    alt: f.alt || `Item ${f.id ?? (i + 1)}`,
    href: `pixelshop/`,
    poster: f.poster ? `${BASE_DIR}/${f.poster}` : undefined,
  }));

  // ✅ 렌더러 (영상/이미지 자동 분기)
  function renderItems(track, items) {
    track.innerHTML = '';
    const frag = document.createDocumentFragment();

    items.forEach((it, idx) => {
      const li = document.createElement('li');
      li.className = 's3-item';

      const a = document.createElement('a');
      a.className = 's3-link';
      a.href = it.href;
      a.setAttribute('aria-label', `Open ${it.alt || `Item ${it.id ?? idx + 1}`}`);

      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(it.src);
      const media = isVideo ? document.createElement('video') : document.createElement('img');

      if (isVideo) {
        const v = media;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.autoplay = true;                        // 🔹 iOS 호환 자동재생
        v.disablePictureInPicture = true;         // 🔹 PiP 버튼 제거
        v.preload = 'auto';
        if (it.poster) v.poster = it.poster;
        v.setAttribute('aria-label', it.alt || 'video');

        const m = it.src.match(/^(.*)\.(mp4|webm|ogg)(\?.*)?$/i);
        const base = m ? m[1] : it.src.replace(/\.(mp4|webm|ogg)(\?.*)?$/i, '');
        const q = m && m[3] ? m[3] : '';

        const sWebm = document.createElement('source');
        sWebm.src = base + '.webm' + q;
        sWebm.type = 'video/webm; codecs=vp9';

        const sMp4 = document.createElement('source');
        sMp4.src = base + '.mp4' + q;
        sMp4.type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

        v.appendChild(sWebm);
        v.appendChild(sMp4);

        v.addEventListener('canplay', () => v.play().catch(() => {}), { once: true });
        v.addEventListener('error', () => {
          if (!it.poster) return;
          const img = document.createElement('img');
          img.src = it.poster;
          img.alt = it.alt || '';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.style.pointerEvents = 'none';
          v.replaceWith(img);
        }, { once: true });
      } else {
        media.src = it.src;
        media.alt = it.alt || '';
        media.loading = 'lazy';
        media.decoding = 'async';
      }

      media.style.pointerEvents = 'none';
      a.appendChild(media);
      li.appendChild(a);
      frag.appendChild(li);
    });

    track.appendChild(frag);
  }

  // 호출
  renderItems(track, ITEMS);

  // Intersection Observer — 보일 때만 재생
  const videos = track.querySelectorAll('video');
  if (videos.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { root: track || null, threshold: 0.3 });  // 🔹 root 안전가드
    videos.forEach(v => io.observe(v));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) videos.forEach(v => v.pause());
    });
  }

  // 미디어 드래그·선택 방지
  track.querySelectorAll('img,video').forEach(el => {
    el.setAttribute('draggable', 'false');
    el.style.pointerEvents = 'none';
    el.style.userSelect = 'none';
    el.style.webkitUserDrag = 'none';
  });

  // ===============================
  //  스크롤 제스처 로직
  // ===============================

  let _glAxis = null;
  let _glStamp = 0;
  let _glJustLockedX = false;
  let _hPending = 0, _hRAF = 0;
  let _snapT = 0;
  let _preferXUntil = 0;

  function _flushH() {
    if (!_hPending) { _hRAF = 0; return; }
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    const next = Math.min(max, Math.max(0, track.scrollLeft + _hPending));
    track.scrollLeft = next;
    _hPending = 0;
    _hRAF = 0;
  }
  function _disableSnap() {
    if (!track.classList.contains('is-scrolling')) track.classList.add('is-scrolling');
    clearTimeout(_snapT);
    _snapT = setTimeout(() => track.classList.remove('is-scrolling'), 180);
  }

  // 🔹 포인터 진입 시 가로 우선 선잠금
  track.addEventListener('pointerenter', () => { _preferXUntil = performance.now() + 280; });
  track.addEventListener('mouseenter',    () => { _preferXUntil = performance.now() + 280; });
  track.addEventListener('touchstart',    () => { _preferXUntil = performance.now() + 280; }, { passive: true }); // 🔹 모바일 대응
  track.addEventListener('pointerleave',  () => {  // 🔹 벗어날 때 상태 리셋
    _preferXUntil = 0; _glAxis = null; _glJustLockedX = false; _hPending = 0;
  });

  // 휠 스크롤
  track.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) return;

    const now = performance.now();
    if (now - _glStamp > 120) _glAxis = null;
    _glStamp = now;

    const LINE = 1, PAGE = 2;
    const k  = e.deltaMode === LINE ? 16 : (e.deltaMode === PAGE ? 800 : 1);
    const dx = e.deltaX * k;
    const dy = e.deltaY * k;

    const hMax = Math.max(0, track.scrollWidth - track.clientWidth);
    if (hMax <= 0) return;

    if (_glAxis == null) {
      if (now <= _preferXUntil) {
        _glAxis = 'x'; _glJustLockedX = true;
      } else {
        const V_DOM = 1.35, H_DOM = 1.05;
        if (Math.abs(dy) > Math.abs(dx) * V_DOM) { _glAxis = 'y'; return; }
        if (Math.abs(dx) > Math.abs(dy) * H_DOM) { _glAxis = 'x'; _glJustLockedX = true; }
        else {
          if (Math.abs(dx) < 1 && Math.abs(dy) > 1) { _glAxis = 'x'; _glJustLockedX = true; }
          else return;
        }
      }
    }

    if (_glAxis === 'y') return;

    const hDelta = (Math.abs(dx) > Math.abs(dy) ? dx : dy);
    const before = track.scrollLeft;
    const after  = Math.min(hMax, Math.max(0, before + hDelta));
    const atLeft  = before <= 0;
    const atRight = before >= hMax - 1;

    if ((hDelta < 0 && atLeft) || (hDelta > 0 && atRight)) {
      _glAxis = 'y';
      e.preventDefault();
      window.scrollBy({ top: hDelta, left: 0, behavior: 'auto' });
      return;
    }

    _disableSnap();

    if (after !== before) {
      e.preventDefault();
      if (_glJustLockedX) {
        track.scrollLeft = after;
        _glJustLockedX = false;
      } else {
        _hPending += hDelta;
        if (!_hRAF) _hRAF = requestAnimationFrame(_flushH);
      }
    }
  }, { passive: false });

  // ===============================
  // 드래그 스크롤
  // ===============================
  let dragging = false, moved = false, startX = 0, startLeft = 0;
  const CLICK_DRAG_TOL = 6;
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; moved = false;
    const p = e.touches ? e.touches[0] : e;
    startX = p.clientX; startLeft = track.scrollLeft; track.style.cursor = 'grabbing';
  }
  function onMove(e) {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - startX;
    if (Math.abs(dx) > CLICK_DRAG_TOL) moved = true;
    track.scrollLeft = startLeft - dx;
  }
  function onUp() {
    if (!dragging) return;
    dragging = false; setTimeout(() => { moved = false; }, 0); track.style.cursor = '';
  }

  if (window.PointerEvent) {
    track.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup',   onUp,   { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
  } else {
    track.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup',   onUp,   { passive: true });
    track.addEventListener('touchstart', onDown, { passive: true });
    track.addEventListener('touchmove',  onMove, { passive: true });
    track.addEventListener('touchend',   onUp,   { passive: true });
    track.addEventListener('touchcancel',onUp,   { passive: true });
  }

  track.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('.s3-link');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.button === 1) return;
    if (moved) { e.preventDefault(); e.stopPropagation(); }
  }, true);
});
