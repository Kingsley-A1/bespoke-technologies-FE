import type { LearnerEmailChallenge } from "./auth-security";
import type { LearnerAuthRepository } from "./learner-auth-service";

type Row = Record<string, unknown>;
export type LearnAuthQuery = (text: string, values?: unknown[]) => Promise<{ rows: Row[]; rowCount?: number | null }>;

const date = (value: unknown) => new Date(value as string | Date).toISOString();

export function createLearnerAuthRepository({ query }: { query: LearnAuthQuery }): LearnerAuthRepository {
  return {
    async listRateLimitEvents(input) {
      const result = await query(
        `SELECT created_at FROM learn_rate_limit_events
         WHERE action = $1 AND created_at >= $2 AND (identity_hash = $3 OR network_hash = $4)`,
        [input.action, input.since, input.identityHash, input.networkHash],
      );
      return result.rows.map((row) => new Date(row.created_at as string | Date));
    },
    async recordRateLimitEvent(input) {
      await query(
        `INSERT INTO learn_rate_limit_events (action, identity_hash, network_hash, created_at)
         VALUES ($1, $2, $3, $4)`,
        [input.action, input.identityHash, input.networkHash, input.createdAt],
      );
    },
    async invalidateOutstandingChallenges(identityHash, invalidatedAt) {
      await query(
        `UPDATE learn_email_challenges SET invalidated_at = $2
         WHERE identity_hash = $1 AND invalidated_at IS NULL AND consumed_at IS NULL`,
        [identityHash, invalidatedAt],
      );
    },
    async createEmailChallenge(challenge) {
      await query(
        `INSERT INTO learn_email_challenges (id, email, identity_hash, network_hash, code_hash, expires_at, failed_attempts, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [challenge.id, challenge.email, challenge.identityHash, challenge.networkHash, challenge.codeHash, challenge.expiresAt, challenge.failedAttempts, challenge.createdAt],
      );
    },
    async findLatestEmailChallenge(identityHash) {
      const result = await query(
        `SELECT id, email, identity_hash, network_hash, code_hash, expires_at, failed_attempts, invalidated_at, consumed_at, created_at
         FROM learn_email_challenges
         WHERE identity_hash = $1 AND invalidated_at IS NULL AND consumed_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [identityHash],
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        id: String(row.id),
        email: String(row.email),
        identityHash: String(row.identity_hash),
        networkHash: String(row.network_hash),
        codeHash: String(row.code_hash),
        expiresAt: date(row.expires_at),
        failedAttempts: Number(row.failed_attempts),
        invalidatedAt: row.invalidated_at ? date(row.invalidated_at) : undefined,
        consumedAt: row.consumed_at ? date(row.consumed_at) : undefined,
        createdAt: date(row.created_at),
      } satisfies LearnerEmailChallenge;
    },
    async saveChallengeOutcome(challenge) {
      const result = await query(
        `UPDATE learn_email_challenges SET failed_attempts = $2, consumed_at = $3
         WHERE id = $1 AND invalidated_at IS NULL AND consumed_at IS NULL`,
        [challenge.id, challenge.failedAttempts, challenge.consumedAt ?? null],
      );
      return (result.rowCount ?? 0) === 1;
    },
    async verifyLearner(email, verifiedAt) {
      const result = await query(
        `INSERT INTO learn_learners (email, verified_at)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET verified_at = EXCLUDED.verified_at, updated_at = now()
         WHERE learn_learners.state = 'active'
         RETURNING id, email`,
        [email, verifiedAt],
      );
      const row = result.rows[0];
      if (!row) throw new Error("Learner account is unavailable.");
      return { id: String(row.id), email: String(row.email) };
    },
    async createSession(input) {
      await query(
        `INSERT INTO learn_sessions (id, learner_id, token_hash, network_hash, user_agent, expires_at, created_at, last_seen_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
        [input.id, input.learnerId, input.tokenHash, input.networkHash, input.userAgent, input.expiresAt, input.createdAt],
      );
    },
    async recordSecurityEvent(input) {
      await query(
        `INSERT INTO learn_security_events (learner_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5::JSONB)`,
        [input.learnerId ?? null, input.action, input.entityType, input.entityId ?? null, JSON.stringify(input.metadata ?? {})],
      );
    },
  };
}
