const STORAGE_KEY = "enview-v0.8.1";
const POWERVIEW_URL = "http://192.168.1.54:8084/#mission";
let db = null;
let baseData = null;
let lastListPage = "dashboard";
let selectedMaintenanceAssetId = null;
let assetLifecycleFilter = "active";
let assetCategoryFilter = "all";

const modulePages = {
  homeview:["⌂","HomeView","Property systems, buildings and recurring home care."],
  powerview:["ϟ","PowerView","Live energy data connected to the Harris battery and Sol-Ark assets."],
  network:["◎","NetworkView","Network devices, health, locations and documentation."],
  finance:["$","FinanceView","Simple business performance and financial insight."],
  operations:["↗","OperationsView","Daily workflows, activity and performance."],
  library:["▤","Library","Manuals, receipts, photos and documents attached to permanent asset IDs."],
  settings:["⚙","Settings","Profiles, preferences, integrations and future data administration."]
};

async function init(){
  const res = await fetch("assets/data/core.json");
  baseData = await res.json();
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("enview-v0.8.0") || localStorage.getItem("enview-v0.7.2");
  db = saved ? JSON.parse(saved) : structuredClone(baseData);
  db.maintenancePlans ||= [];
  db.serviceHistory ||= [];
  db.assets.forEach(a => { a.meters ||= []; a.lifecycle ||= "active"; a.sleepUntil ||= null; });
  wakeScheduledAssets();
  selectedMaintenanceAssetId = db.assets.find(a => db.maintenancePlans.some(p => p.assetId === a.id))?.id || db.assets[0]?.id;
  buildPlaceholders();
  injectMaintenanceDialogs();
  renderAll();
}

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
function wakeScheduledAssets(){
  const today=new Date().toISOString().slice(0,10);
  let changed=false;
  db.assets.forEach(a=>{ if(a.lifecycle==="sleeping"&&a.sleepUntil&&a.sleepUntil<=today){a.lifecycle="active";a.sleepUntil=null;changed=true;} });
  if(changed) save();
}
function lifecycleLabel(v){ return ({active:"Active",sleeping:"Sleeping",disabled:"Disabled",archived:"Archived"})[v]||"Active"; }
function lifecycleIcon(v){ return ({active:"●",sleeping:"☾",disabled:"⊘",archived:"▣"})[v]||"●"; }
function activeAssets(){ return db.assets.filter(a=>(a.lifecycle||"active")==="active"); }

