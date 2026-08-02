import type { LearnCompletionRule } from "./types";

export type RequiredBlock = {
  id: string;
  completionRule: LearnCompletionRule;
};

export type BlockProgressState = {
  blockId: string;
  state: "not_started" | "in_progress" | "completed";
};

export function resolveLessonCompletion(input: {
  requiredBlocks: readonly RequiredBlock[];
  progress: readonly BlockProgressState[];
}) {
  const completed = new Set(
    input.progress.filter((entry) => entry.state === "completed").map((entry) => entry.blockId),
  );
  const pendingBlockIds = input.requiredBlocks
    .filter((block) => block.completionRule !== "none" && !completed.has(block.id))
    .map((block) => block.id);

  return { complete: pendingBlockIds.length === 0, pendingBlockIds };
}
