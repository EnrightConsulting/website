const STORAGE_KEY="enview-v0.6";
const POWERVIEW_URL="http://192.168.1.54:8084/#mission";
let db=null, baseData=null, lastListPage="dashboard";

const modulePages={
  homeview:["⌂","HomeView","Property systems, buildings and recurring home care."],
  powerview:["ϟ","PowerView","Live energy data connected to the Harris battery and Sol-Ark assets."],
  maintenance:["⚒","MaintenanceView","Vehicles, equipment, parts, service history and fast maintenance logging."],
  network:["◎","NetworkView","Network devices, health, locations and documentation."],
  finance:["$","FinanceView","Simple business performance and financial insight."],
  operations:["↗","OperationsView","Daily workflows, activity and performance."],
  library:["▤","Library","Manuals, receipts, photos and documents attached to permanent asset IDs."],
  settings:["⚙","Settings","Profiles, preferences, integrations and future data administration."]
};

async function init(){
  const res=await fetch("assets/data/core.json");
  baseData=await res.json();
  const saved=localStorage.getItem(STORAGE_KEY);
  db=saved?JSON.parse(saved):structuredClone(baseData);
  buildPlaceholders();
  renderAll();
}

function buildPlaceholders(){
  Object.entries(modulePages).forEach(([key,p])=>{
    document.getElementById(`page-${key}`).innerHTML=`<div class="placeholder"><div class="placeholder-icon">${p[0]}</div><p class="eyebrow">Connected application</p><h1>${p[1]}</h1><p>${p[2]}</p></div>`;
  });
}

function loc(id){return db.locations.find(x=>x.id===id)}
function asset(id){return db.assets.find(x=>x.id===id)}
function path(id){return loc(id)?.path.join(" · ")||"Location not assigned"}
function healthClass(a){return a.status}
function statusDot(a){return `<span class="status-dot ${healthClass(a)}"></span>`}

function assetCard(a){
  const metric=a.metrics?.[0]||{label:"Status",value:a.summary};
  return `<button class="asset-card" data-open-asset="${a.id}">
    <div class="asset-head"><span class="asset-icon">${a.icon}</span><span class="health ${healthClass(a)}">${a.healthLabel}</span></div>
    <h3>${a.shortName||a.name}</h3>
    <div class="location">⌖ ${path(a.locationId)}</div>
    <div class="metric"><span>${metric.label}</span><strong>${metric.value}</strong></div>
  </button>`;
}

function renderAll(){
  const priorities=db.assets.filter(a=>a.status!=="healthy").slice(0,4);
  document.getElementById("priorityGrid").innerHTML=priorities.map(a=>`<button class="priority-item" data-open-asset="${a.id}">${statusDot(a)}<span class="priority-copy"><strong>${a.nextAction}</strong><small>${a.shortName} · ${path(a.locationId)}</small></span><span>›</span></button>`).join("");
  const favs=db.assets.filter(a=>a.favorite);
  document.getElementById("favoriteGrid").innerHTML=favs.map(assetCard).join("");
  document.getElementById("favoritesPageGrid").innerHTML=favs.map(assetCard).join("");
  document.getElementById("allAssetGrid").innerHTML=db.assets.map(assetCard).join("");
  renderLocations();
  bindAssetLinks();
}

function renderLocations(){
  const top=db.locations.filter(l=>!l.parentId);
  document.getElementById("locationGrid").innerHTML=top.map(l=>{
    const count=db.assets.filter(a=>loc(a.locationId)?.path[0]===l.name).length;
    return `<button class="location-card" data-open-location="${l.id}"><div class="asset-icon">⌖</div><h3>${l.name}</h3><p>${count} assets across this location hierarchy.</p></button>`;
  }).join("");
  document.querySelectorAll("[data-open-location]").forEach(b=>b.onclick=()=>openLocation(b.dataset.openLocation));
}

function openLocation(id){
  const l=loc(id); if(!l)return;
  const list=db.assets.filter(a=>loc(a.locationId)?.path[0]===l.name);
  document.getElementById("locationDetail").innerHTML=`<div class="detail-hero"><div class="detail-identity"><div class="detail-icon">⌖</div><div><p class="eyebrow">${l.type}</p><h1>${l.name}</h1><div class="detail-id">${l.id}</div></div></div></div><div class="section-head"><div><p class="eyebrow">At this location</p><h2>Assets</h2></div></div><div class="asset-grid large">${list.map(assetCard).join("")}</div>`;
  lastListPage="locations"; showPage("location-detail"); bindAssetLinks();
}

function bindAssetLinks(){
  document.querySelectorAll("[data-open-asset]").forEach(b=>b.onclick=()=>openAsset(b.dataset.openAsset));
}