function uid(prefix){ return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function escapeHtml(v=""){ return String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }

function buildPlaceholders(){
  Object.entries(modulePages).forEach(([key,p])=>{
    document.getElementById(`page-${key}`).innerHTML = `<div class="placeholder"><div class="placeholder-icon">${p[0]}</div><p class="eyebrow">Connected application</p><h1>${p[1]}</h1><p>${p[2]}</p></div>`;
  });
}

function injectMaintenanceDialogs(){
  document.body.insertAdjacentHTML("beforeend", `
  <div class="modal-backdrop" id="planModal"><div class="modal maintenance-modal">
    <div class="modal-head"><div><p class="eyebrow">Maintenance intelligence</p><h2 id="planModalTitle">Add maintenance plan</h2></div><button class="close-button" data-close-plan>×</button></div>
    <div class="form-grid">
      <label class="field"><span>Asset</span><select id="planAsset"></select></label>
      <label class="field"><span>Plan name</span><input id="planName" placeholder="Example: Oil change" /></label>
      <label class="field"><span>Group</span><input id="planGroup" placeholder="Manufacturer, Preventive Care..." /></label>
      <label class="field"><span>Source</span><select id="planSource"><option value="manufacturer">Manufacturer</option><option value="enview">EnView recommended</option><option value="company">Company standard</option><option value="regulatory">Regulatory</option><option value="user">User created</option></select></label>
      <label class="field full"><span>Description</span><textarea id="planDescription" rows="3"></textarea></label>
      <label class="field"><span>Priority</span><select id="planPriority"><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label>
      <label class="field"><span>Status</span><select id="planActive"><option value="true">Active</option><option value="false">Inactive</option></select></label>
      <label class="field full"><span>Checklist items — one per line</span><textarea id="planChecklist" rows="5" placeholder="Inspect item\nReplace part\nRecord reading"></textarea></label>
    </div>
    <div class="modal-actions"><button class="secondary-button" data-close-plan>Cancel</button><button class="primary-button" id="savePlanButton">Save plan</button></div>
  </div></div>

  <div class="modal-backdrop" id="triggerModal"><div class="modal maintenance-modal compact-modal">
    <div class="modal-head"><div><p class="eyebrow">Due rule</p><h2 id="triggerModalTitle">Add trigger</h2></div><button class="close-button" data-close-trigger>×</button></div>
    <div class="form-grid">
      <label class="field"><span>Trigger type</span><select id="triggerType"><option value="time">Time</option><option value="meter">Meter</option><option value="date">Calendar date</option></select></label>
      <label class="field meter-only"><span>Meter</span><select id="triggerMeter"></select></label>
      <label class="field"><span>Active interval</span><input id="triggerValue" type="number" min="0" step="0.1" /></label>
      <label class="field"><span>Unit</span><select id="triggerUnit"><option value="days">Days</option><option value="months">Months</option><option value="years">Years</option><option value="miles">Miles</option><option value="hours">Hours</option><option value="cycles">Cycles</option></select></label>
      <label class="field"><span>Suggested interval</span><input id="triggerRecommended" type="number" min="0" step="0.1" placeholder="Optional" /></label>
      <label class="field"><span>Reason for change</span><input id="triggerReason" placeholder="Optional" /></label>
    </div>
    <div class="modal-actions"><button class="secondary-button" data-close-trigger>Cancel</button><button class="primary-button" id="saveTriggerButton">Save trigger</button></div>
  </div></div>

  <div class="modal-backdrop" id="serviceModal"><div class="modal maintenance-modal">
    <div class="modal-head"><div><p class="eyebrow">Record completed work</p><h2 id="serviceModalTitle">Record service</h2></div><button class="close-button" data-close-service>×</button></div>
    <div class="form-grid">
      <label class="field"><span>Service date</span><input id="serviceDate" type="date" /></label>
      <label class="field"><span>Cost</span><input id="serviceCost" type="number" min="0" step="0.01" /></label>
      <div id="serviceMeters" class="full form-grid"></div>
      <label class="field full"><span>Notes</span><textarea id="serviceNotes" rows="3"></textarea></label>
      <div class="field full"><span>Checklist</span><div id="serviceChecklist" class="checklist-editor"></div></div>
    </div>
    <div class="modal-actions"><button class="secondary-button" data-close-service>Cancel</button><button class="primary-button" id="saveServiceButton">Complete service</button></div>
  </div></div>

  <div class="modal-backdrop" id="assetModal"><div class="modal maintenance-modal">
    <div class="modal-head"><div><p class="eyebrow">Asset Center</p><h2 id="assetModalTitle">Add asset</h2></div><button class="close-button" data-close-asset>×</button></div>
    <div class="form-grid">
      <label class="field"><span>Asset name</span><input id="assetName" placeholder="Example: Workshop air compressor" /></label>
      <label class="field"><span>Short name</span><input id="assetShortName" placeholder="Example: Air Compressor" /></label>
      <label class="field"><span>Category</span><select id="assetCategory"><option value="vehicle">Vehicle</option><option value="equipment">Equipment</option><option value="home">Home System</option><option value="network">Network</option><option value="energy">Energy</option><option value="appliance">Appliance</option><option value="building">Building</option><option value="other">Other</option></select></label>
      <label class="field"><span>Location</span><select id="assetLocation"></select></label>
      <label class="field"><span>Manufacturer</span><input id="assetManufacturer" /></label>
      <label class="field"><span>Model</span><input id="assetModel" /></label>
      <label class="field"><span>Serial number</span><input id="assetSerial" /></label>
      <label class="field"><span>Icon</span><input id="assetIcon" maxlength="3" placeholder="◇" /></label>
      <label class="field"><span>Lifecycle status</span><select id="assetLifecycle"><option value="active">Active</option><option value="sleeping">Sleeping</option><option value="disabled">Disabled</option><option value="archived">Archived</option></select></label>
      <label class="field"><span>Wake date (optional)</span><input id="assetSleepUntil" type="date" /></label>
      <label class="field full"><span>Notes / summary</span><textarea id="assetSummary" rows="3"></textarea></label>
      <label class="check-row full"><input type="checkbox" id="assetFavorite"><span>Add to favorites</span></label>
    </div>
    <div class="modal-actions"><button class="secondary-button" data-close-asset>Cancel</button><button class="primary-button" id="saveAssetButton">Save asset</button></div>
  </div></div>

  <div class="modal-backdrop" id="actionModal"><div class="modal maintenance-modal compact-modal">
    <div class="modal-head"><div><p class="eyebrow">Quick Action</p><h2 id="actionModalTitle">Action</h2></div><button class="close-button" data-close-action>×</button></div>
    <div id="actionModalBody"></div>
    <div class="modal-actions"><button class="secondary-button" data-close-action>Cancel</button><button class="primary-button" id="saveActionButton">Save</button></div>
  </div></div>

  <div class="toast" id="appToast" role="status" aria-live="polite"></div>`);
}

function loc(id){ return db.locations.find(x=>x.id===id); }
function asset(id){ return db.assets.find(x=>x.id===id); }
function plan(id){ return db.maintenancePlans.find(x=>x.id===id); }
function path(id){ return loc(id)?.path.join(" · ") || "Location not assigned"; }
function healthClass(a){ return a.status; }
function assetLifecycle(a){ return a.lifecycle||"active"; }
function statusDot(a){ return `<span class="status-dot ${healthClass(a)}"></span>`; }
function sourceLabel(s){ return ({manufacturer:"Manufacturer",enview:"EnView",company:"Company Standard",regulatory:"Regulatory",user:"User Created"})[s] || s; }

function addInterval(dateString, value, unit){
  const d = new Date(`${dateString}T12:00:00`);
  if(unit === "days") d.setDate(d.getDate()+Number(value));
  if(unit === "months") d.setMonth(d.getMonth()+Number(value));
  if(unit === "years") d.setFullYear(d.getFullYear()+Number(value));
  return d;
}
function triggerState(p,t){
  if(t.type === "time"){
    const base = p.lastService?.date;
    if(!base) return {label:"Not started",remaining:null,status:"unknown"};
    const due = addInterval(base,t.activeValue,t.unit);
    const days = Math.ceil((due-new Date())/86400000);
    return {label:due.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),remaining:days,status:days<0?"overdue":days<=14?"soon":"current"};
  }
  if(t.type === "meter"){
    const a=asset(p.assetId), meter=a?.meters?.find(m=>m.id===t.meterId);
    const start=p.lastService?.meterReadings?.[t.meterId];
    if(!meter || start===undefined) return {label:"Reading needed",remaining:null,status:"unknown"};
    const due=Number(start)+Number(t.activeValue), remaining=due-Number(meter.value);
    return {label:`${due.toLocaleString()} ${t.unit}`,remaining,status:remaining<0?"overdue":remaining<=Math.max(Number(t.activeValue)*.1,1)?"soon":"current"};
  }
  return {label:"Custom date",remaining:null,status:"unknown"};
}
function planState(p){
  const states=p.triggers.map(t=>triggerState(p,t));
  if(states.some(s=>s.status==="overdue")) return "overdue";
  if(states.some(s=>s.status==="soon")) return "soon";
  if(states.some(s=>s.status==="current")) return "current";
  return "unknown";
}
function planStatusLabel(s){ return ({overdue:"Overdue",soon:"Due Soon",current:"Current",unknown:"Needs Setup"})[s]; }
function assetPlanSummary(assetId){
  const target=asset(assetId);
  const plans=db.maintenancePlans.filter(p=>p.assetId===assetId&&p.active&&assetLifecycle(target)==="active");
  return {total:plans.length,overdue:plans.filter(p=>planState(p)==="overdue").length,soon:plans.filter(p=>planState(p)==="soon").length,current:plans.filter(p=>planState(p)==="current").length};
}

