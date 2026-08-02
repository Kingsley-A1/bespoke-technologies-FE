import "server-only";

import { adminQuery, withAdminTransaction } from "@/features/admin/db";
import { createPublishingCommandRepository } from "./publishing-db";
import { validateCourseForPublishing } from "./publishing";
import { publishCourseVersion } from "./publishing-service";
import { validateCourseAssetReferences } from "./asset-reference-validation";

function json(value: unknown) {
  if (typeof value === "string") return JSON.parse(value) as unknown;
  return value;
}

async function fullVersion(courseId: string) {
  const versionResult = await adminQuery<{ id: string; course_id: string; version_number: number; state: string; title: string; summary: string; description: string; reviewed_at: Date | null }>(`SELECT id, course_id, version_number, state, title, summary, description, reviewed_at FROM learn_course_versions WHERE course_id = $1 ORDER BY version_number DESC LIMIT 1`, [courseId]);
  const version = versionResult.rows[0];
  if (!version) return null;
  const [authors, modules, lessons, blocks, assets] = await Promise.all([
    adminQuery<{ author_id: string }>(`SELECT author_id FROM learn_course_authors WHERE course_version_id = $1 ORDER BY sort_order`, [version.id]),
    adminQuery<{ id: string; title: string; sort_order: number }>(`SELECT id, title, sort_order FROM learn_modules WHERE course_version_id = $1 ORDER BY sort_order`, [version.id]),
    adminQuery<{ id: string; module_id: string; slug: string; title: string; objective: string; sort_order: number }>(`SELECT l.id, l.module_id, l.slug, l.title, l.objective, l.sort_order FROM learn_lessons l JOIN learn_modules m ON m.id = l.module_id WHERE m.course_version_id = $1 ORDER BY m.sort_order, l.sort_order`, [version.id]),
    adminQuery<{ id: string; lesson_id: string; stable_id: string; block_type: string; required: boolean; completion_rule: string; config: unknown; sort_order: number }>(`SELECT b.id, b.lesson_id, b.stable_id, b.block_type, b.required, b.completion_rule, b.config, b.sort_order FROM learn_content_blocks b JOIN learn_lessons l ON l.id = b.lesson_id JOIN learn_modules m ON m.id = l.module_id WHERE m.course_version_id = $1 ORDER BY m.sort_order, l.sort_order, b.sort_order`, [version.id]),
    adminQuery<{ id: string; mime_type: string }>(`SELECT id, mime_type FROM learn_assets WHERE course_id = $1`, [version.course_id]),
  ]);
  return {
    id: version.id, versionNumber: version.version_number, state: version.state, title: version.title, summary: version.summary, description: version.description, reviewedAt: version.reviewed_at?.toISOString(), authorIds: authors.rows.map((author) => author.author_id),
    modules: modules.rows.map((module) => ({ id: module.id, title: module.title, sortOrder: module.sort_order, lessons: lessons.rows.filter((lesson) => lesson.module_id === module.id).map((lesson) => ({ id: lesson.id, title: lesson.title, slug: lesson.slug, objective: lesson.objective, sortOrder: lesson.sort_order, blocks: blocks.rows.filter((block) => block.lesson_id === lesson.id).map((block) => ({ id: block.stable_id, type: block.block_type, order: block.sort_order, required: block.required, completionRule: block.completion_rule, config: json(block.config) })) })) })),
    assets: assets.rows.map((asset) => ({ id: asset.id, mimeType: asset.mime_type })),
  };
}

export async function validateAdminLearnCourse(input: { courseId: string; reviewDate: string; actorAdminUserId: string; actorLabel: string }) {
  const course = await fullVersion(input.courseId);
  if (!course || course.state !== "draft") return { ok: false as const, errors: ["Only a current draft can be validated."] };
  const reviewedAt = new Date(input.reviewDate);
  const errors = [...validateCourseForPublishing({ ...course, reviewedAt: Number.isNaN(reviewedAt.getTime()) ? undefined : reviewedAt.toISOString() }), ...validateCourseAssetReferences(course, course.assets)];
  if (errors.length > 0) return { ok: false as const, errors };
  const result = await adminQuery(`UPDATE learn_course_versions SET state = 'validated', reviewed_at = $2, updated_at = now() WHERE id = $1 AND state = 'draft'`, [course.id, reviewedAt.toISOString()]);
  if (result.rowCount !== 1) return { ok: false as const, errors: ["This draft changed before validation completed."] };
  await adminQuery(`INSERT INTO learn_audit_events (actor_admin_user_id, actor_label, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'learn.course_version.validated', 'course_version', $3, $4::JSONB)`, [input.actorAdminUserId, input.actorLabel, course.id, JSON.stringify({ versionNumber: course.versionNumber })]);
  return { ok: true as const };
}

export async function publishAdminLearnCourse(input: { courseId: string; actorAdminUserId: string; actorLabel: string }) {
  const course = await fullVersion(input.courseId);
  if (!course) return { ok: false as const, errors: ["Course version was not found."] };
  const assetErrors = validateCourseAssetReferences(course, course.assets);
  if (assetErrors.length > 0) return { ok: false as const, errors: assetErrors };
  return publishCourseVersion({ course, actorAdminUserId: input.actorAdminUserId, actorLabel: input.actorLabel, repository: createPublishingCommandRepository({ transaction: withAdminTransaction, query: adminQuery }), now: new Date() });
}
