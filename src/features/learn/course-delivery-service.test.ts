import { describe, expect, it, vi } from "vitest";
import { createCourseDeliveryService } from "./course-delivery-service";

const course = { id: "course-1", slug: "course", versionId: "version-1", versionNumber: 1, title: "Course", summary: "Summary", description: "Description", accessPolicy: "manual_grant" as const, authors: [], modules: [] };

describe("course delivery service", () => {
  it("does not allow a public detail page to infer access from an Admin session", async () => {
    const getCourse = vi.fn().mockResolvedValue(course);
    const resolveAccess = vi.fn().mockResolvedValue({ allowed: false, reason: "sign_in_required" });
    const service = createCourseDeliveryService({ getCourse, resolveAccess });

    await expect(service.loadCourse({ slug: "course", learnerId: undefined })).resolves.toEqual({ course, access: { allowed: false, reason: "sign_in_required" } });
    expect(resolveAccess).toHaveBeenCalledWith({ courseId: "course-1", learnerId: undefined });
  });

  it("returns null without an access decision when the requested published course is absent", async () => {
    const service = createCourseDeliveryService({ getCourse: vi.fn().mockResolvedValue(null), resolveAccess: vi.fn() });
    await expect(service.loadCourse({ slug: "missing", learnerId: "learner-1" })).resolves.toBeNull();
  });
});
