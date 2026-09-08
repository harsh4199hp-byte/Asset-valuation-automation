export const MAX_WORKBOOK_BYTES = 50 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = [".xlsx", ".xlsm", ".xlsb", ".xls"];

const FIELD_PATTERNS = {
  description: [/description/, /equipment.*description/, /item.*description/, /^item$/, /^name$/, /asset.*name/],
  equipmentType: [/equipment.*type/, /asset.*type/, /category/, /class/, /type/],
  voltage: [/voltage/, /kv\b/, /rated.*u/],
  rating: [/rating/, /capacity/, /mva\b/, /mw\b/, /power/],
  manufacturer: [/manufacturer/, /make/, /oem/, /supplier/],
  sourceProject: [/project/, /contract/, /reference.*project/, /scheme/],
  supplier: [/supplier/, /vendor/, /manufacturer/],
  country: [/country/, /location/, /origin/],
  currency: [/currency/, /curr\.?/],
  year: [/price.*year/, /year/, /date/],
  reference: [/reference/, /ref\b/, /code/, /tag/, /asset.*no/],
  page: [/page/, /sheet.*page/, /pdf/],
  unit: [/unit(?!ed)/, /basis/, /per\b/, /uom/],
  sourceFactor: [/escalation/, /inflation/, /index.*factor/, /factor/],
};

const COMPONENT_PATTERNS = [
  ["engineering", /engineer|design|technical/],
  ["transport", /transport|freight|delivery|logistics/],
  ["erection", /erection|installation|commission/],
  ["testing", /test|inspection|pre.?commission/],
  ["owner", /owner|client|employer/],
  ["duty", /duty|tax|vat|custom/],
  ["civil", /civil|foundation|building/],
  ["spares", /spare|special tool/],
];

function text(value) { return value === null || value === undefined ? "" : String(value).trim(); }
function nonEmpty(value) { return text(value) !== ""; }
function slug(value) { return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60) || "field"; }

export function normaliseEngineering(value) {
  return text(value)
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\bkilovolt(s)?\b/g, "kv")
    .replace(/\bmegavolt.?ampere(s)?\b/g, "mva")
    .replace(/\bmegawatt(s)?\b/g, "mw")
    .replace(/\bampere(s)?\b/g, "a")
    .replace(/square\s*millimet(er|re)s?/g, "mm2")
    .replace(/[^a-z0-9.%/+-]+/g, " ")
    .trim();
}

export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = text(value).replace(/\s/g, "");
  if (!raw || /^[-–—]$/.test(raw)) return null;
  const negative = /^\(.*\)$/.test(raw);
  const percent = raw.includes("%");
  const cleaned = raw.replace(/[(),$€£¥%]/g, "").replace(/,/g, "");
  const number = Number(cleaned);
  if (!Number.isFinite(number)) return null;
  return (negative ? -Math.abs(number) : number) * (percent ? 0.01 : 1);
}

export function meaningfulRange(matrix, options = {}) {
  const maxRows = options.maxRows ?? 20_000;
  const maxCols = options.maxCols ?? 300;
  const rows = Array.isArray(matrix) ? matrix : [];
  const keptRows = rows.map((row) => Array.isArray(row) ? row : []).filter((row) => row.some(nonEmpty));
  if (!keptRows.length) return { rows: [], startRow: 0, startCol: 0, endRow: -1, endCol: -1, truncated: false, nonEmptyCells: 0 };
  const firstRow = rows.findIndex((row) => Array.isArray(row) && row.some(nonEmpty));
  const lastRow = rows.length - 1 - [...rows].reverse().findIndex((row) => Array.isArray(row) && row.some(nonEmpty));
  const nonEmptyColumns = [];
  for (let col = 0; col < Math.min(maxCols, Math.max(...rows.map((row) => row.length), 0)); col += 1) {
    if (rows.some((row) => nonEmpty(row[col]))) nonEmptyColumns.push(col);
  }
  if (!nonEmptyColumns.length) return { rows: [], startRow: firstRow, startCol: 0, endRow: lastRow, endCol: -1, truncated: false, nonEmptyCells: 0 };
  const firstCol = nonEmptyColumns[0];
  const lastCol = nonEmptyColumns.at(-1);
  const trimmed = rows.slice(firstRow, Math.min(lastRow + 1, firstRow + maxRows)).map((row) => (row || []).slice(firstCol, Math.min(lastCol + 1, firstCol + maxCols)));
  return {
    rows: trimmed,
    startRow: firstRow,
    startCol: firstCol,
    endRow: firstRow + trimmed.length - 1,
    endCol: firstCol + (trimmed[0]?.length || 0) - 1,
    truncated: lastRow + 1 > firstRow + maxRows || lastCol + 1 > firstCol + maxCols,
    nonEmptyCells: trimmed.reduce((total, row) => total + row.filter(nonEmpty).length, 0),
  };
}

