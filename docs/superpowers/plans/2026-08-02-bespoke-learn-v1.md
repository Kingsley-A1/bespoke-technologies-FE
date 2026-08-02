# Bespoke Learn V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Bespoke Learn as a secure multi-course platform with an empty, truthful public catalogue until reviewed course content is authored and published through Bespoke Admin.

**Architecture:** A new `src/features/learn` server-first domain owns learner identity, course publishing, entitlements, progress and typed content validation. Existing Admin authentication only authorises staff publishing actions; learner identity uses separate tables and cookies. Learn-host requests rewrite to internal `/learn` routes, which query only immutable published versions; Admin preview renders drafts through protected `/admin/learn` routes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Zod 4, CockroachDB via `pg`, Cloudflare R2, Resend, Vitest, Testing Library.

## Global Constraints

- Preserve `/admin/learning` and the existing Admin TOTP/session boundary.
- Do not introduce an ORM, LMS package, payment, team, marketplace, password, OAuth or SSO dependency.
- The public catalogue intentionally starts empty. Do not seed Bespoke AI Foundations, synthetic course records, lesson content, assessment content, or renderer fixtures in any shared database.
- Ephemeral test records may exist only inside isolated test execution; they must never be shipped or migration-seeded.
- Learner and Admin sessions must not cross-authorise.
- Published course versions are immutable in application workflows and learner progress is version-pinned.
- Untrusted content is validated against registered schemas; arbitrary HTML, scripts, React source and iframes never reach a renderer.
- Use only the approved Learn logo sources and a deterministic, documented crop; do not generate or fabricate identity assets.
- Do not run `pnpm migrate`, deploy, change DNS, attach a domain, send a real learner email, publish a course, or apply a production migration without a separately reviewed and explicit release instruction.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `migrations/015_create_bespoke_learn.sql` | Additive Learn schema, constraints, indexes, and no seed data. |
| `src/features/learn/types.ts` | Shared domain states and DTOs; no database or React imports. |
| `src/features/learn/content/schemas.ts` | Zod discriminated block schemas and safe structured-text constraints. |
| `src/features/learn/content/registry.ts` | Static block/interaction registration metadata used by validation, editors and renderers. |
| `src/features/learn/db.ts` | Learn-specific typed query/transaction adapter over existing `adminQuery` and `withAdminTransaction`. |
| `src/features/learn/repository.ts` | Course/version/hierarchy, asset, entitlement and learner-state SQL queries. |
| `src/features/learn/auth-security.ts` | Pure OTP/session hashing, token, expiry, rate-limit and cookie-policy helpers. |
| `src/features/learn/auth.ts` | Learner challenge, verification, session, logout and security-event orchestration. |
| `src/features/learn/entitlements.ts` | Server-side access decisions independent of page components. |
| `src/features/learn/publishing.ts` | Draft mutation, validation, cloning/version publication, preview and audit transactions. |
| `src/features/learn/progress.ts` | Idempotent block completion, attempts, responses, completion and resume services. |
| `src/features/learn/assets.ts` | Learn asset validation, R2 upload metadata and protected delivery authorisation. |
| `src/features/learn/components/*` | Focused public, learner, content renderer and Admin editor components. |
| `src/app/learn/**` | Internal Learn public, sign-in, dashboard, course and lesson routes. |
| `src/app/api/learn/**` | Learner auth, activity/progress and protected asset route handlers. |
| `src/app/admin/(protected)/learn/**` | Admin publishing pages and protected draft preview. |
| `src/app/admin/api/learn/**` | Admin asset actions with Admin permission, recent-auth and same-origin enforcement. |
| `public/learn/brand/*` | Approved compact copy and deterministic full-lockup derivative only. |
| `scripts/prepare-learn-brand.mjs` | Deterministic raster crop with recorded source/destination dimensions and coordinates. |
| `docs/bespoke-learn-v1.md` | Operations, authoring, migrations, rollback/recovery, environment and launch evidence. |