function assetCard(a){
  const metric=a.metrics?.[0]||{label:"Status",value:a.summary};
  const lc=assetLifecycle(a);
  return `<article class="asset-card-wrap ${lc}"><button class="asset-card" data-open-asset="${a.id}"><div class="asset-head"><span class="asset-icon">${escapeHtml(a.icon||"◇")}</span><span class="health ${healthClass(a)}">${escapeHtml(a.healthLabel||"Healthy")}</span></div><h3>${escapeHtml(a.shortName||a.name)}</h3><div class="location">⌖ ${escapeHtml(path(a.locationId))}</div><div class="asset-lifecycle ${lc}">${lifecycleIcon(lc)} ${lifecycleLabel(lc)}${lc==="sleeping"&&a.sleepUntil?` until ${new Date(a.sleepUntil+"T12:00:00").toLocaleDateString()}`:""}</div><div class="metric"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong></div></button><button class="asset-card-menu" title="Manage asset" data-manage-asset="${a.id}">•••</button></article>`;
}

function renderAll(){
  const priorities=activeAssets().filter(a=>a.status!=="healthy").slice(0,4);
  document.getElementById("priorityGrid").innerHTML=priorities.map(a=>`<button class="priority-item" data-open-asset="${a.id}">${statusDot(a)}<span class="priority-copy"><strong>${escapeHtml(a.nextAction)}</strong><small>${escapeHtml(a.shortName)} · ${escapeHtml(path(a.locationId))}</small></span><span>›</span></button>`).join("");
  const favs=activeAssets().filter(a=>a.favorite);
  document.getElementById("favoriteGrid").innerHTML=favs.map(assetCard).join("");
  document.getElementById("favoritesPageGrid").innerHTML=favs.map(assetCard).join("");
  renderAssetCenter();
  renderLocations(); renderMaintenance(); bindAssetLinks();
}

