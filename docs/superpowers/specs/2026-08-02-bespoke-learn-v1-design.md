# Bespoke Learn V1 Design

**Status:** Approved direction; implementation specification pending review

**Authority:** `Learn/Bespoke_Learn_Blueprint.md` and `Learn/Agent-Prompt.md`.

## Goal

Build Bespoke Learn as a secure multi-course product area inside the existing
Next.js application. It serves public discovery and learners on
`learn.bespoketech.com.ng`, while authorised Bespoke employees publish courses
from `/admin/learn`. It is not a replacement for the existing employee
development feature at `/admin/learning`.

## Chosen approach

The platform will be a bounded `src/features/learn` domain using the existing
`pg` database wrapper, migrations, R2 client, Resend wrapper, Admin access
checks, audit table, UI tokens, and hostname proxy. It will not add an ORM,
LMS package, separate application, database, identity provider, storage
provider, or design system.

The rejected alternatives are:

1. A standalone Learn application. It would duplicate sensitive infrastructure
   and violate the approved in-repository boundary.
2. A generic CMS body or unrestricted JSON editor. It cannot safely enforce
   typed blocks, accessibility metadata, completion, renderer registration, or
   immutable versioning.
3. A hardcoded AI Foundations site. It fails the multi-course, second-course,
   publisher/author, and version-history requirements.

## Boundaries and roles

### Identity

Learners are stored only in Learn tables. Their verified email, challenges,
sessions, security events, and cookies are independent of `admin_users` and
`admin_sessions`.

- Learner sessions use a dedicated host-only cookie, `HttpOnly`, `Secure` in
  production, `SameSite=Lax`, an HMAC-signed opaque token, and server-side
  revocation.
- Email codes are six digits, expire after ten minutes, are invalidated by a
  resend, permit five verification failures, and are persisted only as a
  peppered HMAC.
- Requests receive enumeration-resistant responses. Database-backed email and
  network rate limits prevent abuse without logging a raw code or response.
- Admin cookies are never read by learner authentication; learner cookies never
  authorise `/admin` routes.

### Administration

New Admin permissions separate authoring from consequential publication:

- `learn.manage`: founder admins and admin managers may author drafts, assets,
  and course structure.
- `learn.publish`: founder admins may publish, archive/unpublish, and grant or
  revoke learner access. This requires recent authentication for consequential
  actions.

`/admin/learning` and the `learning_*` tables remain untouched. Admin users
are publication actors only; they are not publishers, authors, or learners.
Publisher and author records are independent first-class course metadata.

## Data design

A single additive migration will create a `learn_` table family. It will not
alter or delete existing business data.

| Area | Tables and invariants |
| --- | --- |
| Learner identity | `learn_learners`, `learn_email_challenges`, `learn_sessions`, `learn_security_events`, `learn_rate_limit_events`. Learner email is normalized and unique; challenge hashes and session token hashes are unique. |
| Ownership | `learn_publishers`, `learn_authors`, `learn_course_authors`. Published work cannot be orphaned by deleting an owner. |
| Courses | `learn_courses`, `learn_course_versions`, `learn_modules`, `learn_lessons`, `learn_content_blocks`. Versions have explicit lifecycle and deterministic ordering unique per parent. Published version rows and descendants are never updated. |
| Assets | `learn_assets` stores R2 key, filename, MIME type, byte size, dimensions, alt/caption/transcript metadata, and state. Protected delivery checks entitlement before streaming. |
| Access | `learn_enrolments`, `learn_entitlements`. An entitlement is keyed to a learner and course, has a source and state, and is resolved server-side on every protected request. |
| Learning state | `learn_lesson_progress`, `learn_block_progress`, `learn_activity_attempts`, `learn_responses`, `learn_artifacts`, `learn_completion_summaries`. Every activity row references the immutable course version. Idempotency keys and unique constraints make retry/concurrent writes safe. |
| Audit | `learn_audit_events` records publishing, preview, grants/revocations, and consequential state transitions with actor information and non-sensitive metadata. |

Course content remains data. A course has a stable public identity and a
current published version. Editing a published course forks/uses a next draft;
publication atomically validates and freezes that complete hierarchy. Learner
progress always references the exact published version it began on.

## Content and completion design

`src/features/learn/content` owns a Zod-validated registry. Each block has a
stable ID, order, required flag, visibility, estimated duration, completion
rule, and a discriminated type-specific configuration. The registry includes:

- `rich_text`, sanitized structured text only;
- `callout`;
- `image` with alt/caption/decorative semantics;
- `slides` with ordered image assets and resume index;
- `video` and `audio` with controls, supported resume positions, and supplied
  captions/transcript metadata;
- `download` with protected asset metadata;
- `quiz` and `interactive` for single choice, multiple choice, scenario choice,
  and short structured response;
- `reflection` for private learner responses and the AI Opportunity Blueprint
  artifact where a course configures it.

Database content chooses from registered schemas and React renderers only. It
cannot supply HTML, JavaScript, iframe markup, component names, or executable
code. Rich text is sanitized at validation and rendered through a constrained
text model.

Completion is calculated by a server service from required block state,
submitted activities, retry policy, and configured assessment conditions. A
page request or media start is never completion. Responses return explanatory
feedback rather than a bare correct/incorrect label.

## Routing and public surface

The existing hostname proxy will add an explicit Learn host branch. On
`learn.bespoketech.com.ng`, clean paths rewrite to internal `/learn` routes:

