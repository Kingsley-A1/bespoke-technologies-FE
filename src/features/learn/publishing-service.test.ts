import { describe, expect, it, vi } from "vitest";
import { publishCourseVersion } from "./publishing-service";

const course = {
  id: "version-1", versionNumber: 1, state: "validated", title: "A reviewed course", summary: "A reviewed summary.", description: "A full reviewed description.", reviewedAt: "2026-08-02T00:00:00.000Z", authorIds: ["author-1"],
  modules: [{ id: "module-1", title: "Module one", sortOrder: 0, lessons: [{ id: "lesson-1", title: "Lesson one", slug: "lesson-one", objective: "Understand the concept.", sortOrder: 0, blocks: [{ id: "block-1", type: "rich_text", order: 0, required: true, completionRule: "acknowledged", config: { paragraphs: ["Reviewed explanation."] } }] }] }],
};

describe("publishCourseVersion", () => {
  it("publishes only a validated immutable version and records the consequential action", async () => {
    const repository = { publishImmutableVersion: vi.fn().mockResolvedValue(true), recordAudit: vi.fn().mockResolvedValue(undefined) };

    await expect(publishCourseVersion({ course, actorAdminUserId: "admin-1", actorLabel: "Admin", repository, now: new Date("2026-08-02T12:00:00.000Z") })).resolves.toEqual({ ok: true });
    expect(repository.publishImmutableVersion).toHaveBeenCalledWith({ versionId: "version-1", actorAdminUserId: "admin-1", publishedAt: "2026-08-02T12:00:00.000Z" });
    expect(repository.recordAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "learn.course_version.published", entityId: "version-1" }));
  });

  it("does not call the database publish transition when validation fails", async () => {
    const repository = { publishImmutableVersion: vi.fn(), recordAudit: vi.fn() };

    await expect(publishCourseVersion({ course: { ...course, reviewedAt: undefined }, actorAdminUserId: "admin-1", actorLabel: "Admin", repository, now: new Date() })).resolves.toMatchObject({ ok: false });
    expect(repository.publishImmutableVersion).not.toHaveBeenCalled();
  });
});
