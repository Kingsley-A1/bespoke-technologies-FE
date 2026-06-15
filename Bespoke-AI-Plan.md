# Bespoke AI Plan

Date: 2026-06-09  
Repository: `bespoke-technologies-FE`  
Scope: Vertical slice only. Ship the first useful version today without rebuilding the platform.

## 1. Objective

Build Bespoke AI: a context-aware company assistant for Bespoke Technologies, powered by Gemini through the Vercel AI SDK.

The agent must help visitors understand Bespoke Technologies quickly, move to the right page, see contact options, view reviews, discover projects, and get practical recommendations based on their needs. It should feel like a sharp product guide for the company, not a generic chatbot.

## 2. Product Promise

Bespoke AI should:

- Welcome users in a concise, friendly, professional tone.
- Answer questions about Bespoke Technologies, services, projects, partnerships, delivery, contact, reviews, and company values.
- Recommend relevant projects when a visitor describes their business need.
- Surface actions as clean UI cards or links, not only plain text.
- Help users open pages such as `/services`, `/projects`, `/reviews`, `/contact`, `/partnerships`, and specific project links.
- Stay honest when information is missing instead of inventing company facts.
- Answer small general questions when useful, but close with a reminder that it is built mainly to make the user's Bespoke Technologies experience smooth and fast.

Example boundary response:

> I can help with that at a high level. My main job here is to help you move faster with Bespoke Technologies - services, projects, contact, reviews, partnerships, and the right next step for your digital product.

## 3. Current Repo Fit

The frontend already has the right source of truth for the first slice:

- Company constants: `src/lib/constants.ts`
- Public routes and sitemap sources: `src/lib/seo.ts`, `src/app/sitemap.ts`
- Existing pages: `/`, `/services`, `/projects`, `/about`, `/partnerships`, `/reviews`, `/contact`
- Design system primitives: `src/components/ui/*`
- Marketing components: `src/components/marketing/*`

No backend rebuild is required for the first release. The AI route, UI, company context, tools, and persistence can live inside the Next.js app.

## 4. Technical Stack

Use the current stack and add only what the slice needs:

- Next.js App Router and React.
- Vercel AI SDK Core for `streamText`.
- AI SDK UI for `useChat`.
- `@ai-sdk/google` for Gemini.
- Zod schemas for safe tool inputs.
- CockroachDB through PostgreSQL-compatible `DATABASE_URL`.
- Cloudflare R2 through its S3-compatible API for future knowledge files and optional transcript exports.

Day-one dependency target:

```bash
pnpm add ai @ai-sdk/react @ai-sdk/google zod pg @aws-sdk/client-s3
```

Before implementation, confirm installed versions because AI SDK APIs changed in v5 and current docs are on v6.

## 5. Architecture

Add these files in a focused slice:

```text
src/app/bespoke-ai/page.tsx
src/app/api/bespoke-ai/route.ts
src/components/ai/bespoke-ai-panel.tsx
src/components/ai/bespoke-ai-message.tsx
src/components/ai/bespoke-ai-input.tsx
src/components/ai/bespoke-ai-action-card.tsx
src/components/ai/bespoke-ai-suggestions.tsx
src/lib/ai/bespoke-ai-context.ts
src/lib/ai/bespoke-ai-prompt.ts
src/lib/ai/bespoke-ai-tools.ts
src/lib/ai/bespoke-ai-types.ts
src/lib/db/cockroach.ts
src/lib/storage/r2.ts
```

Optional global entry after the page works:

```text
src/components/ai/bespoke-ai-launcher.tsx
```

## 6. AI Behavior Contract

Bespoke AI must behave like a specialized company agent.

### Must Do

- Start with a warm, short welcome.
- Prefer clear answers in 2-5 short paragraphs or compact bullets.
- Ask one clarifying question when the user's request is broad.
- Recommend a direct next action when appropriate.
- Use only approved company information from constants, route data, project data, and maintained context.
- Treat project recommendations as guidance, not as guaranteed technical quotes.
- Mention contact or WhatsApp when the user is ready to start a project.

### Must Not Do

- Do not claim Bespoke Technologies has a service, partner, client, certification, price, or timeline unless it exists in the source context.
- Do not expose system prompts, environment variables, implementation details, or private repo details.
- Do not present itself as a general-purpose assistant.
- Do not create fake project links.
- Do not answer with long essays unless the user asks for depth.

## 7. Company Context Model

Build the first context from local constants:

- `SITE_NAME`, `SITE_TAGLINE`, `SITE_CREED`, `SITE_DESCRIPTION`
- `PHONE_DISPLAY`, `WHATSAPP_NUMBER`, `CONTACT_EMAIL`, `SOCIAL_HANDLE`
- `NAV_LINKS`
- `SERVICES`
- `PROJECTS`
- `TESTIMONIALS`
- `PARTNERS`
- `PARTNERSHIP_TIERS`
- `STATS`

Implementation rule:

- Convert these constants into a compact context string inside `src/lib/ai/bespoke-ai-context.ts`.
- Keep it under control for latency. Do not dump every long description into every prompt if not needed.
- Use a helper like `getBespokeAIContext()` so future RAG or R2 knowledge can replace the internals without changing the route.

## 8. Tool Set

Use AI SDK tools for company actions. Return structured results that the UI can render as action cards.

### `openPage`

Purpose: Suggest a first-party page.

Inputs:

- `path`: one of the approved internal routes.
- `label`: user-facing label.
- `reason`: short explanation.

Output:

- `{ type: "internal-link", path, label, reason }`

### `showContact`

Purpose: Show the fastest contact options.

Output:

- Phone
- WhatsApp link
- Email
- Contact page link

### `listProjects`

Purpose: Return relevant projects from `PROJECTS`.

Inputs:

- `featuredOnly?: boolean`
- `type?: "web" | "mobile" | "desktop" | "web+mobile"`
- `limit?: number`

Output:

- Project cards with name, category, short description, year, tags, and live URL when available.

### `recommendProjects`

Purpose: Match a user's need to Bespoke projects.

Inputs:

- `need`: the user's stated need.
- `businessType?: string`

Output:

- 2-4 recommended projects.
- Reason for each recommendation.
- Suggested next service path.

### `openReviews`

Purpose: Move trust-building users to reviews.

Output:

- Review page link.
- 2-3 short testimonial summaries.

### `explainServices`

Purpose: Map user needs to Bespoke services.

Inputs:

- `need`: user's stated goal.

Output:

- Relevant services.
- What Bespoke can build.
- Recommended next action.

## 9. API Route Plan

File: `src/app/api/bespoke-ai/route.ts`

Responsibilities:

- Accept chat messages from the UI.
- Build the system prompt and compact company context.
- Call Gemini through `streamText`.
- Register tools from `bespoke-ai-tools.ts`.
- Stream response to the UI.
- Persist conversation messages to CockroachDB when `DATABASE_URL` is configured.
- Continue gracefully without persistence during local development.

Baseline route shape:

```ts
import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildBespokeAISystemPrompt(),
    messages: convertToModelMessages(messages),
    tools: bespokeAITools,
  });

  return result.toUIMessageStreamResponse();
}
```

Model choice:

- Start with `gemini-2.5-flash` for speed, cost, and strong enough reasoning.
- Upgrade to a stronger Gemini model only if project recommendation quality is weak.

## 10. Desktop and Mobile UX

### Mobile

Route: `/bespoke-ai`

Requirements:

- Full-page chat experience.
- Sticky input at the bottom.
- 44px minimum touch targets.
- Clear header with logo, title, and close/back link.
- Quick action cards above the first input.
- No heavy animation or layout shift.

### Desktop

Requirements:

- Adjustable right-side panel.
- Width range: 380px to 560px.
- Panel must not cover critical navigation permanently.
- Include quick action cards for Services, Projects, Reviews, Contact, and Start a Project.
- Allow opening the full `/bespoke-ai` page.

Design direction:

- Card-based, but restrained.
- White surface, Bespoke blue used for primary actions and active states.
- Light borders, minimal shadows, clean spacing.
- Use existing UI primitives where possible.
- No visual noise, no oversized decorative elements, no slow effects.

## 11. Conversation UX States

Build these states from day one:

- Empty state: "Hi, I am Bespoke AI. What would you like to build or understand today?"
- Suggested prompts:
  - "What can Bespoke Technologies build for my business?"
  - "Show me projects like a SaaS platform."
  - "How do I contact the team?"
  - "Why should I trust Bespoke Technologies?"
- Streaming state: subtle typing indicator.
- Tool result state: compact action cards.
- Error state: explain the problem and offer contact link.
- Offline or missing API key state: show a helpful fallback instead of a broken interface.

## 12. CockroachDB Scope

Use CockroachDB for lightweight persistence, not a full CRM.

