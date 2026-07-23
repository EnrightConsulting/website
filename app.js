const STORAGE_KEY = "enview-core-v0.5";

let db = null;
let baseData = null;

const icons = {
  vehicle:"🚙", equipment:"🚜", energy:"⚡", network:"◎", home:"⌂", default:"◇"
};

async function loadCore(){
  const response = await fetch("assets/data/core.json");
  baseData = await response.json();
  const saved = localStorage.getItem(STORAGE_KEY);
  db = saved ? JSON.parse(saved) : structuredClone(baseData);
  renderAll();
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  renderAll();
}

function nextId(prefix, collection){
  const nums = collection
    .map(item => item.id)
    .filter(id => id.startsWith(prefix))
    .map(id => Number(id.split("-").pop()))
    .filter(Number.isFinite);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(4,"0")}`;
}

function locationById(id){ return db.locations.find(x => x.id === id); }
function assetById(id){ return db.assets.find(x => x.id === id); }
function partById(id){ return db.parts.find(x => x.id === id); }

function locationPath(id){
  const loc = locationById(id);
  return loc ? loc.path.join(" → ") : "Location not assigned";
}

function relationshipTarget(rel){
  return assetById(rel.targetId)?.name || locationById(rel.targetId)?.name || partById(rel.targetId)?.name || rel.targetId;
}

function renderAll(){
  renderStats();
  renderDashboard();
  renderAssets();
  renderLocations();
  renderParts();
  renderRelationships();
  populateForms();
}

function renderStats(){
  const relationships = db.assets.reduce((n,a)=>n+(a.relationships?.length||0),0);
  const stats = [
    ["Assets", db.assets.length, "Permanent EnView records"],
    ["Locations", db.locations.length, "Nested location objects"],
    ["Parts", db.parts.length, "Ordering-ready records"],
    ["Relationships", relationships, "Connections across the core"]
  ];
  document.getElementById("coreStats").innerHTML = stats.map(s=>`
    <div class="stat-card"><small>${s[0]}</small><strong>${s[1]}</strong><span>${s[2]}</span></div>
  `).join("");
}

function compactAsset(a){
  return `<button class="compact-row" data-open-asset="${a.id}">
    <span class="compact-icon">${icons[a.category]||icons.default}</span>
    <span class="compact-copy"><strong>${a.name}</strong><small class="mono">${a.id} · ${locationPath(a.locationId)}</small></span>
    <span>›</span>
  </button>`;
}

function renderDashboard(){
  document.getElementById("dashboardAssets").innerHTML = db.assets.slice(0,4).map(compactAsset).join("");
  const rels = db.assets.flatMap(a=>(a.relationships||[]).map(r=>({source:a.name,...r}))).slice(0,5);
  document.getElementById("dashboardRelationships").innerHTML = rels.map(r=>`
    <div class="compact-row">
      <span class="compact-icon">⇄</span>
      <span class="compact-copy"><strong>${r.source}</strong><small>${r.type.replaceAll("_"," ")} → ${relationshipTarget(r)}</small></span>
    </div>
  `).join("");
  bindAssetLinks();
}

function assetCard(a){
  return `<button class="asset-card" data-open-asset="${a.id}">
    <div class="asset-top">
      <span class="asset-icon">${icons[a.category]||icons.default}</span>
      <span class="health ${a.status}">${a.health?.label || a.status}</span>
    </div>
    <h3>${a.name}</h3>
    <span class="asset-id mono">${a.id}</span>
    <span class="asset-location">⌖ ${locationPath(a.locationId)}</span>
    <div class="asset-footer"><span>${a.category}</span><strong>${a.relationships?.length||0} links</strong></div>
  </button>`;
}

function renderAssets(filter="all"){
  const list = db.assets.filter(a=>filter==="all" || a.category===filter);
  document.getElementById("assetGrid").innerHTML = list.map(assetCard).join("");
  bindAssetLinks();
}

function openAsset(id){
  const a = assetById(id);
  if(!a) return;
  const rels = a.relationships || [];
  const specs = Object.entries(a.specifications || {});
  const services = a.serviceHistory || [];
  document.getElementById("assetDetail").innerHTML = `
    <div class="detail-hero">
      <div class="detail-top">
        <div class="detail-identity">
          <div class="detail-icon">${icons[a.category]||icons.default}</div>
          <div><p class="eyebrow">${a.category} · ${a.subtype||"asset"}</p><h1>${a.name}</h1>
          <div class="detail-id">${a.id}</div><div class="path">⌖ ${locationPath(a.locationId)}</div></div>
        </div>
        <span class="health ${a.status}">${a.health?.label || a.status}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-stat"><small>Permanent ID</small><strong class="mono">${a.id}</strong></div>
        <div class="detail-stat"><small>Location ID</small><strong class="mono">${a.locationId}</strong></div>
        <div class="detail-stat"><small>Relationships</small><strong>${rels.length}</strong></div>
        <div class="detail-stat"><small>Open issues</small><strong>${a.health?.openIssueCount ?? 0}</strong></div>
      </div>
    </div>
    <div class="detail-panels">
      <section class="detail-panel"><p class="eyebrow">Identity</p><h2>Asset record</h2>
        ${Object.entries(a.identity||{}).map(([k,v])=>`<div class="record-row"><small>${label(k)}</small><br><strong>${v||"Not entered"}</strong></div>`).join("")}
      </section>
      <section class="detail-panel"><p class="eyebrow">Relationships</p><h2>Connected objects</h2>
        ${rels.length ? rels.map(r=>`<div class="record-row"><small>${r.type.replaceAll("_"," ")}</small><br><strong>${relationshipTarget(r)}</strong> <span class="mono">(${r.targetId})</span></div>`).join("") : `<p class="body-copy">No relationships yet.</p>`}
      </section>
      <section class="detail-panel"><p class="eyebrow">Specifications</p><h2>Known facts</h2>
        ${specs.length ? specs.map(([k,v])=>`<div class="record-row"><small>${label(k)}</small><br><strong>${v}</strong></div>`).join("") : `<p class="body-copy">No specifications entered.</p>`}
      </section>
      <section class="detail-panel"><p class="eyebrow">History</p><h2>Service records</h2>
        ${services.length ? services.map(s=>`<div class="record-row"><small>${s.date}${s.mileage?` · ${s.mileage.toLocaleString()} mi`:""}</small><br><strong>${s.summary}</strong></div>`).join("") : `<p class="body-copy">No service history entered.</p>`}
      </section>
    </div>
  `;
  showPage("asset-detail");
}

function label(k){ return k.replace(/([A-Z])/g," $1").replace(/^./,m=>m.toUpperCase()); }

function bindAssetLinks(){
  document.querySelectorAll("[data-open-asset]").forEach(b=>b.onclick=()=>openAsset(b.dataset.openAsset));
}

function renderLocations(){
  const levels = new Map();
  db.locations.forEach(l=>{
    let depth = 0, p = l.parentId;
    while(p){ depth++; p = locationById(p)?.parentId; }
    levels.set(l.id, depth);
  });
  document.getElementById("locationTree").innerHTML = db.locations.map(l=>{
    const count = db.assets.filter(a=>a.locationId===l.id).length;
    const cls = levels.get(l.id)===1?"child":levels.get(l.id)>1?"grandchild":"";
    return `<div class="location-node ${cls}">
      <span class="location-icon">⌖</span>
      <span class="location-copy"><strong>${l.name}</strong><small class="mono">${l.id} · ${l.type}</small><small>${l.path.join(" → ")}</small></span>
      <strong>${count} assets</strong>
    </div>`;
  }).join("");
}

function renderParts(){
  document.getElementById("partsGrid").innerHTML = db.parts.map(p=>{
    const compatible = p.compatibleAssetIds.map(id=>assetById(id)?.name||id).join(", ");
    return `<article class="part-card">
      <div class="part-head"><div><p class="eyebrow">Part record</p><h2>${p.name}</h2><div class="asset-id mono">${p.id}</div></div>
      <span class="verified">${p.verifiedFitment?"Verified":"Fitment unverified"}</span></div>
      <div class="part-meta">
        <div><small>Part number</small><strong>${p.partNumber||"Not entered"}</strong></div>
        <div><small>On hand</small><strong>${p.inventory?.quantityOnHand??0}</strong></div>
        <div><small>Compatible with</small><strong>${compatible||"Not assigned"}</strong></div>
        <div><small>Preferred retailer</small><strong>${p.preferredRetailer||"Not selected"}</strong></div>
      </div>
      <div class="retailer-row">
        ${p.retailerLinks?.amazonSearch?`<a class="retailer-link" href="${p.retailerLinks.amazonSearch}" target="_blank" rel="noopener">Search Amazon</a>`:""}
        ${p.retailerLinks?.walmartSearch?`<a class="retailer-link" href="${p.retailerLinks.walmartSearch}" target="_blank" rel="noopener">Search Walmart</a>`:""}
      </div>
    </article>`;
  }).join("");
}

function renderRelationships(){
  const rels = db.assets.flatMap(a=>(a.relationships||[]).map(r=>({sourceId:a.id,source:a.name,...r})));
  document.getElementById("relationshipBoard").innerHTML = rels.map(r=>`
    <article class="relationship-card">
      <div class="relationship-line">
        <span class="relationship-node">${r.source}</span>
        <span class="relationship-type">${r.type.replaceAll("_"," ")}</span>
        <span class="relationship-node">${relationshipTarget(r)}</span>
      </div>
      <p class="body-copy mono">${r.sourceId} → ${r.targetId}</p>
    </article>
  `).join("");
}

function populateForms(){
  const locationOptions = db.locations.map(l=>`<option value="${l.id}">${l.path.join(" → ")}</option>`).join("");
  document.getElementById("assetLocation").innerHTML = locationOptions;
  document.getElementById("locationParent").innerHTML = `<option value="">Top-level location</option>${locationOptions}`;
  document.getElementById("partAsset").innerHTML = db.assets.map(a=>`<option value="${a.id}">${a.name}</option>`).join("");
}

function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  document.getElementById(`page-${name}`)?.classList.add("active");
  document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}

function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModals(){ document.querySelectorAll(".modal-backdrop").forEach(m=>m.classList.remove("open")); }

document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll("[data-page-target]").forEach(b=>b.onclick=()=>showPage(b.dataset.pageTarget));
document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeModals);
document.querySelectorAll(".modal-backdrop").forEach(m=>m.onclick=e=>{if(e.target===m)closeModals();});

document.querySelectorAll("[data-asset-filter]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-asset-filter]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); renderAssets(b.dataset.assetFilter);
});

document.getElementById("addAssetBtn").onclick=()=>openModal("assetModal");
document.getElementById("addLocationBtn").onclick=()=>openModal("locationModal");
document.getElementById("addPartBtn").onclick=()=>openModal("partModal");

document.getElementById("assetForm").onsubmit=e=>{
  e.preventDefault();
  const category=document.getElementById("assetCategory").value;
  const prefix={vehicle:"ENV-VEH",equipment:"ENV-EQP",energy:"ENV-ENG",network:"ENV-NET",home:"ENV-HME"}[category]||"ENV-AST";
  const id=nextId(prefix,db.assets);
  const statusValue=document.getElementById("assetHealth").value;
  db.assets.push({
    id,name:document.getElementById("assetName").value.trim(),category,subtype:"",
    status:statusValue,locationId:document.getElementById("assetLocation").value,tags:[],
    identity:{},metrics:{},health:{label:statusValue==="healthy"?"Healthy":statusValue==="attention"?"Attention Soon":"Needs Service",openIssueCount:statusValue==="healthy"?0:1,nextAction:""},
    relationships:[{type:"located_at",targetId:document.getElementById("assetLocation").value}],
    specifications:{},serviceHistory:[],documents:[],photos:[]
  });
  save(); closeModals(); e.target.reset(); showPage("assets");
};

document.getElementById("locationForm").onsubmit=e=>{
  e.preventDefault();
  const parentId=document.getElementById("locationParent").value||null;
  const parent=parentId?locationById(parentId):null;
  const name=document.getElementById("locationName").value.trim();
  db.locations.push({
    id:nextId("ENV-LOC",db.locations),name,type:document.getElementById("locationType").value,parentId,
    path:parent?[...parent.path,name]:[name]
  });
  save(); closeModals(); e.target.reset(); showPage("locations");
};

document.getElementById("partForm").onsubmit=e=>{
  e.preventDefault();
  const name=document.getElementById("partName").value.trim();
  const number=document.getElementById("partNumber").value.trim();
  const query=encodeURIComponent([number,name].filter(Boolean).join(" "));
  db.parts.push({
    id:nextId("ENV-PART",db.parts),name,partNumber:number,brand:"",verifiedFitment:false,
    compatibleAssetIds:[document.getElementById("partAsset").value],
    preferredRetailer:document.getElementById("partRetailer").value,
    retailerLinks:{amazonSearch:`https://www.amazon.com/s?k=${query}`,walmartSearch:`https://www.walmart.com/search?q=${query}`},
    inventory:{quantityOnHand:0,locationId:null}
  });
  save(); closeModals(); e.target.reset(); showPage("parts");
};

