# Product specification

The principal workflow is source data → mapping → validation → equipment search → source comparison → price builder → project estimate → revision → Excel export.

The UI must show exact/strong and similar/closest records in separate groups. A similar record is never relabelled as exact and never turns into an estimated price. Search ranking uses technical relevance, source quality, recency and completeness; price magnitude is excluded.

Every selected line exposes database, revision, original workbook, worksheet, row/reference, source project, source country, source year, raw components, included/excluded status, escalation method and location factor. The export repeats that evidence.

The current product currency is USD. A future non-USD source must retain its original currency and flag conversion as required until an approved rate source is configured.
