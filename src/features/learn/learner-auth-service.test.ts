import { describe, expect, it } from "vitest";
import { createLearnerAuthService, type LearnerAuthRepository } from "./learner-auth-service";
import type { LearnerEmailChallenge } from "./auth-security";

const secrets = { sessionSecret: "s".repeat(48), codePepper: "p".repeat(48) };

function createRepository(): LearnerAuthRepository & { challenges: LearnerEmailChallenge[]; sessions: Array<{ learnerId: string; tokenHash: string }> } {
  const challenges: LearnerEmailChallenge[] = [];
  const rateEvents: Array<{ action: "email_code.request" | "email_code.verify"; identityHash: string; networkHash: string; createdAt: Date }> = [];
  const sessions: Array<{ learnerId: string; tokenHash: string }> = [];
  return {
    challenges,
    sessions,
    async listRateLimitEvents(input) {
      return rateEvents.filter((event) => event.action === input.action && (event.identityHash === input.identityHash || event.networkHash === input.networkHash)).map((event) => event.createdAt);
    },
    async recordRateLimitEvent(input) { rateEvents.push({ ...input, createdAt: new Date(input.createdAt) }); },
    async invalidateOutstandingChallenges(identityHash, invalidatedAt) { challenges.forEach((challenge) => { if (challenge.identityHash === identityHash && !challenge.consumedAt) challenge.invalidatedAt = invalidatedAt; }); },
    async createEmailChallenge(challenge) { challenges.push(challenge); },
    async findLatestEmailChallenge(identityHash) { return challenges.findLast((challenge) => challenge.identityHash === identityHash && !challenge.invalidatedAt && !challenge.consumedAt) ?? null; },
    async saveChallengeOutcome(challenge) { const index = challenges.findIndex((item) => item.id === challenge.id); if (index < 0 || challenges[index]?.invalidatedAt || challenges[index]?.consumedAt) return false; challenges[index] = { ...challenges[index], ...challenge }; return true; },
    async verifyLearner(email) { return { id: `learner:${email}`, email }; },
    async createSession(input) { sessions.push({ learnerId: input.learnerId, tokenHash: input.tokenHash }); },
    async recordSecurityEvent() {},
  };
}

describe("learner passwordless authentication service", () => {
  it("rotates a prior code and persists only its peppered challenge record", async () => {
    const repository = createRepository();
    const delivered: string[] = [];
    const service = createLearnerAuthService({ repository, secrets, now: () => new Date("2026-08-02T10:00:00.000Z"), deliverCode: async ({ code }) => { delivered.push(code); } });

    await service.requestCode({ email: "Learner@example.com", network: "203.0.113.4", code: "123456" });
    await service.requestCode({ email: "learner@example.com", network: "203.0.113.4", code: "654321" });

    expect(delivered).toEqual(["123456", "654321"]);
    expect(repository.challenges).toHaveLength(2);
    expect(repository.challenges[0]).toMatchObject({ invalidatedAt: "2026-08-02T10:00:00.000Z" });
    expect(repository.challenges[1]?.codeHash).not.toContain("654321");
  });

  it("creates a learner session only after a valid code is atomically consumed", async () => {
    const repository = createRepository();
    const service = createLearnerAuthService({ repository, secrets, now: () => new Date("2026-08-02T10:00:00.000Z"), deliverCode: async () => undefined });

    await service.requestCode({ email: "learner@example.com", network: "203.0.113.4", code: "123456" });
    const verified = await service.verifyCode({ email: "learner@example.com", code: "123456", network: "203.0.113.4" });

    expect(verified.ok).toBe(true);
    if (verified.ok) expect(verified.session.token).toMatch(/^.+\..+$/);
    expect(repository.sessions).toHaveLength(1);
    await expect(service.verifyCode({ email: "learner@example.com", code: "123456", network: "203.0.113.4" })).resolves.toEqual({ ok: false, reason: "invalid_code" });
  });

  it("never creates a session after five failed verification attempts", async () => {
    const repository = createRepository();
    const service = createLearnerAuthService({ repository, secrets, now: () => new Date("2026-08-02T10:00:00.000Z"), deliverCode: async () => undefined });
    await service.requestCode({ email: "learner@example.com", network: "203.0.113.4", code: "123456" });

    for (let attempt = 0; attempt < 5; attempt += 1) await service.verifyCode({ email: "learner@example.com", code: "000000", network: "203.0.113.4" });

    await expect(service.verifyCode({ email: "learner@example.com", code: "123456", network: "203.0.113.4" })).resolves.toEqual({ ok: false, reason: "locked" });
    expect(repository.sessions).toHaveLength(0);
  });
});
