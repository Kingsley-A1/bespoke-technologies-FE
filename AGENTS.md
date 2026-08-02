# Bespoke Technologies Repository Agent Guide

## Purpose and authority

This file governs agent work throughout this repository. It describes the repository as it exists now; it is not a historical frontend brief.

Use this order of authority when instructions conflict:

1. The user's current request and explicit constraints.
2. The nearest more-specific `AGENTS.md`, if one exists.
3. An approved product blueprint, ADR, mission or implementation plan for the workstream.
4. This guide.
5. General repository documentation.

`CLAUDE.md` delegates to this file. Do not maintain competing instructions there.

Repository code and migrations are the source of truth for implemented behaviour. A plan or README may describe intent, but it does not prove that a feature exists or works.

## What this repository is

`bespoke-technologies-FE` is the full-stack Bespoke Technologies web application, despite the legacy `FE` suffix. It is not frontend-only and there is no separate backend boundary for its current product surfaces.

The application currently uses:

- Next.js 16 App Router, React 19 and strict TypeScript.
- Tailwind CSS 4 and the repository's Bespoke design tokens.
- Route handlers and server actions for server-side behaviour.
- CockroachDB through the PostgreSQL-compatible `pg` driver.
- Ordered SQL migrations under `migrations/`.
- Cloudflare R2 through its S3-compatible API for managed files and images.
- Resend for transactional and operational email.
- Vercel AI SDK with Google Gemini for the public AI and Admin Coworker surfaces.
- Vitest, Testing Library and ESLint for automated verification.
- Vercel as the current application deployment target.

Do not create a second backend, authentication system, storage abstraction, email stack, design system or database access layer without first proving the existing implementation cannot support the requirement.

## Company and brand contract

Canonical runtime brand facts live in `src/lib/company.ts` and `src/lib/constants.ts`. Read those files before repeating contact details, social handles, legal names or public claims; do not copy an older value from documentation.

Stable identity rules:

- Company name: Bespoke Technologies.
- Primary website: `https://www.bespoketech.com.ng`.
- Public motto: “Engineering the solutions for this, and The Next Generations_”.
- “For Honor and For Excellence” is internal creed and values language. Do not add it to public marketing output, fixtures or generated content unless the user explicitly asks for an appropriate internal use.
- Use approved logos and assets from the repository. Never redraw, fabricate, approximate or silently substitute a brand asset.
- Never invent customers, partnerships, testimonials, metrics, prices, accreditations or product capabilities.

Legacy `ktf-*` token and symbol names remain internal implementation details. Do not expose King Tech Foundation as current public branding, but do not perform a risky mass rename merely to remove a legacy identifier.

## Product surfaces and ownership

The repository contains several connected surfaces:

- The public company website and its marketing, portfolio, library, contact and partnership experiences.
- Bespoke Admin under `/admin`, including operational data, employee work, publications, reviews, portfolio, ownership certificates, site assets and internal learning.
- Bespoke AI and the internal Coworker assistant.
- Digital Readiness Audit and its shareable reports.
- Team and document-verification subdomain experiences.
- Bespoke Learn, currently being specified and built as a multi-course learning product.

Do not assume all surfaces share the same audience, identity model, authorization policy or SEO rules.

### Bespoke Learn

For Learn work, read these files completely before planning or editing:

- `Learn/Bespoke_Learn_Blueprint.md` — product, architecture, scope and acceptance authority.
- `Learn/Agent-Prompt.md` — the current execution mission.

Important separation:

- Existing `/admin/learning` is the employee learning-goal and certification workspace. Preserve it.
- New Bespoke Learn publishing operations belong under `/admin/learn` unless the approved blueprint changes that decision.
- Learner identity and enrolment are not automatically equivalent to employee Admin identity or permissions.
- V1 publishing is owned by Bespoke Technologies and authorised team members, while the data model must preserve an intentional future path for external publishers.

If the blueprint, prompt and current code disagree, report the conflict before making a structural or irreversible choice.

## Repository map

- `src/app/` — App Router pages, layouts, metadata, route handlers and server actions.
- `src/features/admin/` — Admin domain logic, authorization, repositories, UI and tests.
- `src/lib/` — shared company, email, AI, SEO, storage and utility modules.
- `src/components/` — reusable public application components.
- `migrations/` — ordered CockroachDB schema migrations. Existing numbers are immutable.
- `scripts/` — migrations, Admin provisioning/configuration and browser QA utilities.
- `public/` — committed public assets, including approved brand assets.
- `Learn/` — Bespoke Learn product blueprint, execution brief and supplied logo assets.
- `qa/` and `design-qa.md` — browser and visual QA resources.
- `.env.example` — environment contract. Never place working credentials in documentation or committed files.

