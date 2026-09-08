# Architecture

## Direction

The product should become a modular monolith with a browser client, a Python/FastAPI application service and a PostgreSQL persistence layer. SQLite is suitable for local development. The current prototype keeps the client and deterministic domain logic local so the workflow can be exercised without installing dependencies.

## Boundaries

- `domain` — pure deterministic matching and money/calculation functions.
- `importer` — format-specific workbook adapters, workbook analysis, mapping revisions, validation and immutable raw evidence.
- `pricing` — canonical equipment/source/component records and source selection.
- `indices` — approved provider adapters, versioned observations and explicit transformations.
- `valuation` — versioned source-workbook methods only after formula audit.
- `estimates` — project/revision/item/assumption snapshots and reconciliation.
- `export` — safe, formatted workbooks from stored snapshots.
- `identity` — authentication and authorization interface; future Entra ID integration belongs here.

## Canonical records

The persistent model should include Organisation, User, Project, ProjectRevision, DatabaseSource, DatabaseRevision, WorkbookImport, WorksheetSource, FieldMapping, Equipment, EquipmentAttribute, HistoricalPrice, PriceSource, PriceComponent, InflationSeries, InflationObservation, LocationFactor, Estimate, EstimateRevision, EstimateItem, EstimateItemComponent, IndirectCost, Assumption, SourceReference, ImportIssue and AuditEvent.

Raw workbook evidence is immutable. Corrections are new mapping/database revisions or explicit administrative corrections with an audit event.

## Calculation contract

`included source components → historical basis → selected escalation method → applied location factor → target-year unit cost → quantity → line total`.

The application never interpolates or extrapolates a price by rating. A recommendation is informational until an engineer selects the source. Financial values should use `Decimal` in the production service, with a documented internal precision and display/export rounding policy.

## Deployment direction

Use environment-based configuration, a health endpoint, Docker Compose for local PostgreSQL, database migrations and a reverse proxy/TLS boundary. Do not expose confidential workbook contents to public hosting without approved identity, storage and retention controls.
