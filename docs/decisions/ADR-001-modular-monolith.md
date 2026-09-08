# ADR-001 — Modular monolith for the first production service

Status: Accepted for direction

Use one deployable service with explicit domain modules rather than microservices. Import, calculation, estimates, export and identity have different boundaries but need transactional traceability and a shared security model. A modular monolith is simpler to test locally and can later split a proven bottleneck without coupling the user workflow to network hops.
