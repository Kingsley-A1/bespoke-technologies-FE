import { describe, expect, it } from "vitest";
import {
  createEmailChallenge,
  decodeLearnerSession,
  encodeLearnerSession,
  isRateLimited,
  learnerCookieName,
  learnerSessionCookieOptions,
  verifyEmailChallenge,
} from "./auth-security";
import type { LearnerEmailChallenge } from "./auth-security";

const secrets = {
  sessionSecret: "s".repeat(48),
  codePepper: "p".repeat(48),
};
const issuedAt = new Date("2026-08-02T10:00:00.000Z");

describe("learner authentication security", () => {
  it("stores only a peppered hash for a six-digit challenge and verifies it before expiry", () => {
    const challenge = createEmailChallenge({
      email: "Learner@example.com",
      network: "203.0.113.4",
      now: issuedAt,
      secrets,
      code: "123456",
    });

    expect(challenge.record.email).toBe("learner@example.com");
    expect(challenge.record.codeHash).not.toContain("123456");
    expect(challenge.record.codeHash).toHaveLength(43);
    expect(verifyEmailChallenge(challenge.record, "123456", issuedAt, secrets)).toMatchObject({ status: "verified" });
  });

  it("expires codes after ten minutes and locks them after five failed attempts", () => {
    const challenge = createEmailChallenge({ email: "learner@example.com", network: "203.0.113.4", now: issuedAt, secrets, code: "123456" });
    expect(verifyEmailChallenge(challenge.record, "123456", new Date("2026-08-02T10:10:00.001Z"), secrets)).toMatchObject({ status: "expired" });

    let record: LearnerEmailChallenge = challenge.record;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      record = verifyEmailChallenge(record, "000000", issuedAt, secrets).record;
    }
    expect(verifyEmailChallenge(record, "123456", issuedAt, secrets)).toMatchObject({ status: "locked" });
  });

  it("makes a resend invalidate the preceding challenge", () => {
    const first = createEmailChallenge({ email: "learner@example.com", network: "203.0.113.4", now: issuedAt, secrets, code: "123456" });
    const resend = createEmailChallenge({
      email: "learner@example.com",
      network: "203.0.113.4",
      now: new Date("2026-08-02T10:01:00.000Z"),
      secrets,
      code: "654321",
      invalidatesChallengeId: first.record.id,
    });
    const invalidated = { ...first.record, invalidatedAt: resend.record.createdAt };

    expect(verifyEmailChallenge(invalidated, "123456", issuedAt, secrets)).toMatchObject({ status: "invalidated" });
    expect(verifyEmailChallenge(resend.record, "654321", issuedAt, secrets)).toMatchObject({ status: "verified" });
  });

  it("uses a dedicated host-only SameSite Lax learner cookie and signature namespace", () => {
    const token = encodeLearnerSession("a1122334-1122-4122-8122-112233445566", secrets);
    expect(learnerCookieName("production")).toBe("__Host-bt_learn_session");
    expect(learnerSessionCookieOptions("production")).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(learnerSessionCookieOptions("production")).not.toHaveProperty("domain");
    expect(decodeLearnerSession(token, secrets)).toMatchObject({ sessionId: "a1122334-1122-4122-8122-112233445566" });
    expect(decodeLearnerSession(`a1122334-1122-4122-8122-112233445566.${"x".repeat(43)}`, secrets)).toBeNull();
  });

  it("limits repeated request attempts by both identity and network within the rolling window", () => {
    const events = [
      new Date("2026-08-02T09:50:00.000Z"),
      new Date("2026-08-02T09:52:00.000Z"),
      new Date("2026-08-02T09:54:00.000Z"),
    ];
    expect(isRateLimited(events, issuedAt, { limit: 3, windowMs: 15 * 60 * 1000 })).toBe(true);
    expect(isRateLimited(events, new Date("2026-08-02T10:10:00.001Z"), { limit: 3, windowMs: 15 * 60 * 1000 })).toBe(false);
  });
});