function renderAssetCenter(){
  const all=db.assets;
  const counts={active:0,sleeping:0,disabled:0,archived:0};
  all.forEach(a=>counts[assetLifecycle(a)]++);
  ["active","sleeping","disabled","archived"].forEach(k=>{const el=document.querySelector(`[data-lifecycle-count="${k}"]`);if(el)el.textContent=counts[k];});
  const list=all.filter(a=>(assetLifecycleFilter==="all"||assetLifecycle(a)===assetLifecycleFilter)&&(assetCategoryFilter==="all"||a.category===assetCategoryFilter));
  const grid=document.getElementById("allAssetGrid");
  if(grid) grid.innerHTML=list.length?list.map(assetCard).join(""):`<div class="empty-state asset-empty"><div class="placeholder-icon">◇</div><h2>No ${assetLifecycleFilter} assets</h2><p>Add a new asset or choose another lifecycle filter.</p><button class="primary-button" data-add-asset>＋ Add Asset</button></div>`;
  bindAssetLinks(); bindAssetManagement();
  document.querySelectorAll("[data-add-asset]").forEach(b=>b.onclick=()=>openAssetModal());
}
function bindAssetManagement(){ document.querySelectorAll("[data-manage-asset]").forEach(b=>b.onclick=e=>{e.stopPropagation();openAssetModal(b.dataset.manageAsset);}); }
function openAssetModal(assetId){
  const a=assetId?asset(assetId):null;
  document.getElementById("assetModalTitle").textContent=a?"Manage asset":"Add asset";
  document.getElementById("assetLocation").innerHTML=db.locations.map(l=>`<option value="${l.id}">${escapeHtml(l.path.join(" · "))}</option>`).join("");
  document.getElementById("assetName").value=a?.name||"";
  document.getElementById("assetShortName").value=a?.shortName||"";
  document.getElementById("assetCategory").value=a?.category||"equipment";
  document.getElementById("assetLocation").value=a?.locationId||db.locations[0]?.id||"";
  document.getElementById("assetManufacturer").value=a?.identity?.manufacturer||"";
  document.getElementById("assetModel").value=a?.identity?.model||"";
  document.getElementById("assetSerial").value=a?.identity?.serialNumber||"";
  document.getElementById("assetIcon").value=a?.icon||"◇";
  document.getElementById("assetLifecycle").value=a?.lifecycle||"active";
  document.getElementById("assetSleepUntil").value=a?.sleepUntil||"";
  document.getElementById("assetSummary").value=a?.summary||"";
  document.getElementById("assetFavorite").checked=Boolean(a?.favorite);
  document.getElementById("saveAssetButton").dataset.assetId=assetId||"";
  document.getElementById("assetModal").classList.add("open");
}
function saveAssetFromModal(){
  const id=document.getElementById("saveAssetButton").dataset.assetId;
  const name=document.getElementById("assetName").value.trim();
  if(!name){alert("Please enter an asset name.");return;}
  const lifecycle=document.getElementById("assetLifecycle").value;
  const values={name,shortName:document.getElementById("assetShortName").value.trim()||name,category:document.getElementById("assetCategory").value,locationId:document.getElementById("assetLocation").value,icon:document.getElementById("assetIcon").value.trim()||"◇",lifecycle,sleepUntil:lifecycle==="sleeping"?(document.getElementById("assetSleepUntil").value||null):null,summary:document.getElementById("assetSummary").value.trim()||"No summary added.",favorite:document.getElementById("assetFavorite").checked,identity:{manufacturer:document.getElementById("assetManufacturer").value.trim(),model:document.getElementById("assetModel").value.trim(),serialNumber:document.getElementById("assetSerial").value.trim()}};
  if(id){Object.assign(asset(id),values);}else{db.assets.unshift({id:uid("ENV-AST"),...values,status:"healthy",healthLabel:"Healthy",nextAction:"No action needed",metrics:[],specifications:[],history:[],parts:[],meters:[]});}
  save();closeModal("assetModal");renderAll();showPage("assets");
}
function setAssetLifecycle(id,lifecycle){
  const a=asset(id);if(!a)return;
  a.lifecycle=lifecycle;if(lifecycle!=="sleeping")a.sleepUntil=null;
  save();renderAll();openAsset(id);
}
function deleteAssetPermanently(id){
  const a=asset(id);if(!a||!confirm(`Permanently delete ${a.name}? This also deletes its maintenance plans and service history and cannot be undone.`))return;
  db.assets=db.assets.filter(x=>x.id!==id);db.maintenancePlans=db.maintenancePlans.filter(p=>p.assetId!==id);db.serviceHistory=db.serviceHistory.filter(s=>s.assetId!==id);
  save();renderAll();showPage("assets");
}
function renderMaintenance(){
  const page=document.getElementById("page-maintenance");
  const a=asset(selectedMaintenanceAssetId)||db.assets[0];
  if(!a){ page.innerHTML="<p>No assets found.</p>"; return; }
  selectedMaintenanceAssetId=a.id;
  const summary=assetPlanSummary(a.id);
  const plans=db.maintenancePlans.filter(p=>p.assetId===a.id);
  const groups=[...new Set(plans.map(p=>p.group||"Other"))];
  page.innerHTML=`
    <div class="page-heading maintenance-heading"><div><p class="eyebrow">Asset intelligence</p><h1>MaintenanceView</h1><p class="subhead">Build the ideal maintenance program, not just a service log.</p></div><button class="primary-button" data-add-plan>＋ Add Maintenance Plan</button></div>
    <div class="maintenance-toolbar card"><label class="field"><span>Asset</span><select id="maintenanceAssetSelect">${db.assets.filter(x=>assetLifecycle(x)!=="archived").map(x=>`<option value="${x.id}" ${x.id===a.id?"selected":""}>${escapeHtml(x.name)}</option>`).join("")}</select></label><div class="maintenance-asset-identity"><span class="asset-icon">${a.icon}</span><div><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(path(a.locationId))}</small></div></div></div>
    <div class="maintenance-metrics"><div class="metric-card"><small>Active plans</small><strong>${summary.total}</strong></div><div class="metric-card"><small>Current</small><strong>${summary.current}</strong></div><div class="metric-card attention-metric"><small>Due soon</small><strong>${summary.soon}</strong></div><div class="metric-card danger-metric"><small>Overdue</small><strong>${summary.overdue}</strong></div></div>
    ${plans.length?groups.map(g=>`<section class="maintenance-group"><div class="section-head"><div><p class="eyebrow">Program group</p><h2>${escapeHtml(g)}</h2></div><span class="count-pill">${plans.filter(p=>p.group===g).length} plans</span></div><div class="maintenance-plan-grid">${plans.filter(p=>p.group===g).map(planCard).join("")}</div></section>`).join(""):`<div class="empty-state"><div class="placeholder-icon">⚒</div><h2>No maintenance plans yet</h2><p>Add a manufacturer recommendation, company standard, regulatory item, or your own preventive-care plan.</p><button class="primary-button" data-add-plan>＋ Add Maintenance Plan</button></div>`}
  `;
  page.querySelector("#maintenanceAssetSelect").onchange=e=>{ selectedMaintenanceAssetId=e.target.value; renderMaintenance(); };
  page.querySelectorAll("[data-add-plan]").forEach(b=>b.onclick=()=>openPlanModal(null,a.id));
  page.querySelectorAll("[data-edit-plan]").forEach(b=>b.onclick=()=>openPlanModal(b.dataset.editPlan));
  page.querySelectorAll("[data-add-trigger]").forEach(b=>b.onclick=()=>openTriggerModal(b.dataset.addTrigger));
  page.querySelectorAll("[data-edit-trigger]").forEach(b=>b.onclick=()=>openTriggerModal(b.dataset.planId,b.dataset.editTrigger));
  page.querySelectorAll("[data-record-service]").forEach(b=>b.onclick=()=>openServiceModal(b.dataset.recordService));
}

