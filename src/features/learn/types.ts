export const LEARN_ACCESS_POLICIES = [
  "public_preview",
  "authenticated_free",
  "manual_grant",
  "unavailable",
] as const;

export type LearnAccessPolicy = (typeof LEARN_ACCESS_POLICIES)[number];

export const LEARN_COMPLETION_RULES = [
  "none",
  "acknowledged",
  "submitted",
  "assessment_passed",
  "media_complete",
] as const;

export type LearnCompletionRule = (typeof LEARN_COMPLETION_RULES)[number];

export const LEARN_BLOCK_TYPES = [
  "rich_text",
  "callout",
  "image",
  "slides",
  "video",
  "audio",
  "download",
  "quiz",
  "interactive",
  "reflection",
] as const;

export type ContentBlockType = (typeof LEARN_BLOCK_TYPES)[number];

export const LEARN_INTERACTION_KINDS = [
  "single_choice",
  "multiple_choice",
  "scenario_choice",
  "short_structured_response",
] as const;

export type InteractionKind = (typeof LEARN_INTERACTION_KINDS)[number];
