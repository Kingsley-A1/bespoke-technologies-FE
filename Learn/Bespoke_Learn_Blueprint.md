# Bespoke Learn Blueprint

> Living product, learning, business, design, engineering and operating specification for Bespoke Learn.

| Field | Value |
| --- | --- |
| Product | Bespoke Learn |
| Product type | Learning and capability-development platform |
| Document status | Approved foundation for V1 implementation |
| Blueprint version | 0.1.0 |
| Last updated | 2 August 2026 |
| Owner | Bespoke Technologies |
| Repository | `bespoke-technologies-FE` |
| Public domain | `https://learn.bespoketech.com.ng` |
| First course | Bespoke AI Foundations |
| Initial publisher | Bespoke Technologies and authorised team members |
| Initial audience | Individual adult learners |
| Initial commercial state | Free introduction and controlled pilot access; no checkout in V1 |

## 1. Purpose and authority

This blueprint is the source of truth for what Bespoke Learn is, why it exists, what V1 must build, what is deliberately reserved for later, how the product can earn revenue, how it strengthens Bespoke Technologies and what must be proven before launch claims are made.

It is written for:

- product and company leadership;
- investors and strategic partners;
- engineers and delivery agents;
- course authors, reviewers and publishers;
- marketing, sales and learner-support teams;
- future maintainers who were not present for the original decisions.

Every implementation agent must read this document completely before planning or changing Bespoke Learn. `Learn/Agent-Prompt.md` is the execution mission; this blueprint governs product intent and enduring contracts. When code, the prompt and this blueprint disagree, stop and resolve the contradiction. Do not silently redefine the product through implementation.

This document distinguishes four states:

- **Verified existing** — present in the repository and inspected.
- **Approved for V1** — required by this blueprint but not necessarily built yet.
- **Reserved** — deliberately deferred behind a clear extension boundary.
- **Not approved** — must not be implemented or claimed without a new decision.

Update the version and decision log whenever an approved change alters the product promise, audience, commercial model, scope, identity boundary, publishing contract, course model, public routes, design system, release gates or governance.

## 2. Executive definition

Bespoke Learn is the learning arm of Bespoke Technologies: a serene, structured and interactive environment where people develop practical technology competence through clear explanations, deliberate practice, immediate feedback and measurable outcomes.

It is a multi-course learning system, not a single-course website. The first course is Bespoke AI Foundations, but every course must use the same data, publishing, delivery, access, progress and quality contracts.

During V1, Bespoke Technologies and authorised team members create and publish every course. The architecture must represent publisher and author ownership independently so that carefully selected external publishers can be supported later without rebuilding the course model.

### Working product promise

> Learn clearly. Practise deliberately. Build capability that lasts.

This is the approved strategic direction, not final public campaign copy. Public use still requires the normal content review.

### First-course promise

> Understand AI. Use it responsibly. Build practical value.

### North-star outcome

A learner can understand a useful technology concept, practise it, receive explanatory feedback, apply it to a realistic context and return later to continue from an accurate saved position.

### North-star metric

**Meaningful Learning Progress:** the proportion of active enrolled learners who complete at least one required practice activity with feedback during a rolling seven-day period.

This is more useful than page views, video starts or time spent because it measures active participation in learning.

## 3. Why Bespoke Learn exists

Technology education is often fragmented between passive videos, unstructured social content, generic course marketplaces and expensive programmes that provide weak evidence of learning.

Bespoke Learn exists to close five gaps:

1. **Clarity:** explain modern technology without unnecessary complexity or hype.
2. **Practice:** require learners to make decisions and apply ideas, not merely watch.
3. **Feedback:** explain why an answer or approach is strong, incomplete or unsafe.
4. **Continuity:** preserve progress, attempts and learner artifacts reliably.
5. **Trust:** show who authored the material, which version is active and when it was reviewed.

### Why Bespoke Technologies should build it

Bespoke Technologies already engineers software, AI, automation and digital systems. Teaching the principles behind that work extends the company's practical expertise into a repeatable learning product.

The strategic opportunity is not to imitate a large marketplace. It is to translate real engineering judgement into structured capability development while retaining Bespoke's standards for security, accessibility, product design and evidence.

### Why now

- Individuals and organisations need practical AI and technology literacy.
- Generative AI has increased both opportunity and confusion.
- Bespoke can establish a public educational voice while the category is still forming.
- The existing application already provides useful Admin, database, storage, email, subdomain and deployment foundations.
- Beginning with one high-value course allows the platform and teaching model to be validated before broad catalogue expansion.

## 4. What Bespoke Learn is not

Bespoke Learn is not:

- a generic course marketplace;
- a catalogue of uploaded videos;
- an entertainment or social-media feed;
- a creator platform open to arbitrary uploads;
- a child-focused gamified application;
- a certificate mill;
- an AI chatbot presented as education;
- a disguised sales funnel with thin learning content;
- a replacement for accredited education;
- a promise that every learner will achieve the same result.

It must not use fabricated testimonials, ratings, enrolment counts, completion rates, accreditation, partner logos, learner outcomes or technical claims.

## 5. Audiences and jobs

### Initial learners

V1 is designed for adults building practical modern-work competence, including:

- business owners and operators;
- professionals and managers;
- entrepreneurs and creators;
- final-year and early-career learners who are adults;
- people moving into technology-enabled work;
- existing Bespoke clients or community members seeking structured learning.

V1 does not intentionally target children. Any future under-18 experience requires a separate safeguarding, consent and data-protection decision.

