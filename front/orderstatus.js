// ===== keys and tiny utils =====
const REQ_LIST = "pp_requests_v1";
const LAST_REQ = "pp_last_request";
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const parse = (s,d) => { try { return JSON.parse(s ?? ""); } catch { return d; } };
const money = n => new Intl.NumberFormat(undefined,{ style:"currency", currency:"USD" }).format(Number(n||0));

// read code from ?code=, or fallback to last
function readCode(){
  const u = new URL(location.href);
  return u.searchParams.get("code") || localStorage.getItem(LAST_REQ) || "";
}

function findRequest(code){
  const list = parse(localStorage.getItem(REQ_LIST), []);
  return list.find(x => String(x.code) === String(code));
}

function markSteps(status){
  const order = ["requested","reviewing","invoiced","paid"];
  const idx = Math.max(0, order.indexOf(status));
  document.querySelectorAll(".step").forEach((el, i) => {
    el.classList.toggle("on", i <= idx);
  });
}

function render(req){
  $("#os_code").textContent = req.code;
  $("#os_badge").textContent = req.status || "requested";
  markSteps(req.status || "requested");

  // items
  const box = $("#os_list");
  box.innerHTML = req.items.map(it => `
    <div class="item">
      <div>
        <div>${esc(it.title || it.name || "Untitled")}</div>
        <div class="meta">${esc(it.id || "")}${Number(it.qty||1) > 1 ? ` · qty ${Number(it.qty)}` : ""}</div>
      </div>
      <div>${money(Number(it.price||0) * Number(it.qty||1))}</div>
    </div>
  `).join("");

  $("#os_total").textContent = money(req.subtotal || 0);

  // invoice open
  const openBtn = $("#openInvoice");
  if (typeof window.openInvoicePanel === "function" && (req.status === "invoiced" || req.status === "paid")){
    openBtn.hidden = false;
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.openInvoicePanel({ readonly:true, requestId: req.code });
    });
  }
}

function toast(msg){
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(()=> t.classList.add("show"));
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=> t.hidden = true, 200); }, 1600);
}

function boot(){
  const code = readCode();
  const req = code && findRequest(code);

  if (!req){
    $("#status").hidden = true;
    $("#empty").hidden = false;
    return;
  }

  render(req);

  // copy
  $("#copy")?.addEventListener("click", async ()=>{
    try { await navigator.clipboard.writeText(req.code); toast("Copied"); }
    catch { toast("Copy failed"); }
  });
}

document.addEventListener("DOMContentLoaded", boot);
