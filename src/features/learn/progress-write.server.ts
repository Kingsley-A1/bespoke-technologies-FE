import "server-only";

import { adminQuery, withAdminTransaction } from "@/features/admin/db";
import { resolveCourseAccess } from "./entitlements";
import { createLearnRepository } from "./repository";
import { createProgressWriteService } from "./progress-write-service";

const accessRepository = createLearnRepository({ query: adminQuery });

async function findPublishedBlock(input: { courseSlug: string; lessonSlug: string; stableBlockId: string }) {
  const result = await adminQuery<{
    course_id: string; version_id: string; lesson_id: string; block_id: string; stable_id: string; required: boolean; completion_rule: string;
  }>(
    `SELECT c.id AS course_id, v.id AS version_id, l.id AS lesson_id, b.id AS block_id, b.stable_id, b.required, b.completion_rule
     FROM learn_courses c JOIN learn_course_versions v ON v.course_id = c.id
     JOIN learn_modules m ON m.course_version_id = v.id JOIN learn_lessons l ON l.module_id = m.id
     JOIN learn_content_blocks b ON b.lesson_id = l.id
     WHERE c.slug = $1 AND l.slug = $2 AND b.stable_id = $3 AND c.state = 'active' AND v.state = 'published' LIMIT 1`,
    [input.courseSlug, input.lessonSlug, input.stableBlockId],
  );
  const block = result.rows[0];
  return block ? { courseId: block.course_id, versionId: block.version_id, lessonId: block.lesson_id, blockId: block.block_id, stableId: block.stable_id, required: block.required, completionRule: block.completion_rule } : null;
}

async function writeAndReconcile(input: { learnerId: string; courseVersionId: string; lessonId: string; blockId: string; state: "in_progress" | "completed"; position: Record<string, number> }) {
  return withAdminTransaction(async (client) => {
    await client.query(
      `INSERT INTO learn_block_progress (learner_id, course_version_id, lesson_id, block_id, state, position, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6::JSONB, CASE WHEN $5 = 'completed' THEN now() ELSE NULL END)
       ON CONFLICT (learner_id, course_version_id, block_id) DO UPDATE SET
         state = CASE WHEN learn_block_progress.state = 'completed' OR EXCLUDED.state = 'completed' THEN 'completed' ELSE 'in_progress' END,
         position = CASE WHEN EXCLUDED.position = '{}'::JSONB THEN learn_block_progress.position ELSE EXCLUDED.position END,
         completed_at = COALESCE(learn_block_progress.completed_at, EXCLUDED.completed_at), updated_at = now()`,
      [input.learnerId, input.courseVersionId, input.lessonId, input.blockId, input.state, JSON.stringify(input.position)],
    );
    const pending = await client.query<{ count: string }>(
      `SELECT count(*)::STRING AS count FROM learn_content_blocks b
       WHERE b.lesson_id = $1 AND b.required = true AND b.completion_rule <> 'none'
         AND NOT EXISTS (
           SELECT 1 FROM learn_block_progress p WHERE p.learner_id = $2 AND p.course_version_id = $3
             AND p.block_id = b.id AND p.state = 'completed'
         )`,
      [input.lessonId, input.learnerId, input.courseVersionId],
    );
    const complete = Number(pending.rows[0]?.count ?? "0") === 0;
    await client.query(
      `INSERT INTO learn_lesson_progress (learner_id, course_version_id, lesson_id, state, resume_block_id, resume_position, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6::JSONB, CASE WHEN $4 = 'completed' THEN now() ELSE NULL END)
       ON CONFLICT (learner_id, course_version_id, lesson_id) DO UPDATE SET
         state = CASE WHEN learn_lesson_progress.state = 'completed' OR EXCLUDED.state = 'completed' THEN 'completed' ELSE 'in_progress' END,
         resume_block_id = EXCLUDED.resume_block_id, resume_position = EXCLUDED.resume_position,
         completed_at = COALESCE(learn_lesson_progress.completed_at, EXCLUDED.completed_at), updated_at = now()`,
      [input.learnerId, input.courseVersionId, input.lessonId, complete ? "completed" : "in_progress", input.blockId, JSON.stringify(input.position)],
    );
    return { complete };
  });
}

export async function recordLearnerProgress(input: { learnerId: string; courseSlug: string; lessonSlug: string; stableBlockId: string; completed?: boolean; position?: Record<string, number> }) {
  let completion = { complete: false };
  const service = createProgressWriteService({
    findPublishedBlock,
    resolveAccess: ({ courseId, learnerId }) => resolveCourseAccess({ courseId, learnerId, now: new Date() }, accessRepository),
    writeProgress: async (progress) => {
      completion = await writeAndReconcile(progress);
    },
    reconcileLesson: async () => completion,
  });
  return service.record(input);
}
