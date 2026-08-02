import { describe, expect, it, vi } from "vitest";
import { createLearnerProgressReader } from "./learner-progress-read";

describe("learner progress reader", () => {
  it("loads lesson state only for the learner's pinned course version", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ lesson_id: "lesson-1", state: "in_progress" }] });
    const reader = createLearnerProgressReader({ query });

    await expect(reader.listLessonStates({ learnerId: "learner-1", versionId: "version-1" })).resolves.toEqual([{ lessonId: "lesson-1", state: "in_progress" }]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("course_version_id = $2"), ["learner-1", "version-1"]);
  });
});
