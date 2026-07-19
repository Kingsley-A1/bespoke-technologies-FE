# Bespoke Technologies Admin System Plan

**Document status:** Proposed implementation plan  
**Prepared:** 16 July 2026  
**Repository:** `bespoke-technologies-FE`  
**Product direction:** A secure internal command centre for billing, clients, delivery, and company oversight.

---

## 1. Executive decision

Build the Admin System **inside the existing `bespoke-technologies-FE` Next.js application** under `/admin`. The public website remains public; the admin route group receives its own protected shell, data-access layer, permissions, and database-backed operational modules.

The current `Bespoke_Invoice_Generator_Source` is a valuable product prototype, not the final application boundary. Port its proven invoice editor, calculations, PDF generator, recurring logic, and dashboard visual language into the main application. Do not deploy or maintain it as a second independent Next.js product.

The first production release should make four things excellent:

1. Secure, named staff access through a six-digit entry experience.
2. Reliable client and billing operations, including standard, proforma, and recurring invoices.
3. Clear work oversight across leads, clients, projects, tasks, payments, and deadlines.
4. Founder-only control over people, security, sensitive settings, approvals, exports, and audit history.

This is an internal operating system, not a large generic ERP. Every module must solve a current Bespoke Technologies workflow and share one source of truth.

---

## 2. Evidence reviewed

The plan is based on the following repository evidence:

- Root `AGENTS.md`: Next.js/React/TypeScript/Tailwind stack; premium blue, black, white identity; accessibility and production quality are required.
- `Bespoke_Invoice_Generator_Source/qa/dashboard-desktop.png`: approved visual foundation for the admin shell.
- `Bespoke_Invoice_Generator_Source/qa/demo-invoice.pdf` and its rendered QA image: approved invoice quality and A4 hierarchy.
- Invoice prototype code: standard, proforma, and recurring documents; PDF generation; calculations; currencies; status tracking; recurring schedules.
- Invoice prototype schema: a single JSON-heavy `invoice_documents` table in Supabase.
- Root application: reusable design tokens and UI primitives, `pg` access through `DATABASE_URL`, and CockroachDB migrations already exist.

### What is already strong

- The dashboard is controlled, clear, and aligned with the Bespoke blue/white brand.
- The invoice PDF is professional, readable, and appropriate for client delivery.
- Invoice calculations, validation, numbering prefixes, recurring logic, and PDF generation already provide a strong starting point.
- The root application already has reusable buttons, inputs, modals, cards, badges, layout utilities, focus styles, and semantic colours.

### Gaps that must be closed

- The invoice prototype is a second standalone Next.js app with a separate dependency tree and data adapter.
- Current authentication is one environment-backed email/password pair with a signed 12-hour cookie; there are no named roles, database sessions, lockouts, revocation, or audit history.
- Preview mode automatically bypasses real authentication when secrets are absent. Production admin must fail closed.
- Clients are derived from invoice snapshots instead of being first-class records.
- The invoice table stores the main document as JSON, which weakens reporting, relational integrity, workflow history, and payment reconciliation.
- There are no leads, projects, tasks, payments, approvals, notifications, staff accounts, or founder oversight views.
- There is no server-authoritative RBAC layer; hiding a button is not authorization.
- Invoice records can be directly edited or deleted after issue, which is unsuitable for financial history.

---

## 3. Product principles

1. **One application, one operational database, one design system.**
2. **Named users, never anonymous shared access.** Every action must be attributable to one staff member.
3. **The six-digit gate is a secure authentication interface, not a permanent shared PIN.**
4. **Permissions are enforced on the server.** The UI reflects permissions but never acts as the security boundary.
5. **Financial documents become immutable when issued.** Corrections use controlled status changes, revisions, credit notes, or voiding.
6. **The database owns truth.** Totals, permissions, status transitions, document numbers, and audit records are server-authoritative.
7. **Founder attention is reserved for exceptions.** Normal work should flow without turning every action into an approval bottleneck.
8. **Useful before broad.** Ship coherent vertical slices before adding more modules.
9. **No invented company facts.** Bank details, tax settings, addresses, signatures, prices, and legal statements require verified configuration.
10. **Desktop-efficient, mobile-safe.** Daily management is optimized for desktop and tablet; urgent review and approval remain usable on mobile.

