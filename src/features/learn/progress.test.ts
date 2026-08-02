import { describe, expect, it } from "vitest";
import { resolveLessonCompletion } from "./progress";

describe("lesson completion", () => {
  it("does not complete a lesson solely because its page was visited", () => {
    expect(
      resolveLessonCompletion({
        requiredBlocks: [
          { id: "explain", completionRule: "acknowledged" },
          { id: "practice", completionRule: "submitted" },
        ],
        progress: [],
      }),
    ).toEqual({ complete: false, pendingBlockIds: ["explain", "practice"] });
  });

  it("completes only after every required block has met its configured state", () => {
    expect(
      resolveLessonCompletion({
        requiredBlocks: [
          { id: "explain", completionRule: "acknowledged" },
          { id: "practice", completionRule: "submitted" },
          { id: "assessment", completionRule: "assessment_passed" },
        ],
        progress: [
          { blockId: "explain", state: "completed" },
          { blockId: "practice", state: "completed" },
          { blockId: "assessment", state: "completed" },
        ],
      }),
    ).toEqual({ complete: true, pendingBlockIds: [] });
  });
});
