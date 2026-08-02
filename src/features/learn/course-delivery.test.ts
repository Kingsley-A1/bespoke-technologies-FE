import { describe, expect, it, vi } from "vitest";
import { createCourseDeliveryRepository } from "./course-delivery";

describe("course delivery repository", () => {
  it("loads public course metadata only from the current immutable published version", async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ course_id: "course-1", course_slug: "course", version_id: "version-2", version_number: 2, title: "Reviewed course", summary: "A reviewed summary", description: "Reviewed description", access_policy: "manual_grant", reviewed_at: "2026-08-02T00:00:00.000Z", published_at: "2026-08-02T00:00:00.000Z" }] }).mockResolvedValueOnce({ rows: [{ id: "module-1", title: "Module one", summary: null, sort_order: 0 }] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: "author-1", display_name: "Author One", sort_order: 0 }] });
    const repository = createCourseDeliveryRepository({ query });

    await expect(repository.findPublishedCourseBySlug("course")).resolves.toMatchObject({ id: "course-1", versionId: "version-2", modules: [{ title: "Module one", lessons: [] }], authors: [{ displayName: "Author One" }] });
    expect(query.mock.calls[0]?.[0]).toContain("v.state = 'published'");
    expect(query.mock.calls[0]?.[0]).not.toContain("draft");
  });

  it("validates stored lesson blocks before they can reach a learner renderer", async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ course_id: "course-1", course_slug: "course", version_id: "version-2", version_number: 2, course_title: "Reviewed course", lesson_id: "lesson-1", lesson_slug: "lesson", lesson_title: "Lesson", objective: "Understand the boundary", context: null, estimated_minutes: 10, module_id: "module-1", module_title: "Module", module_sort_order: 0, lesson_sort_order: 0 }] }).mockResolvedValueOnce({ rows: [{ id: "block-row-1", stable_id: "explain", block_type: "rich_text", required: true, completion_rule: "acknowledged", config: { paragraphs: ["A reviewed explanation."] }, sort_order: 0 }] });
    const repository = createCourseDeliveryRepository({ query });

    await expect(repository.findPublishedLesson({ courseSlug: "course", lessonSlug: "lesson" })).resolves.toMatchObject({ lesson: { id: "lesson-1", blocks: [{ id: "explain", type: "rich_text" }] } });
    expect(query.mock.calls[0]?.[0]).toContain("v.state = 'published'");
  });

  it("rejects invalid stored blocks instead of falling back to an executable renderer", async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ course_id: "course-1", course_slug: "course", version_id: "version-2", version_number: 2, course_title: "Reviewed course", lesson_id: "lesson-1", lesson_slug: "lesson", lesson_title: "Lesson", objective: "Understand the boundary", context: null, estimated_minutes: 10, module_id: "module-1", module_title: "Module", module_sort_order: 0, lesson_sort_order: 0 }] }).mockResolvedValueOnce({ rows: [{ id: "block-row-1", stable_id: "unsafe", block_type: "rich_text", required: false, completion_rule: "none", config: { paragraphs: ["<script>alert(1)</script>"] }, sort_order: 0 }] });
    const repository = createCourseDeliveryRepository({ query });

    await expect(repository.findPublishedLesson({ courseSlug: "course", lessonSlug: "lesson" })).rejects.toThrow(/Text cannot contain markup/i);
  });
});