---

## 4. Users and role-based access

Use two roles now. Keep permission checks capability-based so more roles can be added later without rewriting every route.

### Admin Manager

The operational role. It should be able to:

- View the operational dashboard and assigned/company-wide work.
- Create and maintain leads, clients, contacts, projects, milestones, and tasks.
- Create and edit invoice, proforma, and recurring drafts.
- Issue ordinary invoices within approved company rules.
- Record payments with a reference and supporting note.
- Send, resend, download, and share approved documents.
- Update operational statuses and internal notes.
- View standard reports needed for daily work.

It must not be able to:

- Invite, disable, or change the role of another administrator.
- Change authentication, session, or security settings.
- Change verified company identity, bank details, numbering policy, or tax defaults.
- Hard-delete records or erase audit history.
- Void paid invoices, reverse payments, backdate issued records, or override locked accounting periods.
- Export all company data or view secrets.

### Founder Admin

The control and oversight role. It receives every Admin Manager permission plus:

- Manage admin users, invitations, suspensions, role changes, and session revocation.
- Approve high-risk or exceptional financial actions.
- Configure verified company, payment, numbering, currency, tax, and document defaults.
- Void documents, reverse payments, reopen locked work, and approve sensitive corrections with reasons.
- View the complete audit trail, security events, exports, and system health.
- Export company data and manage retention.
- Configure thresholds and approval rules.
- Access all dashboards, reports, clients, projects, and settings.

### Initial permission matrix

| Capability | Admin Manager | Founder Admin |
|---|:---:|:---:|
| View dashboard, clients, projects, tasks, billing | Yes | Yes |
| Create and edit operational records | Yes | Yes |
| Issue ordinary invoices | Yes, within policy | Yes |
| Manage recurring schedules | Yes | Yes |
| Record a payment | Yes | Yes |
| Reverse a payment | No | Yes, reason required |
| Void an issued invoice | Request only | Yes, reason required |
| Change company/payment/tax/numbering settings | No | Yes |
| Manage admin users and roles | No | Yes |
| View complete security and audit logs | Own/relevant activity only | Yes |
| Export all data | No | Yes, re-authentication required |
| Hard-delete operational history | No | No; use retention workflow |

---

## 5. Six-digit access design

### Required experience

The login screen uses:

- A named identity selector or verified work email.
- Six separate visual code cells backed by one semantic input.
- Numeric keyboard on mobile, full-code paste, arrow/backspace behavior, visible focus, loading, error, locked, and expired states.
- A generic failure message that does not reveal whether an identity exists.
- A clear recovery route controlled by the Founder Admin.

### Security decision

A static six-digit value has only one million combinations. It must not be treated as an industry-standard password or shared indefinitely.

Use the same six-digit UI with a staged verifier:

1. **Bootstrap only:** two named initial users are configured server-side. Environment variables may contain a strong hash/peppered verifier for a temporary six-digit bootstrap code, never the raw code in browser-exposed variables.
2. **Production enrollment:** each named user enrolls a rotating TOTP authenticator. The six-digit value changes every 30 seconds and is accepted only once in its validity window.
3. **Private deployment layer:** the admin route should additionally sit behind the selected hosting/platform access restriction where available.
4. **Recovery:** Founder recovery uses single-use recovery codes stored as hashes. A manager cannot recover or elevate their own account.

The temporary environment code path must automatically disable after successful enrollment or by a short expiry date. If the business deliberately keeps a static code for the first internal pilot, label that release **pilot-only**, limit it to named accounts, and require the controls below.

### Mandatory controls

