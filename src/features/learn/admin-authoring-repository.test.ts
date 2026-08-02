import { describe, expect, it, vi } from "vitest";
import { createAdminAuthoringRepository } from "./admin-authoring-repository";

describe("admin authoring repository", () => {
  it("creates a publisher-backed course and first draft without hardcoding a course branch", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: "publisher-1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "course-1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "version-1" }] });
    const transaction = vi.fn(async (work: (client: { query: typeof query }) => Promise<unknown>) => work({ query }));
    const repository = createAdminAuthoringRepository({ transaction, query });

    await expect(repository.createCourseDraft({ publisher: { slug: "bespoke-technologies", name: "Bespoke Technologies" }, course: { slug: "course-one", title: "Course one", summary: "A concise draft summary.", description: "A draft course description." }, actorAdminUserId: "admin-1" })).resolves.toEqual({ courseId: "course-1", versionId: "version-1" });
    expect(query.mock.calls[0]?.[0]).toContain("learn_publishers");
    expect(query.mock.calls[1]?.[0]).toContain("learn_courses");
    expect(query.mock.calls[2]?.[0]).toContain("learn_course_versions");
  });
});
