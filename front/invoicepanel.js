// /Front/InvoicePanel.js — tiny controller for the light invoice panel

export function ensureInvoicePanel(){
  const panel = document.getElementById("pp-invoices");
  const backdrop = document.getElementById("pp-inv-backdrop");
  if(!panel || !backdrop) return;

  function open(){
    // close cart/search if open
    if (typeof window.closeCart === "function") window.closeCart();
    if (typeof window.closeSearch === "function") window.closeSearch();
    panel.hidden = false;
    backdrop.hidden = false;
    document.documentElement.style.overflow = "hidden";
    hydrateLast();
  }
  function close(){
    panel.hidden = true;
    backdrop.hidden = true;
    document.documentElement.style.overflow = "";
  }

  // Close interactions
  document.addEventListener("click", (e)=>{
    if (e.target.closest("[data-invoice-close]")) close();
    if (e.target === backdrop) close();
  });
  window.addEventListener("keydown", (e)=>{ if (e.key === "Escape") close(); });

  // Expose for other modules (CartPanel.js handleRequest calls this)
  window.openInvoicePanel = open;
  window.closeInvoicePanel = close;

  // Enable/disable the “open last invoice” button if you store one in localStorage
  function hydrateLast(){
    const btn = document.getElementById("pp-open-last");
    if(!btn) return;
    try{
      const last = JSON.parse(localStorage.getItem("pp_last_invoice") || "null");
      if(last && last.url){
        btn.disabled = false;
        btn.textContent = "Open last invoice";
        btn.onclick = () => location.href = last.url;
      }else{
        btn.disabled = true;
        btn.textContent = "No recent invoice";
        btn.onclick = null;
      }
    } catch {
      btn.disabled = true;
      btn.textContent = "No recent invoice";
      btn.onclick = null;
    }
  }
}
