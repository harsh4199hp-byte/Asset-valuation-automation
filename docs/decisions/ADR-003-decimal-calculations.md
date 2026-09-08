# ADR-003 — Decimal money arithmetic in the production service

Status: Accepted for production direction

Use decimal/money-safe arithmetic for stored calculation values. The browser-only prototype has no dependency runtime and uses deterministic JavaScript arithmetic solely for interaction. The production API must use Decimal, declare rounding, store inputs/factors and reconcile exports to the snapshot.
