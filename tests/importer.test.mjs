import assert from "node:assert/strict";
import { analyseWorkbook, detectHeaderRows, meaningfulRange, normaliseEngineering, parseNumber, validateImport } from "../src/importer.mjs";

const fakeXlsx = { utils: { sheet_to_json: (sheet) => sheet.rows } };
const fileMeta = { fileName: "synthetic-price-list.xlsx", size: 2048, extension: ".xlsx", hash: "a".repeat(64), revision: "IMPORT-aaaaaaaaaa" };
const matrix = [
  ["", "", "", "", "", "", "", ""],
  ["Project", "Description", "Equipment Type", "Voltage", "Rating", "Currency", "USD 2022", "USD 2023"],
  ["Alpha", "132/33 kV transformer", "Power Transformer", "132/33 kV", "60 MVA", "USD", 100000, 110000],
  ["Alpha", "132/33 kV transformer", "Power Transformer", "132/33 kV", "75 MVA", "USD", 120000, 132000],
  ["", "", "", "", "", "", "", ""],
];
const workbook = { SheetNames: ["Price List"], Sheets: { "Price List": { rows: matrix } } };

assert.equal(parseNumber("$1,234.50"), 1234.5);
assert.equal(parseNumber("5%"), 0.05);
assert.equal(normaliseEngineering("132 / 33 kilovolts"), "132 / 33 kv");
assert.deepEqual(meaningfulRange(matrix).rows.length, 3);
assert.equal(detectHeaderRows(matrix)[0].row, 1);

const analysis = analyseWorkbook(workbook, fileMeta, fakeXlsx);
assert.equal(analysis.recordCount, 4, "each historical price column remains a distinct source record");
assert.equal(analysis.records[0].year, 2022);
assert.equal(analysis.records[1].year, 2023);
assert.equal(analysis.records[0].components[0].rawValue, 100000);
assert.equal(analysis.records[0].source.cell, "G3");
assert.equal(analysis.records[1].source.cell, "H3");
assert.equal(analysis.records[0].attributes.voltage, "132/33 kV");
assert.equal(analysis.records[0].currency, "USD");
assert.equal(validateImport(analysis).canImport, true);
console.log("importer tests passed");