## Task 1: Preserve the reviewed authority and establish non-destructive baselines

**Files:**
- Modify: `docs/superpowers/specs/2026-08-02-bespoke-learn-v1-design.md`
- Create: `docs/superpowers/plans/2026-08-02-bespoke-learn-v1.md`
- Test: existing `src/features/admin/learning/repository.ts` regression coverage

**Interfaces:**
- Produces: a coherent “empty catalogue until reviewed content” contract used by every later task.

- [ ] **Step 1: Verify the current worktree and relevant existing Admin-learning path**

Run: `git status --short --branch; pnpm exec vitest run src/features/admin/permissions.test.ts src/features/admin/db.test.ts`

Expected: user-owned `AGENTS.md` and `Learn/` changes remain visible but unstaged; the scoped existing tests pass or exact failures are recorded.

- [ ] **Step 2: Keep the design document coherent with the CEO decision**

Replace the obsolete seeding language with this contract:

```md
The platform ships public-ready with an empty catalogue until reviewed course
content is supplied through the Admin publishing workflow.
```

- [ ] **Step 3: Check documentation whitespace and scope terms**

Run: `git diff --check; rg -n -i 'seed Bespoke|synthetic development fixture|production is explicitly out of scope' docs/superpowers`

Expected: no whitespace errors and no obsolete directive in the updated Learn design.

## Task 2: Establish typed Learn contracts and safe block validation

**Files:**
- Create: `src/features/learn/types.ts`
- Create: `src/features/learn/content/schemas.ts`
- Create: `src/features/learn/content/registry.ts`
- Test: `src/features/learn/content/schemas.test.ts`
- Test: `src/features/learn/content/registry.test.ts`

**Interfaces:**
- Produces: `parseContentBlock(input)`, `ContentBlock`, `ContentBlockType`, `InteractionKind`, `LEARN_BLOCK_REGISTRY`, and `getRegisteredBlock(type)`.
- Consumes: Zod and no untrusted rendering code.

- [ ] **Step 1: Write failing schemas tests for accepted and rejected content**

```ts
it('accepts a required single-choice interaction with explanatory feedback', () => {
  expect(parseContentBlock({
    id: 'block-intro', type: 'interactive', order: 1, required: true,
    completionRule: 'submitted', config: {
      kind: 'single_choice', prompt: 'Choose one.', options: [
        { id: 'a', label: 'A', feedback: 'Why A is useful.', correct: true },
      ], retryLimit: 2,
    },
  }).type).toBe('interactive');
});

it.each(['<script>alert(1)</script>', '<iframe src="x">'])(
  'rejects executable rich text: %s', (value) => {
    expect(() => parseContentBlock({ id: 'text', type: 'rich_text', order: 1, required: false, completionRule: 'none', config: { paragraphs: [value] } })).toThrow();
  },
);
```

- [ ] **Step 2: Run the focused test and confirm the intended missing-export failure**

Run: `pnpm exec vitest run src/features/learn/content/schemas.test.ts`

Expected: fail because `parseContentBlock` does not yet exist.

- [ ] **Step 3: Implement discriminated schemas and stable domain DTOs**

```ts
export const contentBlockSchema = z.discriminatedUnion('type', [
  richTextBlockSchema, calloutBlockSchema, imageBlockSchema, slidesBlockSchema,
  videoBlockSchema, audioBlockSchema, downloadBlockSchema, quizBlockSchema,
  interactiveBlockSchema, reflectionBlockSchema,
]);

export function parseContentBlock(input: unknown): ContentBlock {
  return contentBlockSchema.parse(input);
}
```

Use plain paragraphs/headings/lists in rich text, `https` or R2 asset references only, bounded strings/arrays, unique option IDs, and explicit completion rules. Do not add an arbitrary HTML escape hatch.

- [ ] **Step 4: Write and run registry coverage tests**

