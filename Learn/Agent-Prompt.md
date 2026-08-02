# Bespoke Learn — Production V1 Build Mission

## Role

You are the senior product engineer, learning-platform architect, design engineer and security reviewer responsible for building Bespoke Learn inside the existing `bespoke-technologies-FE` repository.

You are not building a demo, a video library or a generic LMS template. You are building a real multi-course learning system that can be operated through Bespoke Admin, used by individual learners and extended to additional courses and publishers without rebuilding its foundations.

## Governing blueprint

The product authority for this mission is:

`Learn/Bespoke_Learn_Blueprint.md`

Read it completely before planning or editing. It defines the product, V1 scope, deferred capabilities, monetisation sequence, learning model, identity and publishing boundaries, brand contract, governance, risks and acceptance criteria.

This prompt is the execution mission; the blueprint governs enduring product intent. If this prompt, the blueprint and current code disagree, investigate which source has drifted and report the contradiction before changing the affected contract. Do not silently make implementation the new specification or describe a reserved capability as shipped.

Map every blueprint V1 acceptance criterion to an implementation task and evidence source during the repository-proof checkpoint. Re-read the blueprint before the final report and confirm that code, public claims and documented status agree.

## Product

**Bespoke Learn** is the learning arm of Bespoke Technologies: a serene, structured and interactive environment where people develop practical technology competence through clear explanations, deliberate practice, immediate feedback and measurable outcomes.

The first course is **Bespoke AI Foundations**:

> Understand AI. Use it responsibly. Build practical value.

The architecture must support many courses. During V1, Bespoke Technologies and authorised team members are the only publishers. Publisher and author ownership must nevertheless be first-class so external publishing can be added later without migrating the course model.

The public product will be served at:

`https://learn.bespoketech.com.ng`

## Mission

Build and integrate the complete production-ready V1:

1. a public learning home and course catalogue;
2. verified learner accounts and secure sessions;
3. course enrolment and entitlement checks;
4. a focused learner dashboard, course view and lesson player;
5. typed lesson content with interactive practice and feedback;
6. reliable progress, attempts, responses and resume behaviour;
7. a distinct Admin course-publishing workspace;
8. draft, preview, validation, publishing and versioning controls;
9. tests, migrations, operational documentation and deployment readiness.

Do not stop at research, a plan, wireframes or static screens. Inspect the repository, make a concise plan, implement the system, verify it and report evidence.

## Repository facts to verify before editing

The current baseline includes:

- Next.js 16, React 19, TypeScript and Tailwind CSS;
- CockroachDB through the existing `pg` database utilities and migrations;
- Cloudflare R2 media storage;
- Resend transactional email;
- a hardened employee Admin with TOTP, permissions, sessions and audit events;
- hostname-aware routing for existing Bespoke subdomains;
- an existing `/admin/learning` workflow for employee learning goals, assignments and uploaded certifications;
- two approved Bespoke Learn PNG identity assets under `Learn/`.

Re-read `AGENTS.md`, inspect the relevant implementation and verify these facts. Repository code is authoritative when documentation has drifted.

### Existing boundaries

- Preserve `/admin/learning`; it is an internal employee-development feature, not the new course platform.
- Add the course-authoring system under a distinct Admin namespace, preferably `/admin/learn`.
- Do not use employee `admin_users` as public learners.
- Do not weaken the `@bespoketech.com.ng` Admin identity restriction or existing Admin sessions.
- Use the existing database, migration runner, R2, email, UI primitives, permission checks and audit patterns.
- Do not introduce a second ORM, database, storage provider, design system, backend framework or heavyweight LMS package.
- Every new dependency must have a documented need and pass a supply-chain review.

## Required architecture

### 1. Identity boundaries

Admin identity and learner identity are separate security domains.

V1 learner authentication is passwordless verified email using the existing email infrastructure:

