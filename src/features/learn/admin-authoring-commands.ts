import { parseContentBlock, type ContentBlock } from "./content/schemas";

type DbQuery = (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;

export function createAdminAuthoringCommands({ query }: { query: DbQuery }) {
  return {
    async updateCourseDraft(input: {
      courseVersionId: string;
      course: { title: string; summary: string; description: string; outcomes: string[]; audience?: string; prerequisites: string[]; commitment?: string; formats: string[]; accessPolicy: "public_preview" | "authenticated_free" | "manual_grant" | "unavailable"; seoTitle?: string; seoDescription?: string };
    }) {
      const result = await query(
        `UPDATE learn_course_versions SET
           title = $2, summary = $3, description = $4, outcomes = $5::JSONB, audience = $6,
           prerequisites = $7::JSONB, commitment = $8, formats = $9::JSONB, access_policy = $10,
           seo_title = $11, seo_description = $12, updated_at = now()
         WHERE id = $1 AND state = 'draft' RETURNING id`,
        [input.courseVersionId, input.course.title.trim(), input.course.summary.trim(), input.course.description.trim(), JSON.stringify(input.course.outcomes), input.course.audience?.trim() || null, JSON.stringify(input.course.prerequisites), input.course.commitment?.trim() || null, JSON.stringify(input.course.formats), input.course.accessPolicy, input.course.seoTitle?.trim() || null, input.course.seoDescription?.trim() || null],
      );
      if (!result.rows[0]) throw new Error("Only a current draft version can be edited.");
      return { id: String(result.rows[0].id) };
    },
    async attachAuthor(input: { courseVersionId: string; author: { slug: string; displayName: string } }) {
      const author = await query(
        `INSERT INTO learn_authors (slug, display_name) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now()
         RETURNING id`,
        [input.author.slug.trim(), input.author.displayName.trim()],
      );
      const authorId = author.rows[0]?.id;
      if (!authorId) throw new Error("Unable to create the course author.");
      const linked = await query(
        `INSERT INTO learn_course_authors (course_version_id, author_id, sort_order)
         SELECT v.id, $2, COALESCE((SELECT MAX(sort_order) + 1 FROM learn_course_authors WHERE course_version_id = v.id), 0)
         FROM learn_course_versions v WHERE v.id = $1 AND v.state = 'draft'
         ON CONFLICT (course_version_id, author_id) DO NOTHING
         RETURNING author_id`,
        [input.courseVersionId, String(authorId)],
      );
      if (!linked.rows[0]) throw new Error("Only a current draft version can be edited.");
      return { authorId: String(authorId) };
    },
    async appendModule(input: { courseVersionId: string; title: string; summary?: string }) {
      const result = await query(
        `INSERT INTO learn_modules (course_version_id, title, summary, sort_order)
         SELECT v.id, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM learn_modules WHERE course_version_id = v.id), 0)
         FROM learn_course_versions v WHERE v.id = $1 AND v.state = 'draft' RETURNING id`,
        [input.courseVersionId, input.title.trim(), input.summary?.trim() || null],
      );
      const id = result.rows[0]?.id;
      if (!id) throw new Error("Only a current draft version can be edited.");
      return { id: String(id) };
    },
    async appendLesson(input: { moduleId: string; slug: string; title: string; objective: string; context?: string; estimatedMinutes?: number }) {
      const result = await query(
        `INSERT INTO learn_lessons (course_version_id, module_id, slug, title, objective, context, estimated_minutes, sort_order)
         SELECT m.course_version_id, m.id, $2, $3, $4, $5, $6, COALESCE((SELECT MAX(sort_order) + 1 FROM learn_lessons WHERE module_id = m.id), 0)
         FROM learn_modules m JOIN learn_course_versions v ON v.id = m.course_version_id
         WHERE m.id = $1 AND v.state = 'draft' RETURNING id`,
        [input.moduleId, input.slug.trim(), input.title.trim(), input.objective.trim(), input.context?.trim() || null, input.estimatedMinutes ?? 10],
      );
      const id = result.rows[0]?.id;
      if (!id) throw new Error("Only a current draft version can be edited.");
      return { id: String(id) };
    },
    async appendBlock(input: { lessonId: string; block: ContentBlock }) {
      const block = parseContentBlock(input.block);
      const result = await query(
        `INSERT INTO learn_content_blocks (course_version_id, lesson_id, stable_id, block_type, required, completion_rule, config, sort_order)
         SELECT m.course_version_id, l.id, $2, $3, $4, $5, $6::JSONB,
           COALESCE((SELECT MAX(sort_order) + 1 FROM learn_content_blocks WHERE lesson_id = l.id), 0)
         FROM learn_lessons l JOIN learn_modules m ON m.id = l.module_id JOIN learn_course_versions v ON v.id = m.course_version_id
         WHERE l.id = $1 AND v.state = 'draft' RETURNING id`,
        [input.lessonId, block.id, block.type, block.required, block.completionRule, JSON.stringify(block.config)],
      );
      const id = result.rows[0]?.id;
      if (!id) throw new Error("Only a current draft version can be edited.");
      return { id: String(id) };
    },
    async updateBlock(input: { blockRowId: string; block: ContentBlock }) {
      const block = parseContentBlock(input.block);
      const result = await query(
        `UPDATE learn_content_blocks b SET block_type = $2, required = $3, completion_rule = $4, config = $5::JSONB, updated_at = now()
         FROM learn_lessons l JOIN learn_modules m ON m.id = l.module_id JOIN learn_course_versions v ON v.id = m.course_version_id
         WHERE b.id = $1 AND l.id = b.lesson_id AND v.state = 'draft' RETURNING b.id`,
        [input.blockRowId, block.type, block.required, block.completionRule, JSON.stringify(block.config)],
      );
      if (!result.rows[0]) throw new Error("Only a current draft block can be edited.");
      return { id: String(result.rows[0].id) };
    },
    async duplicateBlock(input: { sourceBlockId: string; stableId: string }) {
      const result = await query(
        `INSERT INTO learn_content_blocks (course_version_id, lesson_id, stable_id, block_type, required, completion_rule, config, sort_order)
         SELECT b.course_version_id, b.lesson_id, $2, b.block_type, b.required, b.completion_rule, b.config,
           COALESCE((SELECT MAX(copy.sort_order) + 1 FROM learn_content_blocks copy WHERE copy.lesson_id = b.lesson_id), 0)
         FROM learn_content_blocks b JOIN learn_lessons l ON l.id = b.lesson_id JOIN learn_modules m ON m.id = l.module_id JOIN learn_course_versions v ON v.id = m.course_version_id
         WHERE b.id = $1 AND v.state = 'draft' RETURNING id`,
        [input.sourceBlockId, input.stableId.trim()],
      );
      if (!result.rows[0]) throw new Error("Only a current draft block can be duplicated.");
      return { id: String(result.rows[0].id) };
    },
    async removeBlock(input: { blockRowId: string }) {
      const result = await query(
        `DELETE FROM learn_content_blocks b
         USING learn_lessons l, learn_modules m, learn_course_versions v
         WHERE b.id = $1 AND l.id = b.lesson_id AND m.id = l.module_id AND v.id = m.course_version_id AND v.state = 'draft'
         RETURNING b.id`,
        [input.blockRowId],
      );
      if (!result.rows[0]) throw new Error("Only a current draft block can be removed.");
      return { id: String(result.rows[0].id) };
    },
  };
}
