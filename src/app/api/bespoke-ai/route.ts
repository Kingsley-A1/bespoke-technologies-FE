import { google } from "@ai-sdk/google";
import {
  consumeStream,
  convertToModelMessages,
  smoothStream,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { bespokeAITools } from "@/lib/ai/bespoke-ai-tools";
import {
  buildBespokeAISystemPrompt,
  type BespokeAIResponseDetail,
} from "@/lib/ai/bespoke-ai-prompt";
import {
  createBespokeAIError,
  getBespokeAIErrorPayload,
  serializeBespokeAIError,
} from "@/lib/ai/bespoke-ai-errors";
import {
  ensureAIConversation,
  getLastUserMessageText,
  persistAIEvent,
  persistAIMessage,
} from "@/lib/db/cockroach";

export const maxDuration = 30;

const RESPONSE_DETAILS = new Set<BespokeAIResponseDetail>([
  "concise",
  "extended",
]);
const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  let body: {
    messages?: UIMessage[];
    conversationId?: string;
    detailLevel?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json(
      {
        error: createBespokeAIError("invalid-request", {
          message: "Invalid request body.",
        }),
      },
      { status: 400 },
    );
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages)) {
    return Response.json(
      {
        error: createBespokeAIError("invalid-request", {
          message: "Messages must be an array.",
        }),
      },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return Response.json(
      {
        error: createBespokeAIError("rate-limit", {
          retryAfterSeconds: 60,
        }),
      },
      { status: 429 },
    );
  }

  const validationError = validateMessages(messages, body.conversationId);
  if (validationError) {
    return Response.json(
      {
        error: createBespokeAIError("invalid-request", {
          message: validationError,
        }),
      },
      { status: 400 },
    );
  }

  const conversationId = body.conversationId;
  const lastUserText = getLastUserMessageText(messages);
  const detailLevel = parseDetailLevel(body.detailLevel);

  void ensureAIConversation(conversationId).then(() =>
    persistAIMessage({
      conversationId,
      role: "user",
      content: lastUserText,
    }),
  );

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    void persistAIEvent({
      conversationId,
      eventName: "missing_google_api_key",
    });

    return Response.json(
      {
        error: createBespokeAIError("not-configured"),
      },
      { status: 503 },
    );
  }

  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: buildBespokeAISystemPrompt({ detail: detailLevel }),
      messages: await convertToModelMessages(messages),
      tools: bespokeAITools,
      stopWhen: stepCountIs(4),
      maxRetries: 1,
      maxOutputTokens: 800,
      experimental_transform: smoothStream(),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      consumeSseStream: consumeStream,
      onFinish: async ({ responseMessage, isAborted }) => {
        const assistantText = responseMessage.parts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("\n")
          .trim();

        await ensureAIConversation(conversationId);
        await persistAIMessage({
          conversationId,
          role: "assistant",
          content: assistantText,
        });
        await persistAIEvent({
          conversationId,
          eventName: isAborted
            ? "assistant_response_aborted"
            : "assistant_response_finished",
          payload: { messageId: responseMessage.id, isAborted },
        });
      },
      onError: (error) => {
        const aiError = getBespokeAIErrorPayload(error);

        console.error("Bespoke AI stream failed", error);
        void persistAIEvent({
          conversationId,
          eventName: "ai_stream_failed",
          payload: {
            type: aiError.type,
            statusCode: aiError.statusCode,
            message: aiError.message,
          },
        });

        return serializeBespokeAIError(aiError);
      },
    });
  } catch (error) {
    const aiError = getBespokeAIErrorPayload(error);

    console.error("Bespoke AI request failed", error);
    void persistAIEvent({
      conversationId,
      eventName: "ai_request_failed",
      payload: {
        type: aiError.type,
        statusCode: aiError.statusCode,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return Response.json(
      {
        error: aiError,
      },
      { status: aiError.statusCode },
    );
  }
}

function parseDetailLevel(value?: string): BespokeAIResponseDetail {
  if (!value) return "extended";
  return RESPONSE_DETAILS.has(value as BespokeAIResponseDetail)
    ? (value as BespokeAIResponseDetail)
    : "extended";
}

function validateMessages(messages: UIMessage[], conversationId?: string) {
  if (!conversationId || !isUuid(conversationId)) {
    return "A valid conversation id is required.";
  }

  if (messages.length === 0) return "At least one message is required.";
  if (messages.length > MAX_MESSAGES) {
    return `Only the latest ${MAX_MESSAGES} messages may be sent.`;
  }

  const lastUserText = getLastUserMessageText(messages);
  if (!lastUserText) return "The latest user message must include text.";
  if (lastUserText.length > MAX_MESSAGE_CHARS) {
    return `Messages must be ${MAX_MESSAGE_CHARS} characters or fewer.`;
  }

  const totalTextLength = messages.reduce((total, message) => {
    return (
      total +
      message.parts.reduce(
        (partTotal, part) =>
          partTotal + (part.type === "text" ? part.text.length : 0),
        0,
      )
    );
  }, 0);

  if (totalTextLength > MAX_MESSAGES * MAX_MESSAGE_CHARS) {
    return "Conversation payload is too large.";
  }

  return undefined;
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
