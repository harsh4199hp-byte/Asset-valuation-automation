# Technical checkpoint — 08 September 2026

## Evidence status

The brief names:

- `Transmission FAR 29102024 to Dec 2023 Rev 1.1.xlsm`
- `KGL Generating Stations FAR_30112025 to Dec 2025 Rev 0.xlsb`

Neither binary file was present in the workspace or the checked OneDrive/Downloads locations. Consequently, no workbook-specific claim below is treated as verified, no golden source record was fabricated, and the real-file quality gates remain open.

## Findings from the brief to recheck

The Transmission workbook is described as having a broad `Price List` with repeated historical project/source blocks, while the Generating Stations `Price List` is materially narrower. The brief also describes a Transmission build-up with procurement/CIP, local transport, erection & commissioning and owner's cost, plus percentage assumptions and escalation factors. These are design hypotheses until the files are imported and formulas are inspected.

The Fixed Asset Registers are described as containing identification, hierarchy, dynamic technical attributes, commissioning year, life extension, useful life, condition indicators, replacement value, scrap, residual life and DCRV. The application therefore keeps dynamic attributes and valuation methods versioned instead of applying a generic depreciation formula.

## Inflation interpretation

An `Inflation rate` field cannot be treated as an annual percentage by title alone. A value such as `1.53` may be a cumulative factor, index ratio or formula result. The importer must inspect formulas, source/target years, documentation and neighboring fields, then flag unresolved semantics for review. The prototype offers source-factor, index-ratio, annual-assumption and no-escalation modes with their semantics visible.

## Key risks

- Missing files block real workbook forensics and golden-record validation.
- XLSB parsing, formula-cache behavior, merged headers and phantom used ranges can materially affect import accuracy.
- Cost component semantics may differ across databases; flattening them into one total would destroy auditability.
- A country factor without an approved source is a fabricated assumption, so the prototype defaults to 1.0000 and labels the recommendation unavailable.
- Estimate classification depends on project-definition maturity; it cannot be inferred from a database alone.

## Research anchors

- [IVSC Standards Glossary](https://ivsc.org/standards-glossary/) — cost approach framing and valuation terminology.
- [AACE 17R-97](https://web.aacei.org/docs/default-source/toc/toc_17r-97.pdf) — generic estimate classification guidance.
- [AACE 18R-97](https://web.aacei.org/docs/default-source/toc/toc_18r-97.pdf) — process-industry classification and project-definition maturity.
- [U.S. BLS PPI](https://www.bls.gov/ppi/) — candidate authoritative source family for configured equipment/construction series.

These references inform product design; the prototype makes no compliance claim.