- Database-backed attempt tracking by account and network signal.
- Progressive delay and temporary lock after repeated failures; start strict, for example 5 attempts within 15 minutes.
- No unlimited retry after server restart.
- Constant-time verifier comparison.
- TOTP replay prevention.
- Secure, HTTP-only, same-site cookies; rotate the session identifier after authentication.
- 30-minute idle timeout and 8-hour absolute session lifetime for normal use.
- Re-authentication for user management, exports, payment reversal, voiding, and sensitive settings.
- Server-side session revocation and “sign out all devices”.
- Production must refuse to boot the admin module when required security or database secrets are missing.
- No `NEXT_PUBLIC_` authentication secrets and no authentication secrets in logs.
- Audit successful login, failed login, lockout, recovery, session revocation, and sensitive action attempts.

### Proposed environment contract

Exact variable names can be finalized during implementation, but the contract should be equivalent to:

```text
ADMIN_ENABLED=true
ADMIN_SESSION_SECRET=<at least 32 random bytes>
ADMIN_CODE_PEPPER=<separate high-entropy secret>
ADMIN_FOUNDER_EMAIL=<verified named user>
ADMIN_FOUNDER_BOOTSTRAP_CODE_HASH=<temporary verifier only>
ADMIN_MANAGER_EMAIL=<verified named user>
ADMIN_MANAGER_BOOTSTRAP_CODE_HASH=<temporary verifier only>
DATABASE_URL=<existing CockroachDB connection>
ADMIN_BASE_URL=https://www.bespoketech.com.ng/admin
ADMIN_CRON_SECRET=<high-entropy scheduler secret>
```

Do not create separate role-wide shared accounts. The initial two users may map one-to-one to the two roles, but the schema must support multiple named users later.

---

## 6. Information architecture

Use the visual structure of `dashboard-desktop.png`: fixed left navigation, clear top bar, light cool-grey canvas, white panels, restrained borders/shadows, blue primary actions, compact metrics, and readable tables.

### Primary navigation

1. **Overview** — company command centre.
2. **Sales** — leads, opportunities, proposals, and pipeline.
3. **Clients** — companies, contacts, communication notes, billing and project history.
4. **Projects** — delivery status, milestones, tasks, owners, due dates, and risks.
5. **Billing** — invoices, proformas, recurring schedules, payments, receipts, and document exports.
6. **Inbox** — website contact submissions and internal follow-ups when integrated.
7. **Reports** — revenue, receivables, pipeline, delivery, and workload.
8. **Activity** — relevant operational history; full audit view for Founder Admin.
9. **Settings** — company, document, notification, access, and system settings.

### Overview dashboard

Replace the invoice-only summary with a layered command centre:

- **Primary metrics:** outstanding receivables, paid this month, active projects, open leads.
- **Attention queue:** overdue invoices, invoices awaiting approval, late milestones, unassigned leads, failed recurring jobs.
- **Work view:** projects at risk, upcoming deadlines, manager tasks, recent client activity.
- **Finance view:** revenue trend, aging buckets, recurring value, payments received.
- **Founder strip:** approvals, security alerts, system health, and high-value exceptions. Hidden for Admin Manager where inappropriate.
- **Recent activity:** human-readable, attributable events with links to the affected record.

Dashboard numbers must link to their filtered underlying records and state their time range. Avoid decorative metrics that cannot drive an action.

---

## 7. Functional modules

### 7.1 Admin shell and global behaviour

- `/admin` route group with a dedicated layout that does not render the public marketing header/footer.
- Responsive sidebar based on the invoice dashboard reference.
- Global search across clients, invoices, projects, and leads.
- Quick-create menu for lead, client, project, task, and billing document.
- Notification/attention centre for actionable events, not generic noise.
- Breadcrumbs on deep records and a consistent page-header pattern.
- Permission-aware navigation with server-enforced access behind every destination.
- Consistent loading, empty, error, success, stale-data, offline, and unauthorized states.

### 7.2 Sales and leads

- Capture website enquiries and manually entered leads.
- Lead fields: source, company/person, contact details, requested service, owner, value range, stage, next action, next-action date, notes.
- Pipeline stages: new, qualified, discovery, proposal, negotiation, won, lost, archived.
- Convert a won lead into a client and optional project without retyping data.
- Track reasons for lost opportunities.
- Admin Manager handles the pipeline; Founder Admin can view all performance and override ownership.

