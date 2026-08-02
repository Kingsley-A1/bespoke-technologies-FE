import { describe, expect, it } from "vitest";
import { validateCourseAssetReferences } from "./asset-reference-validation";

describe("course asset reference validation", () => {
  const course = { modules: [{ lessons: [{ blocks: [{ id: "image", type: "image", order: 0, required: false, completionRule: "none", config: { assetId: "image-1", altText: "A meaningful reviewed diagram", decorative: false } }] }] }] };

  it("blocks publication when a typed block references an unavailable or incompatible course asset", () => {
    expect(validateCourseAssetReferences(course, [])).toEqual(expect.arrayContaining([expect.stringMatching(/image-1/i)]));
    expect(validateCourseAssetReferences(course, [{ id: "image-1", mimeType: "audio/mpeg" }])).toEqual(expect.arrayContaining([expect.stringMatching(/image/i)]));
  });

  it("accepts a matching course-owned asset reference", () => {
    expect(validateCourseAssetReferences(course, [{ id: "image-1", mimeType: "image/png" }])).toEqual([]);
  });
});