function openAsset(id){
  const a=asset(id); if(!a)return;
  const parts=(a.parts||[]).map(id=>db.parts.find(p=>p.id===id)).filter(Boolean);
  document.getElementById("assetDetail").innerHTML=`
    <div class="detail-hero">
      <div class="detail-top">
        <div class="detail-identity"><div class="detail-icon">${a.icon}</div><div><p class="eyebrow">${a.category}</p><h1>${a.name}</h1><div class="detail-id">${a.id}</div><div class="detail-location">⌖ ${path(a.locationId)}</div></div></div>
        <span class="health ${healthClass(a)}">${a.healthLabel}</span>
      </div>
      <div class="detail-grid">${(a.metrics||[]).map(m=>`<div class="detail-stat"><small>${m.label}</small><strong>${m.value}</strong></div>`).join("")}</div>
    </div>
    <div class="detail-panels">
      <section class="detail-panel">
        <p class="eyebrow">Garage test</p><h2>Quick actions</h2>
        <div class="quick-actions">
          <button class="quick-tile"><span>⚒</span><strong>Log service</strong></button>
          <button class="quick-tile"><span>▣</span><strong>Order parts</strong></button>
          <button class="quick-tile"><span>⌖</span><strong>Move asset</strong></button>
          <button class="quick-tile"><span>▤</span><strong>Add receipt</strong></button>
          <button class="quick-tile"><span>▧</span><strong>Add photo</strong></button>
          <button class="quick-tile"><span>!</span><strong>Report issue</strong></button>
        </div>
      </section>
      <section class="detail-panel"><p class="eyebrow">Next action</p><h2>${a.nextAction}</h2><p class="subhead">${a.summary}</p></section>
      <section class="detail-panel"><p class="eyebrow">Specifications</p><h2>Known facts</h2>${(a.specifications||[]).length?(a.specifications||[]).map(s=>`<div class="record-row"><small>${s.label}</small><br><strong>${s.value}</strong></div>`).join(""):`<p class="subhead">Specifications will be added as this asset is completed.</p>`}</section>
      <section class="detail-panel"><p class="eyebrow">Parts & ordering</p><h2>Required items</h2><div class="parts-list">${parts.length?parts.map(p=>`<div class="part-row"><strong>${p.name}</strong><br><small>${p.partNumber||"No part number"} · ${p.verifiedFitment?"Verified":"Fitment must be verified"}</small><div class="retailers">${Object.entries(p.links||{}).map(([name,url])=>`<a class="retailer" href="${url}" target="_blank" rel="noopener">Search ${name}</a>`).join("")}</div></div>`).join(""):`<p class="subhead">No parts linked yet.</p>`}</div></section>
      <section class="detail-panel"><p class="eyebrow">History</p><h2>Recent activity</h2>${(a.history||[]).length?(a.history||[]).map(h=>`<div class="record-row"><small>${h.date}</small><br><strong>${h.title}</strong><br><small>${h.detail}</small></div>`).join(""):`<p class="subhead">No history entered yet.</p>`}</section>
      <section class="detail-panel"><p class="eyebrow">Permanent identity</p><h2>Core record</h2><div class="record-row"><small>EnView ID</small><br><strong class="detail-id">${a.id}</strong></div><div class="record-row"><small>Location ID</small><br><strong class="detail-id">${a.locationId}</strong></div><div class="record-row"><small>Category</small><br><strong>${a.category}</strong></div></section>
    </div>`;
  showPage("asset-detail");
}

function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  document.getElementById(`page-${name}`)?.classList.add("active");
  document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add("active");
  if(["dashboard","favorites","assets","locations"].includes(name))lastListPage=name;
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
  if(b.dataset.page==="powerview"){
    window.open(POWERVIEW_URL,"_blank","noopener");
    return;
  }
  showPage(b.dataset.page);
});
document.querySelectorAll("[data-page-target]").forEach(b=>b.onclick=()=>{
  if(b.dataset.pageTarget==="powerview"){
    window.open(POWERVIEW_URL,"_blank","noopener");
    return;
  }
  showPage(b.dataset.pageTarget);
});
document.getElementById("assetBack").onclick=()=>showPage(lastListPage);
document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");

document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  const f=b.dataset.filter;document.getElementById("allAssetGrid").innerHTML=db.assets.filter(a=>f==="all"||a.category===f).map(assetCard).join("");bindAssetLinks();
});

const quick=document.getElementById("quickModal");
document.querySelectorAll("[data-open-quick]").forEach(b=>b.onclick=()=>quick.classList.add("open"));
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>quick.classList.remove("open"));
quick.onclick=e=>{if(e.target===quick)quick.classList.remove("open")};

document.getElementById("todayDate").textContent=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric"}).format(new Date());

const input=document.getElementById("globalSearch"), results=document.getElementById("searchResults");
function search(q){
  if(!q){results.classList.remove("open");return}
  const n=q.toLowerCase();
  const hits=[
    ...db.assets.filter(a=>JSON.stringify(a).toLowerCase().includes(n)).map(a=>({title:a.name,sub:`Asset · ${a.id}`,go:()=>openAsset(a.id)})),
    ...db.locations.filter(l=>JSON.stringify(l).toLowerCase().includes(n)).map(l=>({title:l.name,sub:`Location · ${l.id}`,go:()=>openLocation(l.id)})),
    ...db.parts.filter(p=>JSON.stringify(p).toLowerCase().includes(n)).map(p=>({title:p.name,sub:`Part · ${p.id}`,go:()=>{const aid=p.compatibleAssetIds?.[0];aid?openAsset(aid):showPage("assets")}}))
  ].slice(0,8);
  results.innerHTML=hits.length?hits.map((h,i)=>`<button class="search-result" data-hit="${i}"><span><strong>${h.title}</strong><br><small>${h.sub}</small></span><span>›</span></button>`).join(""):`<div style="padding:14px;color:#667085">No results found</div>`;
  results.classList.add("open");
  results.querySelectorAll("[data-hit]").forEach(b=>b.onclick=()=>{hits[Number(b.dataset.hit)].go();results.classList.remove("open");input.value=""});
}
input.oninput=e=>search(e.target.value.trim());
document.addEventListener("click",e=>{if(!results.contains(e.target)&&e.target!==input)results.classList.remove("open")});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.focus()}if(e.key==="Escape"){quick.classList.remove("open");results.classList.remove("open")}});

init();