### Learner jobs

Learners use Bespoke Learn to:

1. understand whether a course is relevant;
2. begin without unnecessary friction;
3. learn one clear concept at a time;
4. practise and receive useful feedback;
5. see genuine progress and the next action;
6. stop and resume without losing work;
7. create a useful artifact or applied outcome;
8. understand what completion does and does not prove.

### Internal team jobs

Authorised Bespoke team members use it to:

- author and review structured courses;
- manage modules, lessons, assets and interactive blocks;
- preview drafts safely;
- publish immutable reviewed versions;
- grant or revoke individual access;
- observe learning quality without invading learner privacy;
- support learners and correct content responsibly.

### Future publisher jobs

Approved external publishers may later use it to:

- maintain a verified publisher profile;
- author or co-author courses;
- submit content for review;
- manage approved revisions;
- understand performance and revenue transparently;
- comply with Bespoke quality, rights and safety policies.

External publishing is reserved, not part of V1.

## 6. Product principles

1. **Capability over consumption.** Completion reflects required learning activity, not a page visit.
2. **One concept, one meaningful action.** Lessons remain focused and active.
3. **Feedback teaches.** Responses explain reasoning, not merely correctness.
4. **Course content is data.** New courses do not require route or component branches.
5. **Published learning is reproducible.** Published versions are immutable and progress remains pinned.
6. **Calm is a feature.** The learning surface removes unrelated navigation and attention traps.
7. **Trust is visible.** Authorship, version, review date, access and limitations are clear.
8. **Accessibility is correctness.** Media, custom interactions and navigation work without a mouse.
9. **Privacy is proportional.** Collect only data needed to deliver, secure and improve learning.
10. **Future-ready means bounded.** Reserve interfaces for later capabilities without building empty systems.
11. **Evidence before claims.** Launch, quality and outcome statements require current proof.
12. **Bespoke before marketplace scale.** Quality and authenticity come before catalogue volume.

## 7. Current truth

### Verified existing in the repository

The current `bespoke-technologies-FE` repository contains:

- Next.js, React, TypeScript and Tailwind CSS;
- CockroachDB access through existing `pg` utilities and migrations;
- Cloudflare R2 media storage patterns;
- Resend transactional email;
- a hardened employee Admin with TOTP, permissions, sessions and audit events;
- hostname-aware routing for `team`, `audit` and `verify` subdomains;
- an internal `/admin/learning` feature for employee goals, assignments, progress and uploaded certifications;
- established Bespoke design tokens, UI conventions and Vercel deployment configuration;
- approved Bespoke Learn compact-mark and full-lockup PNG sources.

### Not yet proven or built as part of Bespoke Learn

The presence of this blueprint or implementation prompt does not mean the following are shipped:

- the Learn subdomain experience;
- public learner accounts;
- course catalogue and publishing schemas;
- course authoring Admin;
- learner entitlements and enrolments;
- lesson content-block renderers;
- progress, attempts, completion and resume;
- live Bespoke AI Foundations content;
- payment or team access;
- production DNS, deployment or real learner traffic.

Each item becomes “built” only after implementation and evidence.

## 8. V1 product scope

### Public trust layer

V1 builds:

- Bespoke Learn home;
- multi-course catalogue;
- course detail pages;
- authorship, version and reviewed-date presentation;
- truthful course access states;
- sign-in entry and support/FAQ access;
- Learn-specific metadata, sitemap, robots and canonical URLs.

### Learner identity and access

V1 builds:

- passwordless verified-email learner accounts;
- secure learner sessions separated from Admin sessions;
- public-preview, authenticated-free, manually granted and unavailable access states;
- enrolment, entitlement and revocation;
- privacy-aware learner profile and security records.

### Learning experience

V1 builds:

- focused learner dashboard;
- course home and module map;
- distraction-free lesson player;
- typed rich-text, callout, image, slide, video, audio, download, quiz, interactive and reflection blocks;
- immediate explanatory feedback;
- attempts, responses and reflections;
- required-block and assessment-based completion;
- reliable course, lesson, slide and media resume;
- learner artifacts, including the AI Opportunity Blueprint where approved course content requires it.

### Admin publishing

V1 builds a distinct `/admin/learn` publishing workspace for:

- publisher and author records;
- course, module, lesson and block authoring;
- appropriate editors for each block type;
- asset upload/selection and accessibility metadata;
- draft preview;
- complete-hierarchy validation;
- immutable version publication;
- archive/unpublish controls that preserve historical records;
- individual entitlement grants and revocation;
- consequential audit events.

The existing `/admin/learning` employee-development workflow remains intact and conceptually separate.

### Platform operations

V1 includes:

- database migrations and recovery/rollback guidance;
- unpublished synthetic seed fixtures;
- security, accessibility, integration and browser tests;
- architecture and operating documentation;
- deployment readiness for `learn.bespoketech.com.ng`.

## 9. Deliberately reserved for later

Reserved capabilities are not missing V1 work. They are sequenced behind product evidence and operational readiness.

