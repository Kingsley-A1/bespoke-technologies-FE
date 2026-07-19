# Admin release boundaries and pending external evidence

- `DATABASE_URL` has not been supplied. The application, normalized migration, transaction paths, fail-closed configuration, and migration runner are ready, but the migration and transaction scenarios still require a real CockroachDB cluster for final deployment evidence.
- No email provider has been approved. The system therefore never claims automated delivery: an approved document becomes `sent` only when a named admin confirms real manual delivery. The database records a manual delivery outbox event. Automated email can be added after the provider decision gate.
- Payment receipts are not in this release because the plan makes them conditional on explicit approval. Payment history and the invoice PDF show confirmed allocations and balances.
- Backup/restore rehearsal and post-deployment real-device acceptance require the production CockroachDB and hosting environments. The exact runbook and acceptance checklist are in `OPERATIONS.md`.
- Demo mode is deterministic and non-durable. Production rejects demo mode, missing secrets, bootstrap fallback by default, and missing database configuration.
