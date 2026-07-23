const assets = [
  {id:"tiguan",name:"2021 Volkswagen Tiguan",icon:"🚙",type:"vehicle",health:"Healthy",healthClass:"green",location:["Main House","Garage","Bay 2"],metricLabel:"Mileage",metric:"104,150 mi",secondary:"Oil due in 650 mi",favorite:true},
  {id:"ram",name:"2022 Ram 1500",icon:"🛻",type:"vehicle",health:"Attention Soon",healthClass:"amber",location:["Main House","Garage","Bay 1"],metricLabel:"Next service",metric:"650 mi",secondary:"Oil service due soon",favorite:true},
  {id:"battery",name:"Harris Battery",icon:"🔋",type:"energy",health:"Healthy",healthClass:"green",location:["Main House","Garage","Solar wall"],metricLabel:"Status",metric:"Online",secondary:"Live PowerView data",favorite:true},
  {id:"hvac",name:"Main House HVAC",icon:"❄",type:"home",health:"Attention Soon",healthClass:"amber",location:["Main House","Hallway","Mechanical closet"],metricLabel:"Filter",metric:"Due next week",secondary:"20 × 25 × 4",favorite:true},
  {id:"camera",name:"Barndo Exterior Camera",icon:"📷",type:"network",health:"Offline",healthClass:"red",location:["Barndo","Exterior","North wall"],metricLabel:"Status",metric:"Offline",secondary:"Reboot may be required",favorite:true},
  {id:"husqvarna",name:"Husqvarna Z254F",icon:"🚜",type:"equipment",health:"Healthy",healthClass:"green",location:["Barndo","Workshop","Equipment bay"],metricLabel:"Hours",metric:"185 hr",secondary:"Blade inspection upcoming",favorite:true},
  {id:"pressure",name:"Troy-Bilt Pressure Washer",icon:"🧰",type:"equipment",health:"Healthy",healthClass:"green",location:["Barndo","Workshop","Back wall"],metricLabel:"Last service",metric:"May 2026",secondary:"Ready to use",favorite:false},
  {id:"hoobs",name:"HOOBS Bridge",icon:"◉",type:"network",health:"Healthy",healthClass:"green",location:["Main House","Kitchen","Top cabinet"],metricLabel:"IP address",metric:"192.168.1.200",secondary:"HomeKit bridge",favorite:false},
  {id:"solark",name:"Sol-Ark 12KP",icon:"⚡",type:"energy",health:"Healthy",healthClass:"green",location:["Main House","Garage","Solar wall"],metricLabel:"Status",metric:"Online",secondary:"Inverter connected",favorite:false}
];

const locations = [
  {id:"main-house",name:"Main House",icon:"🏠",type:"Property",description:"Primary residence, attached garage and home systems"},
  {id:"barndo",name:"Barndo",icon:"🏡",type:"Property",description:"Workshop, garage, cameras and connected equipment"},
  {id:"pronto",name:"Pronto Services",icon:"🏢",type:"Business",description:"Office, shop, trucks, dumpsters and operations"},
  {id:"storage-a",name:"Storage Unit A",icon:"📦",type:"Storage",description:"Future inventory and asset storage location"},
  {id:"tilted-pint",name:"Tilted Pint",icon:"🍽",type:"Business",description:"Restaurant equipment, systems and operations"},
  {id:"mobile",name:"Mobile / In Transit",icon:"🚚",type:"Dynamic",description:"Assets currently moving between locations"}
];

const modules = {
  homeview:{title:"HomeView",icon:"⌂",subtitle:"Property systems, buildings and recurring home care.",cards:[["Systems","HVAC, plumbing, electrical and solar"],["Spaces","Main house, garage, Barndo and outdoor areas"],["Maintenance","Recurring property tasks and service history"]]},
  powerview:{title:"PowerView",icon:"ϟ",subtitle:"Real-time home energy intelligence.",cards:[["Live Energy","Solar, battery, load and grid flow"],["Battery Intelligence","State of charge, balance and runtime"],["History","Trends, events and performance"]]},
  maintenance:{title:"MaintenanceView",icon:"⚒",subtitle:"Fast, reliable records for vehicles and equipment.",cards:[["Assets","Vehicles, equipment and tools"],["Quick Service","Log common work in under 30 seconds"],["Reminders","Upcoming service and issues"]]},
  network:{title:"NetworkView",icon:"◎",subtitle:"Understand every connection across your property.",cards:[["Network Health","Internet, house, garage and Barndo"],["Devices","Cameras, hubs, computers and smart devices"],["Topology","See what connects where"]]},
  finance:{title:"FinanceView",icon:"$",subtitle:"Simple business performance and financial insight.",cards:[["Performance","Revenue, expense and profitability"],["Receivables","A/R aging and collection priorities"],["Reports","Clear, shareable management summaries"]]},
  operations:{title:"OperationsView",icon:"↗",subtitle:"Daily workflows, work activity and performance.",cards:[["Workflows","Jobs, approvals and recurring processes"],["Teams","Assignments, activity and accountability"],["Insights","Turn operating data into action"]]},
  library:{title:"Library",icon:"▤",subtitle:"Manuals, receipts, photos and documents—connected to assets.",cards:[["Documents","Manuals, warranties and diagrams"],["Receipts","Purchases and service records"],["Media","Photos, videos and reference material"]]},
  settings:{title:"Settings",icon:"⚙",subtitle:"Personalize EnView and manage the platform.",cards:[["Profile","User and household information"],["Preferences","Notifications, display and defaults"],["Data","Imports, exports and integrations"]]}
};