| Reserved capability | Why it is deferred | Boundary preserved now |
| --- | --- | --- |
| Visible Paystack checkout | Learning value, price and support economics must be validated first. | Provider-neutral entitlement grants and future payment-source metadata. |
| Subscription plans | Recurring value has not been proven; forced subscriptions may weaken trust. | Access policy can accept time-bounded entitlements later. |
| Organisation accounts, seats and assignments | Adds tenant, billing, reporting and support complexity. | Publisher, learner and entitlement domains are not coupled. |
| Team dashboards and manager analytics | Requires privacy rules and meaningful cohort metrics. | Progress events have stable ownership and purpose. |
| External self-service publishing | Requires contracts, moderation, IP, payout and dispute systems. | Publisher and author ownership are first-class. |
| Publisher payouts and revenue sharing | Requires pricing, tax, reconciliation and quality enforcement. | Course ownership is separable from platform ownership. |
| Public ratings and reviews | Easy to manipulate and harmful before sufficient volume. | Private feedback can support quality improvement. |
| Certificates and verification | Completion must first become credible; accreditation must never be implied. | Completion events and course versions are durable. |
| AI tutor or course assistant | Requires accuracy, privacy, cost and pedagogical evaluation. | Lesson content and learner context have explicit boundaries. |
| Native mobile applications | The mobile web experience must prove demand first. | Responsive routes and APIs remain client-agnostic. |
| Offline course downloads | Introduces rights, sync and data-consistency complexity. | Resume events can later support offline reconciliation. |
| Marketplace search/ranking | Catalogue quality matters more than volume in the first stage. | Multi-publisher metadata can be indexed later. |
| Children/minor accounts | Requires safeguarding and consent architecture. | V1 explicitly targets adults. |
| Formal accreditation | Requires external authority and evidence. | Versioned outcomes and assessments preserve future evidence. |

## 10. Non-goals and prohibited scope

V1 must not build:

- payment collection or public pricing;
- organisation/team management;
- arbitrary third-party uploads;
- open marketplace mechanics;
- public ratings, rankings or install/enrolment counters;
- a separate repository, database, storage provider, auth stack or design system;
- an unrestricted HTML/JavaScript course editor;
- AI-generated course claims or filler presented as approved content;
- fabricated logos or unapproved brand variants;
- engagement tricks such as streak anxiety, autoplay or artificial countdowns.

## 11. System architecture

Bespoke Learn is a bounded product area inside the existing Next.js application.

```text
Authorised Admin
      |
      v
Draft course hierarchy -> validate -> immutable published version
      |                                      |
      v                                      v
Preview surface                      Public course catalogue
                                             |
                                   identity + entitlement
                                             |
                                             v
                                      Learner experience
                                             |
                           progress + attempts + artifacts
```

### Architectural rules

- Use the existing application, database, R2, email, Admin permission and audit infrastructure.
- Use a distinct feature boundary for Learn domain, data access, components and routes.
- Keep public learner identity separate from employee Admin identity.
- Keep the existing employee-learning feature unchanged unless an explicitly tested integration is required.
- Resolve access on the server through one entitlement service.
- Treat published course versions as immutable.
- Validate all content blocks through typed schemas before storage and rendering.
- Render only registered content and interaction components.
- Fail closed when identity, entitlement, course version or asset state is unavailable.
- Make duplicate writes, retries and concurrent progress updates idempotent where practical.

## 12. Domain model

The conceptual model includes:

### Identity

- learner user;
- learner email challenge;
- learner session;
- learner security event;
- employee Admin user and session, remaining separate.

### Publishing

- publisher;
- author;
- course;
- course version;
- course authorship;
- module;
- lesson;
- content block;
- asset;
- publication and audit event.

### Access

- enrolment;
- entitlement;
- access source;
- grant, expiry and revocation metadata.

### Learning activity

- lesson/block progress;
- resumable position;
- activity attempt;
- learner response;
- feedback result;
- reflection;
- learner artifact;
- course completion summary.

### Model invariants

- Course slug is unique within its public scope.
- Published versions cannot be edited in place.
- Module, lesson and block order is deterministic.
- Progress references an exact course version.
- An entitlement references a learner and course, not UI state.
- Revocation is enforced on the next protected server request.
- Draft content never appears in public catalogue queries.
- Deleting an author or publisher cannot silently orphan published work.
- Historical progress and attempts are retained according to policy.

## 13. Identity and security contract

V1 learner authentication uses six-digit passwordless email verification through existing email infrastructure:

- ten-minute code expiry;
- five failed attempts maximum;
- resend rotates the previous code;
- peppered cryptographic hashes only;
- enumeration-resistant responses;
- bounded email/IP rate limits;
- secure, HTTP-only, `SameSite=Lax`, host-only cookies;
- server-side session revocation and logout;
- security-event recording without sensitive code logging.

Admin sessions do not authenticate learner routes. Learner sessions do not authorise Admin routes. Admin publication and access actions are checked server-side through existing permissions.

All rich text is sanitized. No database-supplied JavaScript, iframe markup, React source or arbitrary HTML executes. Protected assets follow existing signed/protected R2 delivery patterns.

## 14. Entitlement contract

Supported V1 access policies:

- `public_preview` — selected content without saved private progress;
- `authenticated_free` — available after verified sign-in;
- `manual_grant` — granted and revocable by authorised Admin;
- `unavailable` — visible or hidden according to publication settings but not enterable.

Lesson components never decide access. The entitlement service returns a typed decision and reason. Future payments and organisation assignments may grant entitlements through adapters without changing lesson code.

## 15. Course versioning and publishing

### Draft lifecycle

`draft -> review-ready -> validated -> published -> superseded or archived`

### Rules