function fieldForLabel(label) {
  const normal = normaliseEngineering(label);
  let best = null;
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normal)) {
        const score = pattern.source.length + (normal === field ? 20 : 0);
        if (!best || score > best.score) best = { field, score };
      }
    }
  }
  return best?.field || null;
}

function headerScore(row) {
  let score = 0;
  for (const cell of row) {
    const value = normaliseEngineering(cell);
    if (!value) continue;
    if (fieldForLabel(value)) score += 3;
    if (/price|cost|rate|amount|value|total|project|supplier|reference/.test(value)) score += 2;
    if (/%|year|currency|country|unit/.test(value)) score += 1;
  }
  return score;
}

export function detectHeaderRows(matrix, maxRows = 40) {
  return matrix.slice(0, maxRows).map((row, index) => ({ row: index, score: headerScore(row) })).filter((item) => item.score >= 3).sort((a, b) => b.score - a.score || a.row - b.row).slice(0, 3);
}

function cellAddress(row, col) {
  let number = col + 1;
  let output = "";
  while (number) {
    const remainder = (number - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    number = Math.floor((number - 1) / 26);
  }
  return `${output}${row + 1}`;
}

function inferYear(value, label = "") {
  const direct = parseNumber(value);
  if (direct && direct >= 1900 && direct <= 2200) return Math.round(direct);
  const match = `${text(value)} ${label}`.match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function inferCurrency(value, label = "") {
  const normal = `${text(value)} ${label}`.toUpperCase();
  if (/\bUSD\b|US\$|\$/.test(normal)) return "USD";
  if (/\bEUR\b|€/.test(normal)) return "EUR";
  if (/\bGBP\b|£/.test(normal)) return "GBP";
  if (/\bKES\b/.test(normal)) return "KES";
  if (/\bZAR\b/.test(normal)) return "ZAR";
  if (/\bUGX\b/.test(normal)) return "UGX";
  return text(value) || "Unknown / review";
}

function sourceCell(sheet, row, col, value, header) {
  const address = cellAddress(row, col);
  const cell = sheet[address] || {};
  return { cell: address, rawValue: value, formula: cell.f || null, heading: header };
}

function isPriceColumn(label, value) {
  const normal = normaliseEngineering(label);
  if (!Number.isFinite(parseNumber(value))) return false;
  if (/(year|date|qty|quantity|life|voltage|kv\b|mva\b|mw\b|ka\b|mm2|factor|percent|%)/.test(normal)) return false;
  return /price|cost|rate|amount|total|supply|cip|fob|\b(?:usd|eur|gbp|kes|zar|ugx)\b|(?:19|20)\d{2}/.test(normal);
}

function componentInfo(label, value) {
  const normal = normaliseEngineering(label);
  const numeric = parseNumber(value);
  if (!Number.isFinite(numeric)) return null;
  const match = COMPONENT_PATTERNS.find(([, pattern]) => pattern.test(normal));
  if (!match && !/%|percent/.test(normal)) return null;
  const percentage = /%|percent/.test(normal) || (Math.abs(numeric) <= 1 && /share|markup|allowance/.test(normal));
  return {
    id: `${match?.[0] || slug(label)}_${slug(label)}`.slice(0, 80),
    name: text(label),
    componentType: percentage ? "percentage" : "absolute_usd",
    rawValue: percentage && Math.abs(numeric) > 1 ? numeric / 100 : numeric,
    rawSourceValue: value,
    calculationBase: /owner|client|employer/.test(normal) ? "subtotal_before_owner" : "equipment",
    includedByDefault: true,
    included: true,
    note: percentage ? "Percentage semantics inferred from the source heading; confirm during review." : "Absolute component retained from the source row.",
  };
}

function confidenceForMapping(mapping) {
  const count = Object.values(mapping).filter(Boolean).length;
  return Math.min(0.99, 0.35 + count * 0.08);
}

function buildHeaders(matrix, headerRow) {
  return matrix[headerRow].map((_, col) => {
    const parts = [];
    for (let row = Math.max(0, headerRow - 2); row <= headerRow; row += 1) if (nonEmpty(matrix[row]?.[col])) parts.push(text(matrix[row][col]));
    return parts.join(" / ") || `Column ${col + 1}`;
  });
}

function parseSheetRecords(sheetName, sheet, matrix, range, fileMeta, mapping) {
  const candidates = [];
  const headerRow = mapping.headerRow;
  const headers = buildHeaders(matrix, headerRow);
  const mappedColumns = {};
  headers.forEach((header, col) => { const field = fieldForLabel(header); if (field && mappedColumns[field] === undefined) mappedColumns[field] = col; });
    const priceColumns = headers.map((header, col) => ({ header, col })).filter(({ header, col }) => isPriceColumn(header, matrix[headerRow + 1]?.[col]) || /price|cost|rate|amount|total|cip|fob|supply|\b(?:usd|eur|gbp|kes|zar|ugx)\b|(?:19|20)\d{2}/.test(normaliseEngineering(header)));
  for (let rowIndex = headerRow + 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex] || [];
    if (!row.some(nonEmpty)) continue;
    const numericPriceColumns = priceColumns.filter(({ col, header }) => Number.isFinite(parseNumber(row[col])) && !/(year|date|qty|quantity|factor|percent|%)/.test(normaliseEngineering(header)));
    if (!numericPriceColumns.length) continue;
    const description = text(row[mappedColumns.description]) || text(row.find((value, col) => nonEmpty(value) && !Number.isFinite(parseNumber(value)) && !fieldForLabel(headers[col])));
    if (!description) continue;
    for (const priceColumn of numericPriceColumns) {
      const price = parseNumber(row[priceColumn.col]);
      if (!Number.isFinite(price) || price <= 0) continue;
      const attributes = {};
      headers.forEach((header, col) => {
        const value = row[col];
        if (!nonEmpty(value) || col === priceColumn.col) return;
        const field = fieldForLabel(header);
        if (field && !["description", "sourceProject", "supplier", "country", "currency", "year", "reference", "page", "unit", "sourceFactor"].includes(field)) attributes[field] = text(value);
        else if (!field && !Number.isFinite(parseNumber(value))) attributes[slug(header)] = text(value);
      });
      const components = [{ id: "equipment", name: text(priceColumn.header) || "Equipment / procurement", componentType: "absolute_usd", rawValue: price, rawSourceValue: row[priceColumn.col], calculationBase: "equipment", includedByDefault: true, included: true, note: "Primary price cell retained from the selected source column." }];
      headers.forEach((header, col) => {
        if (col === priceColumn.col) return;
        const component = componentInfo(header, row[col]);
        if (component && !components.some((entry) => entry.id === component.id)) components.push(component);
      });
      const year = inferYear(row[mappedColumns.year], `${priceColumn.header} ${headers.join(" ")}`);
      const reference = text(row[mappedColumns.reference]) || `${sheetName}!${cellAddress(range.startRow + rowIndex, range.startCol + priceColumn.col)}`;
      const source = sourceCell(sheet, range.startRow + rowIndex, range.startCol + priceColumn.col, row[priceColumn.col], priceColumn.header);
      const recordKey = `${fileMeta.hash}:${sheetName}:${range.startRow + rowIndex}:${range.startCol + priceColumn.col}`;
      const numericFields = headers.map((header, col) => ({ header, col, value: parseNumber(row[col]) })).filter((item) => Number.isFinite(item.value));
      const qualityFields = [description, year, reference, inferCurrency(row[mappedColumns.currency], priceColumn.header) !== "Unknown / review"].filter(Boolean).length;
      candidates.push({
        id: `import-${slug(recordKey)}`,
        databaseId: fileMeta.hash,
        database: fileMeta.fileName,
        revision: fileMeta.revision,
        workbook: fileMeta.fileName,
        sheet: sheetName,
        row: range.startRow + rowIndex + 1,
        cell: source.cell,
        reference,
        page: text(row[mappedColumns.page]) || "Not stated",
        sourceProject: text(row[mappedColumns.sourceProject]) || "Not stated",
        supplier: text(row[mappedColumns.supplier]) || "Not stated",
        year: year || "Unknown / review",
        country: text(row[mappedColumns.country]) || "Unknown / review",
        currency: inferCurrency(row[mappedColumns.currency], priceColumn.header),
        unit: text(row[mappedColumns.unit]) || (/\/\s*(m|km|kg|unit)/i.exec(priceColumn.header)?.[1] ? `per ${RegExp.$1}` : "per unit"),
        sourceFactor: parseNumber(row[mappedColumns.sourceFactor]),
        sourceFactorCell: mappedColumns.sourceFactor === undefined ? null : cellAddress(range.startRow + rowIndex, range.startCol + mappedColumns.sourceFactor),
        source,
        attributes: { equipmentType: text(row[mappedColumns.equipmentType]) || "Unclassified / review", ...attributes },
        description,
        components,
        rawValues: row.map((value, col) => nonEmpty(value) ? sourceCell(sheet, range.startRow + rowIndex, range.startCol + col, value, headers[col]) : null).filter(Boolean),
        quality: qualityFields >= 4 ? "High" : qualityFields >= 2 ? "Medium" : "Low",
        qualityReason: qualityFields >= 4 ? "Description, price, source reference, year and currency were mapped." : "One or more source fields need confirmation in the mapping review.",
        numericFields,
      });
    }
  }
  return candidates;
}

function sheetToRows(xlsx, sheet) {
  if (xlsx?.utils?.sheet_to_json) return xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "", blankrows: false });
  return [];
}