```ts
it('registers every required V1 block with schema, editor and renderer keys', () => {
  expect(Object.keys(LEARN_BLOCK_REGISTRY).sort()).toEqual([
    'audio', 'callout', 'download', 'image', 'interactive', 'quiz',
    'reflection', 'rich_text', 'slides', 'video',
  ]);
});
```

Run: `pnpm exec vitest run src/features/learn/content/schemas.test.ts src/features/learn/content/registry.test.ts`

Expected: pass.

## Task 3: Add the non-seeding database contract and query boundary

**Files:**
- Create: `migrations/015_create_bespoke_learn.sql`
- Create: `src/features/learn/db.ts`
- Create: `src/features/learn/repository.ts`
- Test: `src/features/learn/migration-contract.test.ts`
- Test: `src/features/learn/repository.test.ts`

**Interfaces:**
- Produces: `learnQuery`, `withLearnTransaction`, `LearnRepository`, and additive `learn_*` tables.
- Consumes: `adminQuery` and `withAdminTransaction`; never creates a second connection pool.

- [ ] **Step 1: Write failing migration-contract tests**

```ts
it('creates every Learn domain table and no seeded course insert', async () => {
  const sql = await readFile('migrations/015_create_bespoke_learn.sql', 'utf8');
  expect(sql).toContain('CREATE TABLE IF NOT EXISTS learn_learners');
  expect(sql).toContain('CREATE TABLE IF NOT EXISTS learn_course_versions');
  expect(sql).toContain('CREATE TABLE IF NOT EXISTS learn_activity_attempts');
  expect(sql).not.toMatch(/INSERT\s+INTO\s+learn_(courses|modules|lessons)/i);
});
```

- [ ] **Step 2: Run the migration-contract test to confirm the migration is absent**

Run: `pnpm exec vitest run src/features/learn/migration-contract.test.ts`

Expected: fail with `ENOENT` for migration 015.

- [ ] **Step 3: Implement the additive migration**

Create isolated learner identity, rate-limit, session and security-event tables; publisher/author/course/version/hierarchy/asset tables; enrolment and entitlement tables; progress/attempt/response/artifact/completion tables; and Learn audit tables. Include foreign keys, allowed-state checks, unique deterministic order indexes, version-pinned foreign keys, created/updated timestamps, and idempotency keys. Do not include `INSERT` statements.

- [ ] **Step 4: Implement the typed query adapter and repository port**

```ts
export async function withLearnTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  return withAdminTransaction(work);
}

export interface LearnRepository {
  findPublishedCourseBySlug(slug: string): Promise<PublishedCourse | null>;
  findLearnerBySession(tokenHash: string): Promise<LearnerSessionRecord | null>;
}
```

Use parameterized queries exclusively. SQL functions return `null` for unavailable rows and never substitute draft data.

- [ ] **Step 5: Run focused tests and a migration syntax review without applying it**

Run: `pnpm exec vitest run src/features/learn/migration-contract.test.ts src/features/learn/repository.test.ts; git diff --check`

Expected: pass; no database mutation command is run.

## Task 4: Implement learner OTP, session, rate-limit and Admin-isolation security

**Files:**
- Create: `src/features/learn/auth-security.ts`
- Create: `src/features/learn/auth.ts`
- Create: `src/features/learn/auth-security.test.ts`
- Create: `src/features/learn/auth.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `requestLearnerEmailCode`, `verifyLearnerEmailCode`, `getLearnerSession`, `clearLearnerSession`, `learnerCookieName`, and `LearnerAuthError`.
- Consumes: Learn repository, `sendEmail`, `EMAIL_ADDRESSES`, and independent `LEARN_SESSION_SECRET`/`LEARN_CODE_PEPPER`.

- [ ] **Step 1: Write failing OTP and cookie tests**

```ts
it('invalidates the earlier challenge when a code is resent', () => {
  const first = createEmailChallenge('person@example.com', fixedNow, secrets);
  const second = createEmailChallenge('person@example.com', fixedNow, secrets, first.id);
  expect(canVerifyChallenge(first, first.code, fixedNow, secrets)).toBe(false);
  expect(canVerifyChallenge(second, second.code, fixedNow, secrets)).toBe(true);
});

