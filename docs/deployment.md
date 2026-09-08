# Deployment direction

The prototype is local-only and intentionally does not upload confidential data. A production deployment should provide a containerized FastAPI service, a React/Next.js client, PostgreSQL migrations, object storage with retention policy, a health endpoint, structured logs, backups and a reverse proxy with TLS.

Authentication is an abstraction until Multiconsult confirms requirements; Microsoft Entra ID/SSO is a future adapter. Shared corporate, project/team and private source visibility must be enforced server-side. Never place confidential workbook contents in a public demo host merely to obtain a link.
