# Importer design

## Adapter contract

The current static adapter is the pinned, vendored SheetJS CE 0.20.3 browser build. It reads XLSX, XLSM, XLSB and legacy XLS from an `ArrayBuffer` and returns workbook metadata, worksheet metadata, meaningful ranges, candidate headers/tables, formula/value profiles and raw cell lineage. VBA metadata is detected but never executed or stored. The parser reads cached formula values; it does not calculate formulas.

## Meaningful ranges

Do not iterate to `max_row`/`max_column` blindly. Inspect populated values, formulas and bounded non-empty runs; cap suspicious dimensions and report phantom formatting ranges as an issue.

## Mapping

Mappings are deterministic first: normalized header similarity, engineering vocabulary, units, value profiles, repeated historical price columns and configurable rules. A mapping proposal includes confidence and supporting evidence. The UI requires human mapping review, validation and preview before a database is committed to IndexedDB. Any future AI assistant must be pluggable, internal/approved, minimize payload and require approval.

## Validation

Issues are Error, Warning or Information. Check blank descriptions/prices/years/currencies, zero/negative values, duplicates, mixed currencies, unknown factor semantics, formula errors, missing cached values, unusual ratios, invalid dates, multiple headers/price columns and malformed attributes.

## Security

Treat raw uploads as confidential immutable evidence. Validate extension and content, sanitize filenames, enforce the 50 MB browser limit, cap meaningful ranges, prevent path traversal, do not execute macros or embedded code and record only necessary audit metadata. The implementation stores normalized records, hashes, formulas and source-cell evidence rather than the original workbook bytes.

## Pattern coverage

The generic extractor supports vertical tables and repeated horizontal price columns. Every numeric price column becomes a distinct `HistoricalPrice`-shaped record; it is never averaged with another year or project. Components retain raw headings, inferred type, calculation base and source cells. The two named source workbooks were not available during development, so their workbook-specific pattern mappings and golden values remain an open validation gate.