it('uses a different cookie and signature namespace from Admin sessions', () => {
  expect(learnerCookieName()).not.toContain('admin');
  expect(encodeLearnerSession('id', secrets)).not.toEqual(encodeAdminSessionFixture('id'));
});
```

Cover ten-minute expiry, five failures, peppered HMAC, generic request response, email/network limit, revoked session, `HttpOnly`, `SameSite=Lax`, host-only cookie (no `domain`), and Admin-cookie rejection.

- [ ] **Step 2: Run tests to confirm the security API is missing**

Run: `pnpm exec vitest run src/features/learn/auth-security.test.ts src/features/learn/auth.test.ts`

Expected: fail only because the new auth exports are absent.

- [ ] **Step 3: Implement pure cryptographic/security helpers, then persistence orchestration**

```ts
export function hashLearnerCode(code: string, pepper: string) {
  return createHmac('sha256', pepper).update(code).digest('base64url');
}

export async function getLearnerSession(): Promise<LearnerSession | null> {
  // Decode only the dedicated learner cookie; query an unrevoked, unexpired row.
}
```

Persist only hashes. Do not log a raw code, raw email challenge token, response body, or learner reflection. Mail delivery failure returns a truthful retryable error and does not claim a code was sent.

- [ ] **Step 4: Add the Learn environment contract and run security tests**

Add `LEARN_ENABLED`, `LEARN_BASE_URL`, `LEARN_SESSION_SECRET`, and `LEARN_CODE_PEPPER` with production length/configuration requirements. Run: `pnpm exec vitest run src/features/learn/auth-security.test.ts src/features/learn/auth.test.ts src/features/admin/permissions.test.ts`

Expected: pass.

## Task 5: Implement entitlement, immutable publishing and progress services

**Files:**
- Create: `src/features/learn/entitlements.ts`
- Create: `src/features/learn/publishing.ts`
- Create: `src/features/learn/progress.ts`
- Test: `src/features/learn/entitlements.test.ts`
- Test: `src/features/learn/publishing.test.ts`
- Test: `src/features/learn/progress.test.ts`

**Interfaces:**
- Produces: `resolveCourseAccess`, `validateDraftForPublication`, `publishCourseVersion`, `grantCourseAccess`, `revokeCourseAccess`, `recordBlockProgress`, `submitActivityResponse`, and `resolveLessonCompletion`.
- Consumes: repository port, content schemas, Admin session actor.

- [ ] **Step 1: Write failing service tests for access, immutable publish and retry-safe completion**

```ts
it('denies a revoked manual grant before lesson rendering', async () => {
  await repository.revokeEntitlement(grant.id, actor);
  await expect(resolveCourseAccess({ learnerId, courseId }, repository)).resolves.toMatchObject({ allowed: false, reason: 'revoked' });
});

