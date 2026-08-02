import { describe, expect, it, vi } from "vitest";
import { createPublicCourseService } from "./public-courses";

describe("public course service", () => {
  it("returns only the repository's published course summaries", async () => {
    const listPublishedCourses = vi.fn().mockResolvedValue([{ id: "course-1", title: "Reviewed course" }]);
    const service = createPublicCourseService({ listPublishedCourses });

    await expect(service.list()).resolves.toEqual([{ id: "course-1", title: "Reviewed course" }]);
    expect(listPublishedCourses).toHaveBeenCalledWith(undefined);
  });

  it("passes a learner search term to the published-course query", async () => {
    const listPublishedCourses = vi.fn().mockResolvedValue([]);
    const service = createPublicCourseService({ listPublishedCourses });

    await service.list("responsible AI");

    expect(listPublishedCourses).toHaveBeenCalledWith("responsible AI");
  });
});
