# ADR-002 — Immutable source evidence plus revisioned interpretations

Status: Accepted

Raw workbook files/cells remain immutable evidence. Mapping proposals, interpreted component semantics, selected source records and estimate revisions refer back to file/hash/worksheet/row/cell lineage. Corrections create a new revision and audit event; historical estimates are never recalculated silently when a newer database is uploaded.
