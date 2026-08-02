import "server-only";

import { adminQuery, withAdminTransaction } from "@/features/admin/db";
import { createAdminAuthoringRepository } from "./admin-authoring-repository";
import { createAdminAuthoringCommands } from "./admin-authoring-commands";

const repository = createAdminAuthoringRepository({ transaction: withAdminTransaction, query: adminQuery });

export const listAdminLearnCourses = () => repository.listCourses();
export const createAdminLearnCourseDraft = repository.createCourseDraft;
export async function forkAdminLearnCourseVersion(input: { courseId: string; actorAdminUserId: string; actorLabel: string }) {
  const result = await repository.forkLatestPublishedVersion(input);
  await adminQuery(
    `INSERT INTO learn_audit_events (actor_admin_user_id, actor_label, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, 'learn.course_version.forked', 'course_version', $3, $4::JSONB)`,
    [input.actorAdminUserId, input.actorLabel, result.versionId, JSON.stringify({ courseId: input.courseId })],
  );
  return result;
}
export const adminLearnAuthoringCommands = createAdminAuthoringCommands({ query: adminQuery });

type DraftItemKind = "module" | "lesson" | "block";

export async function moveAdminLearnDraftItem(input: { itemId: string; kind: DraftItemKind; direction: "earlier" | "later" }) {
  return withAdminTransaction(async (client) => {
    const definitions = {
      module: {
        current: `SELECT m.id, m.course_version_id AS parent_id, m.sort_order FROM learn_modules m JOIN learn_course_versions v ON v.id = m.course_version_id WHERE m.id = $1 AND v.state = 'draft'`,
        siblings: `SELECT m.id, m.sort_order FROM learn_modules m JOIN learn_course_versions v ON v.id = m.course_version_id WHERE m.course_version_id = $1 AND v.state = 'draft' ORDER BY m.sort_order`,
        table: "learn_modules", parent: "course_version_id",
      },
      lesson: {
        current: `SELECT l.id, l.module_id AS parent_id, l.sort_order FROM learn_lessons l JOIN learn_modules m ON m.id = l.module_id JOIN learn_course_versions v ON v.id = m.course_version_id WHERE l.id = $1 AND v.state = 'draft'`,
        siblings: `SELECT l.id, l.sort_order FROM learn_lessons l JOIN learn_modules m ON m.id = l.module_id JOIN learn_course_versions v ON v.id = m.course_version_id WHERE l.module_id = $1 AND v.state = 'draft' ORDER BY l.sort_order`,
        table: "learn_lessons", parent: "module_id",
      },
      block: {
        current: `SELECT b.id, b.lesson_id AS parent_id, b.sort_order FROM learn_content_blocks b JOIN learn_lessons l ON l.id = b.lesson_id JOIN learn_modules m ON m.id = l.module_id JOIN learn_course_versions v ON v.id = m.course_version_id WHERE b.id = $1 AND v.state = 'draft'`,
        siblings: `SELECT b.id, b.sort_order FROM learn_content_blocks b JOIN learn_lessons l ON l.id = b.lesson_id JOIN learn_modules m ON m.id = l.module_id JOIN learn_course_versions v ON v.id = m.course_version_id WHERE b.lesson_id = $1 AND v.state = 'draft' ORDER BY b.sort_order`,
        table: "learn_content_blocks", parent: "lesson_id",
      },
    } as const;
    const definition = definitions[input.kind];
    const current = await client.query(definition.current, [input.itemId]);
    const row = current.rows[0];
    if (!row) throw new Error("Only an item in a current draft can be reordered.");
    const siblings = await client.query(definition.siblings, [String(row.parent_id)]);
    const items = siblings.rows.map((item) => ({ id: String(item.id), sortOrder: Number(item.sort_order) }));
    const index = items.findIndex((item) => item.id === input.itemId);
    const target = input.direction === "earlier" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= items.length) return { moved: false as const };
    [items[index], items[target]] = [items[target]!, items[index]!];
    await client.query(`UPDATE ${definition.table} SET sort_order = sort_order + 1000000 WHERE ${definition.parent} = $1`, [String(row.parent_id)]);
    for (const [sortOrder, item] of items.entries()) await client.query(`UPDATE ${definition.table} SET sort_order = $1 WHERE id = $2`, [sortOrder, item.id]);
    return { moved: true as const };
  }) as Promise<{ moved: boolean }>;
}

