# Calculation specification

## Component semantics

Each source component stores `raw_value`, interpreted value, `component_type`, `calculation_base`, source formula/reference, default inclusion and interpretation confidence. Supported types are absolute USD, percentage, multiplier, formula-derived, inherited assumption and unknown. Unknown values do not silently become money.

## Price build-up

For the simple mode:

`historical basis = sum(included components)`

`target unit cost = historical basis × escalation factor × applied location factor`

`line total = target unit cost × quantity`

Detailed mode will escalate each component before summing. The current prototype implements simple mode and makes every factor visible.

## Escalation

Supported modes are source-workbook factor, published/index ratio, user-entered index values (planned through the index adapter), user-entered annual assumption and no escalation. Historical observed escalation must be visually separated from future assumed escalation. Index observations used in a result must be persisted with provider, series, date, retrieval time, units, transformation and resulting factor.

## Precision

The production service should use decimal arithmetic for money. Store enough internal precision for reproducibility, display engineering-friendly rounded USD values and reconcile export values to stored snapshot values under a declared policy. The browser fixture uses deterministic JavaScript arithmetic only as a dependency-free demonstrator.
