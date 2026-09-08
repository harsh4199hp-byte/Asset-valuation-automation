import { FixedDecimal } from "./money.mjs";

/** Pure matching and calculation helpers. Demo fixtures are opt-in only. */

export const DEMO_DATA_NOTICE =
  "Training fixture — not an approved production database. No supplied workbook is present in this workspace.";

export const INDEX_CATALOGUE = [
  {
    id: "demo-electrical",
    name: "Electrical equipment cost index (illustrative)",
    provider: "Demo catalogue",
    series: "ELEC-EQUIP-BASE-2020",
    rationale: "A component-matched index is preferable to generic CPI for electrical equipment. This catalogue entry is illustrative until an approved statistical series is configured.",
    observations: { 2020: 100, 2021: 103.4, 2022: 108.6, 2023: 112.9, 2024: 116.7, 2025: 119.8, 2026: 122.4, 2027: 125.1, 2028: 128.0, 2029: 130.8, 2030: 133.7 },
    sourceUrl: "https://www.bls.gov/ppi/",
  },
  {
    id: "demo-construction",
    name: "Construction input index (illustrative)",
    provider: "Demo catalogue",
    series: "CONSTRUCTION-INPUT-BASE-2020",
    rationale: "Useful as a cross-check for installation-heavy or civil components, but not a substitute for a confirmed equipment series.",
    observations: { 2020: 100, 2021: 104.2, 2022: 111.7, 2023: 116.1, 2024: 119.4, 2025: 122.0, 2026: 124.8, 2027: 127.5, 2028: 130.2, 2029: 133.0, 2030: 135.9 },
    sourceUrl: "https://www.bls.gov/ppi/",
  },
];

export const DEMO_INDEX_CATALOGUE = INDEX_CATALOGUE;

export const LOCATION_FACTOR_POLICY = {
  recommended: null,
  appliedDefault: 1,
  status: "No defensible automatic recommendation available",
  rationale: "A location factor must be sourced, dated and approved for the project context. The demo does not fabricate one.",
};

const component = (id, name, type, value, base, included = true, note = "") => ({
  id,
  name,
  componentType: type,
  rawValue: value,
  calculationBase: base,
  includedByDefault: included,
  included,
  note,
});

const source = (id, name, sheet, row, reference, project, year, country, quality, qualityReason, factor, components, attributes, description) => ({
  id,
  database: "Demo fixture / review required",
  revision: "DEMO-0",
  workbook: "illustrative-demo-fixture.json",
  sheet,
  row,
  reference,
  page: "Not available",
  sourceProject: project,
  supplier: "Not stated in fixture",
  year,
  country,
  currency: "USD",
  unit: "per unit",
  quality,
  qualityReason,
  sourceFactor: factor,
  components,
  attributes,
  description,
});

