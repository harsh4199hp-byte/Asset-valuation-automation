# Testing plan

Current test command:

```text
node tests/domain.test.mjs
```

The available tests cover component arithmetic, percentage bases, source escalation, location factor, zero quantity, quantity invariance, exact/similar separation and snapshot totals.

Required next gates:

1. Import regression tests against the supplied XLSM and XLSB files.
2. Golden records containing file, sheet, row, cell, raw values, formulas, canonical fields and expected outputs.
3. Edge cases: empty/corrupt/hidden-sheet workbooks, merged headers, phantom ranges, duplicate columns, stale caches, unknown currencies/factors, zero/negative/blank prices, malformed attributes and Unicode units.
4. Independent numerical implementation that does not call production calculation functions.
5. Browser E2E: upload → analyse → mapping → import → search → compare → select → build → estimate → indirect cost → export → verify workbook values.
6. Security and performance testing for large files, search latency, memory and export.
