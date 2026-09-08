import {
  DEMO_DATA_NOTICE,
  DEMO_RECORDS,
  INDEX_CATALOGUE,
  LOCATION_FACTOR_POLICY,
  calculatePrice,
  formatMoney,
  formatNumber,
  makeSnapshot,
  searchRecords,
} from "./src/domain.mjs";

const app = document.querySelector("#app");

const state = {
  page: "dashboard",
  project: {
    name: "New Project Estimate",
    number: "AVA-2026-001",
    client: "Multiconsult internal workspace",
    country: "Kenya",
    targetYear: 2030,
    currency: "USD",
  },
  filters: {
    query: "Power Transformer",
    equipmentType: "All equipment",
    voltage: "Any voltage",
    rating: "Any rating",
    manufacturer: "Any manufacturer",
    country: "Any country",
  },
  items: [],
  revisions: [],
  indirectCosts: [
    { id: "engineering", name: "Project engineering", enabled: false, type: "percent", applied: 0, basis: "Direct equipment total", rationale: "No recommendation configured." },
    { id: "management", name: "Project management", enabled: false, type: "percent", applied: 0, basis: "Direct equipment total", rationale: "No recommendation configured." },
    { id: "contingency", name: "Contingency", enabled: false, type: "percent", applied: 0, basis: "Direct equipment total", rationale: "User/project risk basis required." },
    { id: "custom", name: "Other custom cost", enabled: false, type: "absolute", applied: 0, basis: "Absolute USD", rationale: "User-entered only; no automatic percentage." },
  ],
  databases: [
    { id: "demo", name: "Demo fixture / review required", revision: "DEMO-0", type: "Training fixture", source: "illustrative-demo-fixture.json", status: "training", records: DEMO_RECORDS.length, sources: DEMO_RECORDS.length, visibility: "Private local workspace", hash: "Not a workbook" },
  ],
  builder: null,
  modal: null,
  importReport: null,
  toast: "",
};

const pageMeta = {
  dashboard: ["Workspace", "Dashboard"],
  search: ["Estimate workflow", "Equipment search"],
  builder: ["Estimate workflow", "Price builder"],
  estimate: ["Estimate workflow", "Project cost estimate"],
  databases: ["Data management", "Databases"],
  existing: ["Valuation", "Existing asset valuation"],
  basis: ["Governance", "Basis & export"],
  settings: ["Governance", "Settings"],
};

