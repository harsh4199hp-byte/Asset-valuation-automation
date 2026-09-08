# Security and confidentiality

Uploaded valuation workbooks may contain confidential commercial information. The production service needs authentication and authorization boundaries for organisation, team/project and private sources; file-size and content checks; safe retention/deletion; isolated parsing; secure configuration; CSRF protection where cookie sessions are used; and audit events without secrets or unnecessary workbook payloads.

Export strings must be escaped against spreadsheet formula injection. Generated calculation formulas may remain formulas, but user-controlled strings beginning with `=`, `+`, `-` or `@` must be stored as safe text. The prototype exports inline strings and does not execute source workbook code.

External research may support index/methodology/location context but must never silently become an equipment-price record.
