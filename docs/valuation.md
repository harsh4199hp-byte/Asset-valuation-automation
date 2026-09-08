# Existing-asset valuation

Existing asset valuation is intentionally gated. A source-workbook method should only be implemented after inspecting real FAR formulas and independently reproducing representative cases. Inputs to validate include valuation year, commissioning year, life extension, useful-life lookup, condition factor, residual-life minimum, replacement value, scrap treatment and DCRV.

The model should carry a `valuation_method_version` and preserve imported source values. Do not silently apply generic straight-line depreciation or change a historical estimate when later database revisions arrive.
