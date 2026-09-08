import assert from "node:assert/strict";
import { DEMO_RECORDS, calculateHistoricalBasis, calculatePrice, makeSnapshot, searchRecords } from "../src/domain.mjs";

const transformer = DEMO_RECORDS.find((record) => record.id === "demo-tx-60-2022");
assert(transformer, "demo transformer fixture exists");

const historical = calculateHistoricalBasis(transformer);
assert.equal(Math.round(historical.historicalBasis * 100) / 100, 423990);
assert.equal(Math.round(historical.amounts.find((c) => c.id === "engineering").amount * 100) / 100, 19800);
assert.equal(Math.round(historical.amounts.find((c) => c.id === "owner").amount * 100) / 100, 20190);

const noEscalation = calculatePrice(transformer, { targetYear: 2022, method: "none", locationFactor: 1, quantity: 1 });
assert.equal(noEscalation.escalation.factor, 1);
assert.equal(noEscalation.targetUnitCost, 423990);

const escalated = calculatePrice(transformer, { targetYear: 2030, method: "source", locationFactor: 1.05, quantity: 2 });
assert.equal(Math.round(escalated.targetUnitCost * 100) / 100, 525323.61);
assert.equal(Math.round(escalated.total * 100) / 100, 1050647.22);

const excludedOwner = calculatePrice(transformer, { targetYear: 2022, method: "none", locationFactor: 1, quantity: 1, components: { owner: false } });
assert.equal(excludedOwner.historicalBasis, 403800);
assert(excludedOwner.historicalBasis < noEscalation.historicalBasis, "excluding a positive component reduces the basis");

const zeroQuantity = calculatePrice(transformer, { targetYear: 2030, method: "source", locationFactor: 1, quantity: 0 });
assert.equal(zeroQuantity.total, 0);
const sameSettingsDifferentQuantity = calculatePrice(transformer, { targetYear: 2030, method: "source", locationFactor: 1, quantity: 1 });
assert.equal(zeroQuantity.targetUnitCost, sameSettingsDifferentQuantity.targetUnitCost, "quantity does not alter unit cost");

const results = searchRecords(DEMO_RECORDS, { query: "132/33 kV 60 MVA", equipmentType: "Power Transformer", voltage: "132/33 kV", rating: "60 MVA" });
assert(results.length >= 2);
assert.equal(results[0].record.id, "demo-tx-60-2022");
assert.equal(results[0].exact, true);
assert(results.some((result) => result.record.id === "demo-tx-75-2021" && result.exact === false));

const lineageSearch = { ...transformer, sheet: "Price List", cell: "U7", reference: "Price List!U7", rawValues: [{ cell: "A7", heading: "Asset Name", rawValue: "Powerhouse" }] };
const unrelatedSearch = { ...transformer, id: "unrelated", sheet: "Other", cell: "A1", reference: "Other!A1", rawValues: [{ cell: "A1", heading: "Asset Name", rawValue: "Circuit breaker" }] };
assert.equal(searchRecords([lineageSearch, unrelatedSearch], { query: "U7", equipmentType: "All equipment", voltage: "Any voltage", rating: "Any rating", manufacturer: "Any manufacturer", country: "Any country" }).length, 1, "search includes source cell lineage");
assert.equal(searchRecords([lineageSearch, unrelatedSearch], { query: "2022", equipmentType: "All equipment", voltage: "Any voltage", rating: "Any rating", manufacturer: "Any manufacturer", country: "Any country" }).length, 1, "search includes cost-year values");
assert.equal(searchRecords([lineageSearch, unrelatedSearch], { query: "not-in-this-workbook", equipmentType: "All equipment", voltage: "Any voltage", rating: "Any rating", manufacturer: "Any manufacturer", country: "Any country" }).length, 0, "unmatched queries do not return unrelated records");

const snapshot = makeSnapshot({ name: "Test", targetYear: 2030 }, [{ id: "a", total: 10 }], []);
assert.equal(snapshot.total, 10);
assert.equal(snapshot.items[0].total, 10);

console.log("domain tests passed");
