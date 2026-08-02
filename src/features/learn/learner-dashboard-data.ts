import type { LearnerDashboardCourse } from "./components/learner-dashboard";
import type { LearnQuery } from "./repository";

export function createLearnerDashboardReader({ query }: { query: LearnQuery }) {
  return {
    async listForLearner(learnerId: string): Promise<LearnerDashboardCourse[]> {
      const courses = await query(
        `SELECT c.id AS course_id, c.slug, v.id AS version_id, v.title
         FROM learn_courses c JOIN learn_course_versions v ON v.course_id = c.id
         WHERE c.state = 'active' AND v.state = 'published' AND (
           v.access_policy = 'authenticated_free' OR EXISTS (
             SELECT 1 FROM learn_entitlements e
             WHERE e.learner_id = $1 AND e.course_id = c.id AND e.state = 'active'
               AND (e.expires_at IS NULL OR e.expires_at > now()) AND e.revoked_at IS NULL
           )
         ) ORDER BY v.published_at DESC, v.title ASC`,
        [learnerId],
      );
      return Promise.all(courses.rows.map(async (course) => {
        const versionId = String(course.version_id);
        const [lessons, progress] = await Promise.all([
          query(
            `SELECT l.id, l.slug, l.title, l.sort_order FROM learn_lessons l
             JOIN learn_modules m ON m.id = l.module_id
             WHERE m.course_version_id = $1 ORDER BY m.sort_order, l.sort_order`,
            [versionId],
          ),
          query(
            `SELECT lesson_id, state FROM learn_lesson_progress
             WHERE learner_id = $1 AND course_version_id = $2`,
            [learnerId, versionId],
          ),
        ]);
        const states = new Map(progress.rows.map((row) => [String(row.lesson_id), String(row.state)]));
        const completed = lessons.rows.filter((lesson) => states.get(String(lesson.id)) === "completed").length;
        const next = lessons.rows.find((lesson) => states.get(String(lesson.id)) !== "completed");
        return {
          courseSlug: String(course.slug),
          title: String(course.title),
          progressPercent: lessons.rows.length === 0 ? 0 : Math.round((completed / lessons.rows.length) * 100),
          nextLessonSlug: next ? String(next.slug) : undefined,
          nextLessonTitle: next ? String(next.title) : undefined,
        };
      }));
    },
  };
}