### 7.3 Client management

- First-class client company and contact records.
- Multiple contacts per client with one billing contact.
- Billing address, currency preference, tax identifiers only when verified, payment terms, and internal notes.
- Timeline containing leads, projects, documents, payments, notes, and key changes.
- Duplicate detection by normalized company name, email, and phone.
- Archive instead of delete when financial or project history exists.
- Store an immutable client snapshot on every issued financial document so future profile edits do not rewrite history.

### 7.4 Projects and delivery

- Project fields: client, service/category, owner, status, priority, commercial value, start/due dates, health, summary, and internal notes.
- Statuses: planned, active, blocked, review, completed, on hold, cancelled.
- Milestones with owner, due date, completion state, and risk flag.
- Tasks with assignee, priority, due date, status, and project relationship.
- Project detail view with summary, timeline, milestones, tasks, linked invoices, and client context.
- Risk/overdue cues must use text and icons as well as colour.
- Initial release does not need time tracking, chat, Gantt charts, or complex resource planning.

### 7.5 Billing and documents

Port and strengthen the invoice prototype:

- Standard invoices: `BT-INV-YYYY-####`.
- Proforma invoices: `BT-PRO-YYYY-####`.
- Recurring templates: `BT-REC-YYYY-####`.
- NGN default with USD, GBP, and EUR available.
- Live calculations for quantity, rate, line discount, tax, amount paid, and balance.
- A4 live preview and server-generated PDF using the approved Bespoke Technologies assets.
- Draft autosave with an explicit saved state and conflict handling.
- Client selection from the client directory with a document snapshot.
- Payment terms and verified payment instructions from controlled company settings.
- Download, print, email/share workflow, and delivery history.
- Recurring schedules with active, paused, completed, and failed states.
- Payment records separate from invoices; partial payment and reconciliation supported.
- Receipt generation from recorded payments as a later billing slice.

#### Financial lifecycle

- Invoice: draft → pending approval when required → approved → sent/viewed → partially paid → paid or overdue → voided.
- Proforma: draft → sent → accepted/expired → converted to invoice or voided.
- Recurring schedule: draft → active → paused → ended, with each generated invoice linked to its source schedule.
- An issued number is never silently reused.
- Document numbers are allocated atomically on the server, not by listing and incrementing in application memory.
- Issued documents are immutable. Any exceptional edit creates a revision event and requires the appropriate permission.
- Deletion is allowed only for never-issued drafts and still creates an audit event.
- “Sent” must represent a successful delivery handoff, not a button click. Delivery failure remains visible and retryable.

### 7.6 Payments and receivables

- Record payment amount, date, method, reference, currency, note, and actor.
- Apply one or more payments to an invoice.
- Compute balance from payment records; do not trust a client-submitted balance.
- Aging views: not due, 1–30, 31–60, 61–90, and 90+ days overdue.
- Payment reversal requires Founder Admin re-authentication and a reason.
- No payment gateway is required for the first release; manual payment recording is sufficient and useful now.

### 7.7 Reports and founder oversight

- Revenue received by month and currency.
- Outstanding and overdue receivables with aging.
- Invoice conversion and payment time.
- Pipeline value by stage and source.
- Projects by health, status, owner, and lateness.
- Recurring billing value and failed schedule runs.
- Activity and security events by user, action, and date.
- CSV export must be permission-controlled, recorded in audit history, and re-authenticated when company-wide.
- Reports must expose definitions and filters; currency totals must not be falsely combined without an explicit conversion policy.

### 7.8 Settings and administration

- Company identity: approved logo, registration number, website, contact information, address when verified.
- Billing: numbering, default terms, currencies, payment instructions, tax behaviour, approval thresholds.
- People and access: named users, roles, state, last login, active sessions, recovery, revocation.
- Notifications: overdue reminders, approval requests, recurring failures, project risks.
- System health: database connection, job status, last backup/export confirmation, mail delivery status.
- Audit: append-only security and business-critical events.

---

## 8. Technical architecture

### Application boundary