const icons = { dashboard: "⌂", search: "⌕", estimate: "▤", databases: "▥", existing: "◈", basis: "↗", settings: "⚙" };

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function qualityClass(value) { return String(value).toLowerCase(); }
function dateLabel() { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()); }
function typeOptions(values, selected) { return values.map((value) => `<option ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join(""); }
function valueOrDash(value) { return value === undefined || value === null || value === "" ? "—" : esc(value); }
function currentResults() { return searchRecords(DEMO_RECORDS, state.filters); }
function currentItemRows() { return state.items.map((item) => ({ ...item, calc: calculatePrice(item.record, item.settings) })); }
function totals() {
  const rows = currentItemRows();
  const direct = rows.reduce((sum, row) => sum + row.calc.total, 0);
  const indirect = state.indirectCosts.filter((item) => item.enabled).reduce((sum, item) => sum + (item.type === "percent" ? direct * (Number(item.applied) || 0) : Number(item.applied) || 0), 0);
  return { rows, direct, indirect, total: direct + indirect };
}

function navItem(id, label, group = "") {
  return `<button class="nav-item ${state.page === id ? "active" : ""}" data-action="navigate" data-page="${id}"><span class="nav-icon">${icons[id] || "•"}</span><span>${label}</span></button>`;
}

function layout(content) {
  const [group, current] = pageMeta[state.page] || ["Workspace", "Dashboard"];
  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">AV</div><div class="brand-name">Asset Valuation<span class="brand-sub">Automation</span></div></div>
      <div class="nav-group"><div class="nav-label">Workspace</div>${navItem("dashboard", "Dashboard")}${navItem("search", "Equipment search")}${navItem("estimate", "Project estimate")}</div>
      <div class="nav-group"><div class="nav-label">Data management</div>${navItem("databases", "Databases")}${navItem("existing", "Existing assets")}</div>
      <div class="nav-group"><div class="nav-label">Governance</div>${navItem("basis", "Basis & export")}${navItem("settings", "Settings")}</div>
      <div class="sidebar-foot"><span class="status-dot"></span>Local workspace<br /><span class="mono">v0.1 · deterministic demo</span></div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="crumb">${esc(group)} <span> / </span> <strong>${esc(current)}</strong></div><div class="top-actions"><div class="env-pill">Local · private</div><div class="avatar">MC</div></div></header>
      <div class="content">${content}</div>
    </main>
    ${state.modal ? renderModal() : ""}
    <div class="toast ${state.toast ? "show" : ""}">${esc(state.toast)}</div>
  </div>`;
}

function pageHead(eyebrow, title, lede, actions = "") {
  return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p class="lede">${esc(lede)}</p></div><div class="page-actions">${actions}</div></div>`;
}

function notice(text = DEMO_DATA_NOTICE, title = "Source data status", cls = "") {
  return `<div class="notice ${cls}"><div class="notice-icon">◌</div><div><strong>${esc(title)}</strong>${esc(text)}</div></div>`;
}

function renderDashboard() {
  const { direct, total } = totals();
  return pageHead("Engineering workspace", "Asset valuation automation", "A traceable workspace for historical cost evidence, transparent escalation and project estimates.", `<button class="btn btn-primary" data-action="navigate" data-page="search">Start equipment search</button><button class="btn" data-action="navigate" data-page="databases">Manage databases</button>`) +
    notice() +
    `<div class="grid grid-4">
      <div class="card metric"><div class="metric-label">Active project</div><div class="metric-value">${state.items.length ? "1" : "0"}</div><div class="metric-meta">${state.items.length ? "Draft estimate in progress" : "No estimate items yet"}</div></div>
      <div class="card metric"><div class="metric-label">Equipment lines</div><div class="metric-value">${state.items.length}</div><div class="metric-meta">Selected source records</div></div>
      <div class="card metric"><div class="metric-label">Direct cost</div><div class="metric-value">${direct ? formatMoney(direct, 0) : "—"}</div><div class="metric-meta">USD · calculated deterministically</div></div>
      <div class="card metric"><div class="metric-label">Source databases</div><div class="metric-value">${state.databases.length}</div><div class="metric-meta"><span class="up">${state.databases.filter((d) => d.status === "active").length} approved</span> · ${state.databases.filter((d) => d.status === "training").length} training</div></div>
    </div>
    <div class="section-title"><h2>Estimate workflow</h2><span class="muted tiny">Evidence → calculation → export</span></div>
    <div class="card workflow">
      <div class="step done"><div class="step-dot">1</div><div><div class="step-label">Source data</div><div class="step-state">${state.databases.length} database${state.databases.length === 1 ? "" : "s"} visible</div></div></div>
      <div class="step current"><div class="step-dot">2</div><div><div class="step-label">Find equipment</div><div class="step-state">Search actual records</div></div></div>
      <div class="step"><div class="step-dot">3</div><div><div class="step-label">Build price</div><div class="step-state">Components & escalation</div></div></div>
      <div class="step"><div class="step-dot">4</div><div><div class="step-label">Review estimate</div><div class="step-state">Direct & indirect costs</div></div></div>
      <div class="step"><div class="step-dot">5</div><div><div class="step-label">Export</div><div class="step-state">Traceable workbook</div></div></div>
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><div class="panel-head"><div><h2>Current project</h2><p>${esc(state.project.number)} · ${esc(state.project.client)}</p></div><button class="btn btn-sm" data-action="navigate" data-page="estimate">Open estimate</button></div><div class="panel-body">${state.items.length ? `<div class="mini-list">${currentItemRows().slice(0, 4).map((row) => `<div class="mini-row"><div class="mini-icon">◫</div><div class="mini-copy"><div class="mini-title">${esc(row.record.description)}</div><div class="mini-meta">Qty ${formatNumber(row.calc.quantity, 0)} · ${formatMoney(row.calc.total, 0)} · ${esc(row.record.reference)}</div></div><span class="quality ${qualityClass(row.record.quality)}">${esc(row.record.quality)}</span></div>`).join("")}</div>` : `<div class="empty-state"><div class="empty-icon">⌁</div><h3>No equipment selected</h3><p class="tiny">Start with an evidence-backed search. Similar records will remain clearly separated.</p><button class="btn btn-mint" data-action="navigate" data-page="search">Find equipment</button></div>`}</div></div>
      <div class="card"><div class="panel-head"><div><h2>Control checks</h2><p>Guardrails for an engineering calculation</p></div><span class="tag mint">${state.items.length ? "In progress" : "Ready"}</span></div><div class="panel-body"><div class="mini-list"><div class="mini-row"><div class="mini-icon">✓</div><div class="mini-copy"><div class="mini-title">No automatic source selection</div><div class="mini-meta">Engineer chooses the historical price record.</div></div></div><div class="mini-row"><div class="mini-icon">✓</div><div class="mini-copy"><div class="mini-title">No rating interpolation</div><div class="mini-meta">Ranking is technical relevance, never price magnitude.</div></div></div><div class="mini-row"><div class="mini-icon">!</div><div class="mini-copy"><div class="mini-title">Location factor</div><div class="mini-meta">No defensible automatic recommendation configured.</div></div></div><div class="mini-row"><div class="mini-icon">↗</div><div class="mini-copy"><div class="mini-title">Source lineage</div><div class="mini-meta">File, sheet, row and reference carry into export.</div></div></div></div></div></div>
    </div>`;
}

function dynamicFilterOptions(field, selected) {
  const vals = [...new Set(DEMO_RECORDS.map((r) => field === "country" ? r.country : r.attributes[field]).filter(Boolean))];
  return [field === "voltage" ? "Any voltage" : field === "rating" ? "Any rating" : field === "manufacturer" ? "Any manufacturer" : "Any country", ...vals].map((v) => `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(v)}</option>`).join("");
}

function resultCard(result, similar = false) {
  const r = result.record;
  const spec = Object.entries(r.attributes).filter(([key]) => key !== "equipmentType").slice(0, 3).map(([key, val]) => `${key}: ${val}`).join(" · ");
  return `<div class="result-card ${similar ? "similar" : ""}">
    <div><span class="match ${similar ? "similar" : "exact"}">${similar ? "Similar" : "Exact / strong"}</span><div class="result-score mono" style="margin-top:7px">${result.score}/100</div></div>
    <div><div class="result-key">${esc(r.description)}</div><div class="td-sub">${esc(r.sourceProject)}</div></div>
    <div class="result-spec">${esc(spec)}<br /><span class="tag">${esc(r.recordType || "Historical price record")}</span></div>
    <div><div class="result-price">${formatMoney(calculatePrice(r, { targetYear: r.year, method: "none", locationFactor: 1 }).historicalBasis, 0)}</div><div class="result-year">Source year ${r.year} · ${esc(r.country)}</div></div>
    <div><span class="quality ${qualityClass(r.quality)}">${esc(r.quality)}</span><div class="td-sub">${esc(r.qualityReason).slice(0, 42)}…</div></div>
    <div class="result-actions"><button class="row-action" data-action="view-source" data-id="${r.id}">Inspect</button><button class="btn btn-sm btn-primary" data-action="open-builder" data-id="${r.id}">Select price</button></div>
  </div>`;
}

function renderSearch() {
  const results = currentResults();
  const exact = results.filter((r) => r.exact);
  const similar = results.filter((r) => !r.exact);
  const types = ["All equipment", ...new Set(DEMO_RECORDS.map((r) => r.attributes.equipmentType))];
  return pageHead("Evidence first", "Equipment search", "Search across enabled source databases. Select a source only after reviewing its specification, quality and lineage.", `<button class="btn" data-action="navigate" data-page="databases">Upload database</button><button class="btn btn-primary" data-action="navigate" data-page="estimate">View estimate (${state.items.length})</button>`) +
    notice() +
    `<div class="search-bar"><input class="input search-input" data-field="search-query" value="${esc(state.filters.query)}" placeholder="Search description, type, voltage, rating…" /><select class="select" data-field="equipmentType">${typeOptions(types, state.filters.equipmentType)}</select><select class="select" data-field="voltage">${dynamicFilterOptions("voltage", state.filters.voltage)}</select><select class="select" data-field="rating">${dynamicFilterOptions("rating", state.filters.rating)}</select><button class="btn btn-mint" data-action="apply-search">Search</button><button class="btn" data-action="clear-filters">Clear</button></div>
    <div class="filter-strip"><span class="filter-label">Additional filters</span><select class="select" style="width:170px" data-field="manufacturer">${dynamicFilterOptions("manufacturer", state.filters.manufacturer)}</select><select class="select" style="width:150px" data-field="country">${dynamicFilterOptions("country", state.filters.country)}</select><span class="tag mint">${results.length} records scored</span><span class="tag">Price magnitude excluded from ranking</span></div>
    <div class="card card-pad"><div class="panel-head" style="padding:0 0 16px;border:0"><div><h2>Historical source comparison</h2><p>All amounts shown in source currency; demo records are not production evidence.</p></div><span class="mono tiny muted">${dateLabel()}</span></div>
      ${exact.length ? `<div class="result-group"><div class="result-group-head"><div class="result-group-title"><h3>Exact / strong matches</h3><span>${exact.length} source${exact.length === 1 ? "" : "s"}</span></div><span class="tag mint">Technical match</span></div>${exact.map((r) => resultCard(r)).join("")}</div>` : `<div class="no-results">No exact price record was found for the current filters.</div>`}
      ${similar.length ? `<div class="result-group" style="margin-bottom:0"><div class="similar-banner">No automatic estimate is generated from similar records. The following are actual database rows that differ from one or more requested attributes.</div><div class="result-group-head"><div class="result-group-title"><h3>Similar / closest available records</h3><span>${similar.length} source${similar.length === 1 ? "" : "s"}</span></div><span class="tag">Review differences</span></div>${similar.map((r) => resultCard(r, true)).join("")}</div>` : ""}
      ${!exact.length && !similar.length ? `<div class="no-results"><div style="font-size:24px">⌕</div><h3>No matching source records</h3><p>Try a broader description or remove a technical filter. The application never invents a price when no actual record exists.</p></div>` : ""}
    </div>`;
}

function componentDisplay(component) {
  if (component.componentType === "percentage") return `${(Number(component.rawValue) * 100).toFixed(2)}%`;
  if (component.componentType === "absolute_usd") return formatMoney(component.rawValue, 2);
  if (component.componentType === "multiplier") return `${Number(component.rawValue).toFixed(4)} ×`;
  return "Unknown";
}

function renderTrace(record) {
  return `<div class="card trace-card"><div class="trace-hero"><div class="eyebrow">Selected historical source</div><h2>${esc(record.description)}</h2><p>${esc(record.sourceProject)}</p></div><div class="trace-body"><div class="detail-list"><div class="detail-item"><label>Database</label><div>${esc(record.database)}</div></div><div class="detail-item"><label>Revision</label><div class="mono">${esc(record.revision)}</div></div><div class="detail-item"><label>Workbook</label><div class="source-link">${esc(record.workbook)}</div></div><div class="detail-item"><label>Worksheet / row</label><div>${esc(record.sheet)} · ${record.row}</div></div><div class="detail-item"><label>Source reference</label><div class="mono">${esc(record.reference)}</div></div><div class="detail-item"><label>Price year</label><div>${record.year}</div></div><div class="detail-item"><label>Source country</label><div>${esc(record.country)}</div></div><div class="detail-item"><label>Currency</label><div>USD <span class="tag amber">Demo</span></div></div></div><div class="section-title" style="margin:20px 0 9px"><h3>Technical specification</h3></div><div class="detail-list">${Object.entries(record.attributes).map(([key, value]) => `<div class="detail-item"><label>${esc(key.replace(/([A-Z])/g, " $1"))}</label><div>${esc(value)}</div></div>`).join("")}</div></div><div class="trace-footer"><p><strong>Quality: ${esc(record.quality)}</strong> · ${esc(record.qualityReason)}</p></div></div>`;
}

function builderSettings() {
  return state.builder?.settings || { targetYear: state.project.targetYear, method: "source", indexId: INDEX_CATALOGUE[0].id, annualRate: 0.04, locationFactor: 1, quantity: 1, components: {} };
}

function renderBuilder() {
  if (!state.builder) return renderSearch();
  const record = DEMO_RECORDS.find((r) => r.id === state.builder.recordId);
  if (!record) return renderSearch();
  const settings = builderSettings();
  const calc = calculatePrice(record, settings);
  const methodCards = [
    ["source", "Source workbook factor", "Retained factor; confirm semantics before production use."],
    ["index", "Published index", "Versioned observation ratio from catalogue."],
    ["annual", "Annual assumption", "Future assumption entered by engineer."],
    ["none", "No escalation", "Use source-year basis without escalation."],
  ];
  return pageHead("Transparent build-up", "Price builder", "Every included component, factor and override is visible before the line enters the project estimate.", `<button class="btn" data-action="navigate" data-page="search">Back to results</button><button class="btn btn-primary" data-action="add-estimate">Add to project estimate</button>`) +
    notice("This source is illustrative and must be replaced or approved before any commercial use. Selection is explicit and never automatic.", "Review before adding", "") +
    `<div class="builder-grid"><div>${renderTrace(record)}</div><div class="card"><div class="builder-section"><div class="builder-section-head"><div><h3>Source cost components</h3><p>Defaults are inherited from the source record. Overrides are logged in the estimate snapshot.</p></div><span class="tag">${record.components.filter((c) => settings.components[c.id] ?? c.includedByDefault).length} included</span></div><div class="table-wrap"><table class="component-table"><thead><tr><th style="width:30px"></th><th>Component</th><th>Source value</th><th>Interpretation</th><th>Applied amount</th></tr></thead><tbody>${calc.amounts.map((c) => `<tr><td><input class="component-toggle" type="checkbox" data-component="${c.id}" ${(settings.components[c.id] ?? c.includedByDefault) ? "checked" : ""} ${c.componentType === "unknown" ? "disabled" : ""} /></td><td><div class="component-name">${esc(c.name)}</div><div class="component-note">${esc(c.note || "")}</div></td><td class="mono">${componentDisplay(c)}</td><td><div class="component-type">${esc(c.componentType.replaceAll("_", " "))}</div><div class="component-note">Base: ${esc(c.calculationBase.replaceAll("_", " "))}</div></td><td class="mono">${formatMoney(c.amount, 2)}</td></tr>`).join("")}</tbody></table></div></div><div class="builder-section"><div class="builder-section-head"><div><h3>Escalation / inflation</h3><p>Historical observed/index-based escalation is kept separate from future assumptions.</p></div><span class="tag amber">${esc(calc.escalation.label)}</span></div><div class="radio-row">${methodCards.map(([id, title, copy]) => `<div class="radio-card"><input id="method-${id}" name="method" type="radio" value="${id}" data-field="builder-method" ${settings.method === id ? "checked" : ""} /><label for="method-${id}"><span class="radio-title">${title}</span><span class="radio-copy">${copy}</span></label></div>`).join("")}</div>${settings.method === "index" ? `<div class="form-grid" style="margin-top:12px"><div class="field"><label>Index catalogue</label><select class="select" data-field="builder-index">${INDEX_CATALOGUE.map((i) => `<option value="${i.id}" ${i.id === settings.indexId ? "selected" : ""}>${esc(i.name)}</option>`).join("")}</select><div class="field-help">Provider: ${esc((INDEX_CATALOGUE.find((i) => i.id === settings.indexId) || INDEX_CATALOGUE[0]).provider)} · Series is versioned in the export.</div></div><div class="field"><label>Calculation</label><div class="formula-box"><strong>Target index ÷ source index</strong><br />${esc(calc.escalation.basis)}</div></div></div>` : ""}${settings.method === "annual" ? `<div class="form-grid" style="margin-top:12px"><div class="field"><label>Future annual assumption</label><div class="unit-input"><input class="input" type="number" min="0" max="1" step="0.001" data-field="builder-annual" value="${Number(settings.annualRate)}" /><span>%</span></div><div class="field-help">Enter as a decimal, e.g. 0.04 = 4.00% p.a.</div></div><div class="field"><label>Applied semantics</label><div class="formula-box"><strong>Future assumption only</strong><br />${esc(calc.escalation.basis)}</div></div></div>` : ""}<div class="formula-box" style="margin-top:12px"><strong>Applied factor ${calc.escalation.factor.toFixed(4)} ×</strong> · ${esc(calc.escalation.basis)}</div></div><div class="builder-section"><div class="builder-section-head"><div><h3>Country / location adjustment</h3><p>Source: ${esc(record.country)} → target: ${esc(state.project.country)}</p></div><span class="tag amber">${LOCATION_FACTOR_POLICY.status}</span></div><div class="form-grid"><div class="field"><label>Applied factor</label><div class="unit-input"><input class="input" type="number" min="0" step="0.0001" data-field="builder-location" value="${Number(settings.locationFactor).toFixed(4)}" /><span>×</span></div><div class="field-help">1.0000 = no adjustment. Any override is explicit.</div></div><div class="field"><label>Recommendation rationale</label><div class="formula-box">${esc(LOCATION_FACTOR_POLICY.rationale)}</div></div></div></div><div class="builder-section"><div class="builder-section-head"><div><h3>Target-year result</h3><p>USD display precision is rounded for engineering readability; calculations retain more detail.</p></div></div><div class="form-grid"><div class="field"><label>Target cost year</label><input class="input" type="number" min="1900" max="2200" data-field="builder-target-year" value="${settings.targetYear}" /></div><div class="field"><label>Quantity</label><input class="input" type="number" min="0" step="1" data-field="builder-quantity" value="${settings.quantity}" /></div></div><div class="calc-strip" style="margin-top:16px"><div><div class="calc-label">Historical basis</div><div class="calc-value">${formatMoney(calc.historicalBasis, 0)}</div><div class="calc-foot">Included components</div></div><div><div class="calc-label">Escalation</div><div class="calc-value">${calc.escalation.factor.toFixed(4)}×</div><div class="calc-foot">${record.year} → ${settings.targetYear}</div></div><div><div class="calc-label">Unit cost</div><div class="calc-value">${formatMoney(calc.targetUnitCost, 0)}</div><div class="calc-foot">Location ${Number(calc.locationFactor).toFixed(4)}×</div></div><div><div class="calc-label">Line total</div><div class="calc-value accent">${formatMoney(calc.total, 0)}</div><div class="calc-foot">× ${formatNumber(calc.quantity, 0)} unit${calc.quantity === 1 ? "" : "s"}</div></div></div><div class="builder-actions"><button class="btn" data-action="view-source" data-id="${record.id}">Inspect source detail</button><button class="btn btn-mint" data-action="add-estimate">Add to project estimate</button></div></div></div></div>`;
}

function renderEstimate() {
  const { rows, direct, indirect, total } = totals();
  return pageHead("Decision-ready estimate", "Project cost estimate", "Review selected equipment, edit quantities and apply only documented project-level costs.", `<button class="btn" data-action="new-revision">Snapshot revision</button><button class="btn btn-primary" data-action="export">Export Excel workbook</button>`) +
    `<div class="estimate-head"><div class="project-context"><div class="eyebrow">Active project · Rev ${state.revisions.length}</div><h2>${esc(state.project.name)}</h2><p>${esc(state.project.number)} · ${esc(state.project.client)}</p><div class="context-meta"><div><label>Target country</label><span>${esc(state.project.country)}</span></div><div><label>Target cost year</label><span>${state.project.targetYear}</span></div><div><label>Currency</label><span>${state.project.currency}</span></div></div><div class="editable-context"><div class="form-grid"><div class="field"><label>Project name</label><input class="input" data-field="project-name" value="${esc(state.project.name)}" /></div><div class="field"><label>Target country</label><select class="select" data-field="project-country">${typeOptions(["Kenya", "Uganda", "South Africa", "Tanzania", "Other / review"], state.project.country)}</select></div><div class="field"><label>Target cost year</label><input class="input" type="number" data-field="project-target-year" value="${state.project.targetYear}" /></div><div class="field"><label>Project number</label><input class="input" data-field="project-number" value="${esc(state.project.number)}" /></div></div></div></div><div class="total-card"><div class="metric-label">Current estimate total</div><div class="total-big">${total ? formatMoney(total, 0) : "—"}</div><div class="total-sub">${rows.length} equipment line${rows.length === 1 ? "" : "s"} · ${formatMoney(indirect, 0)} indirect costs</div></div></div>
    <div class="section-title"><h2>Equipment estimate</h2><span class="muted tiny">${rows.length ? "All rows retain source lineage" : "Add a selected source from Equipment search"}</span></div>
    <div class="card">${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Specification</th><th>Qty</th><th>Source price</th><th>Escalation</th><th>Adjusted unit cost</th><th>Total</th><th></th></tr></thead><tbody>${rows.map((row, index) => `<tr><td><div class="td-strong">${index + 1}. ${esc(row.record.attributes.equipmentType)}</div><div class="td-sub">${esc(row.record.description)}</div></td><td><div>${esc(row.record.attributes.voltage || "")}</div><div class="td-sub">${esc(row.record.attributes.rating || row.record.attributes.breakingCurrent || row.record.attributes.conductor || "")}</div></td><td><input class="input cost-input" type="number" min="0" step="1" data-item-qty="${row.id}" value="${row.calc.quantity}" /></td><td><div class="td-strong">${formatMoney(row.calc.historicalBasis, 0)}</div><div class="td-sub">${row.record.year} · ${esc(row.record.reference)}</div></td><td><div class="mono">${row.calc.escalation.factor.toFixed(4)}×</div><div class="td-sub">${esc(row.calc.escalation.label).slice(0, 30)}</div></td><td class="td-strong">${formatMoney(row.calc.targetUnitCost, 0)}</td><td class="td-strong">${formatMoney(row.calc.total, 0)}</td><td><button class="row-action" data-action="remove-item" data-item="${row.id}">Remove</button></td></tr>`).join("")}</tbody><tfoot><tr><td colspan="6" style="text-align:right;font-weight:800">Direct equipment total</td><td style="font-weight:800">${formatMoney(direct, 0)}</td><td></td></tr></tfoot></table></div>` : `<div class="empty-state"><div class="empty-icon">▤</div><h3>Your estimate is empty</h3><p>Search the source register and explicitly select a historical price record to begin.</p><button class="btn btn-mint" data-action="navigate" data-page="search">Search source register</button></div>`}</div>
    <div class="section-title"><h2>Project-level indirect costs</h2><span class="muted tiny">No percentages are pre-populated without a source basis</span></div>
    <div class="estimate-layout"><div class="card card-pad"><div class="panel-head" style="padding:0 0 8px;border:0"><div><h3>Optional additions</h3><p>Enable and enter each value deliberately. Percentage inputs are points, e.g. 5.00 = 5%.</p></div></div>${state.indirectCosts.map((item) => `<div class="cost-row"><div><div class="cost-name"><input type="checkbox" data-indirect-toggle="${item.id}" ${item.enabled ? "checked" : ""} /> ${esc(item.name)}</div><div class="cost-basis">Basis: ${esc(item.basis)} · ${esc(item.rationale)}</div></div><div style="display:flex;align-items:center;gap:6px"><input class="input cost-input" type="number" min="0" step="0.01" data-indirect-value="${item.id}" value="${item.type === "percent" ? (Number(item.applied) * 100).toFixed(2) : Number(item.applied).toFixed(2)}" /><span class="muted tiny">${item.type === "percent" ? "%" : "USD"}</span></div></div>`).join("")}</div><div class="side-stack"><div class="card card-pad"><h3>Reconciliation</h3><div class="summary-line"><span>Direct equipment total</span><strong>${formatMoney(direct, 0)}</strong></div><div class="summary-line"><span>Enabled indirect costs</span><strong>${formatMoney(indirect, 0)}</strong></div><div class="summary-line total"><span>Estimate total</span><strong>${formatMoney(total, 0)}</strong></div></div><div class="card card-pad"><h3>Calculation chain</h3><div class="formula-box"><strong>Selected components</strong><br />→ historical basis<br />→ escalation factor<br />→ location factor<br />→ unit cost × quantity<br />→ direct total + optional indirect costs</div></div></div></div>`;
}

function renderDatabases() {
  return pageHead("Controlled source register", "Databases", "Analyse workbooks before import, preserve immutable source evidence and keep revisions visible.", `<button class="btn btn-primary" data-action="choose-file">Upload database</button>`) +
    notice() +
    `<div class="upload-box"><div class="upload-icon">⇧</div><h3>Analyse a workbook</h3><p>Supported extensions: XLSX, XLSM, XLSB and XLS. Uploaded content remains local in this prototype.<br />Macros and embedded code are never executed.</p><button class="btn btn-mint" data-action="choose-file">Choose workbook</button>${state.importReport ? `<div class="analysis-steps"><div class="analysis-step"><div class="num">01</div><div>${esc(state.importReport.fileName)}</div><span class="tiny muted">${formatNumber(state.importReport.size / 1024, 1)} KB · ${esc(state.importReport.extension)}</span></div><div class="analysis-step"><div class="num">02</div><div>Checksum</div><span class="tiny mono muted">${esc(state.importReport.hash.slice(0, 18))}…</span></div><div class="analysis-step"><div class="num">03</div><div>Workbook analysis</div><span class="tiny muted">${esc(state.importReport.analysis)}</span></div><div class="analysis-step"><div class="num">04</div><div>Commit status</div><span class="tiny muted">${esc(state.importReport.status)}</span></div></div>` : ""}</div>
    <div class="card"><div class="panel-head"><div><h2>Source database inventory</h2><p>Visibility and revision boundaries are part of the source model.</p></div><span class="tag">${state.databases.length} registered</span></div><div>${state.databases.map((db) => `<div class="database-row"><div><div class="file-name">${esc(db.name)}</div><div class="file-sub">${esc(db.source)} · ${esc(db.hash)}</div></div><div><div class="tiny muted">Revision</div><div class="mono tiny">${esc(db.revision)}</div></div><div><div class="tiny muted">Records</div><div class="td-strong">${db.records}</div></div><div><div class="tiny muted">Price sources</div><div class="td-strong">${db.sources}</div></div><div><span class="status ${db.status}">${db.status === "training" ? "Training" : "Active"}</span><div class="file-sub">${esc(db.visibility)}</div></div><div><button class="row-action" data-action="database-detail" data-id="${db.id}">Details</button></div></div>`).join("")}</div></div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card card-pad"><h3>Deterministic analysis pipeline</h3><div class="check-list"><div class="check-line"><span class="tag mint">01</span><span>Hash file and inspect workbook metadata.</span></div><div class="check-line"><span class="tag mint">02</span><span>Detect meaningful used ranges, headers and tables.</span></div><div class="check-line"><span class="tag mint">03</span><span>Propose mappings using engineering terms and value profiles.</span></div><div class="check-line"><span class="tag mint">04</span><span>Require human mapping review before commit.</span></div></div></div><div class="card card-pad"><h3>Import guardrails</h3><p class="muted tiny">XLSM macros, XLSB embedded code and formulas are treated as untrusted source evidence. The importer reads values/formulas through format-specific adapters; it does not execute workbook code.</p><div class="citation">Real supplied workbooks were named in the brief but are not available in this workspace. Real-file regression tests are therefore pending upload.</div></div></div>`;
}

function renderExisting() {
  const assets = [
    ["Transmission", "132 kV line bay — illustrative asset", "2012", "30 years", "Medium", 68],
    ["Generation", "Francis turbine unit — illustrative asset", "2008", "40 years", "Good", 79],
    ["Substation", "132/33 kV power transformer — illustrative asset", "2015", "35 years", "Good", 84],
  ];
  return pageHead("Valuation mode", "Existing asset valuation", "A separate view for replacement-cost and depreciated replacement-cost work. Source workbook methods remain versioned and explicit.", `<button class="btn" data-action="navigate" data-page="databases">Review source data</button>`) +
    notice("No source FAR has been imported in this workspace. The cards below are UI-only placeholders and cannot be used as valuation evidence.", "Valuation evidence status") +
    `<div class="grid grid-3">${assets.map(([kind, title, year, life, condition, progress]) => `<div class="card asset-card"><div class="asset-class">${kind} · placeholder</div><div class="asset-title">${title}</div><div class="asset-data"><div><label>Commissioning</label><span>${year}</span></div><div><label>Useful life</label><span>${life}</span></div><div><label>Condition</label><span>${condition}</span></div><div><label>Method</label><span>Not selected</span></div></div><div class="progress"><span style="width:${progress}%"></span></div><div class="file-sub" style="margin-top:8px">Residual-life inputs require validated FAR formulas.</div></div>`).join("")}</div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card card-pad"><h2>Methodology gate</h2><p class="muted">Do not apply generic straight-line depreciation until the source workbook method has been reverse-engineered and independently reproduced.</p><div class="check-list"><div class="check-line"><span class="tag amber">Pending</span><span>Useful-life lookup and valuation-year assumptions.</span></div><div class="check-line"><span class="tag amber">Pending</span><span>Life extension, condition weighting and residual-life floor.</span></div><div class="check-line"><span class="tag amber">Pending</span><span>Scrap handling, replacement value and DCRV arithmetic.</span></div></div></div><div class="card card-pad"><h2>Professional framing</h2><p class="muted">The cost approach reflects the economic principle that a buyer will pay no more than the cost to obtain an asset of equal utility, subject to relevant risk and other factors.</p><div class="citation">Reference: <a href="https://ivsc.org/standards-glossary/" target="_blank" rel="noreferrer">IVSC Standards Glossary</a>. This is a product design reference, not a claim of compliance.</div></div></div>`;
}

function renderBasis() {
  const { rows, direct, indirect, total } = totals();
  return pageHead("Governance & handoff", "Basis of estimate & export", "The handoff view packages assumptions, lineage, escalation and limitations alongside the estimate workbook.", `<button class="btn btn-primary" data-action="export">Download Excel workbook</button>`) +
    notice("Exported workbooks contain the calculations and source register available in this local workspace. They are not a substitute for professional review.", "Export scope", "success-note") +
    `<div class="grid grid-2"><div class="card card-pad"><div class="eyebrow">01 · Estimate basis</div><h2>${esc(state.project.name)}</h2><div class="detail-list" style="margin-top:16px"><div class="detail-item"><label>Project</label><div>${esc(state.project.number)}</div></div><div class="detail-item"><label>Target country</label><div>${esc(state.project.country)}</div></div><div class="detail-item"><label>Target year</label><div>${state.project.targetYear}</div></div><div class="detail-item"><label>Currency</label><div>${state.project.currency}</div></div><div class="detail-item"><label>Databases used</label><div>${state.databases.map((d) => esc(d.name)).join(", ")}</div></div><div class="detail-item"><label>Estimate classification</label><div>Not assigned — project definition maturity required</div></div></div><div class="citation">AACE classification guidance links estimate class to maturity of project definition and other characteristics. This prototype intentionally does not assign a class from database presence alone. <a href="https://web.aacei.org/docs/default-source/toc/toc_17r-97.pdf" target="_blank" rel="noreferrer">AACE 17R-97</a></div></div><div class="card card-pad"><div class="eyebrow">02 · Workbook contents</div><h2>Traceability package</h2><div class="check-list" style="margin-top:16px"><div class="check-line"><span class="tag mint">Sheet</span><span>01_Estimate_Summary — ${formatMoney(total, 0)} total</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>02_Equipment_Estimate — ${rows.length} selected line${rows.length === 1 ? "" : "s"}</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>03_Cost_Breakdown — component arithmetic</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>04_Inflation_Escalation — source/target and factor</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>05_Country_Adjustments — recommendation and applied factor</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>06_Source_Register — file, sheet, row, reference</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>07_Assumptions — overrides and unresolved warnings</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>08_Alternative_Matches — reviewed similar records</span></div><div class="check-line"><span class="tag mint">Sheet</span><span>09_Basis_of_Estimate — methodology and limitations</span></div></div></div></div>
    <div class="card card-pad" style="margin-top:16px"><div class="panel-head" style="padding:0 0 12px;border:0"><div><h2>Known limitations</h2><p>Visible until the production adapters and review gates are completed.</p></div></div><div class="grid grid-3"><div><div class="tag amber">Source files</div><p class="tiny muted" style="margin-top:8px">The two named XLSM/XLSB workbooks were not available for this build, so real-file import regression is pending.</p></div><div><div class="tag amber">Indices</div><p class="tiny muted" style="margin-top:8px">The catalogue entries in this demo are illustrative. Configure approved series and persist retrieved observations before commercial use.</p></div><div><div class="tag amber">Location factors</div><p class="tiny muted" style="margin-top:8px">No defensible automatic country recommendation is applied. User overrides are explicit and visible.</p></div></div></div>`;
}

function renderSettings() {
  return pageHead("Workspace controls", "Settings", "Configuration boundaries for a safe engineering calculation workspace.", "") +
    `<div class="grid grid-2"><div class="card card-pad"><div class="eyebrow">Calculation policy</div><h2>Guardrails</h2><div class="check-list" style="margin-top:16px"><div class="check-line"><input type="checkbox" checked disabled /><span>Deterministic domain calculations only.</span></div><div class="check-line"><input type="checkbox" checked disabled /><span>Similar records cannot silently become exact.</span></div><div class="check-line"><input type="checkbox" checked disabled /><span>Location factor defaults to 1.0000 with no recommendation.</span></div><div class="check-line"><input type="checkbox" checked disabled /><span>Imported source files are immutable evidence.</span></div><div class="check-line"><input type="checkbox" checked disabled /><span>Macros and embedded workbook code are not executed.</span></div></div></div><div class="card card-pad"><div class="eyebrow">Planned integrations</div><h2>Not configured</h2><p class="muted">Authentication, persistent storage, approved index providers and production XLSB parsing belong behind adapters. The local demo does not transmit workbook contents to an external AI service.</p><div class="citation">Entra ID / corporate SSO is intentionally an interface boundary until Multiconsult requirements are confirmed.</div></div></div>`;
}

function renderModal() {
  if (state.modal.type === "source") {
    const r = DEMO_RECORDS.find((record) => record.id === state.modal.id);
    if (!r) return "";
    return `<div class="modal-backdrop" data-action="close-modal"><aside class="modal" data-modal-content><div class="modal-head"><div><div class="eyebrow">Source detail</div><h2>${esc(r.description)}</h2><p>${esc(r.reference)} · ${esc(r.sourceProject)}</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body"><div class="notice">${esc(DEMO_DATA_NOTICE)}</div><div class="modal-section"><h3>Source lineage</h3>${[["Database", r.database], ["Revision", r.revision], ["Original workbook", r.workbook], ["Worksheet", r.sheet], ["Source row", r.row], ["Reference", r.reference], ["Source project", r.sourceProject], ["Country", r.country], ["Price year", r.year], ["Currency", "USD"], ["Pricing basis", "Illustrative source record; confirm"]].map(([label, value]) => `<div class="source-cell"><label>${esc(label)}</label><span>${esc(value)}</span></div>`).join("")}</div><div class="modal-section"><h3>Technical attributes</h3>${Object.entries(r.attributes).map(([key, value]) => `<div class="source-cell"><label>${esc(key.replace(/([A-Z])/g, " $1"))}</label><span>${esc(value)}</span></div>`).join("")}</div><div class="modal-section"><h3>Quality assessment</h3><div><span class="quality ${qualityClass(r.quality)}">${esc(r.quality)}</span><p class="tiny muted" style="margin-top:9px">${esc(r.qualityReason)}</p></div></div><div class="modal-section"><h3>Historical source components</h3>${r.components.map((c) => `<div class="source-cell"><label>${esc(c.name)} <span class="component-type">· ${esc(c.componentType.replaceAll("_", " "))}</span></label><span>${componentDisplay(c)}</span></div>`).join("")}</div><button class="btn btn-primary" data-action="open-builder" data-id="${r.id}">Open price builder</button></div></aside></div>`;
  }
  return "";
}

function render() {
  let content = "";
  if (state.page === "dashboard") content = renderDashboard();
  else if (state.page === "search") content = renderSearch();
  else if (state.page === "builder") content = renderBuilder();
  else if (state.page === "estimate") content = renderEstimate();
  else if (state.page === "databases") content = renderDatabases();
  else if (state.page === "existing") content = renderExisting();
  else if (state.page === "basis") content = renderBasis();
  else content = renderSettings();
  app.innerHTML = layout(content);
}

function updateBuilder(next) {
  if (!state.builder) return;
  state.builder.settings = { ...state.builder.settings, ...next };
  render();
}

function showToast(message) {
  state.toast = message;
  render();
  setTimeout(() => { if (state.toast === message) { state.toast = ""; render(); } }, 2600);
}

function openBuilder(id) {
  const record = DEMO_RECORDS.find((r) => r.id === id);
  if (!record) return;
  const existing = state.items.find((item) => item.record.id === id);
  state.builder = { recordId: id, settings: existing ? { ...existing.settings, targetYear: state.project.targetYear } : { targetYear: state.project.targetYear, method: "source", indexId: INDEX_CATALOGUE[0].id, annualRate: 0.04, locationFactor: 1, quantity: 1, components: {} } };
  state.modal = null;
  state.page = "builder";
  render();
}

function addEstimate() {
  if (!state.builder) return;
  const record = DEMO_RECORDS.find((r) => r.id === state.builder.recordId);
  if (!record) return;
  const settings = structuredClone(state.builder.settings);
  settings.targetYear = Number(settings.targetYear) || state.project.targetYear;
  settings.quantity = Math.max(0, Number(settings.quantity) || 0);
  const id = `item-${record.id}`;
  const existing = state.items.find((item) => item.id === id);
  if (existing) existing.settings = settings;
  else state.items.push({ id, record, settings });
  state.page = "estimate";
  state.builder = null;
  showToast(existing ? "Estimate line updated" : "Source selected and added to estimate");
}

function handleInput(event) {
  const field = event.target.dataset.field;
  const indirectValue = event.target.dataset.indirectValue;
  if (indirectValue) {
    const item = state.indirectCosts.find((i) => i.id === indirectValue);
    if (item) item.applied = item.type === "percent" ? (Number(event.target.value) || 0) / 100 : Number(event.target.value) || 0;
    return;
  }
  if (!field) return;
  if (field === "search-query") {
    state.filters[field] = event.target.value;
    return;
  }
  if (["equipmentType", "voltage", "rating", "manufacturer", "country"].includes(field)) { state.filters[field] = event.target.value; render(); return; }
  if (field === "builder-target-year") updateBuilder({ targetYear: Number(event.target.value) || state.project.targetYear });
  else if (field === "builder-quantity") updateBuilder({ quantity: Math.max(0, Number(event.target.value) || 0) });
  else if (field === "builder-location") updateBuilder({ locationFactor: Math.max(0, Number(event.target.value) || 0) });
  else if (field === "builder-annual") updateBuilder({ annualRate: Math.max(0, Number(event.target.value) || 0) });
  else if (field === "builder-index") updateBuilder({ indexId: event.target.value });
  else if (field === "project-name") state.project.name = event.target.value;
  else if (field === "project-number") state.project.number = event.target.value;
  else if (field === "project-country") { state.project.country = event.target.value; render(); }
  else if (field === "project-target-year") { state.project.targetYear = Number(event.target.value) || 2030; render(); }
}

function handleChange(event) {
  const field = event.target.dataset.field;
  if (field === "builder-method") updateBuilder({ method: event.target.value });
  const componentId = event.target.dataset.component;
  if (componentId) { updateBuilder({ components: { ...builderSettings().components, [componentId]: event.target.checked } }); }
  const itemQty = event.target.dataset.itemQty;
  if (itemQty) { const item = state.items.find((i) => i.id === itemQty); if (item) item.settings.quantity = Math.max(0, Number(event.target.value) || 0); render(); }
  const indirectToggle = event.target.dataset.indirectToggle;
  if (indirectToggle) { const item = state.indirectCosts.find((i) => i.id === indirectToggle); if (item) item.enabled = event.target.checked; render(); }
  const indirectValue = event.target.dataset.indirectValue;
  if (indirectValue) { const item = state.indirectCosts.find((i) => i.id === indirectValue); if (item) item.applied = item.type === "percent" ? (Number(event.target.value) || 0) / 100 : Number(event.target.value) || 0; render(); }
}

async function hashFile(file) {
  try {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch { return "Hash unavailable in this browser"; }
}

async function handleFile(file) {
  if (!file) return;
  const extension = `.${file.name.split(".").pop().toLowerCase()}`;
  const hash = await hashFile(file);
  const isBinaryWorkbook = [".xlsx", ".xlsm", ".xlsb", ".xls"].includes(extension);
  state.importReport = {
    fileName: file.name.replace(/[\\/:*?"<>|]/g, "_"),
    size: file.size,
    extension,
    hash,
    analysis: isBinaryWorkbook ? extension === ".xlsb" ? "Backend adapter required" : "Queued for deterministic adapter" : "Unsupported extension",
    status: isBinaryWorkbook ? "Not committed — mapping review required" : "Rejected",
  };
  render();
  showToast(isBinaryWorkbook ? "Workbook analysed locally; no source rows were committed" : "Unsupported file type");
}

function xmlEscape(value) { return esc(value).replace(/&#039;/g, "&apos;"); }
function colLetter(index) { let n = index + 1; let out = ""; while (n) { const rem = (n - 1) % 26; out = String.fromCharCode(65 + rem) + out; n = Math.floor((n - 1) / 26); } return out; }
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function u16(value) { return [value & 255, (value >>> 8) & 255]; }
function u32(value) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }
function zipStore(files) {
  const encoder = new TextEncoder(); const chunks = []; const central = []; let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name); const data = encoder.encode(file.content); const crc = crc32(data);
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name, ...data]); chunks.push(local);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name]));
    offset += local.length;
  }
  const centralBytes = new Uint8Array(central.reduce((n, b) => n + b.length, 0)); let cursor = 0; for (const b of central) { centralBytes.set(b, cursor); cursor += b.length; }
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(centralBytes.length), ...u32(offset), ...u16(0)]);
  return new Blob([...chunks, centralBytes, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
function xlsxCell(value, style = 0, formula = "") {
  if (value === null || value === undefined || value === "") return `<c s="${style}"/>`;
  if (typeof value === "number" && Number.isFinite(value)) return `<c s="${style}"${formula ? `><f>${xmlEscape(formula)}</f><v>${value}</v></c>` : ` t="n"><v>${value}</v></c>`}`;
  return `<c s="${style}" t="inlineStr"><is><t>${xmlEscape(String(value))}</t></is></c>`;
}
function worksheetXml(rows) { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, ri) => `<row r="${ri + 1}">${row.map((cell, ci) => xlsxCell(cell.value, cell.style || 0, cell.formula).replace("<c ", `<c r="${colLetter(ci)}${ri + 1}" `)).join("")}</row>`).join("")}</sheetData></worksheet>`; }

function downloadWorkbook() {
  const { rows, direct, indirect, total } = totals();
  const summaryRows = [[{ value: "Asset Valuation Automation", style: 1 }], [{ value: "01_Estimate_Summary", style: 2 }], [{ value: "Project" }, { value: state.project.name }], [{ value: "Project number" }, { value: state.project.number }], [{ value: "Target country" }, { value: state.project.country }], [{ value: "Target cost year" }, { value: state.project.targetYear }], [{ value: "Currency" }, { value: state.project.currency }], [{ value: "Direct equipment total" }, { value: direct, style: 4 }], [{ value: "Indirect costs" }, { value: indirect, style: 4 }], [{ value: "Estimate total" }, { value: total, style: 5 }], [{ value: "Source data status" }, { value: DEMO_DATA_NOTICE }]];
  const equipmentRows = [["Item", "Category", "Description", "Specification", "Qty", "Source price", "Source year", "Target year", "Escalation", "Location factor", "Adjusted unit cost", "Total", "Source reference"] .map((value) => ({ value, style: 2 })), ...rows.map((row, index) => [{ value: index + 1 }, { value: row.record.attributes.equipmentType }, { value: row.record.description }, { value: Object.entries(row.record.attributes).map(([k, v]) => `${k}: ${v}`).join("; ") }, { value: row.calc.quantity }, { value: row.calc.historicalBasis, style: 4 }, { value: row.record.year }, { value: row.settings.targetYear }, { value: row.calc.escalation.factor }, { value: row.calc.locationFactor }, { value: row.calc.targetUnitCost, style: 4 }, { value: row.calc.total, style: 4 }, { value: row.record.reference }])];
  const breakdownRows = [["Item", "Component", "Type", "Raw value", "Included", "Applied amount", "Calculation base", "Source formula / note"].map((value) => ({ value, style: 2 }))];
  rows.forEach((row, index) => row.calc.amounts.forEach((c) => breakdownRows.push([{ value: index + 1 }, { value: c.name }, { value: c.componentType }, { value: c.rawValue }, { value: c.amount > 0 || c.included ? "Yes" : "No" }, { value: c.amount, style: 4 }, { value: c.calculationBase }, { value: c.note || "" }])));
  const inflationRows = [["Item", "Source year", "Target year", "Method", "Factor", "Basis", "Index provider", "Series"].map((value) => ({ value, style: 2 })), ...rows.map((row, index) => [{ value: index + 1 }, { value: row.record.year }, { value: row.settings.targetYear }, { value: row.calc.escalation.label }, { value: row.calc.escalation.factor }, { value: row.calc.escalation.basis }, { value: row.calc.escalation.index?.provider || "—" }, { value: row.calc.escalation.index?.series || "—" }])];
  const locationRows = [["Item", "Source country", "Target country", "Recommended factor", "Applied factor", "Source", "Rationale", "Override"].map((value) => ({ value, style: 2 })), ...rows.map((row, index) => [{ value: index + 1 }, { value: row.record.country }, { value: state.project.country }, { value: "Unavailable" }, { value: row.calc.locationFactor }, { value: "No configured source" }, { value: LOCATION_FACTOR_POLICY.rationale }, { value: row.calc.locationFactor !== 1 ? "Yes" : "No" }])];
  const sourceRows = [["Item", "Database", "Revision", "Workbook", "Worksheet", "Row", "Reference", "Source project", "Country", "Year", "Quality", "Quality rationale"].map((value) => ({ value, style: 2 })), ...rows.map((row, index) => [{ value: index + 1 }, { value: row.record.database }, { value: row.record.revision }, { value: row.record.workbook }, { value: row.record.sheet }, { value: row.record.row }, { value: row.record.reference }, { value: row.record.sourceProject }, { value: row.record.country }, { value: row.record.year }, { value: row.record.quality }, { value: row.record.qualityReason }])];
  const assumptionsRows = [["Assumption / override", "Applied value", "Basis", "Status"].map((value) => ({ value, style: 2 })), [{ value: "Location factor recommendation" }, { value: "Unavailable" }, { value: LOCATION_FACTOR_POLICY.rationale }, { value: "Review required" }], ...state.indirectCosts.map((i) => [{ value: i.name }, { value: i.enabled ? i.applied : "Disabled" }, { value: i.basis }, { value: i.enabled ? "Applied by user" : "Not applied" }])];
  const alternativesRows = [["Item", "Description", "Match", "Source year", "Quality", "Reason not selected"].map((value) => ({ value, style: 2 })), ...DEMO_RECORDS.filter((r) => !rows.some((row) => row.record.id === r.id)).map((r) => [{ value: "Available alternative" }, { value: r.description }, { value: "Similar / unselected" }, { value: r.year }, { value: r.quality }, { value: "Not selected by engineer" }])];
  const basisRows = [[{ value: "Basis of Estimate", style: 1 }], [{ value: "Methodology", style: 2 }, { value: "Selected historical components → escalation → location factor → quantity" }], [{ value: "Classification", style: 2 }, { value: "Not assigned; requires project definition maturity review" }], [{ value: "Limitations", style: 2 }, { value: DEMO_DATA_NOTICE }], [{ value: "Export date", style: 2 }, { value: dateLabel() }], [{ value: "Professional review", style: 2 }, { value: "Required before commercial use" }]];
  const sheets = [summaryRows, equipmentRows, breakdownRows, inflationRows, locationRows, sourceRows, assumptionsRows, alternativesRows, basisRows];
  const names = ["01_Estimate_Summary", "02_Equipment_Estimate", "03_Cost_Breakdown", "04_Inflation_Escalation", "05_Country_Adjustments", "06_Source_Register", "07_Assumptions", "08_Alternative_Matches", "09_Basis_of_Estimate"];
  const sheetFiles = sheets.map((rowsForSheet, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: worksheetXml(rowsForSheet) }));
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name, i) => `<sheet name="${xmlEscape(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0.00"/></numFmts><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0D1B2F"/></patternFill></fill></fills><borders count="1"><border/></borders><cellXfs count="6"><xf/><xf fontId="1" fillId="2"/><xf fontId="1" fillId="2"/><xf numFmtId="0"/><xf numFmtId="165"/><xf fontId="1" fillId="2" numFmtId="165"/></cellXfs></styleSheet>`;
  const files = [{ name: "[Content_Types].xml", content: contentTypes }, { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` }, { name: "xl/workbook.xml", content: workbook }, { name: "xl/_rels/workbook.xml.rels", content: rels }, { name: "xl/styles.xml", content: styles }, ...sheetFiles];
  const blob = zipStore(files); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${state.project.number || "asset-valuation"}_estimate.xlsx`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  showToast("Excel workbook downloaded with traceability sheets");
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === "navigate") { state.page = actionTarget.dataset.page; state.modal = null; render(); }
  else if (action === "open-builder") openBuilder(actionTarget.dataset.id);
  else if (action === "view-source") { state.modal = { type: "source", id: actionTarget.dataset.id }; render(); }
  else if (action === "close-modal" && !event.target.closest("[data-modal-content]") || action === "close-modal" && event.target.closest(".modal-close")) { state.modal = null; render(); }
  else if (action === "add-estimate") addEstimate();
  else if (action === "remove-item") { state.items = state.items.filter((item) => item.id !== actionTarget.dataset.item); showToast("Estimate line removed"); }
  else if (action === "clear-filters") { state.filters = { query: "", equipmentType: "All equipment", voltage: "Any voltage", rating: "Any rating", manufacturer: "Any manufacturer", country: "Any country" }; render(); }
  else if (action === "apply-search") { const queryInput = document.querySelector('input[data-field="search-query"]'); if (queryInput) state.filters.query = queryInput.value; render(); }
  else if (action === "choose-file") document.querySelector("#file-input")?.click();
  else if (action === "export") downloadWorkbook();
  else if (action === "new-revision") { const snapshot = makeSnapshot(state.project, currentItemRows().map((i) => ({ ...i, total: i.calc.total })), state.indirectCosts); state.revisions.push(snapshot); showToast(`Revision ${state.revisions.length - 1} snapshot created`); }
  else if (action === "database-detail") showToast("Database detail is read-only in this local prototype");
});
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", (event) => { if (event.key === "Enter" && event.target.matches('input[data-field="search-query"]')) { state.filters.query = event.target.value; render(); } });
document.querySelector("#file-input").addEventListener("change", (event) => handleFile(event.target.files[0]));

render();