| Public URL | Internal implementation |
| --- | --- |
| `/` | `/learn` |
| `/courses` | `/learn/courses` |
| `/courses/[courseSlug]` | `/learn/courses/[courseSlug]` |
| `/sign-in` | `/learn/sign-in` |
| `/dashboard` | `/learn/dashboard` |
| `/courses/[courseSlug]/learn` | `/learn/courses/[courseSlug]/learn` |
| `/courses/[courseSlug]/lessons/[lessonSlug]` | `/learn/courses/[courseSlug]/lessons/[lessonSlug]` |

The Learn branch permits only Learn pages, Learn APIs, assets, `robots.txt`,
and `sitemap.xml`; other routes redirect to the canonical main website host.
Metadata, canonical URLs, sitemap, and robots are selected by hostname.
No DNS, Vercel-domain, or production configuration action is included.

Public pages are server-rendered and only query published course versions.
They provide truthful state-aware actions: preview, sign in, request access,
continue, or resume. The learner shell removes unrelated marketing navigation,
widgets, recommendations, streaks, autoplay, and celebration interruptions.

## Admin publishing surface

`/admin/learn` provides list, create, duplicate, archive, and preview views;
course detail manages identity, authorship, access policy, SEO, modules,
lessons, ordered typed blocks, and assets. It uses focused editors and server
actions/APIs validated by the same schemas used by publishing and rendering.

Draft preview requires Admin authorisation and uses a signed preview context;
it never makes the draft public. Validation reports blocking fields such as
missing authorship, review date, required alt text, transcript/caption, asset,
or invalid block configuration. Publication is a deliberate, permission- and
recent-authentication-protected transaction. Grants and revocations use the
same access service and write audits.

## Visual and asset design

Learn reuses existing typography, spacing, accessible controls, navy, blue,
white, and neutral tokens. The public home introduces the product using the
approved full lockup; header and course shell use the approved compact mark.
Both are shown only on a white or matching neutral canvas without decoration.

The original source files in `Learn/` remain read-only. Tests hash them against
the supplied SHA-256 values. The compact source is copied unchanged into a
dedicated public brand directory. A deterministic script will crop the full
source using an explicitly recorded rectangle after visual comparison; it will
remove blank presentation canvas and the `Concept 4` annotation only, retain
all logo/wordmark pixels, and generate no new logo artwork. Broken local
development assets use an honest missing-asset state, never an invented mark.

The first course is seeded solely as an unpublished data shell with the seven
approved module titles. A separate unpublished internal fixture lesson
exercises every renderer using clearly labelled synthetic development data.
Neither is public catalogue content.

## Performance, accessibility, and error handling

Server route data fetches run in parallel where independent. Learner renderer
code is split by registered block type so unused interactive/media code is not
sent to a basic public course page. Server components serialize only the
learner state required by each client interaction.

Critical routes provide semantic headings/landmarks, visible focus, keyboard
navigation, screen-reader status messages, target sizes, reduced motion,
non-colour states, controlled form errors, media controls, and honest loading,
offline/interrupted, access-denied, and recoverable error states. Browser
evidence at 320, 375, 768, 1024, and 1440 CSS pixels is required before a
completion claim.

## Migration, seed, and recovery plan

The migration is additive and executed only through the repository migration
runner when a human supplies a non-production `DATABASE_URL`. Production is
explicitly out of scope. The migration pairs each table with indexes,
constraints, state checks, and a recovery guide.

Rollback for an unapplied or empty pilot database is a reviewed, explicit
drop-order script kept as documentation, not an automatically-run migration.
For any environment containing learner data, recovery is forward-only:
disable Learn routes, preserve immutable versions/activity/audit records,
restore from a pre-migration database backup if necessary, and investigate
before writing a corrective migration. Seed data is idempotent and remains
unpublished.

## Acceptance map and evidence

| Blueprint acceptance | Implementation task | Evidence source |
| --- | --- | --- |
| Learn hostname and existing subdomains | proxy, SEO helpers, route tests | proxy/SEO tests and browser host checks |
| Second course and non-hardcoded first course | course repositories/Admin forms/seed | Admin create-publish integration test |
| Preserve employee learning | isolate routes/tables/permissions | existing learning test and route check |
| Separate identity/session boundaries | learner auth module/tables/cookies | OTP/session isolation tests |
| Server entitlement and unpublished protection | entitlement service/query filters/preview context | protected-route integration tests |
| Immutable/reproducible versions | version lifecycle transaction | version/progress integration tests |
| Admin author/preview/validate/publish/grant/revoke | `/admin/learn` and audited actions | Admin-to-learner browser journey |
| All block contracts/no executable content | registry, editors, renderer map | schema/registration/security tests |
| Activity-based completion and resume | progress/attempt service/player | completion/idempotency/resume tests |
| Responsive WCAG evidence | focused UI and accessibility tests | browser, keyboard, and automated checks |
| Logo integrity/no annotation | hash test/crop script/public rendering | asset test and mobile/desktop screenshots |
| Deferred-scope protection | no commerce/team/marketplace routes/tables | route/schema review and regression tests |
| Safe migrations | additive migration/recovery guide | migration dry run and docs review |
| Quality gates and real browser journey | full test/build and controlled browser flow | fresh command output and captured checks |

## Explicitly deferred

Checkout, prices, payment adapters, receipts, certificates, accreditation,
organisation accounts, seats, team dashboards, external self-service
publishers, marketplace search/ranking, ratings/reviews, social login, SSO,
passwords, native apps, offline downloads, AI tutors, and real course content
remain outside V1.
