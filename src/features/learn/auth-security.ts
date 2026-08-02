import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

const CHALLENGE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export type LearnerSecuritySecrets = {
  sessionSecret: string;
  codePepper: string;
};

export type LearnerEmailChallenge = {
  id: string;
  email: string;
  identityHash: string;
  networkHash: string;
  codeHash: string;
  expiresAt: string;
  failedAttempts: number;
  invalidatedAt?: string;
  consumedAt?: string;
  createdAt: string;
};

type ChallengeStatus = "verified" | "expired" | "invalidated" | "locked" | "invalid_code";

function hmac(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizedEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > 320 || !/^\S+@\S+\.\S+$/.test(normalized)) {
    throw new Error("A valid learner email is required.");
  }
  return normalized;
}

function emailCode(value?: string) {
  const code = value ?? String(randomInt(0, 1_000_000)).padStart(6, "0");
  if (!/^\d{6}$/.test(code)) throw new Error("Learner verification codes must be six digits.");
  return code;
}

export function hashLearnerCode(code: string, codePepper: string) {
  return hmac(code, codePepper);
}

export function hashLearnerIdentity(email: string, codePepper: string) {
  return hmac(normalizedEmail(email), codePepper);
}

export function hashLearnerNetwork(network: string, codePepper: string) {
  return hmac(network.trim() || "unknown", codePepper);
}

export function createEmailChallenge(input: {
  email: string;
  network: string;
  now: Date;
  secrets: LearnerSecuritySecrets;
  code?: string;
  invalidatesChallengeId?: string;
}) {
  const email = normalizedEmail(input.email);
  const code = emailCode(input.code);
  const createdAt = input.now.toISOString();
  return {
    code,
    invalidatesChallengeId: input.invalidatesChallengeId,
    record: {
      id: randomUUID(),
      email,
      identityHash: hashLearnerIdentity(email, input.secrets.codePepper),
      networkHash: hashLearnerNetwork(input.network, input.secrets.codePepper),
      codeHash: hashLearnerCode(code, input.secrets.codePepper),
      expiresAt: new Date(input.now.getTime() + CHALLENGE_LIFETIME_MS).toISOString(),
      failedAttempts: 0,
      createdAt,
    } satisfies LearnerEmailChallenge,
  };
}

export function verifyEmailChallenge(
  record: LearnerEmailChallenge,
  suppliedCode: string,
  now: Date,
  secrets: LearnerSecuritySecrets,
): { status: ChallengeStatus; record: LearnerEmailChallenge } {
  if (record.invalidatedAt || record.consumedAt) return { status: "invalidated", record };
  if (new Date(record.expiresAt).getTime() < now.getTime()) return { status: "expired", record };
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) return { status: "locked", record };

  if (safeEqual(record.codeHash, hashLearnerCode(suppliedCode, secrets.codePepper))) {
    return { status: "verified", record: { ...record, consumedAt: now.toISOString() } };
  }

  const nextRecord = { ...record, failedAttempts: record.failedAttempts + 1 };
  return {
    status: nextRecord.failedAttempts >= MAX_FAILED_ATTEMPTS ? "locked" : "invalid_code",
    record: nextRecord,
  };
}

export function learnerCookieName(environment = process.env.NODE_ENV) {
  return environment === "production" ? "__Host-bt_learn_session" : "bt_learn_session";
}

export function learnerSessionCookieOptions(environment = process.env.NODE_ENV) {
  return {
    httpOnly: true,
    secure: environment === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function encodeLearnerSession(sessionId: string, secrets: LearnerSecuritySecrets) {
  return `${sessionId}.${hmac(`learn:${sessionId}`, secrets.sessionSecret)}`;
}

export function decodeLearnerSession(token: string | undefined, secrets: LearnerSecuritySecrets) {
  if (!token) return null;
  const [sessionId, signature, ...rest] = token.split(".");
  if (!sessionId || !signature || rest.length > 0) return null;
  const expected = hmac(`learn:${sessionId}`, secrets.sessionSecret);
  if (!safeEqual(signature, expected)) return null;
  return { sessionId, tokenHash: hmac(token, secrets.sessionSecret) };
}

export function isRateLimited(
  events: readonly Date[],
  now: Date,
  policy: { limit: number; windowMs: number },
) {
  return events.filter((event) => {
    const age = now.getTime() - event.getTime();
    return age >= 0 && age < policy.windowMs;
  }).length >= policy.limit;
}
