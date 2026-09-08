# Asset Valuation Automation

Asset Valuation Automation is a traceability-first workspace for engineering cost estimation, replacement-cost analysis and historical equipment-price comparison.

## Current build

This first local build is a no-dependency browser prototype served by Node.js. It demonstrates the core workflow:

1. search actual-looking source records while keeping exact and similar matches separate;
2. inspect file/sheet/row/reference lineage;
3. select a source explicitly and configure components, escalation, location factor and quantity;
4. add multiple lines to a project estimate;
5. apply optional, user-entered indirect costs;
6. snapshot a revision and download a traceability workbook with nine sheets.

The included records are a clearly labelled training fixture. They are not extracted from the two workbooks named in the product brief, because those files were not present in the workspace. No commercial or valuation decision should use the fixture.

## Run locally

```text
node server.mjs
```

Then open `http://127.0.0.1:4173`. No package install is required. Unit tests:

```text
node tests/domain.test.mjs
```

## Important limitations

- Workbook upload currently hashes and classifies a local file, then stops before commit; deterministic XLSX/XLSM/XLSB adapters and a reviewable mapping store are the next implementation boundary.
- Persistence, multi-user authentication, server-side authorization and approved statistical index retrieval are not yet wired.
- The demo index catalogue and source records are illustrative. The UI refuses to recommend a location factor and makes any user override visible.
- Existing-asset cards are placeholders. FAR formula reverse-engineering must happen against the real files before DCRV calculations are implemented.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`docs/technical-checkpoint.md`](./docs/technical-checkpoint.md) for the implementation checkpoint.
