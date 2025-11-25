// Front/phototaxis-shim.js
(function(){
  const IS_HOME = document.body?.dataset?.page === 'home';
  const overlay = () => document.getElementById('overlay');

  // 세션 1회 자동 실행 플래그
  const KEY_SHOWN_SESSION = 'phototaxis_shown_this_session';
  const hasShownThisSession = () => sessionStorage.getItem(KEY_SHOWN_SESSION) === '1';
  const markShownThisSession = () => sessionStorage.setItem(KEY_SHOWN_SESSION, '1');

  // ---- 스타터 함수 탐색 (함수명이 달라도 최대한 찾아서 실행) ----
  function resolveStarter(){
    // 1) 대표 후보
    const direct = [
      'phototaxisStart',
      'startPhototaxis',
      'startLight',
      'initPhototaxis',
    ];
    for (const name of direct){
      const fn = window[name];
      if (typeof fn === 'function') return { fn, name };
    }
    // 2) 네임스페이스 후보
    if (window.phototaxis && typeof window.phototaxis.start === 'function'){
      return { fn: window.phototaxis.start, name: 'phototaxis.start' };
    }
    // 3) 힌트 기반 스캔 (photo|light + start|init 둘 다 포함)
    for (const k of Object.keys(window)){
      const v = window[k];
      if (typeof v === 'function' &&
          /photo|light/i.test(k) && /start|init/i.test(k)) {
        return { fn: v, name: k };
      }
    }
    return null;
  }

  // ---- 표준 API ----
  const API = {
    show(){
      const cv = overlay();
      if (cv) cv.style.display = 'block';
      document.body.classList.add('phototaxis-active');
      window.lightHidden = false;
    },
    hide(){
      const cv = overlay();
      if (cv) cv.style.display = 'none';
      document.body.classList.remove('phototaxis-active');
      window.lightHidden = true;
    },
    /**
     * start({ force=false }): force=true면 세션 1회 제한 무시(로고 클릭용)
     */
    start(opts={}){
      const force = !!opts.force;
      if (!force && hasShownThisSession()) return false;

      // 과거 구현 호환
      try { sessionStorage.removeItem('seenThisSession'); } catch (_){}

      this.show();

      const entry = resolveStarter();
      if (entry){
        try {
          entry.fn();
          markShownThisSession();
          window.dispatchEvent(new CustomEvent('phototaxis:started', { detail: { entry: entry.name }}));
          return true;
        } catch(e){
          console.error('[Phototaxis] start error from', entry.name, e);
        }
      }

      // 스타터를 못 찾았으면 되돌림
      this.hide();
      return false;
    },
    isActive(){ return !window.lightHidden && overlay()?.style.display !== 'none'; },

    // 홈 진입시 자동 1회 (Phototaxis.js 로드 지연 대비 최대 2초 재시도)
    maybeAutoStartOncePerSession(){
      if (!IS_HOME || hasShownThisSession()) return;
      let tries = 0;
      const t = setInterval(() => {
        if (API.start({ force:false }) || ++tries >= 10) clearInterval(t);
      }, 200);
    }
  };

  if (typeof window.lightHidden !== 'boolean') window.lightHidden = true;
  window.Phototaxis = API;

  // 강제 시작 이벤트 훅 (디버그/외부 트리거용)
  window.addEventListener('phototaxis:force-start', () => API.start({ force:true }));

  // 홈에서 세션당 1회 자동 실행
  API.maybeAutoStartOncePerSession();

  // URL로 강제 시작 테스트 (?pt=1)
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('pt') === '1') {
      API.start({ force:true });
      url.searchParams.delete('pt');
      history.replaceState(null, document.title, url.toString());
    }
  } catch {}
})();