it('creates a new immutable published version and preserves old progress', async () => {
  const published = await publishCourseVersion(draft.id, actor, repository);
  await expect(repository.updateBlock(published.id, block)).rejects.toThrow('immutable');
  expect(await repository.progressForVersion(learnerId, previousVersionId)).toHaveLength(1);
});
```

Include public preview/authenticated-free/manual-grant/unavailable decisions, duplicate response idempotency, required-block completion, assessment retry policy, media/slide position, and concurrent serializable transaction retry.

- [ ] **Step 2: Run the failing service tests**

Run: `pnpm exec vitest run src/features/learn/entitlements.test.ts src/features/learn/publishing.test.ts src/features/learn/progress.test.ts`

Expected: fail due to missing service functions.

- [ ] **Step 3: Implement services around a single server entitlement decision**

```ts
export async function resolveCourseAccess(input: AccessSubject, repository: LearnRepository): Promise<AccessDecision> {
  const course = await repository.findCourseAccessPolicy(input.courseId);
  if (!course || course.policy === 'unavailable') return { allowed: false, reason: 'unavailable' };
  if (course.policy === 'public_preview') return { allowed: true, mode: 'preview' };
  // authenticated_free and manual_grant require an independently verified learner.
}
```

Publication must validate authorship, review date, hierarchy, ordering, schemas, accessible assets/captions/transcripts, and a non-empty course before atomically changing a draft version to published. No editor save invokes publication.

- [ ] **Step 4: Run the service suite**

Run: `pnpm exec vitest run src/features/learn/entitlements.test.ts src/features/learn/publishing.test.ts src/features/learn/progress.test.ts`

Expected: pass.

## Task 6: Add Admin permission, navigation, authoring and preview workflow

**Files:**
- Modify: `src/features/admin/types.ts`
- Modify: `src/features/admin/permissions.ts`
- Modify: `src/features/admin/components/admin-shell.tsx`
- Create: `src/app/admin/(protected)/learn/page.tsx`
- Create: `src/app/admin/(protected)/learn/[courseId]/page.tsx`
- Create: `src/app/admin/(protected)/learn/[courseId]/preview/page.tsx`
- Create: `src/app/admin/(protected)/learn/actions.ts`
- Create: `src/features/learn/components/admin-course-editor.tsx`
- Create: `src/features/learn/components/admin-block-editor.tsx`
- Test: `src/features/admin/permissions.test.ts`
- Test: `src/features/learn/admin-publishing.test.tsx`

**Interfaces:**
- Produces: protected Admin authoring pages and server actions that call publishing services only after `learn.manage` or recent `learn.publish` checks.
- Consumes: existing Admin session/access patterns; no learner identity.

- [ ] **Step 1: Write failing permission and Admin workflow tests**

```ts
it('allows managers to author but only founders to publish or revoke access', () => {
  expect(hasPermission('admin_manager', 'learn.manage')).toBe(true);
  expect(hasPermission('admin_manager', 'learn.publish')).toBe(false);
  expect(hasPermission('founder_admin', 'learn.publish')).toBe(true);
});
```

Test an Admin creates publisher/author/course, creates module/lesson/block, saves a draft, previews it at an Admin-only route, receives validation failures, publishes a version, and grants/revokes access. Use a fake repository, never a seeded course.

- [ ] **Step 2: Run the Admin tests and confirm they fail on missing permissions/pages**

Run: `pnpm exec vitest run src/features/admin/permissions.test.ts src/features/learn/admin-publishing.test.tsx`

- [ ] **Step 3: Implement permissions, server actions and focused editor controls**

Each typed editor must call the common schema parser before save. Use accessible ordered lists and explicit move controls rather than drag-only ordering. Use a `fieldset` for block configuration and non-colour validation markers. Draft preview is inside Admin and does not create a public URL.

- [ ] **Step 4: Run Admin workflow tests**

Run: `pnpm exec vitest run src/features/admin/permissions.test.ts src/features/learn/admin-publishing.test.tsx`

Expected: pass while existing `/admin/learning` tests remain unaffected.

## Task 7: Add R2 Learn assets and protected download delivery

**Files:**
- Create: `src/app/admin/api/learn/assets/route.ts`
- Create: `src/app/api/learn/assets/[assetId]/route.ts`
- Create: `src/features/learn/assets.ts`
- Test: `src/features/learn/assets.test.ts`

**Interfaces:**
- Produces: authenticated Admin upload, metadata validation, protected asset stream; preserves original filename/MIME/size.
- Consumes: existing R2 adapter, recent `learn.manage` authorisation, entitlement service.

- [ ] **Step 1: Write failing asset tests**

```ts
it('blocks a required image asset without meaningful alt text from publication', () => {
  expect(validateAssetForPublication({ kind: 'image', decorative: false, altText: '' })).toMatchObject({ valid: false });
});