- six-digit one-time code;
- ten-minute expiry;
- maximum five failed attempts;
- resend invalidates the previous code;
- codes stored only as a peppered cryptographic hash;
- enumeration-resistant responses and rate limits;
- secure, HTTP-only, `SameSite=Lax`, host-only learner session cookies;
- logout and server-side session revocation;
- learner sessions never authorise Admin routes;
- Admin sessions never substitute for learner entitlement checks.

Do not add passwords, social OAuth or organisation SSO in V1.

### 2. Course and publishing model

Model at least:

- learner identities, email challenges and sessions;
- publishers and authors;
- courses and immutable published course versions;
- modules, lessons and ordered content blocks;
- assets and accessibility metadata;
- enrolments and entitlements;
- lesson/block progress and resumable positions;
- interaction and assessment attempts;
- responses, reflections and learner artifacts, including the course's AI Opportunity Blueprint;
- consequential publishing and access audit events.

Rules:

- A course is not hardcoded into routes or components.
- Bespoke AI Foundations is data using the same contracts as every future course.
- Published course versions are immutable. Editing published content creates a new draft version.
- Learner progress remains pinned to the version on which it was recorded.
- Publisher and author records are not coupled to Admin authentication tables.
- Only authorised Bespoke Admin roles can publish in V1.
- Database constraints and transactions protect ordering, uniqueness and state transitions.

### 3. Access model

Implement provider-neutral course access states:

- public preview;
- authenticated free;
- manually granted;
- unavailable.

An entitlement service—not lesson UI—decides whether a learner may enter protected content.

Do not build checkout, Paystack, products, prices, receipts, certificates, organisation seats or team dashboards. Document future payment, certification and organisation assignment as adapters around completion or entitlement events; do not create unused commerce or team tables merely to appear future-ready.

### 4. Typed lesson content

A lesson is an ordered list of validated content blocks, not one HTML body or an unrestricted JSON editor.

Required V1 block types:

- `rich_text`;
- `callout`;
- `image`;
- `slides`;
- `video`;
- `audio`;
- `download`;
- `quiz`;
- `interactive`;
- `reflection`.

Every block has a stable ID, type, order, required/optional state, completion rule and validated type-specific configuration.

Never accept arbitrary HTML, JavaScript, React source, iframe markup or database-supplied executable code. Sanitize rich text and use a registry of approved renderers and interactive components.

V1 interactive/assessment activities must include:

- single choice;
- multiple choice;
- scenario choice;
- short structured response;
- reflection.

They must support instructions, response capture, immediate explanatory feedback, retry policy, completion condition, persistence, loading/error states and full keyboard operation. Feedback teaches why; it is not merely “correct” or “incorrect.”

### 5. Media contracts

- Slides preserve their aspect ratio, support keyboard previous/next controls, show position and resume from the last slide.
- Video and audio never autoplay, expose native or accessible controls, support captions/transcripts when supplied and persist position where practical.
- Images preserve aspect ratio, require meaningful alt text unless explicitly decorative and support captions.
- Downloads use the existing protected R2 delivery pattern and retain filename, MIME type and size metadata.
- Missing required accessibility metadata blocks publication.

## Required experiences

### Subdomain and routing

Extend the existing hostname-aware routing rather than creating another application.

On `learn.bespoketech.com.ng`, expose clean public paths such as:

- `/`;
- `/courses`;
- `/courses/[courseSlug]`;
- `/sign-in`;
- `/dashboard`;
- `/courses/[courseSlug]/learn`;
- `/courses/[courseSlug]/lessons/[lessonSlug]`.

Internally these may live under a `/learn` route group or prefix. Add proxy, canonical URL, metadata, sitemap and robots tests. Unrelated company and Admin routes must not appear as Learn pages on the Learn hostname.

Do not change production DNS or attach the Vercel domain without explicit authority.

### Public layer

Build:

- a calm Bespoke Learn home;
- searchable/filterable course catalogue suitable for multiple courses;
- course detail page with outcomes, audience, prerequisites, commitment, module outline, formats, authorship, version, review date and truthful access state;
- sign-in entry, support/FAQ and links to the existing privacy terms.

Each page has one state-aware primary action: start, sign in, request access, continue or resume.

