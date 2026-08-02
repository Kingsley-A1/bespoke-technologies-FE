import type { LearnQuery } from "./repository";

export function createLearnerProgressReader({ query }: { query: LearnQuery }) {
  return {
    async listLessonStates(input: { learnerId: string; versionId: string }) {
      const result = await query(
        `SELECT lesson_id, state FROM learn_lesson_progress
         WHERE learner_id = $1 AND course_version_id = $2`,
        [input.learnerId, input.versionId],
      );
      return result.rows.map((row) => ({
        lessonId: String(row.lesson_id),
        state: String(row.state) as "not_started" | "in_progress" | "completed",
      }));
    },
    async listBlockPositions(input: { learnerId: string; versionId: string; lessonId: string }) {
      const result = await query(
        `SELECT b.stable_id, p.position FROM learn_block_progress p
         JOIN learn_content_blocks b ON b.id = p.block_id
         WHERE p.learner_id = $1 AND p.course_version_id = $2 AND p.lesson_id = $3`,
        [input.learnerId, input.versionId, input.lessonId],
      );
      return result.rows.map((row) => ({
        stableBlockId: String(row.stable_id),
        position: typeof row.position === "string" ? JSON.parse(row.position) as Record<string, number> : row.position as Record<string, number>,
      }));
    },
  };
}
