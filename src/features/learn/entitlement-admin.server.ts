import "server-only";

import { adminQuery } from "@/features/admin/db";
import { createEntitlementAdminService } from "./entitlement-admin";

const service = createEntitlementAdminService({
  repository: {
    async findLearnerByEmail(email) {
      const result = await adminQuery<{ id: string }>(`SELECT id FROM learn_learners WHERE email = $1 AND state = 'active'`, [email]);
      return result.rows[0] ?? null;
    },
    async grantManual(input) {
      await adminQuery(
        `INSERT INTO learn_entitlements (learner_id, course_id, source, state, granted_by, granted_at, expires_at, revoked_at, revoked_by, revocation_reason)
         VALUES ($1, $2, 'manual_grant', 'active', $3, now(), NULL, NULL, NULL, NULL)
         ON CONFLICT (learner_id, course_id, source) DO UPDATE SET state = 'active', granted_by = EXCLUDED.granted_by, granted_at = now(), expires_at = NULL, revoked_at = NULL, revoked_by = NULL, revocation_reason = NULL`,
        [input.learnerId, input.courseId, input.actorAdminUserId],
      );
    },
    async revokeManual(input) {
      const result = await adminQuery(
        `UPDATE learn_entitlements SET state = 'revoked', revoked_at = now(), revoked_by = $3, revocation_reason = $4
         WHERE learner_id = $1 AND course_id = $2 AND source = 'manual_grant' AND state = 'active'`,
        [input.learnerId, input.courseId, input.actorAdminUserId, input.reason],
      );
      return result.rowCount === 1;
    },
    async recordAudit(input) {
      await adminQuery(
        `INSERT INTO learn_audit_events (actor_admin_user_id, actor_label, action, entity_type, entity_id, reason, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::JSONB)`,
        [input.actorAdminUserId, input.actorLabel, input.action, input.entityType, input.entityId, input.reason ?? null, JSON.stringify(input.metadata ?? {})],
      );
    },
  },
});

export const grantAdminLearnEntitlement = service.grant;
export const revokeAdminLearnEntitlement = service.revoke;