Recommended route layout:

```text
src/app/
  (public)/...                  public Bespoke Technologies website
  admin/
    login/page.tsx
    (protected)/
      layout.tsx
      page.tsx                 overview
      sales/
      clients/
      projects/
      billing/
      reports/
      activity/
      settings/
    api/                       only if route handlers are preferable to actions
```

The existing public routes do not need to move immediately. The important boundary is a dedicated admin layout and server protection for all admin entry points.

### Server layers

```text
UI / Server Components
        ↓
Server Actions and Route Handlers
        ↓
Authentication + Authorization Policy
        ↓
Admin Data Access Layer / Domain Services
        ↓
CockroachDB through DATABASE_URL
        ↓
Audit event written in the same transaction where possible
```

Rules:

- Mark authentication, database, PDF, and authorization modules `server-only`.
- Create one `verifySession()` path and capability helpers such as `requirePermission("invoice.issue")`.
- Re-check permissions in every Server Action and Route Handler.
- Use DTOs so browser components receive only fields needed for the screen.
- Validate all mutations with Zod on the server.
- Use database transactions for numbering, payments, role changes, recurring generation, and linked audit events.
- Avoid a second Supabase data store. Extend the existing CockroachDB/Postgres-compatible access path unless a later architecture decision explicitly replaces it.
- Keep PDF rendering deterministic and server-side.
- Use an outbox/job model for delivery and reminders so a request timeout does not create a false “sent” state.

### Suggested code domains

```text
src/features/admin-auth/
src/features/admin-shell/
src/features/admin-dashboard/
src/features/crm/
src/features/projects/
src/features/billing/
src/features/reports/
src/features/audit/
src/lib/db/
src/lib/permissions/
```

Do not move the invoice prototype directory wholesale into `src`. Port domain logic deliberately, reuse root dependencies and components, and add focused regression tests while porting.

---

## 9. Data model

Use migrations in the root `migrations/` directory and the existing `DATABASE_URL`. Names below are directional; final SQL should follow CockroachDB-supported types and constraints.

### Identity and security

- `admin_users`: id, email, name, role, state, enrolled_at, last_login_at, created_at, updated_at.
- `admin_authenticators`: user_id, type, encrypted/derived credential data, last_used_step, recovery metadata.
- `admin_sessions`: id, user_id, token_hash, created_at, last_seen_at, expires_at, revoked_at, network/device metadata.
- `admin_login_attempts`: identity hash, network hash, outcome, attempted_at.
- `admin_audit_events`: actor_user_id, action, entity_type, entity_id, reason, safe before/after metadata, request correlation, created_at.

### CRM and delivery

- `clients`
- `client_contacts`
- `leads`
- `lead_activities`
- `projects`
- `project_milestones`
- `tasks`
- `operational_notes`

### Billing

- `billing_documents`: type, number, client_id, snapshot fields, status, dates, currency, totals, issue metadata, revision.
- `billing_document_items`: description, quantity, unit rate, discount, tax, sort order, computed totals.
- `billing_document_events`: transitions, delivery, approval, view, revision, void events.
- `recurring_schedules`: cadence, next run, end date, state, source document/template.
- `payments`: amount, currency, paid_at, method, reference, state, recorded_by.
- `payment_allocations`: payment-to-document allocations.
- `document_sequences`: prefix/year/next value with transactional allocation.
- `delivery_outbox`: channel, destination, payload reference, attempts, state, error, next attempt.

### Configuration

- `company_settings`: verified identity and controlled defaults, with change history.
- `approval_policies`: action, threshold, required role, enabled state.
- `notification_preferences`: user/event/channel preferences.

### Data rules

- Use UUIDs for entity IDs and unique constraints for document numbers and normalized user emails.
- Use integer minor units or a carefully defined decimal strategy for money; never JavaScript floating-point values as the persistent accounting authority.
- Keep currency on every monetary record.
- Keep immutable snapshots on issued documents.
- Prefer state fields plus archival timestamps over deletion.
- Audit metadata must exclude credentials, full session tokens, TOTP secrets, and unnecessary client-sensitive values.

