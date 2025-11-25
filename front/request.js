// Request page only — collects form, shows cart snapshot, posts to your Apps Script, stores request id

// ===== config =====
const CART_KEY = "pp_cart_v1";              // 네 CartStore가 쓰는 키와 맞추면 그대로 읽힘
const SNAP_KEY = "pp_request_snapshot";     // CartPanel에서 저장한 스냅샷
const REQ_LIST = "pp_requests_v1";          // 로컬 보관용
const LAST_REQ = "pp_last_request";         // 최근 코드
const API_URL  = "https://script.google.com/macros/s/PASTE_YOUR_APPS_SCRIPT_URL/exec"; // 교체

// ===== tiny utils =====
const $ = (s, r=document) => r.querySelector(s);
const $$= (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = (s="") => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const parse = (s, d) => { try { return JSON.parse(s ?? ""); } catch { return d; } };
const fmt = n => new Intl.NumberFormat(undefined,{style:"currency",currency:"USD"}).format(Number(n||0));
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s||"");
const nowISO = () => new Date().toISOString();

function genCode(){
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const r4 = Math.random().toString(36).slice(2,6).toUpperCase();
  return `PP-${yy}${mm}${dd}-${r4}`;
}

function subtotal(items){
  return items.reduce((s,x)=> s + Number(x.price||0)*Number(x.qty||1), 0);
}

function toast(msg){
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(()=> t.classList.add("show"));
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=> t.hidden = true, 200); }, 1600);
}

// ===== data sources =====
function loadSnapshot(){
  return parse(sessionStorage.getItem(SNAP_KEY), null);
}
function loadCart(){
  // CartStore가 없을 때 대비한 로컬 키 직접 읽기
  return parse(localStorage.getItem(CART_KEY), []);
}

// ===== render summary =====
function renderSummary(items){
  const box = $("#sumItems");
  const total = $("#sumTotal");
  if (!box || !total) return;

  if (!items.length){
    box.innerHTML = `<div class="meta">Your bag is empty</div>`;
    total.textContent = fmt(0);
    return;
  }

  box.innerHTML = items.map(it => `
    <div class="item">
      <div>
        <div>${esc(it.title||it.name||"Untitled")}</div>
        <div class="meta">${esc(it.id||"")}${Number(it.qty||1)>1 ? ` · qty ${Number(it.qty||1)}` : ""}</div>
      </div>
      <div>${fmt(Number(it.price||0)*Number(it.qty||1))}</div>
    </div>
  `).join("");

  total.textContent = fmt(subtotal(items));
}

// ===== send to server =====
async function sendToServer(req){
  if (!API_URL || API_URL.includes("PASTE_YOUR_APPS_SCRIPT_URL")){
    // 아직 연결 전이면 그냥 통과
    return { ok:true, data:{ dev:true } };
  }
  try{
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ action:"create", ...req })
    });
    const json = await res.json().catch(()=> ({}));
    return json && json.ok === true ? { ok:true, data:json } : { ok:false, data:json };
  }catch(err){
    return { ok:false, error:String(err) };
  }
}

// ===== save helpers =====
function saveRequestLocal(req){
  const list = parse(localStorage.getItem(REQ_LIST), []);
  list.push(req);
  localStorage.setItem(REQ_LIST, JSON.stringify(list));
  localStorage.setItem(LAST_REQ, req.code);
}
function clearCartLocal(){
  localStorage.setItem(CART_KEY, JSON.stringify([]));
  // 헤더 뱃지 갱신 이벤트가 있다면 알림
  try{ document.dispatchEvent(new CustomEvent("cart:refresh")); }catch{}
}

// ===== form logic =====
function validateForm(form){
  let ok = true;
  const name = $("#rq_name", form).value.trim();
  const email = $("#rq_email", form).value.trim();
  const eName = $('[data-err="name"]', form);
  const eMail = $('[data-err="email"]', form);

  if (!name){ eName.classList.add("err","show"); ok=false; } else eName.classList.remove("show");
  if (!emailOk(email)){ eMail.classList.add("err","show"); ok=false; } else eMail.classList.remove("show");

  return ok;
}

function gatherForm(form, items){
  const fd = new FormData(form);
  return {
    code: genCode(),
    createdAt: nowISO(),
    status: "requested",
    customer: {
      name:  fd.get("name")?.toString().trim() || "",
      email: fd.get("email")?.toString().trim() || "",
      phone: fd.get("phone")?.toString().trim() || "",
      contact: fd.get("contact")?.toString().trim() || "",
      address: fd.get("address")?.toString().trim() || ""
    },
    note: fd.get("note")?.toString().trim() || "",
    items: items.map(x => ({
      id: x.id,
      title: x.title || x.name || "Item",
      price: Number(x.price||0),
      qty: Number(x.qty||1)
    })),
    subtotal: subtotal(items),
    currency: "USD"
  };
}

function showSuccess(code){
  const done = $("#reqDone");
  const codeEl = $("#reqCode");
  const goStatus = $("#goStatus");
  if (!done || !codeEl || !goStatus) return;

  codeEl.textContent = code;
  goStatus.href = `/front/orderstatus.html?code=${encodeURIComponent(code)}`;
  done.classList.add("on");
}

function boot(){
  const form = $("#rqp-form");
  const copyBtn = $("#copyCode");

  // 소스 데이터 결정: 세션 스냅샷 우선, 없으면 카트 키
  const snap = loadSnapshot();
  const items = snap?.items?.length ? snap.items : loadCart();
  renderSummary(items);

  if (!form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    if (!items.length){
      toast("Your bag is empty");
      return;
    }
    if (!validateForm(form)) return;

    const req = gatherForm(form, items);

    // 로컬에 먼저 저장, 카트 비우기
    saveRequestLocal(req);
    clearCartLocal();

    // 서버로 비동기 전송
    sendToServer(req).then(r=>{
      if (!r.ok) console.warn("Server save failed", r);
    });

    // 성공 UI
    form.style.display = "none";
    showSuccess(req.code);
    toast("Request sent");
  });

  // 코드 복사
  copyBtn?.addEventListener("click", async ()=>{
    const code = $("#reqCode")?.textContent?.trim() || "";
    try{ await navigator.clipboard.writeText(code); toast("Copied"); }
    catch{ toast("Copy failed"); }
  });
}

document.addEventListener("DOMContentLoaded", boot);
