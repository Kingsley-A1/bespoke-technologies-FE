import "server-only";

import { adminQuery, withAdminTransaction } from "@/features/admin/db";
import { parseContentBlock } from "./content/schemas";
import { resolveCourseAccess } from "./entitlements";
import { recordLearnerProgress } from "./progress-write.server";
import { createLearnRepository } from "./repository";
import { createActivitySubmissionService } from "./activity-submission-service";

const accessRepository = createLearnRepository({ query: adminQuery });

function json(value: unknown) {
  return typeof value === "string" ? JSON.parse(value) as unknown : value;
}

async function findPublishedActivityBlock(input: { courseSlug: string; lessonSlug: string; stableBlockId: string }) {
  const result = await adminQuery<{
    course_id: string; version_id: string; lesson_id: string; block_id: string; stable_id: string;
    block_type: string; required: boolean; completion_rule: string; config: unknown; sort_order: number;
  }>(
    `SELECT c.id AS course_id, v.id AS version_id, l.id AS lesson_id, b.id AS block_id, b.stable_id,
            b.block_type, b.required, b.completion_rule, b.config, b.sort_order
     FROM learn_courses c JOIN learn_course_versions v ON v.course_id = c.id
     JOIN learn_modules m ON m.course_version_id = v.id JOIN learn_lessons l ON l.module_id = m.id
     JOIN learn_content_blocks b ON b.lesson_id = l.id
     WHERE c.slug = $1 AND l.slug = $2 AND b.stable_id = $3
       AND c.state = 'active' AND v.state = 'published' AND b.block_type IN ('quiz', 'interactive')
     LIMIT 1`,
    [input.courseSlug, input.lessonSlug, input.stableBlockId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const block = parseContentBlock({
    id: row.stable_id,
    type: row.block_type,
    required: row.required,
    completionRule: row.completion_rule,
    order: row.sort_order,
    config: json(row.config),
  });
  if (block.type !== "quiz" && block.type !== "interactive") return null;
  return {
    courseId: row.course_id,
    versionId: row.version_id,
    lessonId: row.lesson_id,
    blockId: row.block_id,
    stableId: row.stable_id,
    type: block.type,
    required: block.required,
    completionRule: block.completionRule,
    config: block.config,
  };
}

function messages(value: unknown) {
  const record = json(value);
  if (!record || typeof record !== "object" || Array.isArray(record)) return [];
  const candidate = (record as { messages?: unknown }).messages;
  return Array.isArray(candidate) ? candidate.filter((message): message is string => typeof message === "string") : [];
}

export async function submitLearnerActivity(input: {
  learnerId: string;
  courseSlug: string;
  lessonSlug: string;
  stableBlockId: string;
  idempotencyKey: string;
  response: string[];
}) {
  const service = createActivitySubmissionService({
    findPublishedActivityBlock,
    resolveAccess: ({ courseId, learnerId }) => resolveCourseAccess({ courseId, learnerId, now: new Date() }, accessRepository),
    async findAttemptByKey({ learnerId, idempotencyKey }) {
      const result = await adminQuery<{ feedback: unknown }>(
        `SELECT a.feedback FROM learn_activity_attempts a
         WHERE a.learner_id = $1 AND a.idempotency_key = $2 LIMIT 1`,
        [learnerId, idempotencyKey],
      );
      const feedback = result.rows[0]?.feedback;
      if (feedback === undefined) return null;
      const decoded = json(feedback);
      return {
        completed: Boolean(decoded && typeof decoded === "object" && !Array.isArray(decoded) && (decoded as { completed?: unknown }).completed),
        feedback: messages(feedback),
      };
    },
    async countAttempts({ learnerId, versionId, blockId }) {
      const result = await adminQuery<{ count: string }>(
        `SELECT count(*)::STRING AS count FROM learn_activity_attempts
         WHERE learner_id = $1 AND course_version_id = $2 AND block_id = $3`,
        [learnerId, versionId, blockId],
      );
      return Number(result.rows[0]?.count ?? "0");
    },
    async saveAttempt(attempt) {
      await withAdminTransaction(async (client) => {
        const saved = await client.query<{ id: string }>(
          `INSERT INTO learn_activity_attempts
             (learner_id, course_version_id, lesson_id, block_id, idempotency_key, attempt_number, status, feedback)
           VALUES ($1, $2, $3, $4, $5, $6, 'evaluated', $7::JSONB)
           ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
          [attempt.learnerId, attempt.versionId, attempt.lessonId, attempt.blockId, attempt.idempotencyKey, attempt.attemptNumber, JSON.stringify({ messages: attempt.feedback, completed: attempt.completed })],
        );
        const attemptId = saved.rows[0]?.id;
        if (!attemptId) return;
        await client.query(
          `INSERT INTO learn_responses (attempt_id, response) VALUES ($1, $2::JSONB)`,
          [attemptId, JSON.stringify({ values: attempt.response })],
        );
      });
    },
  });
  const result = await service.submit(input);
  if (result.ok && result.completed) {
    await recordLearnerProgress({
      learnerId: input.learnerId,
      courseSlug: input.courseSlug,
      lessonSlug: input.lessonSlug,
      stableBlockId: input.stableBlockId,
      completed: true,
    });
  }
  return result;
}

export async function saveLearnerReflection(input: {
  learnerId: string;
  courseSlug: string;
  lessonSlug: string;
  stableBlockId: string;
  body: string;
}) {
  const body = input.body.trim();
  if (!body || body.length > 8_000) return { ok: false as const, status: 400 as const, error: "A reflection is required." };
  const result = await adminQuery<{
    course_id: string; version_id: string; lesson_id: string; block_id: string; completion_rule: string; config: unknown;
  }>(
    `SELECT c.id AS course_id, v.id AS version_id, l.id AS lesson_id, b.id AS block_id, b.completion_rule, b.config
     FROM learn_courses c JOIN learn_course_versions v ON v.course_id = c.id
     JOIN learn_modules m ON m.course_version_id = v.id JOIN learn_lessons l ON l.module_id = m.id
     JOIN learn_content_blocks b ON b.lesson_id = l.id
     WHERE c.slug = $1 AND l.slug = $2 AND b.stable_id = $3
       AND c.state = 'active' AND v.state = 'published' AND b.block_type = 'reflection' LIMIT 1`,
    [input.courseSlug, input.lessonSlug, input.stableBlockId],
  );
  const block = result.rows[0];
  if (!block) return { ok: false as const, status: 404 as const, error: "Reflection not found." };
  const access = await resolveCourseAccess({ courseId: block.course_id, learnerId: input.learnerId, now: new Date() }, accessRepository);
  if (!access.allowed || access.mode !== "full") return { ok: false as const, status: 403 as const, error: "Course access is required." };
  const config = json(block.config) as { artifactKind?: "reflection" | "ai_opportunity_blueprint" };
  await adminQuery(
    `INSERT INTO learn_artifacts (learner_id, course_version_id, lesson_id, block_id, artifact_kind, body)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (learner_id, course_version_id, block_id, artifact_kind)
     DO UPDATE SET body = EXCLUDED.body, updated_at = now()`,
    [input.learnerId, block.version_id, block.lesson_id, block.block_id, config.artifactKind ?? "reflection", body],
  );
  const completed = block.completion_rule === "submitted";
  if (completed) {
    await recordLearnerProgress({ learnerId: input.learnerId, courseSlug: input.courseSlug, lessonSlug: input.lessonSlug, stableBlockId: input.stableBlockId, completed: true });
  }
  return { ok: true as const, completed, feedback: ["Reflection saved privately."] };
}