function assetCard(a){
  return `<button class="asset-card" data-asset="${a.id}">
    <div class="asset-head"><span class="asset-icon">${a.icon}</span><span class="health-badge ${a.healthClass}">${a.health}</span></div>
    <strong class="asset-title">${a.name}</strong>
    <span class="asset-location">⌖ ${a.location.join(" · ")}</span>
    <div class="asset-metric"><span>${a.metricLabel}</span><strong>${a.metric}</strong></div>
  </button>`;
}
function locationRow(l){
  const count = assets.filter(a=>a.location[0]===l.name).length;
  return `<button class="location-row" data-location="${l.id}">
    <span class="location-row-icon">${l.icon}</span>
    <span class="location-row-copy"><strong>${l.name}</strong><small>${count} assets</small></span><span class="arrow">›</span>
  </button>`;
}
function locationCard(l){
  const count = assets.filter(a=>a.location[0]===l.name).length;
  return `<button class="location-card" data-location="${l.id}">
    <div class="location-card-top"><span class="location-card-icon">${l.icon}</span><span class="location-count">${count} assets</span></div>
    <h3>${l.name}</h3><p>${l.description}</p>
  </button>`;
}
function bindDynamic(){
  document.querySelectorAll("[data-asset]").forEach(b=>b.onclick=()=>openAsset(b.dataset.asset));
  document.querySelectorAll("[data-location]").forEach(b=>b.onclick=()=>openLocation(b.dataset.location));
}
function render(){
  document.getElementById("favoriteAssets").innerHTML=assets.filter(a=>a.favorite).map(assetCard).join("");
  document.getElementById("allAssets").innerHTML=assets.map(assetCard).join("");
  document.getElementById("dashboardLocations").innerHTML=locations.slice(0,4).map(locationRow).join("");
  document.getElementById("locationGrid").innerHTML=locations.map(locationCard).join("");
  bindDynamic();
}
function buildModules(){
  Object.entries(modules).forEach(([key,data])=>{
    document.getElementById(`page-${key}`).innerHTML=`<div class="placeholder"><div class="placeholder-hero">
      <div class="placeholder-icon">${data.icon}</div><p class="eyebrow">EnView application</p><h1>${data.title}</h1><p>${data.subtitle}</p>
      <div class="placeholder-grid">${data.cards.map(c=>`<div class="placeholder-card"><strong>${c[0]}</strong><small>${c[1]}</small></div>`).join("")}</div>
    </div></div>`;
  });
}
function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  const page=document.getElementById(`page-${name}`)||document.getElementById("page-dashboard");
  page.classList.add("active");
  const nav=document.querySelector(`.nav-item[data-page="${name}"]`); if(nav)nav.classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