- Saving a block does not publish anything.
- Publication validates the complete course hierarchy.
- Every published version records publisher, authors, version, review date and publication actor.
- Editing a published course creates or updates the next draft.
- A new publication does not rewrite historical learner activity.
- Removing a public version requires a deliberate visibility decision and does not erase history.
- A course cannot publish with invalid blocks, broken required assets, missing required accessibility metadata or missing authorship/review data.

## 16. Content-block contract

A lesson is an ordered list of validated blocks.

Required V1 blocks:

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

Every block includes a stable ID, type, order, visibility, required state, estimated duration, completion rule, version and validated type-specific configuration.

### Interaction registry

V1 supports:

- single choice;
- multiple choice;
- scenario choice;
- short structured response;
- reflection.

Each interaction provides instructions, response capture, immediate explanatory feedback, retry policy, completion condition, persistence, keyboard operation and recoverable states.

New interaction types are added by registering a schema, Admin editor, learner renderer, tests and accessibility evidence. Database content cannot register executable components.

## 17. Learning design model

Lessons follow this rhythm:

`Orient -> Explain -> Demonstrate -> Do -> Feedback -> Apply -> Reflect`

Target lesson shape:

- approximately 7–12 focused minutes;
- one major concept;
- one meaningful learner action;
- immediate explanatory feedback;
- practical transfer to work or life;
- optional or required reflection according to the outcome.

### Completion principles

A route visit is never sufficient for completion. Completion may require:

- all required blocks acknowledged or completed;
- an interaction response submitted;
- an assessment condition met;
- a reflection or artifact saved;
- a configured media-engagement condition where ethically justified;
- an authorised override recorded with reason.

## 18. Experience architecture

### Public layer

- Learn home;
- course catalogue;
- course detail;
- sign-in;
- support/FAQ;
- privacy and policy links.

The primary action reflects current state: start preview, sign in, request access, continue or resume.

### Learner layer

- focused dashboard;
- course home and module map;
- lesson player;
- progress and resume;
- activities, feedback and reflection;
- artifacts and course resources;
- accurate access-denied and revoked states.

### Admin layer

- distinct `/admin/learn` workspace;
- course hierarchy and version management;
- typed block editors;
- assets and accessibility metadata;
- preview and publish;
- entitlements and audits.

### Subdomain behaviour

`learn.bespoketech.com.ng` uses the existing hostname-aware application pattern. Public URLs remain clean while internal route prefixes may isolate implementation. Unrelated marketing, Admin, audit, team and verification routes must not appear as Learn content on the Learn hostname.

## 19. Design and content voice

### Visual posture

- light, mobile-first and neutral-led;
- white/near-white canvas;
- Bespoke navy for trust and hierarchy;
- Bespoke blue for direction, focus and progress;
- semantic colours only for truthful status;
- clear typography and disciplined spacing;
- restrained borders, shadows and motion;
- one obvious primary action per view.

Do not use generic LMS dashboards, noisy card grids, purple AI gradients, robots, decorative circuits, heavy glassmorphism, childish gamification or low-contrast text.

### Voice

Copy is calm, direct, specific, respectful and outcome-aware. It explains what the learner will do without promising guaranteed transformation.

Avoid:

- hype-heavy AI language;
- “master anything instantly” claims;
- artificial urgency;
- patronising beginner language;
- unexplained technical jargon;
- invented social proof.

## 20. Approved logo contract

These files are the only approved Bespoke Learn identity sources:

| Source | Role | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `Learn/Bepsoke-Learn-Logo.png` | Compact mark | 689 × 526 | `AA0167DF6992D86F058BF84D62566E4D61A854BF5816203F41F1501A594E4F7C` |
| `Learn/Bespoke-learn-logo-with-name.png` | Full mark and wordmark lockup | 1254 × 1254 | `C86881D4472770C9181728357B41DBFF9BA97D50692FD8B2B33513D85FECB68E` |

The original files are read-only. The compact mark is used in the header/course shell. The full lockup introduces the product on the Learn home.

The full lockup includes presentation whitespace and a visible `Concept 4` annotation. That annotation is not part of the identity and must never render. A deterministic production crop may remove only blank canvas and the annotation while preserving every logo/wordmark pixel.

Allowed preparation is limited to proportional resize, PNG optimisation, neutral canvas padding and the documented crop. No generation, AI cleanup, redraw, tracing, retyping, recolouring, inversion, SVG invention, stroke editing, decorative effects or fallback substitution is allowed.

The supplied assets have opaque near-white backgrounds. No dark, transparent, monochrome or vector variant is approved. Request a real asset if one becomes necessary.

## 21. Accessibility and inclusion

V1 targets WCAG 2.2 AA and requires:

- semantic structure and heading order;
- complete keyboard operation;
- visible focus and meaningful focus order;
- sufficient contrast and target size;
- labels, instructions and recoverable form errors;
- non-colour state communication;
- reduced-motion respect;
- meaningful alternative text;
- captions and transcripts where media requires them;
- screen-reader feedback for dynamic interactions;
- mobile layouts without clipping or horizontal page overflow.

Automated checks support, but do not replace, keyboard, screen-reader-informed and visual review.

## 22. Data and privacy

Collect only what V1 needs:

- verified email and essential learner profile data;
- security/session records;
- enrolment and entitlement state;
- progress and resumable positions;
- attempts, responses, reflections and artifacts;
- operational and quality events.

Principles:

- learner reflections and artifacts are private by default;
- do not sell learner data;
- do not train external AI systems on learner work without explicit informed consent and a new policy;
- do not expose individual learning analytics to unrelated company staff;
- document retention and deletion behaviour;
- avoid logging sensitive responses;
- analytics must have a clear learning, reliability or business purpose.

