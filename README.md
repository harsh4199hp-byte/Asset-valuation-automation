# Asset Valuation Automation

Asset Valuation Automation is a traceability-first workspace for engineering cost estimation, replacement-cost analysis and historical equipment-price comparison.

## Current build

This is a static, browser-local application served by Node.js for local development and deployable to GitHub Pages. The pinned SheetJS CE 0.20.3 browser build is vendored in `vendor/xlsx.full.min.js`, so workbook parsing has no runtime CDN dependency. The application supports this workflow:

1. import XLSX, XLSM, XLSB or XLS locally;
2. fingerprint, analyse meaningful ranges and propose pattern-driven mappings;
3. validate and preview rows before committing a local IndexedDB database;
4. search imported source records while keeping exact/strong and similar matches separate;
5. inspect cell-level lineage, components and formulas;
6. select a source explicitly and configure components, escalation, location factor and quantity;
7. add multiple lines to a project estimate, apply optional user-entered indirect costs and snapshot a revision;
8. export a sanitized traceability workbook with nine sheets.

Production mode starts empty. The included records are a clearly labelled training fixture that can only be enabled explicitly. They are not extracted from the two workbooks named in the product brief, because those files were not present in the workspace. No commercial or valuation decision should use the fixture.

## Run locally

```text
node server.mjs
```

Then open `http://127.0.0.1:4173`. No package install is required because the parser build is vendored. Unit tests:

```text
node tests/domain.test.mjs
node tests/money.test.mjs
node tests/importer.test.mjs
node tests/golden.test.mjs
```

## Important limitations

- The named Transmission XLSM and KGL Generating Stations XLSB files were not available for this build. Their workbook-specific sheets, formulas, source cells, component semantics and golden values remain unverified. The automated golden test reports this as skipped rather than inventing expected values.
- The importer is pattern-driven and preserves source cells/formulas, but complex merged blocks, stale formula caches, external links and source-specific semantics still require reviewer confirmation.
- Persistence is browser-local IndexedDB. There is no server-side authentication, multi-user authorization or confidential shared storage on GitHub Pages.
- Production mode exposes no fake index catalogue. The training demo contains illustrative index observations and records only when explicitly enabled.
- Country adjustment is explicitly unadjusted unless an approved factor is entered; no factor is inferred from country names.
- Existing-asset/FAR valuation remains gated. No DCRV or useful-life result is generated until the real FAR methods are reverse-engineered and independently reproduced.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`docs/technical-checkpoint.md`](./docs/technical-checkpoint.md) for the implementation checkpoint.
