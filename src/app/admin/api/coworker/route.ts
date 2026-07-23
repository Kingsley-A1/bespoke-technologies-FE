import { google } from "@ai-sdk/google";
import { convertToModelMessages, smoothStream, streamText, type UIMessage } from "ai";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { buildBespokeCoworkerPrompt } from "@/lib/ai/bespoke-coworker-prompt";
import { createBespokeAIError, getBespokeAIErrorPayload, serializeBespokeAIError } from "@/lib/ai/bespoke-ai-errors";
import { getLastUserMessageText } from "@/lib/db/cockroach";

export const maxDuration = 30;
const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const access = await assertAdminPermission("dashboard.view");
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (isRateLimited(access.session.userId)) return Response.json({ error: createBespokeAIError("rate-limit", { retryAfterSeconds: 60 }) }, { status: 429 });

  let body: { messages?: UIMessage[]; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: createBespokeAIError("invalid-request", { message: "Invalid request body." }) }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const validationError = validateMessages(messages, body.conversationId);
  if (validationError) return Response.json({ error: createBespokeAIError("invalid-request", { message: validationError }) }, { status: 400 });
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return Response.json({ error: createBespokeAIError("not-configured") }, { status: 503 });

  try {
    const system = await buildBespokeCoworkerPrompt(access.session);
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system,
      messages: await convertToModelMessages(messages),
      maxRetries: 1,
      maxOutputTokens: 900,
      experimental_transform: smoothStream(),
    });
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError: (error) => serializeBespokeAIError(getBespokeAIErrorPayload(error)),
    });
  } catch (error) {
    const aiError = getBespokeAIErrorPayload(error);
    console.error("Bespoke Coworker request failed", error);
    return Response.json({ error: aiError }, { status: aiError.statusCode });
  }
}

function validateMessages(messages: UIMessage[], conversationId?: string) {
  if (!conversationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) return "A valid conversation id is required.";
  if (!Array.isArray(messages) || messages.length === 0) return "At least one message is required.";
  if (messages.length > MAX_MESSAGES) return `Only the latest ${MAX_MESSAGES} messages may be sent.`;
  const lastUserText = getLastUserMessageText(messages);
  if (!lastUserText) return "The latest user message must include text.";
  if (lastUserText.length > MAX_MESSAGE_CHARS) return `Messages must be ${MAX_MESSAGE_CHARS} characters or fewer.`;
  const totalTextLength = messages.reduce((total, message) => total + message.parts.reduce((partTotal, part) => partTotal + (part.type === "text" ? part.text.length : 0), 0), 0);
  if (totalTextLength > MAX_MESSAGES * MAX_MESSAGE_CHARS) return "Conversation payload is too large.";
  return undefined;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}
