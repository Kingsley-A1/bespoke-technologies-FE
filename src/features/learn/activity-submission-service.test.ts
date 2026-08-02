import { describe, expect, it } from "vitest";
import { createActivitySubmissionService } from "./activity-submission-service";

const choiceBlock = {
  courseId: "course-1",
  versionId: "version-1",
  lessonId: "lesson-1",
  blockId: "block-row-1",
  stableId: "choose-safely",
  type: "interactive" as const,
  required: true,
  completionRule: "assessment_passed" as const,
  config: {
    kind: "single_choice" as const,
    prompt: "Choose the safer action.",
    options: [
      { id: "check", label: "Check the output", feedback: "Checking output keeps a human accountable.", correct: true },
      { id: "send", label: "Send it immediately", feedback: "Unreviewed output can introduce errors.", correct: false },
    ],
    retryLimit: 1,
  },
};

describe("activity submission service", () => {
  it("persists an explanatory wrong answer without completing an assessment block", async () => {
    const saved: unknown[] = [];
    const service = createActivitySubmissionService({
      findPublishedActivityBlock: async () => choiceBlock,
      resolveAccess: async () => ({ allowed: true, mode: "full" }),
      findAttemptByKey: async () => null,
      countAttempts: async () => 0,
      saveAttempt: async (attempt) => { saved.push(attempt); },
    });

    await expect(service.submit({
      learnerId: "learner-1",
      courseSlug: "course",
      lessonSlug: "lesson",
      stableBlockId: "choose-safely",
      idempotencyKey: "activity-request-1",
      response: ["send"],
    })).resolves.toMatchObject({ ok: true, completed: false, feedback: ["Unreviewed output can introduce errors."] });

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ attemptNumber: 1, response: ["send"], completed: false });
  });

  it("returns the stored result for a retried idempotency key without consuming another attempt", async () => {
    let counted = false;
    const service = createActivitySubmissionService({
      findPublishedActivityBlock: async () => choiceBlock,
      resolveAccess: async () => ({ allowed: true, mode: "full" }),
      findAttemptByKey: async () => ({ completed: true, feedback: ["Checking output keeps a human accountable."] }),
      countAttempts: async () => { counted = true; return 1; },
      saveAttempt: async () => undefined,
    });

    await expect(service.submit({
      learnerId: "learner-1",
      courseSlug: "course",
      lessonSlug: "lesson",
      stableBlockId: "choose-safely",
      idempotencyKey: "activity-request-1",
      response: ["check"],
    })).resolves.toEqual({ ok: true, completed: true, feedback: ["Checking output keeps a human accountable."], replayed: true });

    expect(counted).toBe(false);
  });
});