export async function getAdminLearnCourse(courseId: string) {
  const versionResult = await adminQuery<{
    id: string; course_id: string; version_number: number; state: string; title: string; summary: string; description: string; outcomes: unknown; audience: string | null; prerequisites: unknown; commitment: string | null; formats: unknown; access_policy: string; seo_title: string | null; seo_description: string | null; reviewed_at: Date | null;
  }>(`SELECT id, course_id, version_number, state, title, summary, description, outcomes, audience, prerequisites, commitment, formats, access_policy, seo_title, seo_description, reviewed_at FROM learn_course_versions WHERE course_id = $1 ORDER BY version_number DESC LIMIT 1`, [courseId]);
  const version = versionResult.rows[0];
  if (!version) return null;
  const modulesResult = await adminQuery<{ id: string; title: string; summary: string | null; sort_order: number }>(`SELECT id, title, summary, sort_order FROM learn_modules WHERE course_version_id = $1 ORDER BY sort_order`, [version.id]);
  const lessonsResult = await adminQuery<{ id: string; module_id: string; slug: string; title: string; objective: string; sort_order: number }>(`SELECT l.id, l.module_id, l.slug, l.title, l.objective, l.sort_order FROM learn_lessons l JOIN learn_modules m ON m.id = l.module_id WHERE m.course_version_id = $1 ORDER BY m.sort_order, l.sort_order`, [version.id]);
  const blocksResult = await adminQuery<{ id: string; lesson_id: string; stable_id: string; block_type: string; required: boolean; completion_rule: string; config: unknown; sort_order: number }>(`SELECT b.id, b.lesson_id, b.stable_id, b.block_type, b.required, b.completion_rule, b.config, b.sort_order FROM learn_content_blocks b JOIN learn_lessons l ON l.id = b.lesson_id JOIN learn_modules m ON m.id = l.module_id WHERE m.course_version_id = $1 ORDER BY m.sort_order, l.sort_order, b.sort_order`, [version.id]);
  const assetsResult = await adminQuery<{ id: string; filename: string; mime_type: string; byte_size: number }>(`SELECT id, filename, mime_type, byte_size FROM learn_assets WHERE course_id = $1 ORDER BY created_at DESC`, [courseId]);
  return {
    courseId,
    assets: assetsResult.rows.map((asset) => ({ id: asset.id, filename: asset.filename, mimeType: asset.mime_type, byteSize: Number(asset.byte_size) })),
    version: { id: version.id, number: version.version_number, state: version.state, title: version.title, summary: version.summary, description: version.description, outcomes: list(version.outcomes), audience: version.audience ?? undefined, prerequisites: list(version.prerequisites), commitment: version.commitment ?? undefined, formats: list(version.formats), accessPolicy: version.access_policy, seoTitle: version.seo_title ?? undefined, seoDescription: version.seo_description ?? undefined, reviewedAt: version.reviewed_at?.toISOString() },
    modules: modulesResult.rows.map((module) => ({ id: module.id, title: module.title, summary: module.summary ?? undefined, sortOrder: module.sort_order, lessons: lessonsResult.rows.filter((lesson) => lesson.module_id === module.id).map((lesson) => ({ id: lesson.id, slug: lesson.slug, title: lesson.title, objective: lesson.objective, sortOrder: lesson.sort_order, blocks: blocksResult.rows.filter((block) => block.lesson_id === lesson.id).map((block) => ({ id: block.id, stableId: block.stable_id, type: block.block_type, required: block.required, completionRule: block.completion_rule, config: value(block.config), sortOrder: block.sort_order })) })) })),
  };
}

function list(value: unknown) {
  const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function value(input: unknown) {
  return typeof input === "string" ? JSON.parse(input) as unknown : input;
}