// These are intentionally illustrative records so the UI can be exercised
// without pretending that an unavailable supplied workbook was imported.
export const DEMO_RECORDS = [
  source(
    "demo-tx-60-2022",
    "132/33 kV · 60 MVA power transformer",
    "Price List (illustrative)",
    418,
    "DEMO-TX-2022-0418",
    "Eastern Interconnector — training fixture",
    2022,
    "Kenya",
    "Medium",
    "Illustrative record with complete component arithmetic, but no approved source workbook is attached.",
    1.18,
    [
      component("equipment", "Equipment / procurement", "absolute_usd", 330000, "equipment", true, "Fixed amount from the illustrative source record."),
      component("engineering", "Engineering", "percentage", 0.06, "equipment", true, "6.00% of equipment / procurement cost."),
      component("transport", "Local transport", "absolute_usd", 12000, "equipment", true),
      component("erection", "Erection & commissioning", "absolute_usd", 34000, "equipment", true),
      component("testing", "Testing", "absolute_usd", 8000, "equipment", true),
      component("owner", "Owner's cost", "percentage", 0.05, "subtotal_before_owner", true, "5.00% of subtotal before owner's cost."),
      component("duty", "Duty", "unknown", 0, "unknown", false, "Semantics not established; excluded by default."),
    ],
    { equipmentType: "Power Transformer", voltage: "132/33 kV", rating: "60 MVA", manufacturer: "ABB", phase: "3-phase", cooling: "ONAN/ONAF", frequency: "50 Hz" },
    "Power transformer, 132/33 kV, 60 MVA, 3-phase, ONAN/ONAF",
  ),
  source(
    "demo-tx-75-2021",
    "132/33 kV · 75 MVA power transformer",
    "Price List (illustrative)",
    466,
    "DEMO-TX-2021-0466",
    "Northern Grid Reinforcement — training fixture",
    2021,
    "Uganda",
    "Medium",
    "Technically similar rating; source country differs from the project target.",
    1.25,
    [
      component("equipment", "Equipment / procurement", "absolute_usd", 388000, "equipment", true),
      component("engineering", "Engineering", "percentage", 0.06, "equipment", true),
      component("transport", "Local transport", "absolute_usd", 14000, "equipment", true),
      component("erection", "Erection & commissioning", "absolute_usd", 39000, "equipment", true),
      component("testing", "Testing", "absolute_usd", 9000, "equipment", true),
      component("owner", "Owner's cost", "percentage", 0.05, "subtotal_before_owner", true),
    ],
    { equipmentType: "Power Transformer", voltage: "132/33 kV", rating: "75 MVA", manufacturer: "Siemens Energy", phase: "3-phase", cooling: "ONAN/ONAF", frequency: "50 Hz" },
    "Power transformer, 132/33 kV, 75 MVA, 3-phase, ONAN/ONAF",
  ),
  source(
    "demo-tx-60-2018",
    "132/33 kV · 60 MVA power transformer",
    "Price List (illustrative)",
    311,
    "DEMO-TX-2018-0311",
    "Lake Region Substation — training fixture",
    2018,
    "Kenya",
    "Low",
    "Older illustrative record. Pricing basis and supplier reference are incomplete.",
    1.42,
    [
      component("equipment", "Equipment / procurement", "absolute_usd", 265000, "equipment", true),
      component("engineering", "Engineering", "percentage", 0.05, "equipment", true),
      component("transport", "Local transport", "absolute_usd", 9500, "equipment", true),
      component("erection", "Erection & commissioning", "absolute_usd", 27000, "equipment", true),
      component("owner", "Owner's cost", "percentage", 0.04, "subtotal_before_owner", true),
    ],
    { equipmentType: "Power Transformer", voltage: "132/33 kV", rating: "60 MVA", manufacturer: "Not stated", phase: "3-phase", cooling: "Not stated", frequency: "50 Hz" },
    "Power transformer, 132/33 kV, 60 MVA",
  ),
  source(
    "demo-cb-40-2023",
    "132 kV · 40 kA circuit breaker",
    "Price List (illustrative)",
    227,
    "DEMO-CB-2023-0227",
    "Western Switchyard — training fixture",
    2023,
    "Kenya",
    "High",
    "Complete technical fields and recent illustrative procurement record; still requires source approval.",
    1.10,
    [
      component("equipment", "Equipment / procurement", "absolute_usd", 132000, "equipment", true),
      component("engineering", "Engineering", "percentage", 0.04, "equipment", true),
      component("transport", "Local transport", "absolute_usd", 6500, "equipment", true),
      component("erection", "Erection & commissioning", "absolute_usd", 12000, "equipment", true),
      component("testing", "Testing", "absolute_usd", 4000, "equipment", true),
    ],
    { equipmentType: "Circuit Breaker", voltage: "132 kV", breakingCurrent: "40 kA", manufacturer: "Hitachi Energy", technology: "SF6", mechanism: "Spring" },
    "Circuit breaker, 132 kV, 40 kA, SF6",
  ),
  source(
    "demo-gen-50-2020",
    "50 MW hydro generator",
    "Price List (illustrative)",
    173,
    "DEMO-GEN-2020-0173",
    "Upper River HPP — training fixture",
    2020,
    "Kenya",
    "Medium",
    "Actual-price shape is represented for workflow testing; source workbook is unavailable.",
    1.31,
    [
      component("equipment", "Generator package", "absolute_usd", 1900000, "equipment", true),
      component("engineering", "Engineering", "percentage", 0.08, "equipment", true),
      component("transport", "Transport & logistics", "absolute_usd", 70000, "equipment", true),
      component("erection", "Erection", "absolute_usd", 240000, "equipment", true),
      component("testing", "Testing & commissioning", "absolute_usd", 85000, "equipment", true),
      component("owner", "Owner's cost", "percentage", 0.05, "subtotal_before_owner", true),
    ],
    { equipmentType: "Generator", voltage: "13.8 kV", rating: "50 MW", manufacturer: "Voith Hydro", technology: "Synchronous", frequency: "50 Hz" },
    "Hydro generator package, 50 MW, 13.8 kV",
  ),
  source(
    "demo-cable-630-2024",
    "132 kV XLPE cable · 630 mm²",
    "Price List (illustrative)",
    268,
    "DEMO-CAB-2024-0268",
    "Urban Connection — training fixture",
    2024,
    "South Africa",
    "Medium",
    "Recent illustrative source with a different source country; installation basis requires review.",
    1.06,
    [
      component("equipment", "Cable supply", "absolute_usd", 112, "equipment", true, "Unit is USD/m."),
      component("transport", "Transport & logistics", "absolute_usd", 4.5, "equipment", true, "Unit is USD/m."),
      component("erection", "Installation", "absolute_usd", 18, "equipment", true, "Unit is USD/m."),
      component("testing", "Testing & commissioning", "absolute_usd", 2.5, "equipment", true, "Unit is USD/m."),
    ],
    { equipmentType: "Cable", voltage: "132 kV", conductor: "630 mm²", insulation: "XLPE", lengthUnit: "m", installation: "Trench" },
    "132 kV XLPE cable, 630 mm², installed",
  ),
];