## 23. Monetisation model

Bespoke Learn monetises structured outcomes, practice, feedback, trusted authorship and support—not raw video access.

### Stage 1 — V1 controlled pilot

- Public course discovery and selected introductory learning are free.
- Full-course access is authenticated-free or manually granted during pilot cohorts.
- No public price or checkout is shown.
- Purpose: validate content quality, activation, practice completion, learner support demand and technical reliability.

Pricing is intentionally not approved in this blueprint. Do not invent or publish prices until course scope, support model, outcome evidence, payment costs and target market have been reviewed.

### Stage 2 — Individual course sales

After pilot evidence:

- one-time purchase for a course or learning path;
- free preview before purchase;
- optional legitimate scholarships or access grants;
- Paystack or another approved provider verifies payment server-side and grants an entitlement;
- course/lesson code remains unaware of the payment provider.

One-time purchase is preferred before subscription because the early value proposition is a defined learning outcome, not yet a continuous library promise.

### Stage 3 — Cohorts and professional programmes

Potential offers:

- facilitated cohorts;
- live workshops linked to course modules;
- feedback on applied artifacts;
- Bespoke-led business implementation clinics;
- premium support or office hours.

These may command higher value because they combine content with human guidance. They require published service boundaries and delivery capacity.

### Stage 4 — Organisation learning

Potential revenue:

- seat or cohort licences;
- annual organisation access;
- assigned learning paths;
- private cohorts and reporting;
- custom technology capability programmes.

This stage requires tenant isolation, manager privacy rules, billing, support and reporting that are not part of V1.

### Stage 5 — Curated publisher network

Approved external experts may publish under contractual quality review. Potential models include:

- revenue share per sale;
- fixed content licence;
- commissioned Bespoke production;
- co-branded institutional programmes.

There will be no open-upload marketplace until identity, rights, moderation, quality, payout, tax and dispute systems are mature.

### Revenue principles

- No advertising inside lessons.
- No sale of learner data.
- No dark patterns or false scarcity.
- No recurring subscription before recurring value is proven.
- No certificate surcharge that implies unearned credibility.
- Refund, support and access policies must be understandable before payment launches.

## 24. How Bespoke Learn grows Bespoke Technologies

Bespoke Learn can make Bespoke Technologies more visible and more credible when the teaching is genuinely useful.

### The credibility flywheel

```text
Real engineering practice
        -> clear learning content
        -> learner practice and artifacts
        -> public trust and useful sharing
        -> qualified relationships and opportunities
        -> more real engineering insight
```

### Brand effects

- **Authority:** Bespoke demonstrates how it thinks, not merely what it sells.
- **Authenticity:** named authors, version history and reviewed dates make knowledge accountable.
- **Reach:** useful free lessons and course pages create search and referral surfaces.
- **Trust:** responsible explanations reduce hype around AI and technology.
- **Community:** learners can become informed users, clients, collaborators or future team members.
- **Service discovery:** applied course artifacts may reveal legitimate needs for Bespoke consulting or implementation, without turning lessons into sales pitches.
- **Talent:** the platform demonstrates the standards expected inside Bespoke and can support future recruitment or onboarding.
- **Product leverage:** course content can support workshops, newsletters, events and client education when rights and context permit.

### Authentic growth practices

- publish valuable preview lessons;
- attribute every course and reviewer;
- show versions and meaningful updates;
- share learner artifacts only with explicit permission;
- publish real case studies only after consent and verification;
- host practical learning sessions rather than promotional webinars;
- answer real learner questions in future revisions;
- use transparent outcome language;
- link Learn and the main Bespoke site in context, not through aggressive cross-selling.

Popularity is a consequence of usefulness and consistency, not a release claim.

## 25. Go-to-market path

### Initial distribution

- Bespoke's existing website and professional network;
- existing clients and community relationships;
- practical articles derived from approved course concepts;
- workshops and demonstration sessions;
- direct invitation to a controlled pilot;
- search-optimised public course pages;
- responsible team-member authorship and sharing.

### Expansion

- learner referrals after genuine value;
- partnerships with professional communities;
- business cohort pilots;
- carefully selected institutional relationships;
- approved external co-authors.

Do not buy low-quality enrolments, fabricate demand or optimise for vanity traffic that does not produce learning.

## 26. Measurement framework

### Learning metrics

- meaningful learning progress;
- lesson and module completion;
- assessment mastery where applicable;
- retry improvement;
- artifact completion;
- learner-reported clarity and confidence, labelled as self-report;
- return/resume success.

### Product metrics

- catalogue-to-course-detail conversion;
- course-detail-to-start conversion;
- sign-in completion;
- time to first meaningful practice;
- seven-day continuation;
- access-denied and support rates;
- lesson/player errors;
- mobile completion and accessibility failures.

### Business metrics

- pilot activation and completion;
- qualified Learn-to-service enquiries, without forced attribution;
- future paid conversion;
- refund and support cost;
- content production cost per course;
- payment and delivery cost;
- gross margin by offer;
- future organisation renewal and publisher economics.

### Guardrails

- Do not optimise time spent for its own sake.
- Do not inflate completion by weakening requirements.
- Do not publicly share small-sample percentages without context.
- Do not expose individual learner performance as marketing proof without consent.

## 27. Operating model

### Decision roles

