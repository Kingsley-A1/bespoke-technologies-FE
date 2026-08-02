type DbResult = { rows: Array<Record<string, unknown>> };
type DbClient = { query: (text: string, values?: unknown[]) => Promise<DbResult> };
type Transaction = (work: (client: DbClient) => Promise<unknown>) => Promise<unknown>;

export type AdminAuthoringCourseSummary = { courseId: string; versionId: string; slug: string; title: string; state: string; versionNumber: number; updatedAt: string };

export function createAdminAuthoringRepository({ transaction, query }: { transaction: Transaction; query: DbClient["query"] }) {
  return {
    async createCourseDraft(input: {
      publisher: { slug: string; name: string };
      course: { slug: string; title: string; summary: string; description: string };
      actorAdminUserId: string;
    }) {
      return transaction(async (client) => {
        const publisher = await client.query(
          `INSERT INTO learn_publishers (slug, name) VALUES ($1, $2)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
           RETURNING id`,
          [input.publisher.slug, input.publisher.name],
        );
        const publisherId = publisher.rows[0]?.id;
        if (!publisherId) throw new Error("Unable to create the publisher.");
        const course = await client.query(
          `INSERT INTO learn_courses (slug, publisher_id) VALUES ($1, $2) RETURNING id`,
          [input.course.slug, String(publisherId)],
        );
        const courseId = course.rows[0]?.id;
        if (!courseId) throw new Error("Unable to create the course.");
        const version = await client.query(
          `INSERT INTO learn_course_versions (course_id, version_number, state, title, summary, description, created_by)
           VALUES ($1, 1, 'draft', $2, $3, $4, $5) RETURNING id`,
          [String(courseId), input.course.title, input.course.summary, input.course.description, input.actorAdminUserId],
        );
        const versionId = version.rows[0]?.id;
        if (!versionId) throw new Error("Unable to create the draft version.");
        return { courseId: String(courseId), versionId: String(versionId) };
      }) as Promise<{ courseId: string; versionId: string }>;
    },
    async listCourses(): Promise<AdminAuthoringCourseSummary[]> {
      const result = await query(
        `SELECT c.id AS course_id, c.slug, v.id AS version_id, v.title, v.state, v.version_number, v.updated_at
         FROM learn_courses c JOIN learn_course_versions v ON v.course_id = c.id
         WHERE c.state = 'active' AND v.state IN ('draft', 'review_ready', 'validated', 'published')
         ORDER BY c.updated_at DESC, v.version_number DESC`,
      );
      return result.rows.map((row) => ({
        courseId: String(row.course_id), versionId: String(row.version_id), slug: String(row.slug), title: String(row.title),
        state: String(row.state), versionNumber: Number(row.version_number), updatedAt: new Date(row.updated_at as string | Date).toISOString(),
      }));
    },
    async forkLatestPublishedVersion(input: { courseId: string; actorAdminUserId: string }) {
      return transaction(async (client) => {
        const sourceResult = await client.query(
          `SELECT * FROM learn_course_versions
           WHERE course_id = $1 AND state IN ('published', 'superseded', 'archived')
           ORDER BY version_number DESC LIMIT 1`,
          [input.courseId],
        );
        const source = sourceResult.rows[0];
        if (!source) throw new Error("A published course version is required before creating a revision.");
        const versionResult = await client.query(
          `INSERT INTO learn_course_versions
             (course_id, version_number, state, title, summary, description, outcomes, audience, prerequisites, commitment, formats, cover_asset_id, access_policy, seo_title, seo_description, created_by)
           SELECT course_id, version_number + 1, 'draft', title, summary, description, outcomes, audience, prerequisites, commitment, formats, cover_asset_id, access_policy, seo_title, seo_description, $2
           FROM learn_course_versions WHERE id = $1 RETURNING id`,
          [String(source.id), input.actorAdminUserId],
        );
        const versionId = versionResult.rows[0]?.id;
        if (!versionId) throw new Error("A new course draft could not be created.");
        const authors = await client.query(`SELECT author_id, role, sort_order FROM learn_course_authors WHERE course_version_id = $1 ORDER BY sort_order`, [String(source.id)]);
        for (const author of authors.rows) {
          await client.query(`INSERT INTO learn_course_authors (course_version_id, author_id, role, sort_order) VALUES ($1, $2, $3, $4)`, [String(versionId), String(author.author_id), String(author.role), Number(author.sort_order)]);
        }
        const modules = await client.query(`SELECT id, title, summary, sort_order FROM learn_modules WHERE course_version_id = $1 ORDER BY sort_order`, [String(source.id)]);
        for (const moduleRow of modules.rows) {
          const nextModule = await client.query(`INSERT INTO learn_modules (course_version_id, title, summary, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`, [String(versionId), String(moduleRow.title), moduleRow.summary ?? null, Number(moduleRow.sort_order)]);
          const moduleId = nextModule.rows[0]?.id;
          if (!moduleId) throw new Error("A course module could not be copied.");
          const lessons = await client.query(`SELECT id, slug, title, objective, context, estimated_minutes, sort_order FROM learn_lessons WHERE module_id = $1 ORDER BY sort_order`, [String(moduleRow.id)]);
          for (const lesson of lessons.rows) {
            const nextLesson = await client.query(`INSERT INTO learn_lessons (course_version_id, module_id, slug, title, objective, context, estimated_minutes, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`, [String(versionId), String(moduleId), String(lesson.slug), String(lesson.title), String(lesson.objective), lesson.context ?? null, Number(lesson.estimated_minutes), Number(lesson.sort_order)]);
            const lessonId = nextLesson.rows[0]?.id;
            if (!lessonId) throw new Error("A course lesson could not be copied.");
            const blocks = await client.query(`SELECT stable_id, block_type, required, completion_rule, config, sort_order FROM learn_content_blocks WHERE lesson_id = $1 ORDER BY sort_order`, [String(lesson.id)]);
            for (const block of blocks.rows) {
              await client.query(`INSERT INTO learn_content_blocks (course_version_id, lesson_id, stable_id, block_type, required, completion_rule, config, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7::JSONB, $8)`, [String(versionId), String(lessonId), String(block.stable_id), String(block.block_type), Boolean(block.required), String(block.completion_rule), typeof block.config === "string" ? block.config : JSON.stringify(block.config), Number(block.sort_order)]);
            }
          }
        }
        return { courseId: input.courseId, versionId: String(versionId) };
      }) as Promise<{ courseId: string; versionId: string }>;
    },
  };
}