export function componentAmount(item, componentRecord, includedOverride = componentRecord.included) {
  if (!includedOverride || componentRecord.componentType === "unknown") return 0;
  if (["absolute_usd", "absolute_money", "absolute", "per_unit_money"].includes(componentRecord.componentType)) return FixedDecimal.from(componentRecord.rawValue).toNumber();
  if (componentRecord.componentType === "percentage") {
    const base = FixedDecimal.from(item._bases?.[componentRecord.calculationBase] ?? 0);
    return base.mul(componentRecord.rawValue).toNumber();
  }
  if (["multiplier", "cumulative_factor"].includes(componentRecord.componentType)) {
    const base = FixedDecimal.from(item._bases?.[componentRecord.calculationBase] ?? 0);
    return base.mul(componentRecord.rawValue).toNumber();
  }
  return 0;
}

export function calculateHistoricalBasis(record, componentState = {}) {
  const included = record.components.map((c) => ({ ...c, included: componentState[c.id] ?? c.includedByDefault }));
  const bases = { equipment: FixedDecimal.from(0), subtotal_before_owner: FixedDecimal.from(0) };
  const fixed = included.find((c) => c.id === "equipment");
  bases.equipment = fixed && fixed.included ? FixedDecimal.from(fixed.rawValue) : FixedDecimal.from(0);
  let beforeOwner = FixedDecimal.from(0);
  const amounts = [];
  for (const c of included) {
    if (c.id === "owner") continue;
    const amount = componentAmount({ _bases: bases }, c, c.included);
    amounts.push({ ...c, amount });
    beforeOwner = beforeOwner.add(amount);
  }
  bases.subtotal_before_owner = beforeOwner;
  const owner = included.find((c) => c.id === "owner");
  if (owner) amounts.push({ ...owner, amount: componentAmount({ _bases: bases }, owner, owner.included) });
  const historicalBasis = amounts.reduce((sum, c) => sum.add(c.amount), FixedDecimal.from(0));
  return { amounts, historicalBasis: historicalBasis.toNumber(), bases: { equipment: bases.equipment.toNumber(), subtotal_before_owner: bases.subtotal_before_owner.toNumber() } };
}

function observationFor(index, year) {
  const value = index.observations[year];
  if (value !== undefined) return value;
  const years = Object.keys(index.observations).map(Number).sort((a, b) => a - b);
  if (year <= years[0]) return index.observations[years[0]];
  if (year >= years[years.length - 1]) return index.observations[years[years.length - 1]];
  const lower = years.filter((y) => y < year).at(-1);
  const upper = years.find((y) => y > year);
  const portion = (year - lower) / (upper - lower);
  return index.observations[lower] + (index.observations[upper] - index.observations[lower]) * portion;
}