function openAsset(id){
  const a=assets.find(x=>x.id===id); if(!a)return;
  document.getElementById("assetDetail").innerHTML=`
    <div class="detail-hero">
      <div class="detail-top">
        <div class="detail-identity"><div class="detail-icon">${a.icon}</div><div>
          <p class="eyebrow">${a.type}</p><h1>${a.name}</h1><div class="detail-meta">${a.secondary}</div>
          <div class="detail-location">⌖ ${a.location.join(" → ")}</div>
        </div></div>
        <span class="health-badge ${a.healthClass}">${a.health}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-stat"><small>${a.metricLabel}</small><strong>${a.metric}</strong></div>
        <div class="detail-stat"><small>Location</small><strong>${a.location[a.location.length-1]}</strong></div>
        <div class="detail-stat"><small>Open issues</small><strong>${a.healthClass==="red"?"1":"0"}</strong></div>
        <div class="detail-stat"><small>Documents</small><strong>3</strong></div>
      </div>
    </div>
    <div class="detail-panels">
      <div class="detail-panel">
        <div class="section-title-row"><div><p class="eyebrow">Fast capture</p><h2>Quick actions</h2></div></div>
        <div class="quick-actions-row">
          <button class="quick-action-tile"><span>⚒</span><strong>Log service</strong></button>
          <button class="quick-action-tile"><span>⌖</span><strong>Move asset</strong></button>
          <button class="quick-action-tile"><span>▧</span><strong>Add photo</strong></button>
          <button class="quick-action-tile"><span>▤</span><strong>Add receipt</strong></button>
          <button class="quick-action-tile"><span>◷</span><strong>Reminder</strong></button>
          <button class="quick-action-tile"><span>!</span><strong>Report issue</strong></button>
        </div>
      </div>
      <div class="detail-panel">
        <p class="eyebrow">Location hierarchy</p><h2>Where it lives</h2>
        <div class="location-path">${a.location.map(x=>`<span class="crumb">${x}</span>`).join("")}</div>
        <button class="text-button">View location history</button>
      </div>
      <div class="detail-panel">
        <p class="eyebrow">History</p><h2>Recent activity</h2>
        <div class="history-item"><strong>Record updated</strong><br><small>Yesterday</small></div>
        <div class="history-item"><strong>Location confirmed</strong><br><small>June 2026</small></div>
        <div class="history-item"><strong>Asset added to EnView</strong><br><small>Initial import</small></div>
      </div>
      <div class="detail-panel">
        <p class="eyebrow">Connected knowledge</p><h2>Asset intelligence</h2>
        <div class="history-item"><strong>Specifications</strong><br><small>Parts, fluids, model and serial information</small></div>
        <div class="history-item"><strong>Documents</strong><br><small>Manuals, receipts and photos</small></div>
        <div class="history-item"><strong>Relationships</strong><br><small>Connected systems and related assets</small></div>
      </div>
    </div>`;
  showPage("asset-detail");
}
function openLocation(id){
  const l=locations.find(x=>x.id===id); if(!l)return;
  const here=assets.filter(a=>a.location[0]===l.name);
  document.getElementById("locationDetail").innerHTML=`
    <div class="detail-hero">
      <div class="detail-top"><div class="detail-identity"><div class="detail-icon">${l.icon}</div><div>
        <p class="eyebrow">${l.type}</p><h1>${l.name}</h1><div class="detail-meta">${l.description}</div>
      </div></div><span class="health-badge green">${here.length} assets</span></div>
    </div>
    <div class="section-title-row"><div><p class="eyebrow">At this location</p><h2>Assets</h2></div></div>
    <div class="asset-grid large">${here.length?here.map(assetCard).join(""):`<div class="card"><strong>No assets yet</strong><p class="subhead">Add or move an asset to this location.</p></div>`}</div>`;
  showPage("location-detail"); bindDynamic();
}
buildModules(); render();

document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));
document.querySelectorAll("[data-page-target]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.pageTarget)));
document.getElementById("assetBack").onclick=()=>showPage("assets");
document.getElementById("locationBack").onclick=()=>showPage("locations");

document.querySelectorAll(".filter-chip").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  const f=btn.dataset.filter;document.getElementById("allAssets").innerHTML=assets.filter(a=>f==="all"||a.type===f).map(assetCard).join("");bindDynamic();
});

document.getElementById("todayDate").textContent=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric"}).format(new Date());
document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");

const quick=document.getElementById("quickModal"), locModal=document.getElementById("locationModal");
document.querySelectorAll("[data-open-quick]").forEach(b=>b.onclick=()=>quick.classList.add("open"));
document.querySelectorAll("[data-close-modal]").forEach(b=>b.onclick=()=>quick.classList.remove("open"));
document.querySelectorAll("[data-open-add-location]").forEach(b=>b.onclick=()=>locModal.classList.add("open"));
document.querySelectorAll("[data-close-location]").forEach(b=>b.onclick=()=>locModal.classList.remove("open"));
[quick,locModal].forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove("open")});

const input=document.getElementById("globalSearch"), results=document.getElementById("searchResults");
function search(q){
  if(!q){results.classList.remove("open");return}
  const assetMatches=assets.filter(a=>[a.name,a.type,a.location.join(" "),a.metric,a.secondary].join(" ").toLowerCase().includes(q.toLowerCase())).map(a=>({title:a.name,sub:`Asset · ${a.location.join(" · ")}`,action:()=>openAsset(a.id)}));
  const locationMatches=locations.filter(l=>[l.name,l.type,l.description].join(" ").toLowerCase().includes(q.toLowerCase())).map(l=>({title:l.name,sub:`Location · ${l.type}`,action:()=>openLocation(l.id)}));
  const matches=[...assetMatches,...locationMatches].slice(0,8);
  results.innerHTML=matches.length?matches.map((m,i)=>`<button class="search-result" data-search-index="${i}"><span><strong>${m.title}</strong><br><small>${m.sub}</small></span><span>›</span></button>`).join(""):`<div style="padding:14px;color:#667085">No results found</div>`;
  results.classList.add("open");
  results.querySelectorAll("[data-search-index]").forEach(b=>b.onclick=()=>{matches[Number(b.dataset.searchIndex)].action();results.classList.remove("open");input.value=""});
}
input.oninput=e=>search(e.target.value.trim());
document.addEventListener("click",e=>{if(!results.contains(e.target)&&e.target!==input)results.classList.remove("open")});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.focus()}if(e.key==="Escape"){quick.classList.remove("open");locModal.classList.remove("open");results.classList.remove("open")}});
