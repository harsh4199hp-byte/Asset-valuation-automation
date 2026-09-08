# Asset Valuation Automation — repository guide

This repository contains a local, no-dependency prototype for the Asset Valuation Automation brief. Start it with `node server.mjs` and open `http://127.0.0.1:4173`.

Critical invariants:

- Never invent an equipment price, silently select a source, or present a similar record as exact.
- Production calculation logic must remain deterministic and source lineage must survive export.
- Uploaded workbooks are confidential evidence; do not execute macros, embedded code, or send rows to an unapproved external AI service.
- Real supplied workbooks were not available when this prototype was built. The demo fixture is visibly labelled and must not be used commercially.

Repository map:

- `app.js` — browser workflow and local XLSX export.
- `src/domain.mjs` — pure deterministic search/calculation domain functions.
- `tests/domain.test.mjs` — unit and invariant tests.
- `docs/` — product, architecture, importer, calculation, security, valuation, testing and deployment notes.

Run `node tests/domain.test.mjs` for the available test suite. Before production, add a server-side adapter, persistence, authentication and real-file golden tests for both named sample workbooks.
