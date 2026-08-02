import type { AccessDecision } from "./entitlements";

type PublishedBlock = {
  courseId: string;
  versionId: string;
  lessonId: string;
  blockId: string;
  stableId: string;
  required: boolean;
  completionRule: string;
};

type WriteInput = {
  learnerId: string;
  courseSlug: string;
  lessonSlug: string;
  stableBlockId: string;
  completed?: boolean;
  position?: Record<string, number>;
};

export function createProgressWriteService({
  findPublishedBlock,
  resolveAccess,
  writeProgress,
  reconcileLesson,
}: {
  findPublishedBlock: (input: Pick<WriteInput, "courseSlug" | "lessonSlug" | "stableBlockId">) => Promise<PublishedBlock | null>;
  resolveAccess: (input: { courseId: string; learnerId: string }) => Promise<AccessDecision>;
  writeProgress: (input: { learnerId: string; courseVersionId: string; lessonId: string; blockId: string; state: "in_progress" | "completed"; position: Record<string, number> }) => Promise<void>;
  reconcileLesson: (input: { learnerId: string; courseVersionId: string; lessonId: string }) => Promise<{ complete: boolean }>;
}) {
  return {
    async record(input: WriteInput) {
      if (!input.completed && !input.position) return { ok: false as const, status: 400 as const };
      const block = await findPublishedBlock(input);
      if (!block) return { ok: false as const, status: 404 as const };
      const access = await resolveAccess({ courseId: block.courseId, learnerId: input.learnerId });
      if (!access.allowed || access.mode !== "full") return { ok: false as const, status: 403 as const };
      await writeProgress({
        learnerId: input.learnerId,
        courseVersionId: block.versionId,
        lessonId: block.lessonId,
        blockId: block.blockId,
        state: input.completed ? "completed" : "in_progress",
        position: input.position ?? {},
      });
      const completion = await reconcileLesson({ learnerId: input.learnerId, courseVersionId: block.versionId, lessonId: block.lessonId });
      return { ok: true as const, completed: completion.complete };
    },
  };
}
