import type { CourseAccessRepository } from "./entitlements";
import type { LearnAccessPolicy } from "./types";

type Row = Record<string, unknown>;

export type LearnQuery = (text: string, values?: unknown[]) => Promise<{ rows: Row[] }>;

export type PublishedCourseSummary = {
  id: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  title: string;
  summary: string;
  accessPolicy: LearnAccessPolicy;
  reviewedAt?: string;
  publishedAt?: string;
};

export type LearnRepository = CourseAccessRepository & {
  findEntitlement: NonNullable<CourseAccessRepository["findEntitlement"]>;
  listPublishedCourses(search?: string): Promise<PublishedCourseSummary[]>;
};

const iso = (value: unknown) => value ? new Date(value as string | Date).toISOString() : undefined;

function mapCourseSummary(row: Row): PublishedCourseSummary {
  return {
    id: String(row.course_id),
    slug: String(row.slug),
    versionId: String(row.version_id),
    versionNumber: Number(row.version_number),
    title: String(row.title),
    summary: String(row.summary),
    accessPolicy: String(row.access_policy) as LearnAccessPolicy,
    reviewedAt: iso(row.reviewed_at),
    publishedAt: iso(row.published_at),
  };
}

export function createLearnRepository({ query }: { query: LearnQuery }): LearnRepository {
  const access: Pick<LearnRepository, "findCourseAccessPolicy" | "findEntitlement"> = {
    async findCourseAccessPolicy(courseId) {
      const result = await query(
        `SELECT v.access_policy FROM learn_courses c
         JOIN learn_course_versions v ON v.course_id = c.id
         WHERE c.id = $1 AND c.state = 'active' AND v.state = 'published' LIMIT 1`,
        [courseId],
      );
      const row = result.rows[0];
      return row ? { accessPolicy: String(row.access_policy) as LearnAccessPolicy } : null;
    },
    async findEntitlement(input) {
      const result = await query(
        `SELECT state, expires_at, revoked_at FROM learn_entitlements
         WHERE learner_id = $1 AND course_id = $2 ORDER BY granted_at DESC LIMIT 1`,
        [input.learnerId, input.courseId],
      );
      const row = result.rows[0];
      return row ? {
        state: String(row.state) as "active" | "revoked" | "expired",
        expiresAt: iso(row.expires_at),
        revokedAt: iso(row.revoked_at),
      } : null;
    },
  };

  return {
    ...access,
    async listPublishedCourses(search?: string) {
      const normalizedSearch = search?.trim().toLowerCase() ?? "";
      const result = await query(
        `SELECT c.id AS course_id, c.slug, v.id AS version_id, v.version_number, v.title, v.summary, v.access_policy, v.reviewed_at, v.published_at
         FROM learn_courses c
         JOIN learn_course_versions v ON v.course_id = c.id
         WHERE c.state = 'active' AND v.state = 'published'
           AND ($1 = '' OR lower(v.title) LIKE '%' || $1 || '%' OR lower(v.summary) LIKE '%' || $1 || '%')
         ORDER BY v.published_at DESC, v.title ASC`,
        [normalizedSearch],
      );
      return result.rows.map(mapCourseSummary);
    },
  };
}