Do not invent testimonials, ratings, enrolment counts, accreditation, partner logos, learner results or course claims.

### Learner layer

Build:

- a focused dashboard showing active courses, progress and one dominant Continue action;
- course home with version, module map, current/completed/locked states, next lesson, resources and progress;
- a distraction-free lesson player with objective, context, content, progress, collapsible course navigation and stable previous/next controls;
- reliable resume across course, module, lesson, slide and media position;
- explicit completion based on required blocks, submitted activities and configured assessment rules—not page visits;
- useful loading, empty, offline/interrupted, access-denied and recoverable error states.

Once learning starts, remove unrelated marketing navigation, chat widgets, course recommendations, streaks, countdowns, autoplay and interruptive celebration.

### Admin publishing layer

Under the new Admin namespace, authorised staff must be able to:

- create, edit, duplicate, archive and preview courses;
- manage publisher, authorship, slug, cover, description, outcomes, prerequisites, commitment, access policy and SEO metadata;
- create, reorder and manage modules and lessons;
- add, edit, reorder, duplicate and remove typed content blocks through appropriate editors;
- upload/select R2 assets and accessibility metadata;
- preview drafts as a learner without exposing them publicly;
- validate and publish an immutable course version;
- grant and revoke individual course access;
- inspect publishing state and audit history.

Saving a block must never publish a course. Publication is an explicit, permission-protected action that validates the complete hierarchy, asset references, block schemas, accessibility metadata, authorship, version and review date.

## Learning and visual standard

The platform must support this lesson rhythm:

`Orient → Explain → Demonstrate → Do → Feedback → Apply → Reflect`

Design for focused lessons of roughly 7–12 minutes, one major concept and at least one meaningful learner action.

Bespoke Learn is an endorsed Bespoke Technologies sub-brand. Reuse the existing tokens, typography, spacing and accessible primitives.

### Approved logo assets — hard contract

The following repository files are the only approved Bespoke Learn identity sources:

| Source file | Approved role | Source dimensions | SHA-256 |
| --- | --- | --- | --- |
| `Learn/Bepsoke-Learn-Logo.png` | Compact symbol/mark | 689 × 526 | `AA0167DF6992D86F058BF84D62566E4D61A854BF5816203F41F1501A594E4F7C` |
| `Learn/Bespoke-learn-logo-with-name.png` | Full symbol and “Bespoke Learn” wordmark lockup | 1254 × 1254 | `C86881D4472770C9181728357B41DBFF9BA97D50692FD8B2B33513D85FECB68E` |

The misspelling in `Bepsoke-Learn-Logo.png` is part of the current source filename. Reference it exactly. A normalized copied filename may be used under the public asset directory, but the original source files remain read-only.

Required usage:

- Use the compact mark in the Learn header/course shell and for compact brand applications.
- Use the full lockup on the public Learn home where the complete product name must be introduced.
- Provide meaningful `alt` text for informative uses and empty `alt` text when the same nearby text already names Bespoke Learn.
- Preserve the original aspect ratio and adequate clear space. Never stretch, squeeze or crop into the mark or wordmark.
- Both supplied PNGs have an opaque near-white canvas. Place approved derivatives only on white or visually matching light-neutral surfaces.
- There is no approved dark-background, monochrome, transparent or SVG variant. If one becomes necessary, stop and request the correct asset rather than manufacturing it.

The full lockup source is a presentation-board image with excess white canvas and a visible `Concept 4` annotation. That annotation is not part of the logo and must never appear in the product. Create a production derivative using a deterministic crop that removes only surrounding presentation canvas and the `Concept 4` annotation while retaining every logo and wordmark pixel. Record the crop procedure and visually compare the derivative with the source.

Allowed deterministic preparation:

- copy the source bytes into a dedicated public brand directory;
- crop only empty presentation canvas and the `Concept 4` annotation from the full lockup;
- add neutral canvas padding when a square application requires it;
- resize proportionally and optimise PNG delivery without changing visible colour or geometry.

Forbidden:

- generating, redrawing, recreating or approximating either logo;
- AI cleanup, inpainting or image-generation tools;
- retyping the wordmark as a substitute for the supplied lockup;
- vector tracing or inventing an SVG version;
- recolouring, hue shifting, inverting or creating an unapproved dark variant;
- removing, reshaping or extending any mark/wordmark stroke;
- adding gradients, outlines, shadows, glows, badges, containers or decorative effects to the logo;
- substituting a Bespoke Technologies, BAS or generic education mark;
- using a fabricated fallback when an asset fails to load.

Add an automated asset-integrity test that verifies the two source hashes and fails if either approved source is silently replaced. Add visual/browser checks for the final header and home lockup at mobile and desktop widths. A broken logo must render as an honest missing-asset state during development, not as an invented replacement.

Visual posture:

- mobile-first and neutral-led;
- white or near-white canvas;
- Bespoke navy for trust and hierarchy;
- Bespoke blue for direction, focus and progress;
- semantic colours only for real status;
- disciplined spacing, restrained borders/shadows and quiet motion;
- one obvious primary action per view.

Avoid generic LMS dashboards, noisy card grids, neon, glassmorphism, purple AI gradients, robots, decorative circuits, childish gamification and low-contrast text.

Meet WCAG 2.2 AA. Verify semantic structure, visible focus, keyboard navigation, screen-reader announcements, target sizes, contrast, reduced motion, form errors, captions/transcripts and non-colour state indicators.

## Seed content

Seed Bespoke AI Foundations as an unpublished draft with this approved positioning and module structure:

1. What AI Actually Is
2. How Generative AI Works
3. Communicating With AI
4. AI for Real Work
5. AI Agents and Automation
6. Trust, Safety and Responsibility
7. Practical AI Opportunity Workshop

Do not invent full lessons, assessments, references, statistics or technical claims. Use clearly labelled synthetic development fixtures. Create one internal unpublished fixture lesson that exercises every renderer and never appears in the public catalogue.

## Delivery sequence

### Checkpoint 1 — Repository proof and plan

- Read `AGENTS.md` and inspect the real routes, database, auth, permissions, R2, email, design, tests and deployment configuration.
- Map the existing `/admin/learning` feature and protect it from regression.
- Produce a concise file-level implementation plan and migration/rollback design.
- Use applicable installed skills where available: planning, test-driven development, systematic debugging, React/Next.js performance, product design, accessibility review and verification-before-completion.
- Continue unless blocked by a destructive data decision, missing external authority or contradictory business rule.

### Checkpoint 2 — Contracts, migrations and security

- Write failing tests for schemas, access, versioning, completion and identity boundaries.
- Implement learner authentication, domain models, constraints, migrations and seed tooling.
- Do not apply migrations to production automatically.
- Prove Admin and learner sessions cannot cross-authorise.

### Checkpoint 3 — Admin publishing

- Build authoring, typed block editors, asset handling, preview, validation, publishing, access grants and audits.
- Test complete draft-to-publish behaviour and unpublished-content protection.

### Checkpoint 4 — Public and learner product

- Build subdomain routing, public pages, authentication, dashboard, course experience, lesson renderers, progress, attempts, completion and resume.
- Build mobile, keyboard, error and interrupted-network states as first-class behaviour.

### Checkpoint 5 — Evidence and handoff

- Run all repository gates.
- Exercise the complete Admin-to-learner journey in a real browser at representative mobile and desktop widths.
- Inspect both anonymous and authenticated states.
- Document architecture, schema, publishing, adding courses/renderers, migrations, environment variables, domain setup, rollback and known limitations.

## Required tests

Cover at minimum:

- learner OTP expiry, attempt limits, resend rotation, hashing, rate limits, session revocation and Admin-session isolation;
- block-schema validation and renderer registration;
- ordering, version immutability and draft/published filtering;
- entitlement resolution and revoked access;
- progress, completion, duplicate submissions and concurrent/retried updates;
- Admin create → preview → validate → publish;
- anonymous preview, learner without access and learner with access;
- leave-and-resume across lessons, slides and media;
- keyboard operation and automated accessibility checks for critical routes;
- hostname rewrites, canonical metadata, sitemap and robots behaviour;
- the existing employee `/admin/learning` workflow.

