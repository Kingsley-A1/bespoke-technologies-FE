import { describe, expect, it, vi } from "vitest";
import { createProgressWriteService } from "./progress-write-service";

const block = { courseId: "course-1", versionId: "version-1", lessonId: "lesson-1", blockId: "block-row-1", stableId: "explain", required: true, completionRule: "acknowledged" };

describe("progress write service", () => {
  it("rechecks learner entitlement before it writes version-pinned progress", async () => {
    const writeProgress = vi.fn();
    const service = createProgressWriteService({ findPublishedBlock: vi.fn().mockResolvedValue(block), resolveAccess: vi.fn().mockResolvedValue({ allowed: false, reason: "revoked" }), writeProgress, reconcileLesson: vi.fn() });

    await expect(service.record({ learnerId: "learner-1", courseSlug: "course", lessonSlug: "lesson", stableBlockId: "explain", completed: true })).resolves.toEqual({ ok: false, status: 403 });
    expect(writeProgress).not.toHaveBeenCalled();
  });

  it("writes an idempotent state and reconciles completion only after a real block action", async () => {
    const writeProgress = vi.fn().mockResolvedValue(undefined);
    const reconcileLesson = vi.fn().mockResolvedValue({ complete: false });
    const service = createProgressWriteService({ findPublishedBlock: vi.fn().mockResolvedValue(block), resolveAccess: vi.fn().mockResolvedValue({ allowed: true, mode: "full" }), writeProgress, reconcileLesson });

    await expect(service.record({ learnerId: "learner-1", courseSlug: "course", lessonSlug: "lesson", stableBlockId: "explain", completed: true, position: { slide: 1 } })).resolves.toEqual({ ok: true, completed: false });
    expect(writeProgress).toHaveBeenCalledWith(expect.objectContaining({ learnerId: "learner-1", courseVersionId: "version-1", blockId: "block-row-1", state: "completed", position: { slide: 1 } }));
    expect(reconcileLesson).toHaveBeenCalledWith({ learnerId: "learner-1", courseVersionId: "version-1", lessonId: "lesson-1" });
  });
});
