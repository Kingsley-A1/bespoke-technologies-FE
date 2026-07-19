# Admin Acceptance Matrix

| Slice | Acceptance evidence |
|---|---|
| 0 - architecture | `ARCHITECTURE.md`, `PROTOTYPE_EXTRACTION_MAP.md`, route/data boundary, and normalized migration contract |
| 1 - secure foundation | named role fixtures, TOTP RFC test, throttled login records, revocable sessions, server permission tests, re-authentication route, and responsive protected shell |
| 2 - billing core | standard/proforma/recurring editor, atomic DB sequence, immutable issued workflow, approved A4 component, and PDF route |
| 3 - payments/recurring | payment allocations, partial/paid status, Founder reversal, idempotent recurring-run table, and protected cron route |
| 4 - CRM | website submission API, Inbox, retry-safe lead conversion, lead stages, clients, and billing contacts |
| 5 - delivery | projects, health/status, milestones, tasks, assignees, dates, and client/billing linkage |
| 6 - oversight | actionable dashboard, approval queue, reports with metric definitions, company settings, users/sessions, controlled CSV, activity history, and health cards |
| 7 - hardening | typecheck, lint, tests, production build, runtime interaction checks, same-input visual comparisons, desktop/mobile captures, PDF inspection, and passing `design-qa.md` |

The database-dependent production checks remain configuration steps until `DATABASE_URL` is supplied; application code, migrations, local full-flow mode, and the connection/runbook contract are complete before requesting it.

External launch dependencies and deliberately conditional items are recorded in `KNOWN_LIMITS.md`. The requirement-by-requirement evidence is in `COMPLETION_AUDIT.md`.