function planCard(p){
  const state=planState(p);
  const service=p.lastService;
  return `<article class="maintenance-plan-card ${state}">
    <div class="plan-card-head"><div><span class="source-badge ${p.source}">${sourceLabel(p.source)}</span><h3>${escapeHtml(p.name)}</h3></div><span class="plan-status ${state}">${planStatusLabel(state)}</span></div>
    <p>${escapeHtml(p.description||"No description added.")}</p>
    <div class="trigger-list">${p.triggers.length?p.triggers.map(t=>triggerRow(p,t)).join(""):`<div class="trigger-empty">No due triggers yet.</div>`}</div>
    <button class="add-trigger-button" data-add-trigger="${p.id}">＋ Add Trigger</button>
    ${service?`<div class="last-service"><small>Last serviced</small><strong>${new Date(service.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</strong></div>`:""}
    <div class="plan-card-actions"><button class="secondary-button" data-edit-plan="${p.id}">Edit Plan</button><button class="primary-button" data-record-service="${p.id}">Record Service</button></div>
  </article>`;
}
function triggerRow(p,t){
  const st=triggerState(p,t);
  const changed=t.recommendedValue!==null&&t.recommendedValue!==undefined&&Number(t.recommendedValue)!==Number(t.activeValue);
  const label=t.type==="time"?`Every ${t.activeValue} ${t.unit}`:`Every ${Number(t.activeValue).toLocaleString()} ${t.unit}`;
  return `<div class="trigger-row"><div><strong>${escapeHtml(label)}</strong><small>Next due: ${escapeHtml(st.label)}</small>${changed?`<small class="override-note">Suggested: ${Number(t.recommendedValue).toLocaleString()} ${t.unit} · Customized</small>`:""}${t.overrideReason?`<small>${escapeHtml(t.overrideReason)}</small>`:""}</div><button class="icon-button" title="Edit trigger" data-plan-id="${p.id}" data-edit-trigger="${t.id}">✎</button></div>`;
}

function openPlanModal(planId,assetId){
  const p=planId?plan(planId):null;
  document.getElementById("planModalTitle").textContent=p?"Edit maintenance plan":"Add maintenance plan";
  document.getElementById("planAsset").innerHTML=db.assets.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("");
  document.getElementById("planAsset").value=p?.assetId||assetId||selectedMaintenanceAssetId;
  document.getElementById("planName").value=p?.name||"";
  document.getElementById("planGroup").value=p?.group||"My Custom Care";
  document.getElementById("planSource").value=p?.source||"user";
  document.getElementById("planDescription").value=p?.description||"";
  document.getElementById("planPriority").value=p?.priority||"normal";
  document.getElementById("planActive").value=String(p?.active??true);
  document.getElementById("planChecklist").value=(p?.checklist||[]).join("\n");
  document.getElementById("savePlanButton").dataset.planId=planId||"";
  document.getElementById("planModal").classList.add("open");
}
function savePlanFromModal(){
  const id=document.getElementById("savePlanButton").dataset.planId;
  const values={assetId:document.getElementById("planAsset").value,name:document.getElementById("planName").value.trim(),group:document.getElementById("planGroup").value.trim()||"Other",source:document.getElementById("planSource").value,description:document.getElementById("planDescription").value.trim(),priority:document.getElementById("planPriority").value,active:document.getElementById("planActive").value==="true",checklist:document.getElementById("planChecklist").value.split("\n").map(x=>x.trim()).filter(Boolean)};
  if(!values.name){ alert("Please enter a plan name."); return; }
  if(id) Object.assign(plan(id),values); else db.maintenancePlans.push({id:uid("ENV-MP"),...values,triggers:[],lastService:null});
  selectedMaintenanceAssetId=values.assetId; save(); closeModal("planModal"); renderMaintenance();
}

function openTriggerModal(planId,triggerId){
  const p=plan(planId), t=triggerId?p.triggers.find(x=>x.id===triggerId):null, a=asset(p.assetId);
  document.getElementById("triggerModalTitle").textContent=t?"Edit trigger":"Add trigger";
  document.getElementById("triggerType").value=t?.type||"time";
  document.getElementById("triggerMeter").innerHTML=(a.meters||[]).map(m=>`<option value="${m.id}">${escapeHtml(m.name)} (${m.unit})</option>`).join("")||`<option value="">No meters configured</option>`;
  document.getElementById("triggerMeter").value=t?.meterId||a.meters?.[0]?.id||"";
  document.getElementById("triggerValue").value=t?.activeValue??"";
  document.getElementById("triggerUnit").value=t?.unit||(t?.type==="meter"?a.meters?.[0]?.unit:"months")||"months";
  document.getElementById("triggerRecommended").value=t?.recommendedValue??"";
  document.getElementById("triggerReason").value=t?.overrideReason||"";
  document.getElementById("saveTriggerButton").dataset.planId=planId;
  document.getElementById("saveTriggerButton").dataset.triggerId=triggerId||"";
  updateTriggerFields(); document.getElementById("triggerModal").classList.add("open");
}
function updateTriggerFields(){ document.querySelectorAll(".meter-only").forEach(el=>el.style.display=document.getElementById("triggerType").value==="meter"?"flex":"none"); }
function saveTriggerFromModal(){
  const b=document.getElementById("saveTriggerButton"), p=plan(b.dataset.planId), id=b.dataset.triggerId;
  const type=document.getElementById("triggerType").value, value=Number(document.getElementById("triggerValue").value);
  if(!value||value<=0){ alert("Enter an interval greater than zero."); return; }
  const recRaw=document.getElementById("triggerRecommended").value;
  const values={type,meterId:type==="meter"?document.getElementById("triggerMeter").value:null,activeValue:value,recommendedValue:recRaw===""?null:Number(recRaw),unit:document.getElementById("triggerUnit").value,overrideReason:document.getElementById("triggerReason").value.trim()};
  if(type==="meter"&&!values.meterId){ alert("This asset needs a meter before a meter-based trigger can be used."); return; }
  if(id) Object.assign(p.triggers.find(x=>x.id===id),values); else p.triggers.push({id:uid("TRG"),...values});
  save(); closeModal("triggerModal"); renderMaintenance();
}

function openServiceModal(planId){
  const p=plan(planId), a=asset(p.assetId);
  document.getElementById("serviceModalTitle").textContent=`Record ${p.name}`;
  document.getElementById("serviceDate").value=new Date().toISOString().slice(0,10);
  document.getElementById("serviceCost").value=""; document.getElementById("serviceNotes").value="";
  document.getElementById("serviceMeters").innerHTML=(a.meters||[]).map(m=>`<label class="field"><span>${escapeHtml(m.name)} (${m.unit})</span><input type="number" step="0.1" data-service-meter="${m.id}" value="${m.value}"></label>`).join("");
  document.getElementById("serviceChecklist").innerHTML=(p.checklist||[]).map((x,i)=>`<label class="check-row"><input type="checkbox" data-check-index="${i}"><span>${escapeHtml(x)}</span></label>`).join("")||"<p class='subhead'>No checklist added.</p>";
  document.getElementById("saveServiceButton").dataset.planId=planId;
  document.getElementById("serviceModal").classList.add("open");
}
function saveServiceFromModal(){
  const p=plan(document.getElementById("saveServiceButton").dataset.planId), a=asset(p.assetId);
  const readings={};
  document.querySelectorAll("[data-service-meter]").forEach(i=>{ readings[i.dataset.serviceMeter]=Number(i.value); const m=a.meters.find(x=>x.id===i.dataset.serviceMeter); if(m)m.value=Number(i.value); });
  const completed=[...document.querySelectorAll("[data-check-index]")].filter(x=>x.checked).map(x=>p.checklist[Number(x.dataset.checkIndex)]);
  const record={id:uid("ENV-SVC"),planId:p.id,assetId:p.assetId,date:document.getElementById("serviceDate").value,cost:Number(document.getElementById("serviceCost").value||0),notes:document.getElementById("serviceNotes").value.trim(),meterReadings:readings,checklistCompleted:completed};
  p.lastService={date:record.date,cost:record.cost,notes:record.notes,meterReadings:record.meterReadings};
  db.serviceHistory.unshift(record); save(); closeModal("serviceModal"); renderMaintenance();
}
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

function renderLocations(){
  const top=db.locations.filter(l=>!l.parentId);
  document.getElementById("locationGrid").innerHTML=top.map(l=>{const count=db.assets.filter(a=>assetLifecycle(a)!=="archived"&&loc(a.locationId)?.path[0]===l.name).length;return `<button class="location-card" data-open-location="${l.id}"><div class="asset-icon">⌖</div><h3>${escapeHtml(l.name)}</h3><p>${count} assets across this location hierarchy.</p></button>`;}).join("");
  document.querySelectorAll("[data-open-location]").forEach(b=>b.onclick=()=>openLocation(b.dataset.openLocation));
}
function openLocation(id){
  const l=loc(id); if(!l)return; const list=db.assets.filter(a=>assetLifecycle(a)!=="archived"&&loc(a.locationId)?.path[0]===l.name);
  document.getElementById("locationDetail").innerHTML=`<div class="detail-hero"><div class="detail-identity"><div class="detail-icon">⌖</div><div><p class="eyebrow">${escapeHtml(l.type)}</p><h1>${escapeHtml(l.name)}</h1><div class="detail-id">${l.id}</div></div></div></div><div class="section-head"><div><p class="eyebrow">At this location</p><h2>Assets</h2></div></div><div class="asset-grid large">${list.map(assetCard).join("")}</div>`;
  lastListPage="locations"; showPage("location-detail"); bindAssetLinks();
}
function bindAssetLinks(){ document.querySelectorAll("[data-open-asset]").forEach(b=>b.onclick=()=>openAsset(b.dataset.openAsset)); }
function openAsset(id){
  const a=asset(id); if(!a)return; const parts=(a.parts||[]).map(id=>db.parts.find(p=>p.id===id)).filter(Boolean); const m=assetPlanSummary(a.id); const lc=assetLifecycle(a);
  document.getElementById("assetDetail").innerHTML=`<div class="detail-hero"><div class="detail-top"><div class="detail-identity"><div class="detail-icon">${escapeHtml(a.icon||"◇")}</div><div><p class="eyebrow">${escapeHtml(a.category)}</p><h1>${escapeHtml(a.name)}</h1><div class="detail-id">${a.id}</div><div class="detail-location">⌖ ${escapeHtml(path(a.locationId))}</div></div></div><div class="detail-badges"><span class="health ${healthClass(a)}">${escapeHtml(a.healthLabel||"Healthy")}</span><span class="lifecycle-badge ${lc}">${lifecycleIcon(lc)} ${lifecycleLabel(lc)}</span></div></div><div class="asset-management-bar"><button class="secondary-button" data-edit-current>✎ Edit</button><button class="secondary-button" data-life="active">● Activate</button><button class="secondary-button" data-life="sleeping">☾ Sleep</button><button class="secondary-button" data-life="disabled">⊘ Disable</button><button class="secondary-button" data-life="archived">▣ Archive</button><button class="danger-button" data-delete-current>Delete permanently</button></div><div class="detail-grid">${(a.metrics||[]).map(x=>`<div class="detail-stat"><small>${escapeHtml(x.label)}</small><strong>${escapeHtml(x.value)}</strong></div>`).join("")||`<div class="detail-stat"><small>Status</small><strong>${lifecycleLabel(lc)}</strong></div>`}</div></div>
  <div class="detail-panels"><section class="detail-panel"><p class="eyebrow">Maintenance program</p><h2>${m.total} active plans</h2><p class="subhead">${lc==="active"?`${m.overdue} overdue · ${m.soon} due soon`:"Reminders paused while this asset is not active."}</p><button class="primary-button" id="openAssetMaintenance">Open MaintenanceView</button></section><section class="detail-panel"><p class="eyebrow">Next action</p><h2>${escapeHtml(a.nextAction||"No action needed")}</h2><p class="subhead">${escapeHtml(a.summary||"")}</p></section><section class="detail-panel"><p class="eyebrow">Specifications</p><h2>Known facts</h2>${(a.specifications||[]).length?a.specifications.map(s=>`<div class="record-row"><small>${escapeHtml(s.label)}</small><br><strong>${escapeHtml(s.value)}</strong></div>`).join(""):`<p class="subhead">Specifications will be added as this asset is completed.</p>`}</section><section class="detail-panel"><p class="eyebrow">Parts & ordering</p><h2>Required items</h2>${parts.length?parts.map(p=>`<div class="part-row"><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.partNumber||"No part number")} · ${p.verifiedFitment?"Verified":"Fitment must be verified"}</small></div>`).join(""):`<p class="subhead">No parts linked yet.</p>`}</section><section class="detail-panel"><p class="eyebrow">History</p><h2>Recent activity</h2>${(a.history||[]).length?a.history.map(h=>`<div class="record-row"><small>${escapeHtml(h.date)}</small><br><strong>${escapeHtml(h.title)}</strong><br><small>${escapeHtml(h.detail)}</small></div>`).join(""):`<p class="subhead">No history entered yet.</p>`}</section><section class="detail-panel"><p class="eyebrow">Permanent identity</p><h2>Core record</h2><div class="record-row"><small>EnView ID</small><br><strong class="detail-id">${a.id}</strong></div><div class="record-row"><small>Location ID</small><br><strong class="detail-id">${a.locationId}</strong></div></section></div>`;
  document.getElementById("openAssetMaintenance").onclick=()=>{selectedMaintenanceAssetId=a.id;renderMaintenance();showPage("maintenance");};
  document.querySelector("[data-edit-current]").onclick=()=>openAssetModal(a.id);
  document.querySelectorAll("[data-life]").forEach(b=>b.onclick=()=>{if(b.dataset.life==="sleeping"){openAssetModal(a.id);document.getElementById("assetLifecycle").value="sleeping";}else setAssetLifecycle(a.id,b.dataset.life);});
  document.querySelector("[data-delete-current]").onclick=()=>deleteAssetPermanently(a.id);
  showPage("asset-detail");
}

