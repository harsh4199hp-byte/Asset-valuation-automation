# User experience review

Date: 2026-09-08

## Why the interface changed

The deployed site was functional, but its first screen behaved like an internal dashboard: it exposed metrics, controls and workflow detail before explaining the next action. The search screen also presented evidence in a dense, spreadsheet-like layout, which made the distinction between usable source rows and comparison-only rows easy to miss.

The revised experience is organised around the user’s likely sequence:

1. Import a trusted workbook.
2. Review the workbook and validation results.
3. Find and select source evidence.
4. Build, review and export the estimate.

## Research applied

- WCAG 2.2 informed the larger controls, visible labels, keyboard-focus treatment and touch-target sizing. See [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) and [Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html).
- GOV.UK’s [file upload guidance](https://design-system.service.gov.uk/components/file-upload/) informed the upload explanation and supported-file hint. Its [validation pattern](https://design-system.service.gov.uk/patterns/validation/) informed keeping blocking errors visible beside the affected review step.
- The [GOV.UK task-list guidance](https://design-system.service.gov.uk/components/task-list/) informed the short four-step workflow summary. It is intentionally a summary rather than a required task list because this workflow has a preferred order.
- Nielsen Norman Group’s guidance on [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) informed moving advanced governance detail behind the relevant review screens. Its [empty-state guidance](https://www.nngroup.com/articles/empty-state-interface-design/) informed the production empty state and its direct import action.

## Changes made

- Reframed the home page as “Start a valuation” / “Continue your estimate” with one primary next action.
- Grouped navigation into Estimate, Source data and Review so the main path is easier to scan.
- Replaced the dense search grid with readable evidence cards that show description, technical attributes, source location, historical price, quality and action.
- Separated “Selectable matches” from “Closest available” comparison records, with an explicit “Comparison only” label.
- Added plain-language search labels, examples, filter labels and a clear empty state.
- Preserved the existing source lineage, validation gates, browser-local privacy boundary and export workflow.
- Added responsive rules for narrower screens while retaining the same content hierarchy.

## Verification performed

- `node --check app.js` passed.
- Domain, money and importer tests passed.
- Golden workbook tests were skipped because the named FAR/price workbooks are not present in the repository workspace; the supplied files were tested through the deployed browser workflow instead.
- Local browser smoke test passed for: home, demo search, keyword search, selectable source handoff, price builder, estimate review, production empty state, workbook analysis, mapping review and validation blocking.
- The available non-price workbook `IEC_Cable_Sizing_110kV_Template.xlsx` was correctly blocked at validation with zero candidate source rows.
- The supplied KGL XLSB was analysed and imported locally: 8 worksheets, 3,699 candidate rows, mapping review, validation warnings, preview and commit all completed. Testing exposed two data-scale edge cases: unresolved currency text could crash display formatting, and an empty search could attempt to render thousands of cards. The deployed fix shows unresolved money as `Review`, prevents rows without a valid ISO currency from being selected as estimate bases, and limits the initial result window while keeping the full match count visible.
- After the fix, KGL search remained responsive with 12 initial cards / 36 cards for a focused query, the invalid-currency source displayed `Review` without runtime errors, and a valid source opened the builder with its component and lineage details intact. Browser runtime logs were empty.
- The supplied Transmission XLSM is 76.6 MB and is rejected by the documented 50 MB local safety limit before parsing; its bytes were not uploaded or stored.

This review improves usability and discoverability; it does not replace engineer review of source workbooks or establish production pricing data.
