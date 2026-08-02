"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPermission, requireRecentAdminPermission } from "@/features/admin/access";
import { adminLearnAuthoringCommands, createAdminLearnCourseDraft, forkAdminLearnCourseVersion, moveAdminLearnDraftItem } from "@/features/learn/admin-authoring.server";
import { blockFromAuthoringInput } from "@/features/learn/authoring-block-input";
import { publishAdminLearnCourse, validateAdminLearnCourse } from "@/features/learn/admin-publishing.server";
import { grantAdminLearnEntitlement, revokeAdminLearnEntitlement } from "@/features/learn/entitlement-admin.server";
import { adminQuery } from "@/features/admin/db";

function text(formData: FormData, key: string, maxLength = 4_000) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value || value.length > maxLength) throw new Error(`A valid ${key} is required.`);
  return value;
}

function slug(formData: FormData, key: string) {
  const value = text(formData, key, 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error(`${key} must use lowercase URL-safe words.`);
  return value;
}

function optionalText(formData: FormData, key: string, maxLength = 4_000) {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length > maxLength) throw new Error(`${key} is too long.`);
  return value || undefined;
}

function lines(formData: FormData, key: string, maxItems = 20) {
  const values = String(formData.get(key) ?? "").split("\n").map((value) => value.trim()).filter(Boolean);
  if (values.length > maxItems || values.some((value) => value.length > 400)) throw new Error(`${key} needs shorter, separate lines.`);
  return [...new Set(values)];
}

function accessPolicy(formData: FormData) {
  const value = text(formData, "accessPolicy", 40);
  if (value !== "public_preview" && value !== "authenticated_free" && value !== "manual_grant" && value !== "unavailable") throw new Error("A valid access policy is required.");
  return value;
}

export async function createLearnCourseAction(formData: FormData) {
  const session = await requireAdminPermission("learn.manage");
  const result = await createAdminLearnCourseDraft({
    publisher: { name: text(formData, "publisherName", 180), slug: slug(formData, "publisherSlug") },
    course: {
      title: text(formData, "title", 240),
      slug: slug(formData, "slug"),
      summary: text(formData, "summary", 1_000),
      description: text(formData, "description", 8_000),
    },
    actorAdminUserId: session.userId,
  });
  revalidatePath("/admin/learn");
  redirect(`/admin/learn/${result.courseId}`);
}

export async function addLearnModuleAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  await adminLearnAuthoringCommands.appendModule({ courseVersionId: text(formData, "courseVersionId", 100), title: text(formData, "title", 240), summary: String(formData.get("summary") ?? "") });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function addLearnLessonAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  await adminLearnAuthoringCommands.appendLesson({ moduleId: text(formData, "moduleId", 100), slug: slug(formData, "slug"), title: text(formData, "title", 240), objective: text(formData, "objective", 1_000), context: String(formData.get("context") ?? ""), estimatedMinutes: Number(formData.get("estimatedMinutes") ?? 10) });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function addLearnBlockAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  const block = blockFromFormData(formData);
  await adminLearnAuthoringCommands.appendBlock({ lessonId: text(formData, "lessonId", 100), block });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function updateLearnBlockAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  await adminLearnAuthoringCommands.updateBlock({ blockRowId: text(formData, "blockRowId", 100), block: blockFromFormData(formData) });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function duplicateLearnBlockAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  await adminLearnAuthoringCommands.duplicateBlock({ sourceBlockId: text(formData, "blockRowId", 100), stableId: text(formData, "newBlockId", 96) });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function removeLearnBlockAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  if (formData.get("confirmed") !== "on") throw new Error("Confirm that the draft block should be removed.");
  const courseId = text(formData, "courseId", 100);
  await adminLearnAuthoringCommands.removeBlock({ blockRowId: text(formData, "blockRowId", 100) });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function moveLearnDraftItemAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  const kind = text(formData, "kind", 20);
  const direction = text(formData, "direction", 20);
  if ((kind !== "module" && kind !== "lesson" && kind !== "block") || (direction !== "earlier" && direction !== "later")) throw new Error("A valid draft ordering action is required.");
  await moveAdminLearnDraftItem({ itemId: text(formData, "itemId", 100), kind, direction });
  revalidatePath(`/admin/learn/${courseId}`);
}