function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active")); document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  document.getElementById(`page-${name}`)?.classList.add("active"); document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add("active");
  if(name==="maintenance")renderMaintenance(); if(["dashboard","favorites","assets","locations"].includes(name))lastListPage=name;
  document.getElementById("sidebar").classList.remove("open"); window.scrollTo({top:0,behavior:"smooth"});
}

function closeModal(id){ document.getElementById(id)?.classList.remove("open"); }
function showToast(message){
  const toast=document.getElementById("appToast");
  if(!toast){ alert(message); return; }
  toast.textContent=message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove("show"),2600);
}
function assetOptions(selected=""){ return db.assets.filter(a=>assetLifecycle(a)!=="archived").map(a=>`<option value="${a.id}" ${a.id===selected?"selected":""}>${escapeHtml(a.name)}</option>`).join(""); }
function locationOptions(selected=""){ return db.locations.map(l=>`<option value="${l.id}" ${l.id===selected?"selected":""}>${escapeHtml(l.path.join(" · "))}</option>`).join(""); }
function openActionModal(type){
  const modal=document.getElementById("actionModal"), title=document.getElementById("actionModalTitle"), body=document.getElementById("actionModalBody"), save=document.getElementById("saveActionButton");
  save.dataset.action=type;
  const first=db.assets.find(a=>assetLifecycle(a)!=="archived")?.id||"";
  const configs={
    "move-asset": ["Move Asset",`<div class="form-grid"><label class="field full"><span>Asset</span><select id="actionAsset">${assetOptions(first)}</select></label><label class="field full"><span>New location</span><select id="actionLocation">${locationOptions()}</select></label></div>`,"Move asset"],
    "add-receipt": ["Add Receipt",`<div class="form-grid"><label class="field full"><span>Asset</span><select id="actionAsset">${assetOptions(first)}</select></label><label class="field"><span>Vendor</span><input id="actionVendor" placeholder="Vendor name"></label><label class="field"><span>Amount</span><input id="actionAmount" type="number" min="0" step="0.01"></label><label class="field full"><span>Note</span><textarea id="actionNote" rows="3"></textarea></label></div>`,"Save receipt"],
    "order-parts": ["Order Parts",`<div class="form-grid"><label class="field full"><span>Asset</span><select id="actionAsset">${assetOptions(first)}</select></label><label class="field full"><span>Part or search terms</span><input id="actionQuery" placeholder="Example: 2021 Tiguan oil filter"></label></div>`,"Search parts"],
    "report-issue": ["Report Issue",`<div class="form-grid"><label class="field full"><span>Asset</span><select id="actionAsset">${assetOptions(first)}</select></label><label class="field full"><span>Issue</span><input id="actionIssue" placeholder="Describe the problem"></label><label class="field full"><span>Details</span><textarea id="actionNote" rows="3"></textarea></label></div>`,"Save issue"]
  };
  const c=configs[type]; if(!c)return;
  title.textContent=c[0]; body.innerHTML=c[1]; save.textContent=c[2]; modal.classList.add("open");
}
function saveQuickAction(){
  const type=document.getElementById("saveActionButton").dataset.action;
  const assetId=document.getElementById("actionAsset")?.value, a=asset(assetId);
  if(!a){ alert("Please choose an asset."); return; }
  if(type==="move-asset"){
    a.locationId=document.getElementById("actionLocation").value;
    a.history||=[]; a.history.unshift({date:new Date().toLocaleDateString(),title:"Asset moved",detail:`Moved to ${path(a.locationId)}`});
    save(); closeModal("actionModal"); renderAll(); showToast(`${a.shortName||a.name} moved successfully.`);
  }else if(type==="add-receipt"){
    const vendor=document.getElementById("actionVendor").value.trim(), amount=document.getElementById("actionAmount").value;
    if(!vendor){alert("Please enter a vendor.");return;}
    db.receipts||=[]; db.receipts.unshift({id:uid("RCT"),assetId,vendor,amount:Number(amount||0),note:document.getElementById("actionNote").value.trim(),date:new Date().toISOString().slice(0,10)});
    a.history||=[]; a.history.unshift({date:new Date().toLocaleDateString(),title:`Receipt added — ${vendor}`,detail:amount?`$${Number(amount).toFixed(2)}`:"Amount not entered"});
    save(); closeModal("actionModal"); renderAll(); showToast("Receipt saved.");
  }else if(type==="order-parts"){
    const q=document.getElementById("actionQuery").value.trim(); if(!q){alert("Enter a part or search term.");return;}
    closeModal("actionModal"); window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`,"_blank","noopener");
  }else if(type==="report-issue"){
    const issue=document.getElementById("actionIssue").value.trim(); if(!issue){alert("Please describe the issue.");return;}
    db.issues||=[]; db.issues.unshift({id:uid("ISS"),assetId,title:issue,note:document.getElementById("actionNote").value.trim(),status:"open",date:new Date().toISOString().slice(0,10)});
    a.status="attention"; a.healthLabel="Needs Attention"; a.nextAction=issue; a.history||=[]; a.history.unshift({date:new Date().toLocaleDateString(),title:"Issue reported",detail:issue});
    save(); closeModal("actionModal"); renderAll(); showToast("Issue saved and added to priorities.");
  }
}
function handleQuickAction(type){
  closeModal("quickModal");
  if(type==="add-asset") return openAssetModal();
  if(type==="log-service"){
    const p=db.maintenancePlans.find(p=>p.active!==false && assetLifecycle(asset(p.assetId)||{})!=="archived");
    if(p){ selectedMaintenanceAssetId=p.assetId; renderMaintenance(); showPage("maintenance"); openServiceModal(p.id); }
    else { showPage("maintenance"); showToast("Add a maintenance plan before logging service."); }
    return;
  }
  openActionModal(type);
}
function setupBindings(){
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{if(b.dataset.page==="powerview")window.open(POWERVIEW_URL,"_blank","noopener");else showPage(b.dataset.page);});
  document.querySelectorAll("[data-page-target]").forEach(b=>b.onclick=()=>{if(b.dataset.pageTarget==="powerview")window.open(POWERVIEW_URL,"_blank","noopener");else showPage(b.dataset.pageTarget);});
  document.getElementById("assetBack").onclick=()=>showPage(lastListPage);
  document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
  document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");assetCategoryFilter=b.dataset.filter;renderAssetCenter();});
  document.querySelectorAll("[data-lifecycle-filter]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-lifecycle-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");assetLifecycleFilter=b.dataset.lifecycleFilter;renderAssetCenter();});
  const quick=document.getElementById("quickModal");
  document.querySelectorAll("[data-open-quick]").forEach(b=>b.onclick=()=>quick.classList.add("open"));
  document.querySelectorAll("[data-quick-action]").forEach(b=>b.onclick=()=>handleQuickAction(b.dataset.quickAction));
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>quick.classList.remove("open")); quick.onclick=e=>{if(e.target===quick)quick.classList.remove("open")};
  document.addEventListener("click",e=>{if(e.target.closest("[data-close-plan]"))closeModal("planModal");if(e.target.closest("[data-close-trigger]"))closeModal("triggerModal");if(e.target.closest("[data-close-service]"))closeModal("serviceModal");if(e.target.closest("[data-close-asset]"))closeModal("assetModal");if(e.target.closest("[data-close-action]"))closeModal("actionModal");if(e.target.classList.contains("modal-backdrop"))e.target.classList.remove("open");});
  document.getElementById("saveAssetButton").onclick=saveAssetFromModal;
  document.getElementById("savePlanButton").onclick=savePlanFromModal;
  document.getElementById("saveTriggerButton").onclick=saveTriggerFromModal;
  document.getElementById("saveServiceButton").onclick=saveServiceFromModal;
  document.getElementById("saveActionButton").onclick=saveQuickAction;
  document.getElementById("triggerType").onchange=updateTriggerFields;
  document.querySelector(".profile-button").onclick=()=>showPage("settings");
  document.getElementById("todayDate").textContent=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric"}).format(new Date());
  const input=document.getElementById("globalSearch"),results=document.getElementById("searchResults");
  function search(q){if(!q){results.classList.remove("open");return}const n=q.toLowerCase();const hits=[...db.assets.filter(a=>JSON.stringify(a).toLowerCase().includes(n)).map(a=>({title:a.name,sub:`Asset · ${a.id}`,go:()=>openAsset(a.id)})),...db.locations.filter(l=>JSON.stringify(l).toLowerCase().includes(n)).map(l=>({title:l.name,sub:`Location · ${l.id}`,go:()=>openLocation(l.id)})),...db.maintenancePlans.filter(p=>JSON.stringify(p).toLowerCase().includes(n)).map(p=>({title:p.name,sub:`Maintenance · ${asset(p.assetId)?.shortName||p.assetId}`,go:()=>{selectedMaintenanceAssetId=p.assetId;renderMaintenance();showPage("maintenance")}}))].slice(0,8);results.innerHTML=hits.length?hits.map((h,i)=>`<button class="search-result" data-hit="${i}"><span><strong>${escapeHtml(h.title)}</strong><br><small>${escapeHtml(h.sub)}</small></span><span>›</span></button>`).join(""):`<div style="padding:14px;color:#667085">No results found</div>`;results.classList.add("open");results.querySelectorAll("[data-hit]").forEach(b=>b.onclick=()=>{hits[Number(b.dataset.hit)].go();results.classList.remove("open");input.value=""});}
  input.oninput=e=>search(e.target.value.trim());
  document.addEventListener("click",e=>{if(!results.contains(e.target)&&e.target!==input)results.classList.remove("open")});
  document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.focus()}if(e.key==="Escape"){quick.classList.remove("open");results.classList.remove("open");["planModal","triggerModal","serviceModal","assetModal","actionModal"].forEach(closeModal)}});
}
async function bootstrap(){
  try{ await init(); setupBindings(); }
  catch(error){ console.error("EnView failed to start",error); document.body.insertAdjacentHTML("beforeend",`<div class="startup-error"><strong>EnView could not start.</strong><br>${escapeHtml(error.message)}</div>`); }
}
bootstrap();
