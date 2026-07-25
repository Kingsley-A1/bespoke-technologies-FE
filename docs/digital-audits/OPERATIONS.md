# Digital Readiness Audit operations

## Production contract

The audit is a native Next.js feature at `/digital-readiness-audit`. CockroachDB is the source of truth for context, answers, progress and completed report snapshots. The browser never supplies an authoritative score.

Required production configuration:

- `DATABASE_URL`
- `DIGITAL_AUDIT_HASH_PEPPER` with at least 32 random characters
- the existing admin, Turnstile and Resend configuration documented in `.env.example`

Run `pnpm migrate` before deploying application code. Migration `009_create_digital_audits.sql` is additive, so an application rollback does not require a destructive database rollback.

## Lifecycle

- A record begins only when the context step is submitted.
- Answers are saved one at a time as `started` or `in_progress`.
- The same-device resume credential lasts for the 90-day incomplete retention window.
- Completion requires six stored answers and is recalculated on the server.
- The read-only report uses a separate random share token.
- Admin management state is separate from public assessment status.
- CRM conversion requires contact details and explicit follow-up consent, is idempotent and writes the audit summary into lead activity.

## Retention and privacy

- Incomplete, unconverted audits are deleted after 90 days without activity.
- Completed, unconverted audits are anonymised after 24 months.
- Converted records remain linked to the CRM retention lifecycle.
- The scheduled admin maintenance endpoint applies retention.
- Shared reports contain no email, phone or resume credential.
- Founder-only CSV export neutralises spreadsheet formula prefixes.

## Release procedure

1. Set `DIGITAL_AUDIT_HASH_PEPPER` in staging and production.
2. Run `pnpm migrate` against staging.
3. Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build`.
4. Complete one audit without contact details and one with email plus consent.
5. Interrupt an audit after three answers and verify it appears as incomplete in `/admin/digital-audits`.
6. Reload the browser and verify same-device resume.
7. Complete the audit and verify the score is persisted and the report link is read-only.
8. Verify copy, native share where supported, print/PDF and email delivery.
9. Revoke and regenerate the share link from admin.
10. Convert the audit to a lead twice; verify only one lead exists.
11. Confirm Manager can manage audits but cannot export, while Founder can export.
12. Run the scheduled maintenance endpoint in staging and inspect retention queries.

## Monitoring

Monitor public endpoint error rates, answer-save failures, audit completion rate, stale incompletes, report email failures and CRM conversions. Do not log answer content, contact details, resume tokens or share tokens.
