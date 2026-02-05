const els = {
  grid: document.getElementById("grid"),
  empty: document.getElementById("empty"),
  q: document.getElementById("q"),
  tag: document.getElementById("tag"),
  sort: document.getElementById("sort"),
  reset: document.getElementById("reset"),
  tpl: document.getElementById("card-tpl")
};

const DATA_URL = "./commission.json";

let DATA = [];
let VIEW = [];

ready(init);

function ready(fn){
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}

async function init(){
  try{
    DATA = await fetchJSON(DATA_URL);
  }catch(e){
    console.error(e);
    els.empty.hidden = false;
    els.empty.textContent = "Failed to load commission.json";
    return;
  }

  hydrateTags(DATA);
  bindUI();
  render();
}

async function fetchJSON(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(res.status + " " + res.statusText);
  return res.json();
}

function bindUI(){
  const rerender = () => render();

  els.q.addEventListener("input", debounce(rerender, 120));
  els.tag.addEventListener("change", rerender);
  els.sort.addEventListener("change", rerender);

  if (els.reset){
    els.reset.addEventListener("click", () => {
      els.q.value = "";
      els.tag.value = "";
      els.sort.value = "new";
      render();
    });
  }
}

function hydrateTags(data){
  els.tag.replaceChildren();
  els.tag.appendChild(new Option("All", ""));

  const tags = new Set();
  data.forEach(d => (d.tags || []).forEach(t => tags.add(t)));

  [...tags]
    .sort((a,b)=>a.localeCompare(b))
    .forEach(t => els.tag.appendChild(new Option(t, t)));
}

function render(){
  const q = (els.q.value || "").trim().toLowerCase();
  const tag = els.tag.value || "";
  const sort = els.sort.value || "new";

  VIEW = DATA
    .filter(d => {
      if (tag && !(d.tags || []).includes(tag)) return false;
      if (!q) return true;
      const hay = [d.title, String(d.year || ""), ...(d.tags || [])].join(" ").toLowerCase();
      return hay.includes(q);
    })
    .slice();

  VIEW.sort((a,b) => {
    if (sort === "az") return (a.title || "").localeCompare(b.title || "");
    if (sort === "za") return (b.title || "").localeCompare(a.title || "");
    if (sort === "old") return (Number(a.year || 0) - Number(b.year || 0)) || (a.title || "").localeCompare(b.title || "");
    return (Number(b.year || 0) - Number(a.year || 0)) || (a.title || "").localeCompare(b.title || "");
  });

  els.grid.replaceChildren();

  if (!VIEW.length){
    els.empty.hidden = false;
    els.empty.textContent = "No results";
    return;
  }

  els.empty.hidden = true;

  const frag = document.createDocumentFragment();
  VIEW.forEach(d => frag.appendChild(cardEl(d)));
  els.grid.appendChild(frag);
}

function cardEl(d){
  const el = els.tpl.content.firstElementChild.cloneNode(true);

  const a = el.querySelector(".media");
  const img = el.querySelector(".img");
  const title = el.querySelector(".title");
  const meta = el.querySelector(".meta");

  a.href = d.href || "#";

  img.src = d.thumb || "";
  img.alt = d.title || "";

  title.textContent = d.title || "";
  meta.textContent = [d.year ? String(d.year) : "", (d.tags || []).join(", ")]
    .filter(Boolean)
    .join(" · ");

  return el;
}

function debounce(fn, ms){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
