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