document.getElementById("resetDemo").onclick=()=>{
  if(confirm("Reset EnView 0.5 to the original demo data?")){
    db=structuredClone(baseData); save(); showPage("dashboard");
  }
};

const placeholders={
  maintenance:["⚒","MaintenanceView","Uses Core assets, parts, locations and service history without creating a separate database."],
  powerview:["ϟ","PowerView","Live energy data connects to the same battery and inverter asset records."],
  network:["◎","NetworkView","Network status, IP addresses and firmware connect to permanent device assets."],
  library:["▤","Library","Documents, photos and receipts attach to asset IDs instead of becoming disconnected files."],
  settings:["⚙","Core Settings","Future schema tools, imports, exports, user accounts and integrations live here."]
};
Object.entries(placeholders).forEach(([key,p])=>{
  document.getElementById(`page-${key}`).innerHTML=`<div class="placeholder"><div class="placeholder-icon">${p[0]}</div><p class="eyebrow">Connected application</p><h1>${p[1]}</h1><p>${p[2]}</p></div>`;
});

const searchInput=document.getElementById("globalSearch");
const searchResults=document.getElementById("searchResults");
function doSearch(q){
  if(!q){searchResults.classList.remove("open");return;}
  const needle=q.toLowerCase();
  const hits=[
    ...db.assets.filter(a=>JSON.stringify(a).toLowerCase().includes(needle)).map(a=>({title:a.name,sub:`Asset · ${a.id}`,go:()=>openAsset(a.id)})),
    ...db.locations.filter(l=>JSON.stringify(l).toLowerCase().includes(needle)).map(l=>({title:l.name,sub:`Location · ${l.id}`,go:()=>showPage("locations")})),
    ...db.parts.filter(p=>JSON.stringify(p).toLowerCase().includes(needle)).map(p=>({title:p.name,sub:`Part · ${p.id}`,go:()=>showPage("parts")}))
  ].slice(0,9);
  searchResults.innerHTML=hits.length?hits.map((h,i)=>`<button class="search-result" data-hit="${i}"><span><strong>${h.title}</strong><br><small>${h.sub}</small></span><span>›</span></button>`).join(""):`<div style="padding:14px;color:#667085">No results found</div>`;
  searchResults.classList.add("open");
  searchResults.querySelectorAll("[data-hit]").forEach(b=>b.onclick=()=>{hits[Number(b.dataset.hit)].go();searchResults.classList.remove("open");searchInput.value="";});
}
searchInput.oninput=e=>doSearch(e.target.value.trim());
document.addEventListener("click",e=>{if(!searchResults.contains(e.target)&&e.target!==searchInput)searchResults.classList.remove("open");});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();searchInput.focus();}if(e.key==="Escape"){closeModals();searchResults.classList.remove("open");}});

loadCore();