function blockFromFormData(formData: FormData) {
  const fields: Record<string, string | undefined> = {};
  for (const [key, formValue] of formData.entries()) if (typeof formValue === "string") fields[key] = formValue;
  return blockFromAuthoringInput({ id: text(formData, "blockId", 96), type: text(formData, "blockType", 40), order: Number(formData.get("order") ?? 0), required: formData.get("required") === "true", completionRule: text(formData, "completionRule", 40), fields });
}

export async function addLearnAuthorAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  await adminLearnAuthoringCommands.attachAuthor({ courseVersionId: text(formData, "courseVersionId", 100), author: { slug: slug(formData, "authorSlug"), displayName: text(formData, "authorName", 240) } });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function updateLearnCourseAction(formData: FormData) {
  await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  await adminLearnAuthoringCommands.updateCourseDraft({
    courseVersionId: text(formData, "courseVersionId", 100),
    course: {
      title: text(formData, "title", 240), summary: text(formData, "summary", 1_000), description: text(formData, "description", 8_000), outcomes: lines(formData, "outcomes"), audience: optionalText(formData, "audience", 500), prerequisites: lines(formData, "prerequisites"), commitment: optionalText(formData, "commitment", 240), formats: lines(formData, "formats"), accessPolicy: accessPolicy(formData), seoTitle: optionalText(formData, "seoTitle", 60), seoDescription: optionalText(formData, "seoDescription", 160),
    },
  });
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function validateLearnCourseAction(formData: FormData) {
  const session = await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  const result = await validateAdminLearnCourse({ courseId, reviewDate: text(formData, "reviewDate", 40), actorAdminUserId: session.userId, actorLabel: session.displayName });
  if (!result.ok) throw new Error(result.errors.join(" "));
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function publishLearnCourseAction(formData: FormData) {
  const session = await requireRecentAdminPermission("learn.publish");
  const courseId = text(formData, "courseId", 100);
  const result = await publishAdminLearnCourse({ courseId, actorAdminUserId: session.userId, actorLabel: session.displayName });
  if (!result.ok) throw new Error(result.errors.join(" "));
  revalidatePath(`/admin/learn/${courseId}`);
  revalidatePath("/courses");
}

export async function forkLearnCourseVersionAction(formData: FormData) {
  const session = await requireAdminPermission("learn.manage");
  const courseId = text(formData, "courseId", 100);
  const result = await forkAdminLearnCourseVersion({ courseId, actorAdminUserId: session.userId, actorLabel: session.displayName });
  revalidatePath(`/admin/learn/${courseId}`);
  redirect(`/admin/learn/${result.courseId}`);
}

export async function archiveLearnCourseAction(formData: FormData) {
  const session = await requireRecentAdminPermission("learn.publish");
  if (formData.get("confirmed") !== "on") throw new Error("Confirm that the course should be archived.");
  const courseId = text(formData, "courseId", 100);
  const result = await adminQuery<{ id: string }>(
    `UPDATE learn_courses SET state = 'archived', updated_at = now()
     WHERE id = $1 AND state = 'active' RETURNING id`,
    [courseId],
  );
  if (!result.rows[0]) throw new Error("This course is no longer available to archive.");
  await adminQuery(
    `INSERT INTO learn_audit_events (actor_admin_user_id, actor_label, action, entity_type, entity_id)
     VALUES ($1, $2, 'learn.course.archived', 'course', $3)`,
    [session.userId, session.displayName, courseId],
  );
  revalidatePath("/admin/learn");
  revalidatePath("/courses");
  redirect("/admin/learn");
}

export async function grantLearnAccessAction(formData: FormData) {
  const session = await requireRecentAdminPermission("learn.publish");
  const courseId = text(formData, "courseId", 100);
  const result = await grantAdminLearnEntitlement({ learnerEmail: text(formData, "learnerEmail", 320), courseId, actorAdminUserId: session.userId, actorLabel: session.displayName });
  if (!result.ok) throw new Error(result.error);
  revalidatePath(`/admin/learn/${courseId}`);
}

export async function revokeLearnAccessAction(formData: FormData) {
  const session = await requireRecentAdminPermission("learn.publish");
  const courseId = text(formData, "courseId", 100);
  const result = await revokeAdminLearnEntitlement({ learnerEmail: text(formData, "learnerEmail", 320), courseId, actorAdminUserId: session.userId, actorLabel: session.displayName, reason: text(formData, "reason", 1_000) });
  if (!result.ok) throw new Error(result.error);
  revalidatePath(`/admin/learn/${courseId}`);
}