function classifySheet(name, textContent) {
  const normal = normaliseEngineering(`${name} ${textContent.slice(0, 1200)}`);
  if (/price|rate|cost|equipment/.test(normal)) return "price-list";
  if (/fixed.*asset|far|asset.*register/.test(normal)) return "fixed-asset-register";
  if (/useful.*life|life.*table|depreciation/.test(normal)) return "useful-life";
  if (/inflation|index|escalation/.test(normal)) return "inflation";
  if (/valuation|replacement|drc|depreciated/.test(normal)) return "valuation-report";
  return "other";
}

export function analyseWorkbook(workbook, fileMeta, xlsx = globalThis.XLSX) {
  const sheets = [];
  const records = [];
  for (const name of workbook?.SheetNames || []) {
    const sheet = workbook.Sheets[name];
    const matrix = sheetToRows(xlsx, sheet);
    const range = meaningfulRange(matrix);
    const flattened = range.rows.flat().filter(nonEmpty).map(text).join(" | ");
    const headers = detectHeaderRows(range.rows);
    const headerRow = headers[0]?.row ?? 0;
    const headerNames = buildHeaders(range.rows, headerRow);
    const mapping = {};
    headerNames.forEach((header) => { const field = fieldForLabel(header); if (field && !mapping[field]) mapping[field] = header; });
    const hasPriceHeading = headerNames.some((header) => /unit\s*price|total\s*(unit\s*)?cost|purchase\s*price|historical\s*price|cip|fob|price\s*rate/.test(normaliseEngineering(header)));
    const hasIdentityHeading = Boolean(mapping.description || mapping.equipmentType || mapping.sourceProject || mapping.reference);
    const namedPriceSheet = /price|cost|rate|equipment\s*(register|list)/i.test(name);
    const candidateRecords = range.rows.length && headers.length ? parseSheetRecords(name, sheet, range.rows, { ...range, startRow: range.startRow, startCol: range.startCol }, fileMeta, { headerRow }) : [];
    const isPriceSheet = classifySheet(name, flattened) === "price-list" || namedPriceSheet || (hasPriceHeading && hasIdentityHeading);
    const hasFormula = Object.entries(sheet || {}).some(([key, value]) => !key.startsWith("!") && value && typeof value === "object" && Boolean(value.f));
    const sheetAnalysis = { name, classification: classifySheet(name, flattened), isPriceSheet, range, headerCandidates: headers, headerRow, headers: headerNames, mapping, confidence: confidenceForMapping(mapping), hidden: Boolean(workbook.Workbook?.Sheets?.find((entry) => entry.name === name)?.Hidden), candidateRecordCount: candidateRecords.length, formulasDetected: hasFormula };
    sheets.push(sheetAnalysis);
    if (isPriceSheet) records.push(...candidateRecords);
  }
  const priceSheets = sheets.filter((sheet) => sheet.isPriceSheet && !sheet.hidden);
  const selectedSheets = priceSheets.length ? priceSheets : sheets.filter((sheet) => sheet.classification === "other" ? false : true);
  const selectedNames = new Set(selectedSheets.map((sheet) => sheet.name));
  const selectedRecords = records.filter((record) => selectedNames.has(record.sheet));
  return {
    fileName: fileMeta.fileName,
    extension: fileMeta.extension,
    size: fileMeta.size,
    hash: fileMeta.hash,
    sheets,
    priceSheets: selectedSheets.map((sheet) => sheet.name),
    records: selectedRecords,
    recordCount: selectedRecords.length,
    sourceCount: new Set(selectedRecords.map((record) => `${record.sheet}:${record.row}:${record.cell}`)).size,
    formulasDetected: sheets.some((sheet) => sheet.formulasDetected),
    macrosDetected: Boolean(workbook.vbaraw) || sheets.some((sheet) => sheet.type === "macro"),
  };
}

