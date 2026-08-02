# Bespoke Learn V1 operations

Bespoke Learn shares the existing Next.js application, CockroachDB, R2 and Resend integrations. It does not create a second backend, public learner does not use `admin_users`, and Admin authentication does not authorise learner routes.

## Launch state

V1 is deliberately public-ready with no courses in the catalogue. Do not add seed courses, lessons, publisher rows, synthetic content or fixtures to a shared environment. A reviewed course is created privately through `/admin/learn`, then explicitly validated by an Admin with `learn.manage` and published by a recently authenticated Admin with `learn.publish`.

## Environment

Set `LEARN_SESSION_SECRET` and `LEARN_CODE_PEPPER` to different random values of at least 32 characters. They are not substitutes for any `ADMIN_*` secret. Production also needs the existing `DATABASE_URL`, `RESEND_API_KEY` and configured R2 credentials.

## Migration and recovery

`migrations/015_create_bespoke_learn.sql` is additive and has no content or seed inserts. It has not been applied by this work.

Before a release, a designated operator must review the target `DATABASE_URL`, obtain a CockroachDB backup/restore point, apply the migration in a controlled environment, inspect the `learn_*` tables and run the migration/contract tests. Do not run `pnpm migrate` against an unverified connection string.

Rollback is a release rollback first: stop Learn traffic and restore the database from the pre-migration backup if removal is required. Do not drop `learn_*` tables in a live shared database as an ad-hoc rollback; the migration is additive and later data may be material.

## Brand derivative procedure

The source identity files remain read-only under `Learn/`. The automated test verifies their supplied SHA-256 values. `public/learn/brand/bespoke-learn-mark.png` is a byte copy of `Learn/Bepsoke-Learn-Logo.png`.

`public/learn/brand/bespoke-learn-lockup.png` is the sole presentation derivative. It was created from `Learn/Bespoke-learn-logo-with-name.png` with FFmpeg's deterministic crop `crop=1070:680:95:270`: left 95px, top 270px, width 1070px and height 680px. This retains every logo and wordmark pixel with neutral surrounding canvas and excludes the lower-left `Concept 4` annotation. It was visually inspected alongside the source. No colour, geometry, mark or wordmark pixels were changed.

## Domain readiness

The proxy recognises `learn.bespoketech.com.ng`; this code does not modify DNS or attach a Vercel domain. Before going live, attach the hostname through the approved deployment process, confirm TLS, set the canonical hostname and test sitemap/robots plus anonymous and learner session routes.

## Authoring and publishing

`/admin/learn` is distinct from the employee-development workspace at
`/admin/learning`. Staff create a private course draft, complete factual
course metadata, add first-class authors, upload course-owned assets, and
build ordered modules, lessons and typed blocks. The editor supports only the
registered V1 block types: rich text, callout, image, slides, video, audio,
download, quiz, interactive and reflection.

Saving a draft never publishes it. Validation checks the hierarchy, review
date, authorship, block schemas, asset ownership/type and required
accessibility data. A recent `learn.publish` authorisation is required for
publication, grants, revocations and archive. Published versions are never
edited: create a draft revision instead, which preserves learner records on
the earlier version. Draft preview and draft assets require Admin access and
are not routed through public learner delivery.

To add a renderer in a future reviewed change, add a strict schema to
`src/features/learn/content/schemas.ts`, registry metadata in
`content/registry.ts`, a constrained editor, a renderer, accessibility and
interaction states, publication validation, and unit/browser coverage. Do not
add raw HTML, arbitrary JSON, scripts, iframes or database-supplied code.

## Explicit V1 deferrals

No checkout, Paystack integration, prices, products, receipts, certificates,
organisation seats, teams, marketplace or external-publisher UI is shipped.
Future payment and organisation adapters should grant/revoke entitlement in
response to a verified business event. Future certification should consume a
version-pinned completion event; it must not alter the content, entitlement or
learner-identity model.