## Working method

### Before editing

1. Read the user's full request and identify the actual outcome.
2. Inspect `git status`; assume existing changes belong to the user.
3. Read the execution path, its tests and any governing blueprint or ADR.
4. Search for existing components, repositories, schema, permissions and design patterns before adding new ones.
5. Separate verified implementation from planned, seeded, mocked or environment-dependent behaviour.
6. Identify security, data-migration, deployment and backwards-compatibility risks.

Ask only when a missing decision would materially change the product, data model, public behaviour or irreversible implementation. Otherwise make the safest repository-aligned assumption, state it and continue.

### While implementing

- Make the smallest coherent change that solves the complete requirement.
- Preserve unrelated and uncommitted work.
- Prefer existing repository patterns over new abstractions.
- Keep server secrets, database access and privileged decisions in server-only modules.
- Enforce authorization at the server boundary; hiding UI is not authorization.
- Validate untrusted input and return truthful error states.
- Keep side effects explicit, auditable and retry-safe where retries can occur.
- Do not convert real integration failures into misleading success or empty states.
- Do not silently broaden task scope into deployment, production migration, DNS, billing or external messaging.

### Reviews and diagnosis

When asked to review or diagnose, inspect and report with file and line evidence. Do not implement fixes unless the request includes implementation. Prioritize findings by impact and distinguish a reproduced defect from a hypothesis.

## Data and migration rules

- CockroachDB is the operational database. Use PostgreSQL-compatible SQL that respects CockroachDB transaction behaviour.
- Reuse `src/features/admin/db.ts` and its transaction retry pattern for current Admin-domain work.
- Every schema change is a new, ordered, additive migration. Never edit an applied migration to change history.
- Make backfills explicit, idempotent where practical and safe for partially deployed states.
- Preserve tenant, owner, author and actor boundaries in schema and queries.
- Do not apply a migration to production or destructive data operation without explicit authorization.
- `pnpm migrate` changes the configured database; it is not a harmless validation command.
- Never use production data, credentials or real personal information in fixtures and screenshots.

## Authentication and authorization rules

The current Bespoke Admin authentication is security-sensitive and database-backed. It includes named employee identities, role permissions, TOTP, recovery codes, restricted recovery sessions, rate limiting and session revocation.

- Read `src/features/admin/auth.ts`, `access.ts`, `permissions.ts`, `config.ts` and the relevant migrations before changing Admin security.
- Preserve fail-closed production configuration.
- Require server-side permissions for protected queries and mutations.
- Require recent authentication for operations that already use it.
- Preserve same-origin checks on browser mutations.
- Store session and recovery credentials only in their established hashed or encrypted form.
- Never weaken Admin security to make local setup easier.
- A future customer or learner authentication system must not silently replace or absorb employee Admin authentication. Make any identity convergence an explicit, reviewed architecture decision with a migration and rollback plan.

## External services and secrets

- Environment variable names belong in `.env.example`; values belong only in approved secret stores or untracked local environment files.
- Never print, commit, paste into test output or expose credentials to the browser.
- Use `src/lib/storage/r2.ts` for R2 operations and preserve cleanup behaviour when replacing uploaded objects.
- Use the shared email client and templates for email. Escape or safely render user-controlled content.
- Treat AI output as untrusted. Validate structured output, bound inputs and preserve truthful provider and transport failures.
- Do not claim that email, R2, AI, CockroachDB, DNS or a Vercel deployment works live unless it was actually exercised in the relevant environment.

## Subdomains, routing and SEO

Hostname behaviour is shared infrastructure, not page-local logic.

- Read `src/proxy.ts` before changing hostname routing or redirects.
- Read `src/lib/subdomain-seo.ts`, `src/app/sitemap.ts` and `src/app/robots.ts` before changing subdomain metadata or indexing.
- Current code explicitly handles `www`, `team`, `audit` and `verify` hostnames.
- A new subdomain such as `learn.bespoketech.com.ng` requires coordinated proxy, canonical metadata, sitemap, robots, Vercel-domain and DNS work. Code completion alone does not prove the hostname is live.
- Add hostname-level tests for rewrites, redirects, canonical URLs and indexing rules when subdomain behaviour changes.