export function validateImport(analysis) {
  const issues = [];
  const warnings = [];
  if (!analysis.sheets.length) issues.push({ severity: "error", message: "The workbook contains no readable worksheets." });
  if (!analysis.records.length) issues.push({ severity: "error", message: "No rows with a description and a positive price were found on the proposed price sheets." });
  if (analysis.sheets.some((sheet) => sheet.range.truncated)) warnings.push("At least one meaningful range was capped for safety; review the source workbook before import.");
  if (analysis.macrosDetected) warnings.push("Macro metadata was detected. It is retained only as a source flag; no macro or embedded code is executed.");
  if (analysis.formulasDetected) warnings.push("Formula cells are retained as lineage, while the cached displayed values are used for analysis.");
  if (analysis.records.some((record) => record.currency === "Unknown / review")) warnings.push("Some price rows have no mapped currency; confirm currency before using them in an estimate.");
  if (analysis.records.some((record) => record.year === "Unknown / review")) warnings.push("Some price rows have no mapped source year; those rows cannot be escalated until corrected.");
  return { issues, warnings, canImport: issues.length === 0 };
}

export async function importWorkbookFile(file, options = {}) {
  if (!file) throw new Error("No workbook selected");
  const extension = `.${text(file.name).split(".").at(-1).toLowerCase()}`;
  if (!SUPPORTED_EXTENSIONS.includes(extension)) throw new Error(`Unsupported workbook type: ${extension || "unknown"}`);
  if (file.size > (options.maxBytes ?? MAX_WORKBOOK_BYTES)) throw new Error(`Workbook exceeds the ${Math.round((options.maxBytes ?? MAX_WORKBOOK_BYTES) / 1024 / 1024)} MB local safety limit.`);
  const data = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const fileMeta = { fileName: text(file.name).replace(/[\\/:*?"<>|]/g, "_"), size: file.size, extension, hash, revision: `IMPORT-${hash.slice(0, 10)}` };
  const xlsx = options.xlsx || globalThis.XLSX;
  if (!xlsx?.read) throw new Error("The local spreadsheet parser is not available. Refresh the page and try again.");
  const workbook = xlsx.read(data, { type: "array", cellFormula: true, cellNF: true, cellDates: true, bookVBA: true, dense: false, WTF: false });
  const analysis = analyseWorkbook(workbook, fileMeta, xlsx);
  // Macro bytes are intentionally not persisted or passed to the application model.
  delete workbook.vbaraw;
  const validation = validateImport(analysis);
  const database = {
    id: `db-${hash.slice(0, 16)}`,
    name: fileMeta.fileName.replace(/\.[^.]+$/, ""),
    revision: fileMeta.revision,
    source: fileMeta.fileName,
    sourceFormat: extension,
    hash,
    size: file.size,
    importedAt: new Date().toISOString(),
    status: "active",
    visibility: "Private local workspace",
    records: analysis.records,
    recordsCount: analysis.recordCount,
    sources: analysis.sourceCount,
    worksheets: analysis.sheets.map(({ name, classification, range, mapping, confidence, hidden }) => ({ name, classification, range, mapping, confidence, hidden })),
    validation,
  };
  return { fileMeta, workbook, analysis, validation, database };
}