---

## 10. Delivery plan: vertical slices

Estimates are implementation ranges for one focused engineer/agent and should be recalibrated after Slice 0. Every slice ends with a deployable, testable outcome.

### Slice 0 — Architecture lock and prototype extraction map

**Estimate:** 1–2 working days  
**Outcome:** one agreed application boundary and no ambiguous data/auth direction.

Work:

- Confirm `/admin` as the route boundary and CockroachDB as the operational store.
- Inventory invoice prototype files into port, adapt, replace, or discard.
- Define capability names and the role matrix.
- Approve login identity model and rotating-code enrollment.
- Define migration ordering, environment contract, deployment environment, email provider decision gate, and backup expectation.
- Capture desktop and mobile admin-shell target states before implementation.

Exit gate:

- Architecture decision record accepted.
- No raw/static production code is presented as OTP.
- Invoice prototype extraction map is complete.
- The root repository remains the only deployable product target.

### Slice 1 — Secure admin foundation

**Estimate:** 4–6 working days  
**Outcome:** Founder Admin and Admin Manager can securely enter an empty production-ready admin shell.

Work:

- Add admin users, authenticators, attempts, sessions, and audit migrations.
- Implement six-digit login, bootstrap enrollment, rotating TOTP verification, recovery codes, logout, timeout, and revocation.
- Implement server-side data-access and permission guards.
- Build the reference-based admin shell, responsive navigation, account menu, unauthorized and locked states.
- Add founder user/access screen and active-session controls.
- Add security headers, origin checks, generic auth errors, rate limiting, and fail-closed configuration validation.

Exit gate:

- Both roles have named accounts and receive the correct navigation.
- Direct URL and direct mutation attempts are denied server-side.
- Brute-force, replay, expired code, revoked session, and missing-secret tests pass.
- Login and sensitive security events appear in the Founder audit view.
- Keyboard-only login and mobile code entry pass manual QA.

### Slice 2 — Billing core port

**Estimate:** 6–9 working days  
**Outcome:** Bespoke Technologies can create, issue, download, and track professional standard and proforma invoices from the main admin system.

Work:

- Port brand, invoice types, validation, math, editor, A4 preview, and PDF generator.
- Replace prototype storage with normalized CockroachDB billing tables.
- Add first-class clients/contact selection and immutable document snapshots.
- Implement atomic numbering and approved financial state transitions.
- Add drafts, approvals where required, issue, PDF download, void request, revision history, search, filters, pagination, and dashboard billing metrics.
- Preserve the accepted demo-invoice appearance and verified company facts.

Exit gate:

- The main app reproduces or improves the approved PDF without regression.
- Duplicate numbering is prevented under concurrent creation.
- Issued documents cannot be silently edited or deleted.
- Manager and Founder permission scenarios pass.
- Calculation, validation, PDF, API/action, accessibility, and responsive tests pass.

### Slice 3 — Payments and recurring billing

**Estimate:** 4–6 working days  
**Outcome:** receivables and repeat work are operationally trustworthy.

Work:

- Add payment records, allocations, partial payment, balance, reversal control, and aging.
- Port recurring templates into dedicated schedules with pause/resume/end/failure states.
- Add idempotent scheduled generation with job history and retries.
- Add receipts generated from payments if approved for this release.
- Add outstanding, overdue, paid-this-month, recurring-value, and failed-job dashboard views.

Exit gate:

- Totals reconcile from line items and payment allocations.
- Running the same scheduled job twice does not duplicate invoices.
- A failed run is visible and retryable.
- Payment reversal is Founder-only, re-authenticated, and audited.

### Slice 4 — CRM and sales pipeline

**Estimate:** 5–7 working days  
**Outcome:** enquiries progress into clients, projects, and billing without duplicated entry.

Work:

- Add leads, stages, owner, next action, notes, source, value range, and filters.
- Add first-class clients and contacts with history and duplicate detection.
- Add lead-to-client conversion.
- Connect website contact submissions through a validated server boundary.
- Add pipeline metrics and overdue follow-up attention items.