it('returns 403 before streaming a download to a learner without entitlement', async () => {
  await expect(streamProtectedAsset(assetId, deniedLearner)).resolves.toMatchObject({ status: 403 });
});
```

- [ ] **Step 2: Run the asset test to confirm the new module is absent**

Run: `pnpm exec vitest run src/features/learn/assets.test.ts`

- [ ] **Step 3: Implement MIME/size/metadata validation and server-only delivery**

Use the existing `putR2Object`, `getR2ObjectBytes`, and cleanup pattern. Require same-origin plus recent Admin permission for upload. Never expose raw R2 credentials or a public bucket URL for protected content.

- [ ] **Step 4: Run the asset test**

Run: `pnpm exec vitest run src/features/learn/assets.test.ts`

Expected: pass.

## Task 8: Add Learn-host routing, SEO and truthful empty public pages

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/proxy.test.ts`
- Modify: `src/lib/subdomain-seo.ts`
- Modify: `src/lib/subdomain-seo.test.ts`
- Create: `src/app/learn/layout.tsx`
- Create: `src/app/learn/page.tsx`
- Create: `src/app/learn/courses/page.tsx`
- Create: `src/app/learn/courses/[courseSlug]/page.tsx`
- Create: `src/app/learn/support/page.tsx`
- Create: `src/features/learn/components/public-shell.tsx`
- Create: `src/features/learn/components/course-catalogue.tsx`
- Test: `src/features/learn/public-routes.test.tsx`

**Interfaces:**
- Produces: clean Learn hostname rewrites, Learn-only sitemap/robots/canonicals, public empty catalogue and unpublished-safe course detail behavior.
- Consumes: published-course repository queries only.

- [ ] **Step 1: Write failing hostname and empty-state tests**

```ts
it('rewrites the Learn root and rejects unrelated company routes on the Learn host', () => {
  expect(proxy(learnRequest('/')).headers.get('x-middleware-rewrite')).toContain('/learn');
  expect(proxy(learnRequest('/services')).status).toBe(308);
});

it('states that reviewed courses will appear here when the catalogue is empty', () => {
  render(<CourseCatalogue courses={[]} />);
  expect(screen.getByText(/Reviewed courses will appear here/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the route tests to confirm the Learn host is not yet implemented**

Run: `pnpm exec vitest run src/proxy.test.ts src/lib/subdomain-seo.test.ts src/features/learn/public-routes.test.tsx`

- [ ] **Step 3: Implement the host branch and public surface**

Add `LEARN_HOSTNAME`/origin and sitemap/robots rules. Permit only Learn routes/APIs/assets/SEO files. Public catalogue queries only published courses and presents an honest no-course state. Course detail returns 404 for draft/unpublished data. Include support/FAQ and existing privacy/terms links.

- [ ] **Step 4: Run focused host, SEO and public UI tests**

Run: `pnpm exec vitest run src/proxy.test.ts src/lib/subdomain-seo.test.ts src/features/learn/public-routes.test.tsx`

Expected: pass.

## Task 9: Add learner sign-in, dashboard and course access routes

**Files:**
- Create: `src/app/learn/sign-in/page.tsx`
- Create: `src/app/learn/dashboard/page.tsx`
- Create: `src/app/learn/courses/[courseSlug]/learn/page.tsx`
- Create: `src/app/api/learn/auth/request-code/route.ts`
- Create: `src/app/api/learn/auth/verify-code/route.ts`
- Create: `src/app/api/learn/auth/logout/route.ts`
- Create: `src/features/learn/components/sign-in-form.tsx`
- Create: `src/features/learn/components/learner-dashboard.tsx`
- Create: `src/features/learn/components/course-home.tsx`
- Test: `src/features/learn/learner-routes.test.tsx`
- Test: `src/features/learn/learner-auth-routes.test.ts`

**Interfaces:**
- Produces: learner-only sign-in and protected course/dashboard routes with explicit empty, denied and recovery states.
- Consumes: learner auth and entitlement services.

- [ ] **Step 1: Write failing learner route tests**

```ts
it('does not treat an Admin session as learner access', async () => {
  mockAdminCookie();
  await expect(loadProtectedCourse('course-id')).resolves.toMatchObject({ status: 401 });
});

