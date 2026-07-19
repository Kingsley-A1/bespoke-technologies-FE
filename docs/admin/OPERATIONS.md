# Admin Operations Runbook

## Before the database connection is supplied

The app runs the full admin workflow with deterministic in-memory records when `ADMIN_DEMO_MODE=true` outside production. The login page displays the two local verification identities. Demo data is intentionally not durable.

## Production setup

1. Obtain the CockroachDB connection string and set `DATABASE_URL` only in the hosting environment.
2. Run `pnpm admin:totp` twice. Enrol the first secret in the Founder Admin authenticator and the second in the Admin Manager authenticator.
3. With the final `ADMIN_CODE_PEPPER` set, run `pnpm admin:recovery` once per role. Store the displayed codes offline and set only the generated hash list in that role's `ADMIN_*_RECOVERY_HASHES` variable.
4. Configure every `ADMIN_*` variable documented in `.env.example`. Set `ADMIN_DEMO_MODE=false` and `ADMIN_ALLOW_BOOTSTRAP=false`.
5. Use independent high-entropy values for `ADMIN_SESSION_SECRET`, `ADMIN_CODE_PEPPER`, and `ADMIN_CRON_SECRET`.
6. Run the production verifier in an environment that contains the production variables. In PowerShell: `$env:NODE_ENV='production'; pnpm admin:verify`.
7. Run `pnpm migrate`. The runner records each applied root migration in `app_migrations` and is safe to run again.
8. Deploy, then complete the post-deployment checks below.

Never paste the database string, TOTP secret, access code, session secret, code pepper, or cron secret into source control, chat screenshots, logs, or browser-visible variables.

## Post-deployment checks

- Public marketing routes render without admin chrome.
- `/admin` redirects an unauthenticated request to `/admin/login`.
- Founder and Manager can each sign in with their own rotating code.
- A reused TOTP code is rejected.
- Five failed attempts produce a temporary lock.
- Manager cannot open Activity, mutate users/settings, reverse payments, void documents, or export all data.
- Founder can perform those actions after recent re-authentication.
- Client → billing draft → approval → confirmed manual delivery → PDF → partial payment → paid works.
- Proforma → accepted → standard invoice works without retyping services.
- Running the recurring endpoint twice for the same due date creates one invoice.
- Website contact submission appears in Inbox and converts to a lead.
- Lead, client, project, task, billing, payment, approval, export, and security actions appear in Activity.
- PDF shows the approved logo, company facts, Unicode currency symbols, totals, terms, and footer without clipping.

## Scheduler

Call `POST /admin/api/recurring/run` with:

```text
Authorization: Bearer <ADMIN_CRON_SECRET>
```

A daily schedule is sufficient. The database unique constraint on `(schedule_id, due_date)` makes a repeated run idempotent.
The same protected run reconciles overdue invoices and removes login-attempt plus expired/revoked-session records older than 90 days. Financial and admin audit history is never deleted by this retention job.

## Recovery

- Revoke a lost-device session from Admin Settings.
- Suspend a compromised Manager identity from Admin Settings.
- Rotate the affected TOTP secret, `ADMIN_SESSION_SECRET`, and/or `ADMIN_CODE_PEPPER` in the hosting environment according to the incident scope.
- A session-secret rotation invalidates every existing signed session cookie.
- Bootstrap access is disabled in production unless `ADMIN_ALLOW_BOOTSTRAP=true` is deliberately and temporarily set during a controlled recovery.
- Record the incident and recovery reason in the operational incident log; do not delete the corresponding admin audit history.

## Backup and rollback

- CockroachDB is the operational source of truth. Confirm the selected cluster backup/restore policy before launch.
- Rehearse restoring migrations and a recent backup into a non-production cluster.
- Application rollback may revert code, but must never roll back or reuse issued document numbers.
- Forward-fix financial records. Use void/reversal events instead of deleting issued documents or payments.

## Release checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm qa:admin-browser
```

Visual QA compares the implemented `/admin` overview with `Bespoke_Invoice_Generator_Source/qa/dashboard-desktop.png`. PDF QA compares a generated document with `Bespoke_Invoice_Generator_Source/qa/pdf-render/demo-invoice.png`.
