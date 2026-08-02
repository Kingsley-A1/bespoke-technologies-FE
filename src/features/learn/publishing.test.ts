import { describe, expect, it } from "vitest";
import { validateCourseForPublishing } from "./publishing";

const completeCourse = {
  id: "version-1",
  versionNumber: 1,
  state: "draft",
  title: "A reviewed course",
  summary: "A concise reviewed summary.",
  description: "A complete description of the learning experience.",
  reviewedAt: "2026-08-02T00:00:00.000Z",
  authorIds: ["author-1"],
  modules: [{ id: "module-1", title: "Module one", sortOrder: 0, lessons: [{ id: "lesson-1", title: "Lesson one", slug: "lesson-one", objective: "Understand one practical concept.", sortOrder: 0, blocks: [{ id: "block-1", type: "rich_text", order: 0, required: true, completionRule: "acknowledged", config: { paragraphs: ["A reviewed explanation."] } }] }], }],
};

describe("course publishing validation", () => {
  it("requires reviewed authorship and a complete ordered hierarchy before publishing", () => {
    expect(validateCourseForPublishing(completeCourse)).toEqual([]);
  });

  it("rejects a missing review date and an empty learning hierarchy", () => {
    const result = validateCourseForPublishing({ ...completeCourse, reviewedAt: undefined, modules: [] });

    expect(result).toEqual(expect.arrayContaining([expect.stringMatching(/review date/i), expect.stringMatching(/module/i)]));
  });

  it("rejects a block whose required accessibility metadata does not validate", () => {
    const result = validateCourseForPublishing({ ...completeCourse, modules: [{ ...completeCourse.modules[0], lessons: [{ ...completeCourse.modules[0].lessons[0], blocks: [{ id: "image-1", type: "image", order: 0, required: false, completionRule: "none", config: { assetId: "asset-1", decorative: false } }] }] }] });

    expect(result).toEqual(expect.arrayContaining([expect.stringMatching(/image-1/i)]));
  });
});