Exit gate:

- A website/manual lead can become a client and billing draft without retyping identity data.
- Lost reasons, ownership, next actions, and histories remain reportable.
- Client archives preserve related billing and project history.

### Slice 5 — Project delivery operations

**Estimate:** 5–8 working days  
**Outcome:** the team can oversee active delivery and connect work to commercial records.

Work:

- Add projects, milestones, tasks, owners, dates, health, risk, and project timeline.
- Link projects to clients, leads, invoices, and payments.
- Add “my work”, overdue work, upcoming deadlines, blocked work, and projects-at-risk views.
- Add founder portfolio view and operational activity history.

Exit gate:

- A won lead can become a project with milestones and an invoice.
- Overdue/blocked states are visible without relying on colour alone.
- Role restrictions and cross-record links are verified.

### Slice 6 — Founder oversight, reports, and controlled settings

**Estimate:** 4–7 working days  
**Outcome:** the Founder Admin can oversee the company and control exceptions without editing the database directly.

Work:

- Add receivables, revenue, pipeline, delivery, workload, recurring, security, and activity reports.
- Add approval queue and configurable thresholds.
- Add company/document/payment settings with change history.
- Add controlled CSV exports and retention/archive workflows.
- Add system health, job health, and delivery status views.

Exit gate:

- Every metric is defined and links to its filtered records.
- Multi-currency figures are not falsely aggregated.
- Sensitive settings and exports require re-authentication and are audited.
- Founder actions have reasons and visible outcomes.

### Slice 7 — Production hardening and release

**Estimate:** 3–5 working days  
**Outcome:** a deliberately launched internal system with documented operations and rollback.

Work:

- Full permission, financial lifecycle, authentication, recovery, and audit scenario testing.
- Desktop, tablet, and mobile browser QA.
- Accessibility review against practical WCAG 2.2 expectations.
- Load and concurrency checks for login throttling, numbering, dashboard queries, and recurring jobs.
- Backup/restore rehearsal, migration rehearsal, rollback plan, incident runbook, and secret rotation procedure.
- Production environment validation and post-deployment smoke checks.
- Remove or quarantine preview-only authentication/storage fallbacks from the production path.

Exit gate:

- Typecheck, lint, unit, integration, end-to-end, build, and PDF regression checks pass.
- No P0/P1 security, financial-integrity, accessibility, or data-loss findings remain.
- Founder and Manager complete acceptance scenarios with real devices.
- Monitoring, backup, recovery, and ownership are documented.

---

## 11. Test strategy

### Unit tests

- Permission decisions and role boundaries.
- Code verification windows, replay blocking, lockout timing, and session expiry.
- Invoice and payment calculations using minor units/defined decimals.
- State-transition rules.
- Number formatting, sequence allocation, recurrence advancement, and aging buckets.
- Zod validation and DTO redaction.

### Integration tests

- Login → session → authorized data access → logout/revocation.
- Manager denial and Founder approval for each sensitive action.
- Client → invoice → issue → payment → paid lifecycle.
- Lead → client → project → invoice relationships.
- Recurring generation idempotency and retry.
- Audit record created with the business mutation.
- Database constraint and transaction behaviour.

### End-to-end scenarios

1. Founder enrolls, signs in, creates the named Manager account, and revokes a session.
2. Manager signs in with six digits, creates a client, prepares a standard invoice, issues it, and downloads the PDF.
3. Manager creates a proforma and converts the accepted document into an invoice without duplicate entry.
4. Manager records a partial payment; the dashboard and aging view update correctly.
5. Manager requests a void/payment reversal; Founder re-authenticates and approves or rejects with a reason.
6. A recurring run creates exactly one invoice, then advances the schedule.
7. A lead converts into a client and project with linked billing.
8. Direct requests attempting role escalation, hidden actions, ID changes, or stale updates fail safely.

### Visual and accessibility QA

