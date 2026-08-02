import { describe, expect, it } from "vitest";
import { createLearnerDashboardReader } from "./learner-dashboard-data";

describe("learner dashboard data", () => {
  it("returns a server-authorised course with the first incomplete lesson as its continue target", async () => {
    const replies = [
      { rows: [{ course_id: "course-1", version_id: "version-1", slug: "responsible-ai", title: "Responsible AI" }] },
      { rows: [{ id: "lesson-1", slug: "first-step", title: "First step", sort_order: 0 }, { id: "lesson-2", slug: "second-step", title: "Second step", sort_order: 1 }] },
      { rows: [{ lesson_id: "lesson-1", state: "completed" }] },
    ];
    const reader = createLearnerDashboardReader({ query: async () => replies.shift()! });

    await expect(reader.listForLearner("learner-1")).resolves.toEqual([{
      courseSlug: "responsible-ai",
      title: "Responsible AI",
      progressPercent: 50,
      nextLessonSlug: "second-step",
      nextLessonTitle: "Second step",
    }]);
  });
});
