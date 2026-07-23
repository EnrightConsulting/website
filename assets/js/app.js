const pages = {
  homeview: {
    title: "HomeView", icon: "⌂", subtitle: "Your property, systems and buildings in one place.",
    cards: [["Systems","HVAC, plumbing, electrical and solar"],["Spaces","Main house, garage, Barndo and outdoor areas"],["Maintenance","Recurring property tasks and service history"]]
  },
  powerview: {
    title: "PowerView", icon: "ϟ", subtitle: "Real-time home energy intelligence.",
    cards: [["Live Energy","Solar, battery, load and grid flow"],["Battery Intelligence","State of charge, balance and runtime"],["History","Trends, events and performance"]]
  },
  maintenance: {
    title: "MaintenanceView", icon: "⚒", subtitle: "Fast, reliable records for vehicles and equipment.",
    cards: [["Vehicles","Ram, Tiguan, Atlas, GLK and Catalina"],["Equipment","Mowers, pressure washer and golf cart"],["Quick Service","Log common work in under 30 seconds"]]
  },
  network: {
    title: "NetworkView", icon: "◎", subtitle: "Understand every connection across your property.",
    cards: [["Network Health","Internet, house, garage and Barndo"],["Devices","Cameras, hubs, computers and smart devices"],["Topology","See what connects where"]]
  },
  finance: {
    title: "FinanceView", icon: "$", subtitle: "Simple business performance and financial insight.",
    cards: [["Performance","Revenue, expense and profitability"],["Receivables","A/R aging and collection priorities"],["Reports","Clear, shareable management summaries"]]
  },
  operations: {
    title: "OperationsView", icon: "↗", subtitle: "Daily workflows, work activity and performance.",
    cards: [["Workflows","Jobs, approvals and recurring processes"],["Teams","Assignments, activity and accountability"],["Insights","Turn operating data into action"]]
  },
  library: {
    title: "Library", icon: "▤", subtitle: "Manuals, receipts, photos and documents—connected to assets.",
    cards: [["Documents","Manuals, warranties and diagrams"],["Receipts","Purchases and service records"],["Media","Photos, videos and reference material"]]
  },
  settings: {
    title: "Settings", icon: "⚙", subtitle: "Personalize EnView and manage the platform.",
    cards: [["Profile","User and household information"],["Preferences","Notifications, display and defaults"],["Data","Imports, exports and integrations"]]
  }
};

function buildPlaceholders(){
  Object.entries(pages).forEach(([key, data])=>{
    const el = document.getElementById(`page-${key}`);
    el.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-hero">
          <div class="placeholder-icon">${data.icon}</div>
          <p class="eyebrow">EnView application</p>
          <h1>${data.title}</h1>
          <p>${data.subtitle}</p>
          <div class="placeholder-grid">
            ${data.cards.map(c=>`<div class="placeholder-card"><strong>${c[0]}</strong><small>${c[1]}</small></div>`).join("")}
          </div>
        </div>
      </div>`;
  });
}

function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  const page = document.getElementById(`page-${name}`) || document.getElementById("page-dashboard");
  page.classList.add("active");
  const nav = document.querySelector(`.nav-item[data-page="${name}"]`);
  if(nav) nav.classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
  location.hash = name === "dashboard" ? "" : name;
}

buildPlaceholders();

document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));
document.querySelectorAll("[data-page-target]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.pageTarget)));

const date = new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric"}).format(new Date());
document.getElementById("todayDate").textContent = date;

const modal = document.getElementById("quickModal");
document.querySelectorAll("[data-open-quick]").forEach(b=>b.addEventListener("click",()=>{
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false");
}));
document.getElementById("closeQuick").addEventListener("click",()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true")});
modal.addEventListener("click",e=>{if(e.target===modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}});

document.getElementById("mobileMenu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));

const searchData = [
  ["2021 Volkswagen Tiguan","MaintenanceView","maintenance"],
  ["2022 Ram 1500","MaintenanceView","maintenance"],
  ["Husqvarna Z254F","MaintenanceView","maintenance"],
  ["Main House HVAC","HomeView","homeview"],
  ["Harris BMS","PowerView · NetworkView","powerview"],
  ["Garage Camera","NetworkView","network"],
  ["Oil filter FE11784","MaintenanceView","maintenance"],
  ["Manuals and receipts","Library","library"]
];
const input = document.getElementById("globalSearch");
const results = document.getElementById("searchResults");
function renderSearch(q){
  const matches = searchData.filter(x=>x[0].toLowerCase().includes(q.toLowerCase()) || x[1].toLowerCase().includes(q.toLowerCase())).slice(0,6);
  if(!q){results.classList.remove("open");return}
  results.innerHTML = matches.length ? matches.map(m=>`<button class="search-result" data-result-page="${m[2]}"><span><strong>${m[0]}</strong><br><small>${m[1]}</small></span><span>›</span></button>`).join("") : `<div style="padding:14px;color:#667085">No results found</div>`;
  results.classList.add("open");
  results.querySelectorAll("[data-result-page]").forEach(b=>b.addEventListener("click",()=>{showPage(b.dataset.resultPage);results.classList.remove("open");input.value=""}));
}
input.addEventListener("input",e=>renderSearch(e.target.value.trim()));
document.addEventListener("click",e=>{if(!results.contains(e.target) && e.target!==input)results.classList.remove("open")});
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.focus()}
  if(e.key==="Escape"){modal.classList.remove("open");results.classList.remove("open")}
});

const initial = location.hash.replace("#","");
if(initial && document.getElementById(`page-${initial}`)) showPage(initial);