- Compare the implemented admin overview at the same desktop viewport as `dashboard-desktop.png`.
- Compare every generated document against the accepted invoice QA output.
- Verify 390 × 844, tablet, standard laptop, and wide desktop layouts.
- Test keyboard navigation, focus order, code paste, screen-reader names, error announcement, reduced motion, contrast, zoom to 200%, and tables on small screens.

---

## 12. Definition of done for every slice

A slice is complete only when:

- The user journey works end to end with realistic data.
- Both roles have explicit allow and deny tests.
- Mutations validate, authorize, transact, and audit on the server.
- Loading, empty, error, success, unauthorized, and retry states exist.
- Mobile and desktop layouts are manually checked.
- Keyboard and basic screen-reader behaviour are checked.
- Relevant unit/integration/end-to-end tests, lint, typecheck, and build pass.
- Migration, environment, deployment, and rollback notes are updated.
- Known limits are recorded truthfully.

---

## 13. First-release scope boundary

### Must ship

- Named Founder Admin and Admin Manager access.
- Hardened six-digit authentication flow and secure sessions.
- Server-side RBAC and audit history.
- Admin overview and attention queue.
- Clients and contacts.
- Standard, proforma, and recurring invoices.
- Approved PDF generation, invoice history, atomic numbering, and controlled lifecycle.
- Payments, partial balances, overdue state, and recurring job visibility.
- Leads, projects, milestones, and tasks.
- Founder approvals, user management, sensitive settings, exports, and system health.

### Deliberately later

- Native mobile application.
- Payroll, HR, leave, attendance, or employee performance management.
- Full accounting ledger, bank feeds, inventory, procurement, or statutory tax filing.
- Complex time tracking, Gantt planning, chat, or video meetings.
- Customer self-service portal.
- Payment gateway and automatic bank reconciliation.
- AI-generated financial decisions or unsupervised messaging.
- Multi-company/tenant architecture.

These are separate products or later modules. They should not delay a reliable internal command centre.

---

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Static six-digit code is guessed or shared | Unauthorized access | Temporary bootstrap only; named users, TOTP, throttling, private access layer, session controls, audit |
| Two separate apps drift | Duplicate dependencies and inconsistent product behaviour | Port the invoice domain into the root app; one deployment and design system |
| Supabase and CockroachDB split operational truth | Reporting and consistency failures | Use the existing root `DATABASE_URL` path for admin operational data |
| Client edits alter historical invoices | Financial record corruption | Immutable client/company snapshots on issued documents |
| Concurrent invoice creation duplicates numbers | Broken document integrity | Transactional sequence allocation and unique database constraint |
| UI-only role restrictions are bypassed | Privilege escalation | Central server-side DAL and permission checks on every mutation/read |
| Every action requires Founder approval | Operational bottleneck | Approve only configured high-risk exceptions and thresholds |
| Report totals combine currencies incorrectly | Misleading oversight | Separate by currency unless a documented conversion rate/date is applied |
| “Sent” status is recorded before real delivery | False operational state | Delivery outbox with success/failure/retry events |
| Broad ERP scope delays useful release | No usable outcome | Vertical slices and strict first-release boundary |

---

## 15. Standards and implementation references

- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication): centralize authorization in a data-access layer and re-check access in Server Actions and Route Handlers.
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security): treat every server mutation entry point as externally callable and authorize it explicitly.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): generic auth errors, MFA, throttling, re-authentication, and logging guidance.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): secure session lifecycle, revocation, and re-authentication after risk events.
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html): rate limiting and authenticator requirements for short numeric outputs.
- WCAG 2.2 practical expectations already required by the repository `AGENTS.md`.

---

## 16. Recommended first implementation ticket

Start with **Slice 0 and Slice 1 only**:

> Integrate a protected `/admin` shell into the root Next.js app; add named Founder Admin and Admin Manager users; implement the six-digit bootstrap/enrollment and rotating verification flow; add database-backed sessions, server-side permission guards, throttling, revocation, and an audit view; reproduce the structure and visual restraint of `dashboard-desktop.png`; and prove the complete allow/deny scenario matrix before porting invoice features.

This creates the safe foundation on which every later admin module can be added without reworking identity, permissions, navigation, or data boundaries.
