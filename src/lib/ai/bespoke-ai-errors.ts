export const BESPOKE_AI_ERROR_PREFIX = "__BESPOKE_AI_ERROR__:";

export type BespokeAIErrorType =
  | "rate-limit"
  | "provider-overloaded"
  | "quota-exhausted"
  | "not-configured"
  | "invalid-request"
  | "server";

export interface BespokeAIErrorPayload {
  type: BespokeAIErrorType;
  title: string;
  message: string;
  recoveryLabel: string;
  canRetry: boolean;
  shouldDisableInput: boolean;
  contactRecommended: boolean;
  statusCode: number;
  retryAfterSeconds?: number;
}

const BESPOKE_AI_ERROR_LIBRARY: Record<BespokeAIErrorType, BespokeAIErrorPayload> =
  {
    "rate-limit": {
      type: "rate-limit",
      title: "Bespoke AI is handling a lot of requests right now.",
      message:
        "Please wait a moment before sending another message. Your conversation is still here.",
      recoveryLabel: "Try again in a few seconds.",
      canRetry: true,
      shouldDisableInput: false,
      contactRecommended: false,
      statusCode: 429,
    },
    "provider-overloaded": {
      type: "provider-overloaded",
      title: "Bespoke AI is taking a short pause.",
      message:
        "The AI service is under heavy demand right now. Please come back shortly for a fresh response.",
      recoveryLabel: "Come back in about a minute.",
      canRetry: true,
      shouldDisableInput: false,
      contactRecommended: true,
      statusCode: 503,
    },
    "quota-exhausted": {
      type: "quota-exhausted",
      title: "Bespoke AI is temporarily at capacity.",
      message:
        "The assistant has reached its current session limit. Please come back later for another response.",
      recoveryLabel: "Please try again a bit later.",
      canRetry: true,
      shouldDisableInput: false,
      contactRecommended: true,
      statusCode: 429,
    },
    "not-configured": {
      type: "not-configured",
      title: "Bespoke AI is unavailable right now.",
      message:
        "The assistant is offline at the moment. Please contact Bespoke Technologies directly so the team can help you manually.",
      recoveryLabel: "A direct team handoff is the fastest path right now.",
      canRetry: false,
      shouldDisableInput: true,
      contactRecommended: true,
      statusCode: 503,
    },
    "invalid-request": {
      type: "invalid-request",
      title: "That request could not be sent.",
      message:
        "Please shorten or rephrase your message, then try again.",
      recoveryLabel: "Short, clear prompts work best here.",
      canRetry: false,
      shouldDisableInput: false,
      contactRecommended: false,
      statusCode: 400,
    },
    server: {
      type: "server",
      title: "We could not finish that reply.",
      message:
        "Something went wrong on our side while preparing the response. Please try again shortly.",
      recoveryLabel: "Retrying once usually clears this.",
      canRetry: true,
      shouldDisableInput: false,
      contactRecommended: true,
      statusCode: 500,
    },
  };

export function createBespokeAIError(
  type: BespokeAIErrorType,
  overrides: Partial<BespokeAIErrorPayload> = {},
): BespokeAIErrorPayload {
  return {
    ...BESPOKE_AI_ERROR_LIBRARY[type],
    ...overrides,
    type,
  };
}

export function serializeBespokeAIError(payload: BespokeAIErrorPayload) {
  return `${BESPOKE_AI_ERROR_PREFIX}${JSON.stringify(payload)}`;
}

export function getBespokeAIErrorPayload(error: unknown): BespokeAIErrorPayload {
  const parsedError = parseBespokeAIError(error);
  if (parsedError) {
    return parsedError;
  }

  const errorText = getErrorText(error);

  if (isNotConfiguredError(errorText)) {
    return createBespokeAIError("not-configured");
  }

  if (isInvalidRequestError(errorText)) {
    return createBespokeAIError("invalid-request");
  }

  if (isQuotaError(errorText)) {
    return createBespokeAIError("quota-exhausted");
  }

  if (isProviderOverloadedError(errorText)) {
    return createBespokeAIError("provider-overloaded");
  }

  if (isRateLimitError(errorText)) {
    return createBespokeAIError("rate-limit");
  }

  return createBespokeAIError("server");
}