- **Product Owner:** approves product scope, audience, monetisation and irreversible public contracts.
- **Learning Lead:** owns learning outcomes, curriculum coherence and assessment integrity.
- **Course Author:** drafts content and activities within approved outcomes.
- **Subject Reviewer:** checks technical accuracy and currency.
- **Editorial Reviewer:** checks clarity, tone, references and accessibility requirements.
- **Publisher:** performs the final authorised publication action.
- **Engineering Owner:** owns platform reliability, security, migrations and deployment evidence.
- **Learner Support:** handles access, content and technical issues through defined escalation.

One person may hold multiple roles initially, but the responsibilities and approval evidence remain distinct.

### Course release checklist

A course version requires:

- approved audience and outcomes;
- complete module/lesson hierarchy;
- technically reviewed content;
- valid activities and feedback;
- complete asset rights and attribution;
- accessibility metadata, captions and transcripts;
- references and reviewed date where needed;
- preview in representative mobile/desktop states;
- explicit publication approval;
- rollback/unpublish plan.

## 28. Content quality and governance

- Every factual course has an accountable author and reviewer.
- Time-sensitive material records reviewed date and sources.
- AI may assist drafting, but a named human owns accuracy and publication.
- AI-generated sources or citations are never trusted without verification.
- Substantive corrections create a new course version when they affect learning or assessment.
- Minor presentation corrections follow a documented policy and never rewrite approved learner history silently.
- Learner feedback informs review; it does not automatically change content.
- External content requires documented rights and licence.
- Deprecated courses remain archived with clear status rather than disappearing without explanation.

## 29. Engineering quality and release evidence

Required gates include:

- lint;
- typecheck;
- unit and integration tests;
- production build;
- migration verification and recovery plan;
- security tests for identity and entitlements;
- accessibility automation and manual keyboard review;
- real browser critical-path verification;
- responsive inspection at 320, 375, 768, 1024 and 1440 CSS pixels;
- logo-source integrity and rendered-logo inspection;
- subdomain, canonical, sitemap and robots verification;
- proof that existing Admin learning and public subdomains still work.

“Build succeeded” is not evidence that a learner can complete and resume a lesson.

## 30. Roadmap

### Phase 0 — Product authority

- blueprint and implementation mission;
- approved logo sources;
- repository and architecture proof.

### Phase 1 — V1 platform foundation

- identity separation;
- domain model and migrations;
- course schemas and versioning;
- Admin publishing foundation;
- entitlement service.

### Phase 2 — Complete learning product

- public Learn surface;
- learner dashboard and course experience;
- renderers, interactions and feedback;
- progress, completion and resume;
- Bespoke AI Foundations draft shell.

### Phase 3 — Content and controlled pilot

- approved first-course content;
- internal and invited learner QA;
- support process;
- learning and product evidence;
- correction and version cycle.

### Phase 4 — Individual monetisation

- approved pricing and policies;
- payment adapter and verified entitlement grant;
- receipts, refunds and reconciliation;
- paid launch evidence.

### Phase 5 — Programmes and organisations

- cohorts, facilitation and professional offers;
- organisation tenant and seat architecture;
- manager reporting with privacy rules.

### Phase 6 — Curated publisher expansion

- publisher onboarding and contracts;
- moderation and quality operations;
- rights, payout, tax and dispute systems;
- curated catalogue expansion.

No phase has a public date until capacity, dependencies and acceptance evidence support it.

## 31. Economics and investor view

### What is the economic engine?

The engine begins with reusable course content delivered through software, then expands through paid access, cohorts, organisation licences and curated publisher partnerships. Human support increases price and value but also cost; it must be packaged deliberately.

### What creates defensibility?

Potential defensibility comes from:

- Bespoke's combination of engineering practice and learning design;
- trusted first-party content with accountable versioning;
- a reusable active-learning and publishing system;
- accumulated knowledge of which explanations and activities produce progress;
- learner artifacts and outcome workflows;
- credible relationships with learners, businesses and future publishers.

This is a strategy, not a proven moat. It becomes defensible only through consistent quality, evidence, distribution and operational execution.

### What drives costs?

- course research, authoring and review;
- media and interactive production;
- engineering and platform operations;
- email, storage, delivery and observability;
- learner support and facilitation;
- payment fees, refunds and reconciliation later;
- publisher shares and compliance later.

### What must be measured before scaling?

- content production time and cost;
- activation and meaningful progress;
- completion and continuation;
- learner support demand;
- willingness to pay;
- paid conversion and refund rate;
- gross margin by self-paced, cohort and organisation offer;
- course freshness and revision burden.

No revenue, valuation, adoption or margin figures are claimed in this blueprint.

## 32. Risks and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Passive content disguised as learning | Weak outcomes and low trust | Require practice, feedback and explicit completion rules. |
| Overbuilding the platform before content | Delayed launch and wasted complexity | Deliver V1 around the first course and validated extension boundaries. |
| Hardcoding AI Foundations | Future courses require engineering | Enforce course-data and second-course acceptance tests. |
| Reusing Admin identities for learners | Security and privacy boundary failure | Separate learner identity, sessions and tables. |
| Content becomes outdated | Incorrect instruction and reputation damage | Versioning, sources, review dates and accountable reviewers. |
| Payment logic enters lessons | Provider lock-in and fragile access | Entitlement adapter boundary. |
| External publisher quality varies | Brand dilution and support burden | Curated onboarding, contracts, review and moderation before expansion. |
| Completion is mistaken for accreditation | Legal and trust risk | Precise completion language; no accreditation claim without authority. |
| Learner reflections are overused | Privacy loss | Private by default, minimal access and explicit consent. |
| Logo derivatives drift | Brand inconsistency | Source hashes, deterministic crop and no fabricated variants. |
| Marketplace features distract learners | Lower completion | Focused course shell and phased catalogue strategy. |
| V1 monetisation is premature | Pricing and refund friction before value | Controlled pilot and evidence before checkout. |
| The product becomes a sales funnel | Loss of educational authenticity | Useful learning first; contextual, restrained service discovery only. |

