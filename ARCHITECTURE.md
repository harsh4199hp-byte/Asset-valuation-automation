# Architecture

## Direction

The current deployable slice is a browser-local static application. It uses a vendored SheetJS adapter for local workbook parsing, a pure domain layer for matching/calculation, and IndexedDB for normalized source revisions and project state. A future modular monolith may add a Python/FastAPI service and PostgreSQL persistence, but confidential source files must not be sent to GitHub Pages.

## Boundaries

- `domain` — pure deterministic matching and money/calculation functions.
- `importer` — SheetJS format adapter, meaningful-range detection, pattern-driven mappings, validation and cell-level evidence.
- `pricing` — canonical equipment/source/component records and source selection.
- `indices` — approved provider adapters, versioned observations and explicit transformations.
- `valuation` — versioned source-workbook methods only after formula audit.
- `estimates` — project/revision/item/assumption snapshots and reconciliation.
- `export` — safe, formatted nine-sheet XLSX workbooks from stored snapshots.
- `identity` — authentication and authorization interface; future Entra ID integration belongs here.

## Canonical records

The persistent model should include Organisation, User, Project, ProjectRevision, DatabaseSource, DatabaseRevision, WorkbookImport, WorksheetSource, FieldMapping, Equipment, EquipmentAttribute, HistoricalPrice, PriceSource, PriceComponent, InflationSeries, InflationObservation, LocationFactor, Estimate, EstimateRevision, EstimateItem, EstimateItemComponent, IndirectCost, Assumption, SourceReference, ImportIssue and AuditEvent.

Raw workbook evidence is immutable. Corrections are new mapping/database revisions or explicit administrative corrections with an audit event.

## Calculation contract

`included source components → historical basis → selected escalation method → applied location factor → target-year unit cost → quantity → line total`.

The application never interpolates or extrapolates a price by rating. A recommendation is informational until an engineer selects the source. Financial values use the browser fixed-point decimal helper at six internal decimal places, with display/export rounding at the boundary. A server implementation should preserve the same contract with a typed `Decimal` money value and explicit currency/FX rules.

## Deployment direction

The GitHub Pages build is suitable for local/browser-only testing and sharing of the UI. It has no server-side identity or access control. Do not expose confidential workbook contents to public hosting without approved identity, storage and retention controls.