export function escalationFor(record, settings) {
  const sourceYear = Number(record.year);
  const targetYear = Number(settings.targetYear);
  if (!Number.isInteger(sourceYear) || !Number.isInteger(targetYear)) throw new Error("A valid integer source and target year are required.");
  if (settings.method === "none" || sourceYear === targetYear) return { factor: 1, label: "No escalation", basis: "Source year equals target year or method disabled." };
  if (settings.method === "source") {
    const factor = Number(record.sourceFactor);
    if (!Number.isFinite(factor) || factor <= 0) return { factor: 1, label: "Unadjusted — no source factor", basis: "No approved source-workbook factor was imported; no escalation applied." };
    return { factor, label: "Imported source-workbook factor", basis: "Retained from the selected source record; formula semantics must be approved." };
  }
  if (settings.method === "index") {
    const index = INDEX_CATALOGUE.find((i) => i.id === settings.indexId);
    if (!index) throw new Error("The selected index is not available or approved.");
    const sourceIndex = observationFor(index, sourceYear);
    const targetIndex = observationFor(index, targetYear);
    return { factor: targetIndex / sourceIndex, label: index.name, basis: `${index.series}: ${targetIndex.toFixed(1)} / ${sourceIndex.toFixed(1)}; ${index.rationale}`, index };
  }
  if (settings.method === "annual") {
    const annual = Number(settings.annualRate);
    if (!Number.isFinite(annual) || annual < 0 || annual > 1) throw new Error("Annual assumption must be between 0 and 1.");
    const years = Math.max(0, targetYear - sourceYear);
    return { factor: Math.pow(1 + annual, years), label: "User-entered annual inflation assumption", basis: `${(annual * 100).toFixed(2)}% p.a. for ${years} future year(s); future assumption only.` };
  }
  throw new Error(`Unrecognised escalation method: ${settings.method || "blank"}`);
}

export function calculatePrice(record, settings = {}) {
  const componentResult = calculateHistoricalBasis(record, settings.components ?? {});
  const escalation = escalationFor(record, settings);
  const locationFactor = Number(settings.locationFactor ?? 1);
  const quantity = Number(settings.quantity ?? 1);
  if (!Number.isFinite(locationFactor) || locationFactor <= 0) throw new Error("Location factor must be greater than zero.");
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error("Quantity must be zero or greater.");
  const targetUnitCost = FixedDecimal.from(componentResult.historicalBasis).mul(escalation.factor).mul(locationFactor).toNumber();
  return {
    ...componentResult,
    escalation,
    locationFactor,
    quantity,
    targetUnitCost,
    total: FixedDecimal.from(targetUnitCost).mul(quantity).toNumber(),
  };
}

export function normalise(value) {
  return String(value ?? "").toLowerCase().replace(/[–—−]/g, "-").replace(/\bkilovolt(s)?\b/g, "kv").replace(/\bmegavolt.?ampere(s)?\b/g, "mva").replace(/square\s*millimet(er|re)s?/g, "mm2").replace(/[^a-z0-9.]+/g, " ").trim();
}

function searchableRecordText(record) {
  const rawValues = (record.rawValues || []).flatMap((value) => [value.cell, value.heading, value.rawValue, value.formula]);
  const components = (record.components || []).flatMap((componentRecord) => [componentRecord.name, componentRecord.componentType, componentRecord.rawValue, componentRecord.calculationBase, componentRecord.note]);
  return [
    record.description,
    record.database,
    record.workbook,
    record.revision,
    record.sheet,
    record.row,
    record.cell,
    record.reference,
    record.page,
    record.sourceProject,
    record.supplier,
    record.year,
    record.country,
    record.currency,
    record.unit,
    record.quality,
    record.qualityReason,
    record.source?.cell,
    record.source?.heading,
    ...Object.entries(record.attributes || {}).flat(),
    ...components,
    ...rawValues,
  ].filter((value) => value !== null && value !== undefined && value !== "").join(" ");
}

function tokenMatch(query, record) {
  const haystack = normalise(searchableRecordText(record));
  const tokens = normalise(query).split(/\s+/).filter(Boolean);
  const words = new Set(haystack.split(/\s+/));
  return tokens.filter((token) => words.has(token) || (!/^\d+(?:\.\d+)?$/.test(token) && haystack.includes(token))).length;
}