## 33. Leadership questions and answers

### Product and company leadership

**What exactly are we launching first?**
A multi-course platform foundation, the Bespoke AI Foundations draft shell, first-party Admin publishing, learner identity/access, active lesson delivery, progress and controlled pilot readiness. Approved course content is a separate required workstream.

**Why not launch a simple video course first?**
It would be faster initially but would encode the wrong product: passive consumption, weak feedback and a likely rebuild for future courses. V1 remains disciplined, but its core must represent active learning and multiple courses.

**What must be true before public launch?**
The platform gates pass, real browser journeys work, approved content is reviewed and published, policies/support exist, the subdomain is verified and no unproven outcome or accreditation claim is shown.

**Who owns the product?**
Bespoke Technologies owns the platform and first-party catalogue. Named internal roles own product, learning, content, publishing, engineering and support decisions.

**Could Learn weaken the main company brand?**
Yes, if content is generic, inaccurate or sales-heavy. Accountable authorship, visible review, calm design and practical outcomes are explicit safeguards.

### Investor and strategic-partner questions

**Is this a content business or a software business?**
Initially it is a vertically integrated learning product: proprietary software plus first-party content and optional services. Over time the platform can support organisation and curated publisher revenue without becoming an open marketplace.

**Who pays?**
The staged model targets individuals purchasing defined learning outcomes, participants in facilitated programmes, organisations purchasing capability development and later approved publisher partnerships.

**Why will learners choose Bespoke?**
The intended differentiation is practical engineering credibility, calm active learning, accountable content and applied artifacts. This must be validated through pilot behaviour and feedback, not assumed.

**How does it scale?**
Course data, block registries, immutable versions and entitlement adapters allow content and access models to expand without rebuilding learner routes. Content quality and support remain operational scaling constraints.

**What is the moat?**
There is no proven moat at V1. The potential moat is the combination of trusted practice, learning system, content quality, outcome data and distribution relationships.

**When does revenue begin?**
After the controlled pilot validates learning value, operational reliability and support economics, leadership may approve individual pricing and payment implementation.

**What would justify external investment?**
Evidence of repeatable learner activation and progress, willingness to pay, sustainable course production, sound margins, credible distribution and a responsible path to organisation or publisher scale.

### Engineering questions

**Why is Learn in the existing frontend repository?**
The repository already provides the required Admin, database, storage, email, design, subdomain and deployment foundations. A separate application would duplicate sensitive infrastructure before scale requires it.

**Why are learner and Admin identities separate?**
Admin identities are restricted employee security principals. Public learners have different eligibility, session, privacy and threat requirements.

**How do we add a second course?**
Author it through Admin using the same publisher, course-version, module, lesson and block schemas. No UI route or renderer changes are acceptable unless a genuinely new content type is approved.

**How do we add a block type?**
Register its schema, Admin editor, learner renderer, completion behaviour, tests and accessibility evidence. Database content never supplies code.

**How do we change published content?**
Create and publish a new immutable course version. Existing progress remains attached to the old version according to migration policy.

**How does payment integrate later?**
An approved payment adapter verifies server-side transactions and grants entitlements. Course components only consume entitlement decisions.

**What happens if R2, email or database is unavailable?**
The system fails closed for protected operations, shows a truthful recoverable state and does not fabricate success, access or progress.

### Team and course-author questions

**Can any team member publish?**
No. Authoring and publication are separate permissions. Only authorised publishers complete the final publication action.

**Can AI write the course?**
AI may assist drafting, but named humans own accuracy, sources, teaching quality and publication. Generated claims or citations require verification.

**What makes a lesson ready?**
It has a clear outcome, focused explanation, meaningful practice, explanatory feedback, practical transfer, correct assets, accessibility metadata and review evidence.

**Can we upload existing slides or videos?**
Yes, when rights are clear and the media meets the platform's captions, transcripts, aspect-ratio, navigation and accessibility contracts.

**How are learner questions handled?**
Support resolves immediate issues; recurring learning questions inform reviewed revisions rather than silently changing published content.

### Learner and customer questions

**What does completion mean?**
The learner completed the configured activities for a specific course version. It does not imply formal accreditation unless explicitly and legitimately stated later.

**Is progress saved?**
Yes for verified learners, including required lesson progress and supported resume positions.

**Who can see responses and reflections?**
They are private by default and accessible only according to documented operational and support permissions.

**Will learner data be sold or used to train AI?**
No sale of learner data is allowed. External AI training on learner work requires a separate explicit consent and policy decision.

**Is the platform accessible?**
WCAG 2.2 AA is the target, supported by automation and manual keyboard/visual evidence. Any known limitation must be disclosed.

### Sales, marketing and partnership questions

**How should Learn generate leads?**
By demonstrating useful expertise and allowing contextual service discovery. Lessons must never be weakened into promotional content.