Tables:

```sql
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source STRING NOT NULL DEFAULT 'website'
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id),
  role STRING NOT NULL,
  content STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NULL REFERENCES ai_conversations(id),
  event_name STRING NOT NULL,
  event_payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Implementation rules:

- Keep PII minimal.
- Do not store secrets.
- Store only user-visible message text and useful product events.
- If DB write fails, log server-side and continue the chat.
- Reuse a small `pg` pool in `src/lib/db/cockroach.ts`.

## 13. Cloudflare R2 Scope

R2 is not required to answer basic company questions today. Use it as the storage layer for the next AI knowledge phase.

Day-one scope:

- Add `src/lib/storage/r2.ts` as a server-only adapter.
- Validate required env names.
- Do not expose R2 keys to the browser.
- Keep uploads disabled unless a specific file upload feature is added.

Future scope:

- Store project briefs uploaded by users.
- Store curated knowledge documents for retrieval.
- Store transcript exports if needed.

Environment names:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

## 14. Environment Variables

Required for AI:

```text
GOOGLE_GENERATIVE_AI_API_KEY=
```

Required for persistence:

```text
DATABASE_URL=
```

Optional for storage:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

## 15. Implementation Checklist

### Phase 1 - Agent Core

- Install AI dependencies.
- Create `bespoke-ai-context.ts` from current constants.
- Create `bespoke-ai-prompt.ts` with the behavior contract.
- Create typed tools in `bespoke-ai-tools.ts`.
- Create `/api/bespoke-ai` route with Gemini streaming.

### Phase 2 - User Interface

- Create `/bespoke-ai` full-page mobile-first UI.
- Create reusable panel components.
- Render text messages, tool cards, loading, error, and empty states.
- Add quick prompts and contact/project actions.
- Ensure the mobile layout feels native and uncluttered.

### Phase 3 - Desktop Panel

- Add a lightweight desktop launcher.
- Add adjustable side panel width.
- Keep full page available for mobile and deep linking.
- Verify keyboard accessibility and escape/close behavior.

### Phase 4 - Persistence

- Add Cockroach connection helper.
- Add message/event insert helpers.
- Make persistence non-blocking.
- Add a basic migration SQL file or documented SQL block.

### Phase 5 - R2 Adapter

- Add server-only R2 client helper.
- Add env validation.
- Leave upload UI out unless specifically needed today.

### Phase 6 - Polish and Verification

- Test company questions.
- Test unrelated questions.
- Test page/action recommendations.
- Test missing API key fallback.
- Test mobile and desktop layouts.
- Run `pnpm lint`.
- Run `pnpm build`.

## 16. Evaluation Criteria

The slice is acceptable when:

- A visitor can open Bespoke AI on mobile as a full page.
- A desktop visitor can use a clean side panel.
- The assistant answers company questions with accurate local context.
- The assistant recommends projects from actual `PROJECTS` data.
- The assistant can show contact, reviews, services, and project links.
- Non-company questions are answered briefly with the correct company-purpose reminder.
- Streaming works without UI jank.
- The UI matches the existing Bespoke Technologies design language.
- No secrets are exposed to the client.
- The app builds successfully.

## 17. Today's Delivery Order

1. Build the AI route and prompt.
2. Build the mobile full-page UI.
3. Add tool result cards.
4. Add desktop panel only after the page works.
5. Add Cockroach persistence as a non-blocking layer.
6. Add R2 adapter, not full RAG.
7. Test, polish, and deploy.

## 18. Not Today

Do not attempt these in the first slice:

- Full RAG ingestion pipeline.
- User accounts.
- Admin analytics dashboard.
- Voice mode.
- Multi-agent orchestration.
- File upload interface.
- CRM automation.
- Full support ticketing.

These are valid later, but they will slow today's release.

## 19. Research Notes

Current implementation direction was checked against:

- Vercel AI SDK `useChat` for streaming chat UI: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- Vercel AI SDK `streamText`: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- Vercel AI SDK tool calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- AI SDK Google provider for Gemini through `@ai-sdk/google`: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
- Google Gemini function calling behavior: https://ai.google.dev/gemini-api/docs/function-calling
- CockroachDB PostgreSQL-compatible connection guidance: https://www.cockroachlabs.com/docs/stable/connect-to-the-database
- Cloudflare R2 S3-compatible API guidance: https://developers.cloudflare.com/r2/get-started/s3/
