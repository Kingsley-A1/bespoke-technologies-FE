# Admin System Completion Audit

## Outcome

Slices 0 through 7 are implemented in the frontend repository. The application is complete in deterministic local-demo mode and production-fail-closed mode. Production data activation is deliberately pending the CockroachDB `DATABASE_URL` that will be supplied separately.

## Requirement evidence

| Area | Implemented evidence |
|---|---|
| Architecture | Route and data boundaries, normalized SQL migration, typed domain model, extraction map, environment contract, and operations runbook |
| Secure access | Six-digit TOTP, one-time replay protection, recovery-code hashes, attempt throttling and lockout, signed revocable sessions, re-authentication, role and permission guards, security headers, and production configuration verifier |
| Roles | Admin Manager operational permissions and Founder Admin controls for users, settings, exports, payment reversals, voiding, and activity oversight |
| Billing | Standard invoices, proformas, recurring templates, editable drafts, atomic numbering, approval workflow, immutable issued documents, revisions, lifecycle events, conversion without retyping, A4 HTML preview, and server PDF |
| Money | Decimal-safe totals, allocations, partial and full payment states, Founder reversals, overdue reconciliation, aging views, and financial event history |
| CRM | Website contact intake, Inbox triage, leads, activities, stages, clients, billing contacts, and retry-safe opportunity conversion into client, project, and billing draft |
| Delivery | Projects, owners, commercial values, status, health, priority, milestones, tasks, assignees, due dates, and billing linkage |
| Oversight | Company overview, action queue, reports with metric definitions, CSV export controls, company settings, users, sessions, retention job, health status, and append-only activity records |
| Reliability | Transactional financial, approval, numbering, recurring, and authentication paths; conditional updates for races; idempotent recurring and conversion workflows; production fail-closed checks |
| Design | Responsive reference-grounded shell and invoice, approved wordmark, combined reference comparisons, Edge interaction/accessibility harness, and passing `design-qa.md` |

## Scenario evidence

- Unauthenticated admin requests redirect to the code gate.
- Founder and Manager sign in independently; invalid codes lock after the configured threshold.
- Manager is denied Founder-only activity and export operations at the server boundary.
- Draft creation and editing preserve the document number and update calculated values.
- Approval, manual-delivery confirmation, PDF generation, payments, reversal, and reconciliation keep financial state explicit.
- Repeated recurring runs and concurrent runners create one document for one due date.
- Repeated lead and proforma conversions return the existing result without duplicates.
- Website submissions appear in Inbox and can enter the CRM flow.
- Logout revokes access; cross-origin admin mutations are rejected.
- Desktop, tablet, mobile, navigation, editor, detail, and invoice states pass the repeatable Microsoft Edge QA harness.

## Release gates

The release suite is:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm qa:admin-browser
```

The browser command expects the local development server on `http://127.0.0.1:3000` and Microsoft Edge at its standard Windows installation path.

## External activation boundary

No database secret has been added to source control or browser-visible configuration. Once `DATABASE_URL` is supplied, run the production verifier, migration runner, database-backed scenario pass, backup/restore rehearsal, and post-deployment checklist in `OPERATIONS.md`. Email remains truthful manual-delivery confirmation until a provider is explicitly approved.
