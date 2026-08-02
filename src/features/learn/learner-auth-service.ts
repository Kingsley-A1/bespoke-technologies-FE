import { randomUUID } from "node:crypto";
import {
  createEmailChallenge,
  decodeLearnerSession,
  encodeLearnerSession,
  hashLearnerIdentity,
  hashLearnerNetwork,
  isRateLimited,
  verifyEmailChallenge,
  type LearnerEmailChallenge,
  type LearnerSecuritySecrets,
} from "./auth-security";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

type RateAction = "email_code.request" | "email_code.verify";

export type LearnerAuthRepository = {
  listRateLimitEvents(input: { action: RateAction; identityHash: string; networkHash: string; since: string }): Promise<Date[]>;
  recordRateLimitEvent(input: { action: RateAction; identityHash: string; networkHash: string; createdAt: string }): Promise<void>;
  invalidateOutstandingChallenges(identityHash: string, invalidatedAt: string): Promise<void>;
  createEmailChallenge(challenge: LearnerEmailChallenge): Promise<void>;
  findLatestEmailChallenge(identityHash: string): Promise<LearnerEmailChallenge | null>;
  saveChallengeOutcome(challenge: Pick<LearnerEmailChallenge, "id" | "failedAttempts" | "consumedAt">): Promise<boolean>;
  verifyLearner(email: string, verifiedAt: string): Promise<{ id: string; email: string }>;
  createSession(input: { id: string; learnerId: string; tokenHash: string; networkHash: string; userAgent: string; expiresAt: string; createdAt: string }): Promise<void>;
  recordSecurityEvent(input: { learnerId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }): Promise<void>;
};

type Delivery = (input: { email: string; code: string; expiresAt: string }) => Promise<void>;

export function createLearnerAuthService({
  repository,
  secrets,
  now = () => new Date(),
  deliverCode,
}: {
  repository: LearnerAuthRepository;
  secrets: LearnerSecuritySecrets;
  now?: () => Date;
  deliverCode: Delivery;
}) {
  async function rateLimited(action: RateAction, identityHash: string, networkHash: string, limit: number, at: Date) {
    const events = await repository.listRateLimitEvents({
      action,
      identityHash,
      networkHash,
      since: new Date(at.getTime() - RATE_WINDOW_MS).toISOString(),
    });
    return isRateLimited(events, at, { limit, windowMs: RATE_WINDOW_MS });
  }

  return {
    async requestCode(input: { email: string; network: string; code?: string }) {
      const at = now();
      const challenge = createEmailChallenge({ ...input, now: at, secrets });
      const isLimited = await rateLimited("email_code.request", challenge.record.identityHash, challenge.record.networkHash, 5, at);
      if (isLimited) {
        await repository.recordSecurityEvent({ action: "learner.email_code.rate_limited", entityType: "email_challenge", metadata: { channel: "request" } });
        return { accepted: true as const, delivered: false as const };
      }

      await repository.recordRateLimitEvent({ action: "email_code.request", identityHash: challenge.record.identityHash, networkHash: challenge.record.networkHash, createdAt: challenge.record.createdAt });
      await repository.invalidateOutstandingChallenges(challenge.record.identityHash, challenge.record.createdAt);
      await repository.createEmailChallenge(challenge.record);
      try {
        await deliverCode({ email: challenge.record.email, code: challenge.code, expiresAt: challenge.record.expiresAt });
        await repository.recordSecurityEvent({ action: "learner.email_code.issued", entityType: "email_challenge", entityId: challenge.record.id });
        return { accepted: true as const, delivered: true as const };
      } catch {
        await repository.recordSecurityEvent({ action: "learner.email_code.delivery_failed", entityType: "email_challenge", entityId: challenge.record.id });
        return { accepted: true as const, delivered: false as const };
      }
    },

    async verifyCode(input: { email: string; code: string; network: string; userAgent?: string }) {
      const at = now();
      const identityHash = hashLearnerIdentity(input.email, secrets.codePepper);
      const networkHash = hashLearnerNetwork(input.network, secrets.codePepper);
      if (await rateLimited("email_code.verify", identityHash, networkHash, 10, at)) return { ok: false as const, reason: "rate_limited" as const };
      await repository.recordRateLimitEvent({ action: "email_code.verify", identityHash, networkHash, createdAt: at.toISOString() });

      const challenge = await repository.findLatestEmailChallenge(identityHash);
      if (!challenge) return { ok: false as const, reason: "invalid_code" as const };
      const outcome = verifyEmailChallenge(challenge, input.code, at, secrets);
      const saved = await repository.saveChallengeOutcome(outcome.record);
      if (!saved) return { ok: false as const, reason: "invalid_code" as const };
      if (outcome.status !== "verified") {
        await repository.recordSecurityEvent({ action: "learner.email_code.rejected", entityType: "email_challenge", entityId: challenge.id, metadata: { reason: outcome.status } });
        return { ok: false as const, reason: outcome.status };
      }

      const learner = await repository.verifyLearner(challenge.email, at.toISOString());
      const sessionId = randomUUID();
      const token = encodeLearnerSession(sessionId, secrets);
      const decoded = decodeLearnerSession(token, secrets);
      if (!decoded) throw new Error("Unable to create learner session.");
      const expiresAt = new Date(at.getTime() + SESSION_LIFETIME_MS).toISOString();
      await repository.createSession({
        id: sessionId,
        learnerId: learner.id,
        tokenHash: decoded.tokenHash,
        networkHash,
        userAgent: input.userAgent?.slice(0, 240) ?? "unknown",
        expiresAt,
        createdAt: at.toISOString(),
      });
      await repository.recordSecurityEvent({ learnerId: learner.id, action: "learner.session.created", entityType: "session", entityId: sessionId });
      return { ok: true as const, learner, session: { id: sessionId, token, expiresAt } };
    },
  };
}