export function scoreRecord(record, filters = {}) {
  const queryHits = tokenMatch(filters.query ?? "", record);
  const queryTokens = normalise(filters.query ?? "").split(/\s+/).filter(Boolean);
  let score = queryTokens.length ? (queryHits / queryTokens.length) * 35 : 0;
  const requestedType = filters.equipmentType && filters.equipmentType !== "All equipment" ? filters.equipmentType : "";
  if (requestedType) score += record.attributes.equipmentType === requestedType ? 35 : 0;
  if (filters.voltage && filters.voltage !== "Any voltage") score += normalise(record.attributes.voltage) === normalise(filters.voltage) ? 12 : 0;
  if (filters.rating && filters.rating !== "Any rating") score += normalise(record.attributes.rating) === normalise(filters.rating) ? 10 : 0;
  const manufacturerRequested = filters.manufacturer && filters.manufacturer !== "Any manufacturer" ? filters.manufacturer : "";
  const countryRequested = filters.country && filters.country !== "Any country" ? filters.country : "";
  if (manufacturerRequested && normalise(record.attributes.manufacturer) === normalise(manufacturerRequested)) score += 8;
  if (countryRequested && normalise(record.country) === normalise(countryRequested)) score += 4;
  const differences = [];
  const requested = [["Equipment type", requestedType, record.attributes.equipmentType], ["Voltage", filters.voltage !== "Any voltage" ? filters.voltage : "", record.attributes.voltage], ["Rating", filters.rating !== "Any rating" ? filters.rating : "", record.attributes.rating], ["Manufacturer", manufacturerRequested, record.attributes.manufacturer], ["Country", countryRequested, record.country]];
  for (const [label, expected, actual] of requested) if (expected && normalise(expected) !== normalise(actual)) differences.push(`${label} differs: ${actual || "missing"} vs ${expected}`);
  const completeness = [record.description, record.year, record.currency, record.reference, record.source?.cell || record.cell, record.attributes.equipmentType].filter((value) => value && !String(value).includes("Unknown")).length;
  score += Math.min(8, completeness);
  if (record.quality === "High") score += 6;
  else if (record.quality === "Medium") score += 3;
  const allRequestedMatch = differences.length === 0 && queryHits === queryTokens.length;
  const exact = Boolean(allRequestedMatch && (requestedType || filters.voltage !== "Any voltage" || filters.rating !== "Any rating" || queryTokens.length > 0));
  const strong = !exact && differences.length <= 1 && queryHits >= Math.max(1, queryTokens.length - 1) && completeness >= 4;
  return { score: Math.min(100, Math.round(score)), exact, matchClass: exact ? "Exact source match" : strong ? "Strong technical match" : "Similar / closest available", differences, scoreBreakdown: { queryHits, completeness, quality: record.quality || "Unknown" } };
}

export function searchRecords(records, filters = {}) {
  const requestedType = filters.equipmentType && filters.equipmentType !== "All equipment" ? filters.equipmentType : "";
  const queryRequested = Boolean(normalise(filters.query ?? ""));
  return records
    .map((record) => ({ record, ...scoreRecord(record, filters) }))
    .filter((result) => (!requestedType || normalise(result.record.attributes.equipmentType) === normalise(requestedType)) && (!filters.manufacturer || filters.manufacturer === "Any manufacturer" || normalise(result.record.attributes.manufacturer) === normalise(filters.manufacturer)) && (!filters.country || filters.country === "Any country" || normalise(result.record.country) === normalise(filters.country)) && (queryRequested ? result.scoreBreakdown.queryHits > 0 : result.score > 0 || !requestedType))
    .sort((a, b) => b.score - a.score || Number(b.record.year) - Number(a.record.year));
}

export function formatMoney(value, digits = 0, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(value) || 0);
}

export function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(value) || 0);
}

export function makeSnapshot(project, items, indirectCosts = []) {
  const direct = items.reduce((sum, item) => sum + item.total, 0);
  const indirect = indirectCosts.filter((i) => i.enabled).reduce((sum, i) => sum + (i.type === "percent" ? direct * (Number(i.applied) || 0) : Number(i.applied) || 0), 0);
  return { direct, indirect, total: direct + indirect, createdAt: new Date().toISOString(), project: { ...project }, items: structuredClone(items), indirectCosts: structuredClone(indirectCosts) };
}
