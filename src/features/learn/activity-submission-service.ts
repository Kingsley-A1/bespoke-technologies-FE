import type { AccessDecision } from "./entitlements";
import type { LearnCompletionRule } from "./types";

type ChoiceConfig = {
  kind: "single_choice" | "multiple_choice" | "scenario_choice";
  prompt: string;
  options: Array<{ id: string; feedback: string; correct: boolean }>;
  retryLimit: number;
};

type StructuredConfig = {
  kind: "short_structured_response";
  prompt: string;
  guidance: string;
  retryLimit: number;
};

type ActivityBlock = {
  courseId: string;
  versionId: string;
  lessonId: string;
  blockId: string;
  stableId: string;
  type: "quiz" | "interactive";
  required: boolean;
  completionRule: LearnCompletionRule;
  config: ChoiceConfig | StructuredConfig;
};

type StoredAttempt = { completed: boolean; feedback: string[] };

type Submission = {
  learnerId: string;
  courseSlug: string;
  lessonSlug: string;
  stableBlockId: string;
  idempotencyKey: string;
  response: string[];
};

function isChoiceConfig(config: ChoiceConfig | StructuredConfig): config is ChoiceConfig {
  return "options" in config;
}

function normalisedResponse(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function createActivitySubmissionService({
  findPublishedActivityBlock,
  resolveAccess,
  findAttemptByKey,
  countAttempts,
  saveAttempt,
}: {
  findPublishedActivityBlock: (input: Pick<Submission, "courseSlug" | "lessonSlug" | "stableBlockId">) => Promise<ActivityBlock | null>;
  resolveAccess: (input: { courseId: string; learnerId: string }) => Promise<AccessDecision>;
  findAttemptByKey: (input: { learnerId: string; idempotencyKey: string }) => Promise<StoredAttempt | null>;
  countAttempts: (input: { learnerId: string; versionId: string; blockId: string }) => Promise<number>;
  saveAttempt: (input: {
    learnerId: string;
    versionId: string;
    lessonId: string;
    blockId: string;
    idempotencyKey: string;
    attemptNumber: number;
    response: string[];
    feedback: string[];
    completed: boolean;
  }) => Promise<void>;
}) {
  return {
    async submit(input: Submission) {
      if (!/^[A-Za-z0-9_-]{16,128}$/.test(input.idempotencyKey)) return { ok: false as const, status: 400 as const, error: "Invalid submission key." };
      const previous = await findAttemptByKey({ learnerId: input.learnerId, idempotencyKey: input.idempotencyKey });
      if (previous) return { ok: true as const, completed: previous.completed, feedback: previous.feedback, replayed: true as const };

      const block = await findPublishedActivityBlock(input);
      if (!block) return { ok: false as const, status: 404 as const, error: "Activity not found." };
      const access = await resolveAccess({ courseId: block.courseId, learnerId: input.learnerId });
      if (!access.allowed || access.mode !== "full") return { ok: false as const, status: 403 as const, error: "Course access is required." };

      const response = normalisedResponse(input.response);
      if (response.length === 0) return { ok: false as const, status: 400 as const, error: "A response is required." };
      const attempts = await countAttempts({ learnerId: input.learnerId, versionId: block.versionId, blockId: block.blockId });
      if (attempts > block.config.retryLimit) return { ok: false as const, status: 409 as const, error: "No retries remain for this activity." };

      let feedback: string[];
      let correct = false;
      if (isChoiceConfig(block.config)) {
        const allowed = new Set(block.config.options.map((option) => option.id));
        if (response.some((value) => !allowed.has(value))) return { ok: false as const, status: 400 as const, error: "The selected response is not available." };
        const correctIds = block.config.options.filter((option) => option.correct).map((option) => option.id);
        correct = correctIds.length === response.length && correctIds.every((value) => response.includes(value));
        feedback = block.config.options.filter((option) => response.includes(option.id)).map((option) => option.feedback);
      } else {
        feedback = [block.config.guidance];
      }
      const completed = block.completionRule === "submitted" || (block.completionRule === "assessment_passed" && correct);
      await saveAttempt({
        learnerId: input.learnerId,
        versionId: block.versionId,
        lessonId: block.lessonId,
        blockId: block.blockId,
        idempotencyKey: input.idempotencyKey,
        attemptNumber: attempts + 1,
        response,
        feedback,
        completed,
      });
      return { ok: true as const, completed, feedback, replayed: false as const };
    },
  };
}