function parseBespokeAIError(error: unknown) {
  const directPayload = normalizeBespokeAIErrorPayload(error);
  if (directPayload) {
    return directPayload;
  }

  if (error instanceof Error && "info" in error) {
    return normalizeBespokeAIErrorPayload(
      (error as Error & { info?: unknown }).info,
    );
  }

  const rawMessage =
    error instanceof Error
      ? error.message.trim()
      : typeof error === "string"
        ? error.trim()
        : "";

  if (rawMessage) {
    const rawPayload = rawMessage.startsWith(BESPOKE_AI_ERROR_PREFIX)
      ? safeParseJson(rawMessage.slice(BESPOKE_AI_ERROR_PREFIX.length))
      : safeParseJson(rawMessage);

    if (rawPayload) {
      return normalizeBespokeAIErrorPayload(rawPayload);
    }
  }

  const errorText = getErrorText(error).trim();
  if (!errorText) {
    return null;
  }

  const serializedPayload = errorText.startsWith(BESPOKE_AI_ERROR_PREFIX)
    ? safeParseJson(errorText.slice(BESPOKE_AI_ERROR_PREFIX.length))
    : safeParseJson(errorText);

  if (serializedPayload) {
    return normalizeBespokeAIErrorPayload(serializedPayload);
  }

  return null;
}

function normalizeBespokeAIErrorPayload(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if ("error" in value) {
    return normalizeBespokeAIErrorPayload(value.error);
  }

  if (typeof value.type !== "string") {
    return null;
  }

  if (!isBespokeAIErrorType(value.type)) {
    return null;
  }

  const base = createBespokeAIError(value.type);
  return {
    ...base,
    title: typeof value.title === "string" ? value.title : base.title,
    message: typeof value.message === "string" ? value.message : base.message,
    recoveryLabel:
      typeof value.recoveryLabel === "string"
        ? value.recoveryLabel
        : base.recoveryLabel,
    canRetry:
      typeof value.canRetry === "boolean" ? value.canRetry : base.canRetry,
    shouldDisableInput:
      typeof value.shouldDisableInput === "boolean"
        ? value.shouldDisableInput
        : base.shouldDisableInput,
    contactRecommended:
      typeof value.contactRecommended === "boolean"
        ? value.contactRecommended
        : base.contactRecommended,
    statusCode:
      typeof value.statusCode === "number" ? value.statusCode : base.statusCode,
    retryAfterSeconds:
      typeof value.retryAfterSeconds === "number"
        ? value.retryAfterSeconds
        : undefined,
  };
}

function isBespokeAIErrorType(value: string): value is BespokeAIErrorType {
  return value in BESPOKE_AI_ERROR_LIBRARY;
}

function isRateLimitError(errorText: string) {
  return /too many requests|rate.?limit/i.test(errorText);
}

function isProviderOverloadedError(errorText: string) {
  return /high demand|unavailable|service unavailable|status["\s:]+503|code["\s:]+503/i.test(
    errorText,
  );
}

function isQuotaError(errorText: string) {
  return /quota|resource_exhausted/i.test(errorText);
}

function isNotConfiguredError(errorText: string) {
  return /not connected yet|missing_google_api_key|api key/i.test(errorText);
}

function isInvalidRequestError(errorText: string) {
  return /invalid request body|messages must be an array|valid conversation id|at least one message|must include text|characters or fewer|payload is too large/i.test(
    errorText,
  );
}

function getErrorText(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return `${error.name} ${error.message} ${safeStringify(error)}`;
  }

  return safeStringify(error);
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
