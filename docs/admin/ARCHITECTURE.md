# Admin Architecture Decision

## Status

Accepted for the first production release.

## Boundary

- The Bespoke Technologies public website and internal admin live in one Next.js application.
- The admin surface is rooted at `/admin` and uses a dedicated protected layout.
- `Bespoke_Invoice_Generator_Source` is a reference implementation only. Its proven billing domain code is ported into the root application; the nested app is not deployed.
- CockroachDB through the existing server-only `DATABASE_URL` is the operational source of truth.
- A seeded in-memory repository is allowed only when `ADMIN_DEMO_MODE=true` outside production so the complete system can be built and verified before a database connection string is supplied.

## Security boundary

- Users are named and mapped to `founder_admin` or `admin_manager`.
- Six-digit entry uses a rotating TOTP when a secret is configured. Fixed codes are restricted to explicit non-production demo/bootstrap mode.
- Authentication, authorization, session lookup, mutations, exports, and PDF generation are server-only.
- Every protected read and mutation checks capabilities at the server boundary.
- Sensitive actions require Founder Admin and a recorded reason.
- A document becomes `sent` only after an administrator confirms real manual delivery; approval alone never claims delivery.
- Production admin refuses insecure demo fallbacks.

## Domain boundary

The admin is divided into identity/audit, CRM, delivery, billing, reporting, and settings domains. Cross-domain actions use stable IDs and append audit events. Financial issue/payment transitions are transactional where a database is configured.

## Deployment contract

1. Apply root migrations in filename order.
2. Configure `DATABASE_URL`, named admin identities, TOTP secrets, and session secrets.
3. Build with demo mode disabled.
4. Run authentication, role, billing, recurring, export, and PDF smoke checks.
