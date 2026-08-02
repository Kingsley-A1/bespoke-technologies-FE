import { parseContentBlock, type ContentBlock } from "./content/schemas";
import type { LearnAccessPolicy } from "./types";
import type { LearnQuery } from "./repository";

export type PublishedCourseDetail = {
  id: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  title: string;
  summary: string;
  description: string;
  accessPolicy: LearnAccessPolicy;
  outcomes: string[];
  audience?: string;
  prerequisites: string[];
  commitment?: string;
  formats: string[];
  reviewedAt?: string;
  publishedAt?: string;
  authors: Array<{ id: string; displayName: string }>;
  modules: Array<{
    id: string;
    title: string;
    summary?: string;
    sortOrder: number;
    lessons: Array<{ id: string; slug: string; title: string; objective: string; estimatedMinutes: number; sortOrder: number }>;
  }>;
};

export type PublishedLesson = {
  course: { id: string; slug: string; versionId: string; versionNumber: number; title: string };
  module: { id: string; title: string; sortOrder: number };
  lesson: { id: string; slug: string; title: string; objective: string; context?: string; estimatedMinutes: number; sortOrder: number; blocks: ContentBlock[] };
};

const text = (value: unknown) => String(value ?? "");
const number = (value: unknown) => Number(value ?? 0);
const iso = (value: unknown) => value ? new Date(value as string | Date).toISOString() : undefined;

function object(value: unknown) {
  return typeof value === "string" ? JSON.parse(value) as unknown : value;
}

function stringList(value: unknown) {
  const parsed = object(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

export function createCourseDeliveryRepository({ query }: { query: LearnQuery }) {
  return {
    async findPublishedCourseBySlug(slug: string): Promise<PublishedCourseDetail | null> {
      const courseResult = await query(
        `SELECT c.id AS course_id, c.slug AS course_slug, v.id AS version_id, v.version_number,
                v.title, v.summary, v.description, v.access_policy, v.outcomes, v.audience, v.prerequisites, v.commitment, v.formats, v.reviewed_at, v.published_at
         FROM learn_courses c JOIN learn_course_versions v ON v.course_id = c.id
         WHERE c.slug = $1 AND c.state = 'active' AND v.state = 'published' LIMIT 1`,
        [slug],
      );
      const course = courseResult.rows[0];
      if (!course) return null;
      const [modulesResult, lessonsResult, authorsResult] = await Promise.all([
        query(`SELECT id, title, summary, sort_order FROM learn_modules WHERE course_version_id = $1 ORDER BY sort_order`, [text(course.version_id)]),
        query(`SELECT l.id, l.module_id, l.slug, l.title, l.objective, l.estimated_minutes, l.sort_order
               FROM learn_lessons l JOIN learn_modules m ON m.id = l.module_id
               WHERE m.course_version_id = $1 ORDER BY m.sort_order, l.sort_order`, [text(course.version_id)]),
        query(`SELECT a.id, a.display_name, ca.sort_order FROM learn_course_authors ca JOIN learn_authors a ON a.id = ca.author_id
               WHERE ca.course_version_id = $1 ORDER BY ca.sort_order`, [text(course.version_id)]),
      ]);
      return {
        id: text(course.course_id), slug: text(course.course_slug), versionId: text(course.version_id), versionNumber: number(course.version_number),
        title: text(course.title), summary: text(course.summary), description: text(course.description), accessPolicy: text(course.access_policy) as LearnAccessPolicy,
        outcomes: stringList(course.outcomes), audience: course.audience ? text(course.audience) : undefined, prerequisites: stringList(course.prerequisites), commitment: course.commitment ? text(course.commitment) : undefined, formats: stringList(course.formats),
        reviewedAt: iso(course.reviewed_at), publishedAt: iso(course.published_at),
        authors: authorsResult.rows.map((author) => ({ id: text(author.id), displayName: text(author.display_name) })),
        modules: modulesResult.rows.map((module) => ({
          id: text(module.id), title: text(module.title), summary: module.summary ? text(module.summary) : undefined, sortOrder: number(module.sort_order),
          lessons: lessonsResult.rows.filter((lesson) => text(lesson.module_id) === text(module.id)).map((lesson) => ({
            id: text(lesson.id), slug: text(lesson.slug), title: text(lesson.title), objective: text(lesson.objective), estimatedMinutes: number(lesson.estimated_minutes), sortOrder: number(lesson.sort_order),
          })),
        })),
      };
    },

    async findPublishedLesson(input: { courseSlug: string; lessonSlug: string }): Promise<PublishedLesson | null> {
      const lessonResult = await query(
        `SELECT c.id AS course_id, c.slug AS course_slug, v.id AS version_id, v.version_number, v.title AS course_title,
                l.id AS lesson_id, l.slug AS lesson_slug, l.title AS lesson_title, l.objective, l.context, l.estimated_minutes,
                m.id AS module_id, m.title AS module_title, m.sort_order AS module_sort_order, l.sort_order AS lesson_sort_order
         FROM learn_courses c JOIN learn_course_versions v ON v.course_id = c.id
         JOIN learn_modules m ON m.course_version_id = v.id JOIN learn_lessons l ON l.module_id = m.id
         WHERE c.slug = $1 AND l.slug = $2 AND c.state = 'active' AND v.state = 'published' LIMIT 1`,
        [input.courseSlug, input.lessonSlug],
      );
      const lesson = lessonResult.rows[0];
      if (!lesson) return null;
      const blocksResult = await query(
        `SELECT id, stable_id, block_type, required, completion_rule, config, sort_order
         FROM learn_content_blocks WHERE lesson_id = $1 ORDER BY sort_order`,
        [text(lesson.lesson_id)],
      );
      const blocks = blocksResult.rows.map((block) => parseContentBlock({
        id: text(block.stable_id), type: text(block.block_type), required: Boolean(block.required), completionRule: text(block.completion_rule), order: number(block.sort_order), config: object(block.config),
      }));
      return {
        course: { id: text(lesson.course_id), slug: text(lesson.course_slug), versionId: text(lesson.version_id), versionNumber: number(lesson.version_number), title: text(lesson.course_title) },
        module: { id: text(lesson.module_id), title: text(lesson.module_title), sortOrder: number(lesson.module_sort_order) },
        lesson: { id: text(lesson.lesson_id), slug: text(lesson.lesson_slug), title: text(lesson.lesson_title), objective: text(lesson.objective), context: lesson.context ? text(lesson.context) : undefined, estimatedMinutes: number(lesson.estimated_minutes), sortOrder: number(lesson.lesson_sort_order), blocks },
      };
    },
  };
}
