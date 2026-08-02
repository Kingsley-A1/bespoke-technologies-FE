import { validateCourseForPublishing, type PublishingCourse } from "./publishing";

export type PublishingCommandRepository = {
  publishImmutableVersion(input: { versionId: string; actorAdminUserId: string; publishedAt: string }): Promise<boolean>;
  recordAudit(input: { actorAdminUserId: string; actorLabel: string; action: string; entityType: string; entityId: string; metadata?: Record<string, unknown> }): Promise<void>;
};

export async function publishCourseVersion(input: {
  course: PublishingCourse;
  actorAdminUserId: string;
  actorLabel: string;
  repository: PublishingCommandRepository;
  now: Date;
}) {
  if (input.course.state !== "validated") return { ok: false as const, errors: ["Validate this immutable version before publishing."] };
  const errors = validateCourseForPublishing(input.course);
  if (errors.length > 0) return { ok: false as const, errors };
  const publishedAt = input.now.toISOString();
  const published = await input.repository.publishImmutableVersion({ versionId: input.course.id, actorAdminUserId: input.actorAdminUserId, publishedAt });
  if (!published) return { ok: false as const, errors: ["This version is no longer publishable. Refresh and review its current state."] };
  await input.repository.recordAudit({
    actorAdminUserId: input.actorAdminUserId,
    actorLabel: input.actorLabel,
    action: "learn.course_version.published",
    entityType: "course_version",
    entityId: input.course.id,
    metadata: { versionNumber: input.course.versionNumber },
  });
  return { ok: true as const };
}