**Can we advertise learner numbers or completion rates?**
Only when the data is verified, statistically contextualised and approved for publication. V1 must not fabricate or exaggerate proof.

**Can partners publish immediately?**
No. Early collaboration is commissioned or co-authored under Bespoke review. Self-service publishing is a later governed capability.

**Can we call courses accredited?**
Not without a real accreditation relationship, approved wording and supporting evidence.

### Legal, trust and governance questions

**Who owns course IP?**
First-party content is owned or licensed by Bespoke according to documented agreements. External content requires explicit rights before publication.

**How are corrections handled?**
Material corrections produce a reviewed new version; urgent harmful content may be unpublished while preserving audit history.

**What policies are required before payment?**
Pricing, refund, access duration, support, privacy, terms, receipt and dispute policies must be approved and visible.

**What policies are required before external publishers?**
Identity verification, content rights, quality, prohibited content, review, revision, payout, tax, removal and dispute policies.

## 34. V1 acceptance criteria

V1 is accepted only when:

- [ ] Bespoke Learn is served through tested Learn-hostname routing without breaking existing subdomains.
- [ ] A second course can be authored and published through Admin without UI or route code changes.
- [ ] Bespoke AI Foundations is a course data instance, not a hardcoded product branch.
- [ ] Existing `/admin/learning` employee development still works.
- [ ] Learner identity and sessions are isolated from employee Admin identity and sessions.
- [ ] Entitlement decisions are enforced server-side.
- [ ] Draft and unpublished content cannot be accessed without authorised preview.
- [ ] Published versions are immutable and learner progress remains reproducible.
- [ ] Admin can author, preview, validate, publish, grant and revoke without raw database edits.
- [ ] Every required block has a schema, editor, renderer, completion contract, tests and accessible states.
- [ ] No arbitrary content-supplied code reaches the renderer.
- [ ] Completion requires configured learning activity rather than a page visit.
- [ ] Learners can leave and resume accurately.
- [ ] Mobile, desktop, keyboard and WCAG 2.2 AA evidence exists for critical journeys.
- [ ] Approved logo files remain hash-identical and no fabricated variant exists.
- [ ] The `Concept 4` presentation annotation never appears in product UI.
- [ ] No payment, team management, open publishing or marketplace UI is present.
- [ ] No invented course content, social proof, outcome, accreditation or external publisher is presented as real.
- [ ] Migrations have verified recovery guidance and were not silently applied to production.
- [ ] Lint, typecheck, tests and production build pass.
- [ ] Real browser evidence covers Admin publication, learner sign-in/access, activity completion, persistence, resume and revocation.
- [ ] Deployment state distinguishes configured, deployed, domain-attached and live-verified.

## 35. Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-08-02 | Build Bespoke Learn inside `bespoke-technologies-FE`. | Reuses existing Admin, database, storage, email, design, subdomain and deployment infrastructure. |
| 2026-08-02 | Treat Bespoke Learn as a multi-course system from V1. | Prevents AI Foundations from becoming a hardcoded one-off. |
| 2026-08-02 | Keep external publishing reserved but model publisher/authorship now. | Preserves future expansion without taking on marketplace operations. |
| 2026-08-02 | Separate learner identity from employee Admin identity. | Their eligibility, privacy and threat boundaries differ. |
| 2026-08-02 | Use passwordless verified email for V1 learners. | Provides a focused account flow using existing email infrastructure without password-recovery or OAuth scope. |
| 2026-08-02 | Make published course versions immutable. | Protects approved content and reproducible progress. |
| 2026-08-02 | Defer checkout until pilot evidence. | Pricing and payment should follow validated learning value and support economics. |
| 2026-08-02 | Prefer one-time individual purchase before subscription. | The initial offer is a defined outcome, not yet a continuous library. |
| 2026-08-02 | Use only the two supplied Learn logo sources. | Prevents brand fabrication and derivative drift. |
| 2026-08-02 | Preserve `/admin/learning` and create `/admin/learn`. | Separates employee development from public course publishing. |

## 36. Open decisions with explicit owners

These are deliberately undecided and must not be guessed:

| Decision | When required | Decision owner |
| --- | --- | --- |
| Public price for AI Foundations | Before paid launch | Product Owner with finance/commercial review |
| Access duration after purchase | Before paid launch | Product Owner |
| Refund and support policy | Before paid launch | Product Owner with legal/operations review |
| Whether completion certificates are offered | After completion credibility is proven | Product and Learning Leads |
| Formal accreditation strategy | Before any accreditation language | Product Owner with external authority |
| Organisation pricing and reporting | Before organisation pilot | Product Owner with Engineering/Privacy review |
| External publisher commercial model | Before external publishing | Product Owner with legal/finance review |
| AI tutor or assistant | After privacy, accuracy and cost evaluation | Product, Learning and Engineering Leads |
| Dark/transparent/vector logo variants | When the design requires them | Brand Owner |

An open decision is not permission to insert a placeholder claim into the product.

## 37. How to update this blueprint

1. Verify current code and public behaviour.
2. Identify the product or operating contract that needs to change.
3. Record the proposal, reason, consequences and migration impact.
4. Obtain the required owner approval.
5. Update all affected sections and acceptance criteria.
6. Increment the blueprint version.
7. Add a dated decision-log entry.
8. Update the implementation prompt if delivery instructions changed.
9. Implement only after the documents are coherent.
10. Verify that public claims match shipped evidence.

Never rewrite history by editing a prior decision without recording its replacement.
