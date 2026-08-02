import type { PublishingCommandRepository } from "./publishing-service";

type DbResult = { rows: Array<Record<string, unknown>> };
type DbClient = { query: (text: string, values?: unknown[]) => Promise<DbResult> };
type Transaction = (work: (client: DbClient) => Promise<unknown>) => Promise<unknown>;

export function createPublishingCommandRepository({ transaction, query }: { transaction: Transaction; query?: DbClient["query"] }): PublishingCommandRepository {
  return {
    async publishImmutableVersion(input) {
      return transaction(async (client) => {
        const published = await client.query(
          `UPDATE learn_course_versions
           SET state = 'published', published_at = $2, published_by = $3, updated_at = now()
           WHERE id = $1 AND state = 'validated'
           RETURNING course_id`,
          [input.versionId, input.publishedAt, input.actorAdminUserId],
        );
        const courseId = published.rows[0]?.course_id;
        if (!courseId) return false;
        await client.query(
          `UPDATE learn_course_versions SET state = 'superseded', updated_at = now()
           WHERE course_id = $1 AND id <> $2 AND state = 'published'`,
          [String(courseId), input.versionId],
        );
        return true;
      }) as Promise<boolean>;
    },
    async recordAudit(input) {
      if (!query) throw new Error("Publishing audit database is not configured.");
      await query(
        `INSERT INTO learn_audit_events (actor_admin_user_id, actor_label, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::JSONB)`,
        [input.actorAdminUserId, input.actorLabel, input.action, input.entityType, input.entityId, JSON.stringify(input.metadata ?? {})],
      );
    },
  };
}
