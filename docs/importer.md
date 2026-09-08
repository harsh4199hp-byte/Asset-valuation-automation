# Importer design

## Adapter contract

Each adapter should return workbook metadata, worksheet metadata, meaningful used ranges, candidate headers/tables, formula/value profiles, merged-header information and raw cell lineage. Planned adapters: XLSX/XLSM via openpyxl-compatible parsing, XLSB via a dedicated binary reader, and legacy XLS via a format-specific reader.

## Meaningful ranges

Do not iterate to `max_row`/`max_column` blindly. Inspect populated values, formulas and bounded non-empty runs; cap suspicious dimensions and report phantom formatting ranges as an issue.

## Mapping

Mappings are deterministic first: normalized header similarity, engineering vocabulary, units, value profiles, formula relationships and configurable rules. A mapping proposal includes confidence and supporting evidence. Human approval creates a mapping revision. Any future AI assistant must be pluggable, internal/approved, minimize payload and require approval.

## Validation

Issues are Error, Warning or Information. Check blank descriptions/prices/years/currencies, zero/negative values, duplicates, mixed currencies, unknown factor semantics, formula errors, missing cached values, unusual ratios, invalid dates, multiple headers/price columns and malformed attributes.

## Security

Treat raw uploads as confidential immutable evidence. Validate extension and content, sanitize filenames, isolate parsing, enforce upload limits, prevent path traversal, do not execute macros or embedded code and record only necessary audit metadata.
