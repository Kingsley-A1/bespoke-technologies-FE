type EntitlementAdminRepository = {
  findLearnerByEmail(email: string): Promise<{ id: string } | null>;
  grantManual(input: { learnerId: string; courseId: string; actorAdminUserId: string }): Promise<void>;
  revokeManual(input: { learnerId: string; courseId: string; actorAdminUserId: string; reason: string }): Promise<boolean>;
  recordAudit(input: { actorAdminUserId: string; actorLabel: string; action: string; entityType: string; entityId: string; metadata?: Record<string, unknown>; reason?: string }): Promise<void>;
};

function email(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error("A valid learner email is required.");
  return normalized;
}

export function createEntitlementAdminService({ repository }: { repository: EntitlementAdminRepository }) {
  return {
    async grant(input: { learnerEmail: string; courseId: string; actorAdminUserId: string; actorLabel: string }) {
      const learner = await repository.findLearnerByEmail(email(input.learnerEmail));
      if (!learner) return { ok: false as const, error: "Learner not found." };
      await repository.grantManual({ learnerId: learner.id, courseId: input.courseId, actorAdminUserId: input.actorAdminUserId });
      await repository.recordAudit({ actorAdminUserId: input.actorAdminUserId, actorLabel: input.actorLabel, action: "learn.entitlement.granted", entityType: "course", entityId: input.courseId, metadata: { learnerId: learner.id, source: "manual_grant" } });
      return { ok: true as const };
    },
    async revoke(input: { learnerEmail: string; courseId: string; actorAdminUserId: string; actorLabel: string; reason: string }) {
      const learner = await repository.findLearnerByEmail(email(input.learnerEmail));
      if (!learner) return { ok: false as const, error: "Learner not found." };
      const revoked = await repository.revokeManual({ learnerId: learner.id, courseId: input.courseId, actorAdminUserId: input.actorAdminUserId, reason: input.reason.trim() });
      if (!revoked) return { ok: false as const, error: "No active manual entitlement was found." };
      await repository.recordAudit({ actorAdminUserId: input.actorAdminUserId, actorLabel: input.actorLabel, action: "learn.entitlement.revoked", entityType: "course", entityId: input.courseId, reason: input.reason.trim(), metadata: { learnerId: learner.id, source: "manual_grant" } });
      return { ok: true as const };
    },
  };
}