## UI, design and content standard

Build calm, deliberate and credible product experiences—not generic SaaS decoration.

- Start mobile-first and verify intended desktop layouts.
- Reuse the current tokens and primitives before creating new ones.
- Maintain clear hierarchy, disciplined spacing, readable measure and strong next-action clarity.
- Use colour intentionally; do not solve every hierarchy problem with more brand blue.
- Provide loading, empty, error, disabled, success and recovery states where the journey can reach them.
- Keep layouts stable with realistic minimum, typical and maximum content.
- Prefer semantic HTML, visible focus, keyboard operation and sufficient contrast; use ARIA only where semantics are insufficient.
- Respect reduced-motion preferences and avoid motion that obscures state.
- Optimize images and avoid unnecessary client components, effects and hydration.
- Any new visual direction should be documented through reusable tokens and primitives, not scattered one-off values.
- UI work is not verified solely because it compiles. Inspect it in a browser at relevant breakpoints and test the critical interaction.

Copy must be specific, professional and supportable. Avoid hype, filler, invented evidence and claims that are only future intent.

## Verification

Use the smallest relevant checks during development, then run fresh final gates proportional to the change.

Core commands:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

When the complete Vitest suite is unreliable under parallel workers, reproduce it serially and report that fact:

```powershell
pnpm exec vitest run --maxWorkers=1
```

Additional expectations:

- Run targeted tests first for fast feedback, but do not substitute them for relevant final gates.
- Run `pnpm admin:verify` for Admin runtime-configuration work.
- Run `pnpm qa:admin-browser` only when its browser and environment prerequisites are configured.
- For UI changes, inspect mobile and desktop, keyboard flow, focus, overflow and all reachable states.
- For email, PDFs, uploads, AI or third-party integrations, exercise the actual artifact or boundary when the environment permits.
- For migrations, test against an isolated compatible database when possible; never use production as the test environment.
- Do not claim a command passed from an earlier commit or another machine. Report the command, result and anything not verified.

## Deployment and external changes

- A successful `pnpm build` proves a production bundle can be compiled; it does not prove the Vercel deployment, domain, database or providers are healthy.
- Do not deploy, alter DNS, run production migrations, rotate secrets, send real email, change billing or publish externally unless the user authorizes that action.
- Before an authorized release, verify required environment configuration from `.env.example`, migration state, hostname routing, metadata, critical journeys and rollback options.
- Report the deployed URL and post-deployment evidence only after checking them.

## Git and repository safety

- Inspect the branch, remote and worktree before editing or publishing.
- Never discard, overwrite or include unrelated user changes.
- Do not use destructive reset or checkout commands unless explicitly authorized.
- Keep generated artifacts and secrets out of commits.
- Do not commit, push, open a PR or merge unless the user requests it.
- When publishing is requested, state the exact scope, branch/PR or remote SHA and remaining worktree state.

## Definition of done

A task is complete only when:

- The requested user or business outcome is implemented, not merely described.
- The result follows the current architecture and the governing product document.
- Security and authorization are enforced at the trusted boundary.
- Schema and external-service changes include safe failure, migration and rollback thinking.
- Public copy and assets are factual and brand-correct.
- Relevant automated checks pass, or failures are reproduced and honestly separated into task-related and unrelated issues.
- Relevant UI or generated artifacts are actually inspected.
- Remaining limitations, environment gaps and manual reviewer checks are named.

Final handoff should concisely state:

1. What changed and where.
2. What was verified, with fresh command or runtime evidence.
3. What could not be verified and why.
4. Known risks, migrations, deployment steps or next dependencies.

## Critical prohibitions

Never:

- Describe this repository as frontend-only.
- Invent facts, assets, users, customer evidence or integrations.
- Expose a secret or personal data in code, logs, prompts, fixtures or documentation.
- authorize a sensitive operation only in the client UI.
- bypass or weaken Admin authentication and permissions.
- edit an applied migration in place.
- apply production migrations or destructive data changes without authorization.
- replace a real provider failure with a false success state.
- claim a deployment or integration is live without direct evidence.
- overwrite unrelated work in a dirty worktree.

## Keeping this guide current

Update this file when the repository's durable architecture, ownership boundaries, verification commands or product authority changes. Do not add temporary task status, speculative architecture or credentials. Link to focused blueprints and ADRs rather than duplicating them here.