it('shows one Continue action for an active course', () => {
  render(<LearnerDashboard courses={[activeCourse]} />);
  expect(screen.getByRole('link', { name: /continue/i })).toBeVisible();
});
```

- [ ] **Step 2: Run focused tests and confirm absent implementation**

Run: `pnpm exec vitest run src/features/learn/learner-routes.test.tsx src/features/learn/learner-auth-routes.test.ts`

- [ ] **Step 3: Implement routes and accessible recovery states**

The sign-in flow returns the same success-shaped request response for unknown and known emails. Dashboard is empty until a learner holds access to a published course. Course home resolves entitlement on the server and displays version, module state, next lesson/resources, and an access-denied response without leaking drafts.

- [ ] **Step 4: Run learner identity and route tests**

Run: `pnpm exec vitest run src/features/learn/auth.test.ts src/features/learn/learner-routes.test.tsx src/features/learn/learner-auth-routes.test.ts`

Expected: pass.

## Task 10: Implement the lesson player, safe renderers, activities and reliable resume

**Files:**
- Create: `src/app/learn/courses/[courseSlug]/lessons/[lessonSlug]/page.tsx`
- Create: `src/app/api/learn/progress/route.ts`
- Create: `src/app/api/learn/activities/[blockId]/route.ts`
- Create: `src/features/learn/components/lesson-player.tsx`
- Create: `src/features/learn/components/content-renderer.tsx`
- Create: `src/features/learn/components/blocks/*.tsx`
- Create: `src/features/learn/components/activity-form.tsx`
- Test: `src/features/learn/lesson-player.test.tsx`
- Test: `src/features/learn/content-renderer.test.tsx`
- Test: `src/features/learn/resume.test.tsx`

**Interfaces:**
- Produces: registered renderer-only lesson delivery and activity submissions tied to version-pinned progress.
- Consumes: block registry, access decision, progress service.

- [ ] **Step 1: Write failing renderer and resume behavior tests**

```tsx
it('renders a slide position and supports keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<SlidesBlock block={twoSlideBlock} onPositionChange={onPositionChange} />);
  await user.keyboard('{ArrowRight}');
  expect(screen.getByText('2 of 2')).toBeVisible();
  expect(onPositionChange).toHaveBeenCalledWith({ slideIndex: 1 });
});

it('does not mark a required interactive lesson complete on a page visit', () => {
  expect(resolveLessonCompletion(requiredInteractiveLesson, emptyProgress)).toMatchObject({ complete: false });
});
```

Cover all ten block types, keyboard order, explanatory feedback, retry limits, media no-autoplay, transcript/caption rendering when supplied, required reflection saving, transient save failure, previous/next stability, blocked future modules, and resume positions.

- [ ] **Step 2: Run the player suite and confirm absent component exports**

Run: `pnpm exec vitest run src/features/learn/lesson-player.test.tsx src/features/learn/content-renderer.test.tsx src/features/learn/resume.test.tsx`

- [ ] **Step 3: Implement static renderer dispatch and client interactions**

```tsx
export function ContentRenderer({ block, state }: ContentRendererProps) {
  const renderer = getRegisteredBlock(block.type).renderer;
  return React.createElement(renderer, { block, state });
}
```

Use a static registry, not a component name from course data. Client components submit idempotency keys, announce feedback/errors, preserve local answers while retrying, and call server routes that re-check learner session, entitlement, version and block identity.

- [ ] **Step 4: Run player, completion and resume tests**

Run: `pnpm exec vitest run src/features/learn/lesson-player.test.tsx src/features/learn/content-renderer.test.tsx src/features/learn/resume.test.tsx src/features/learn/progress.test.ts`

Expected: pass.

## Task 11: Prepare approved identity assets without generating a variant

**Files:**
- Create: `scripts/prepare-learn-brand.mjs`
- Create: `public/learn/brand/bespoke-learn-mark.png`
- Create: `public/learn/brand/bespoke-learn-lockup.png`
- Create: `docs/bespoke-learn-brand-assets.md`
- Test: `src/features/learn/brand-assets.test.ts`
- Test: `src/features/learn/brand-rendering.test.tsx`

**Interfaces:**
- Produces: source-integrity assertion and two approved display assets only.
- Consumes: read-only source PNGs in `Learn/`.

- [ ] **Step 1: Write failing hash and rendered-use tests**

```ts
it('keeps both approved source files hash-identical', async () => {
  await expect(sha256('Learn/Bepsoke-Learn-Logo.png')).resolves.toBe('AA0167DF6992D86F058BF84D62566E4D61A854BF5816203F41F1501A594E4F7C');
  await expect(sha256('Learn/Bespoke-learn-logo-with-name.png')).resolves.toBe('C86881D4472770C9181728357B41DBFF9BA97D50692FD8B2B33513D85FECB68E');
});
```

- [ ] **Step 2: Run the asset test to confirm no derivative exists**

Run: `pnpm exec vitest run src/features/learn/brand-assets.test.ts src/features/learn/brand-rendering.test.tsx`

- [ ] **Step 3: Implement the deterministic preparation script**

Use a native deterministic raster operation, record source hash/dimensions and exact crop rectangle in documentation, copy the compact source bytes, and crop only the full-lockup presentation canvas/annotation. Manually inspect the derivative against the source before accepting it. Do not call an AI image editor.

- [ ] **Step 4: Add components and verify source/derivative use**

The public home uses the lockup on a light neutral surface. Header/course shell use the compact mark. Tests assert no `Concept 4` text is present in UI and no fallback identity is rendered.

Run: `pnpm exec vitest run src/features/learn/brand-assets.test.ts src/features/learn/brand-rendering.test.tsx`

Expected: pass.

## Task 12: Finish operational documentation, accessibility automation and release evidence

**Files:**
- Create: `docs/bespoke-learn-v1.md`
- Create: `docs/bespoke-learn-production-migration-review.md`
- Modify: `.env.example`
- Test: `src/features/learn/accessibility.test.tsx`
- Test: `src/features/learn/empty-catalogue.test.tsx`

**Interfaces:**
- Produces: administrator/author guide, environment contract, migration professional-review checklist, rollback/recovery plan, and tested accessibility requirements.

- [ ] **Step 1: Write failing accessibility and truthful-empty-state tests**

```tsx
it('exposes the empty catalogue as a labelled main-region state with no fabricated course claim', () => {
  render(<LearnHome courses={[]} />);
  expect(screen.getByRole('main')).toHaveTextContent('Reviewed courses will appear here');
  expect(screen.queryByText(/enrolled|graduates|rating/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused documentation/UI tests**

Run: `pnpm exec vitest run src/features/learn/accessibility.test.tsx src/features/learn/empty-catalogue.test.tsx`

- [ ] **Step 3: Document every operational boundary**

Document architecture, table purpose, version publishing, adding a course/block renderer, Admin roles, learner retention/deletion handling, R2 asset policy, current environment variables, clean-host Vercel configuration prerequisites, production migration review gates, backup verification, explicit post-review release authorisation, forward recovery, and deferred scope. Do not describe the domain as attached or live.

- [ ] **Step 4: Run all required repository and browser gates**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Then run focused migration/security/accessibility/hostname tests, serial Vitest if necessary, and browser journeys at 320, 375, 768, 1024, and 1440 CSS pixels. Browser test records are ephemeral and created through Admin; public screens must return to the intentional empty catalogue state after cleanup.

Expected: commands either pass with recorded output or are reported with exact task-related/environment blocker evidence.