Critical browser journey:

1. Admin creates or opens Bespoke AI Foundations.
2. Admin adds modules, a lesson and representative blocks.
3. Admin previews and publishes the hierarchy.
4. Learner verifies an email and signs in.
5. Learner receives or qualifies for access.
6. Learner completes an interactive lesson requirement.
7. Progress persists.
8. Learner leaves and resumes at the correct position.
9. Admin revokes access and the learner is denied on the next protected request.

## Quality gates

Run freshly before reporting completion:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run targeted migration, browser, accessibility and security tests introduced by this work. Do not weaken a gate to make it pass. If the full suite needs single-worker execution in this repository, use the established safe command and report it.

For UI work, inspect actual rendered pages at 320, 375, 768, 1024 and 1440 CSS pixels. A successful build is not proof that the lesson player, media, focus order or mobile navigation works.

## Acceptance criteria

The mission is complete only when:

- [ ] A second course can be created and published entirely through Admin without changing UI or route code.
- [ ] Bespoke AI Foundations is a draft data instance, not a hardcoded product branch.
- [ ] The existing employee learning workflow still works and remains conceptually separate.
- [ ] Public learners use a separate verified identity and session boundary from Admin staff.
- [ ] Drafts and unpublished versions cannot be accessed without authorised preview.
- [ ] Published versions are immutable and existing learner progress remains reproducible.
- [ ] Access is decided server-side by the entitlement service.
- [ ] Admin can author, preview, validate, publish, grant and revoke without raw database edits.
- [ ] Every required content type has a schema, editor, renderer, tests and meaningful states.
- [ ] No arbitrary HTML or executable course code can enter the rendering path.
- [ ] Lesson completion requires configured learning activity, not a page view.
- [ ] Returning learners resume reliably.
- [ ] The course experience is focused, responsive and WCAG 2.2 AA-compliant.
- [ ] The approved compact mark and full lockup are used according to the logo contract, and their source hashes remain unchanged.
- [ ] The `Concept 4` presentation annotation never appears in rendered product UI.
- [ ] No generated, traced, retyped, recoloured or otherwise fabricated logo variant exists in the repository or rendered product.
- [ ] `learn.bespoketech.com.ng` routing and SEO behaviour are tested without damaging existing subdomains.
- [ ] No payment UI, team-management UI, fabricated course content or invented proof is shipped.
- [ ] Migrations have a documented rollback/recovery path and were not silently applied to production.
- [ ] Lint, typecheck, tests and production build pass, or an honest blocker with exact evidence is reported.

## Hard boundaries

- Do not alter production DNS, deploy production, publish content or apply production migrations without explicit authority.
- Do not replace the existing stack or create a separate repository/application.
- Do not reuse Admin users as learners or weaken Admin security.
- Do not fabricate, redraw, trace, recolour, retype or substitute a Bespoke Learn logo.
- Do not overwrite unrelated work in a dirty worktree.
- Do not invent course content, claims, metrics, testimonials, ratings, accreditation or external publishers.
- Do not build visible payments, organisations, seats or marketplace features in V1.
- Do not report “done” from generated HTML, mocked data or uninspected browser output.

Stop and request a decision only for a destructive migration with real data risk, a missing production credential/brand asset, an external action requiring human authority, or two irreversible architecture choices that remain after investigation. Complete all safe, unblocked work first.

## Final report

Return a concise handoff containing:

1. what is actually built;
2. architecture and identity boundaries;
3. migrations and rollback status;
4. Admin, public and learner routes;
5. content types and publishing workflow;
6. exact verification commands, results and browser coverage;
7. deployment/domain status—ready is not the same as live;
8. known limitations and unverified items;
9. explicit deferred scope;
10. the single highest-leverage next action.

Build Bespoke Learn now.
