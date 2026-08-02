import { z } from "zod";
import {
  LEARN_BLOCK_TYPES,
  LEARN_COMPLETION_RULES,
  LEARN_INTERACTION_KINDS,
  type ContentBlockType,
} from "../types";

const BLOCK_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

const safeText = z
  .string()
  .trim()
  .min(1)
  .max(4_000)
  .refine((value) => !/[<>]/.test(value), "Text cannot contain markup.");

const optionalSafeText = z
  .string()
  .trim()
  .max(4_000)
  .refine((value) => !/[<>]/.test(value), "Text cannot contain markup.")
  .optional();

const stableId = z.string().min(3).max(96).regex(BLOCK_ID, "Use a stable identifier.");
const assetId = stableId;

const baseBlock = z.object({
  id: stableId,
  order: z.number().int().min(0).max(10_000),
  required: z.boolean(),
  completionRule: z.enum(LEARN_COMPLETION_RULES),
});

const assetReference = z
  .object({
    assetId,
    altText: optionalSafeText,
    decorative: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.decorative && !value.altText) {
      ctx.addIssue({
        code: "custom",
        path: ["altText"],
        message: "Meaningful images require alternative text.",
      });
    }
  });

const choiceOption = z
  .object({
    id: stableId,
    label: safeText.max(280),
    feedback: safeText.max(1_200),
    correct: z.boolean(),
  })
  .strict();

const choiceInteractionConfig = z
  .object({
    kind: z.enum(["single_choice", "multiple_choice", "scenario_choice"]),
    prompt: safeText.max(1_500),
    instructions: optionalSafeText,
    options: z.array(choiceOption).min(2).max(8),
    retryLimit: z.number().int().min(0).max(5),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = new Set(value.options.map((option) => option.id));
    if (ids.size !== value.options.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Option IDs must be unique." });
    }
    const correctCount = value.options.filter((option) => option.correct).length;
    if (value.kind === "multiple_choice" ? correctCount < 1 : correctCount !== 1) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Choose valid correct-answer options." });
    }
  });

const structuredResponseConfig = z
  .object({
    kind: z.literal("short_structured_response"),
    prompt: safeText.max(1_500),
    instructions: optionalSafeText,
    guidance: safeText.max(1_500),
    retryLimit: z.number().int().min(0).max(5),
  })
  .strict();

export const richTextBlockSchema = baseBlock.extend({
  type: z.literal("rich_text"),
  config: z.object({ paragraphs: z.array(safeText).min(1).max(32) }).strict(),
}).strict();

export const calloutBlockSchema = baseBlock.extend({
  type: z.literal("callout"),
  config: z.object({
    title: safeText.max(240),
    body: safeText.max(2_000),
    tone: z.enum(["info", "caution", "practice"]),
  }).strict(),
}).strict();

export const imageBlockSchema = baseBlock.extend({
  type: z.literal("image"),
  config: assetReference.extend({ caption: optionalSafeText }).strict(),
}).strict();

export const slidesBlockSchema = baseBlock.extend({
  type: z.literal("slides"),
  config: z.object({
    slides: z.array(assetReference).min(1).max(100),
  }).strict(),
}).strict();

const mediaConfig = z.object({
  assetId,
  captionsAssetId: assetId.optional(),
  transcript: optionalSafeText,
}).strict().superRefine((value, ctx) => {
  if (!value.captionsAssetId && !value.transcript) {
    ctx.addIssue({
      code: "custom",
      path: ["transcript"],
      message: "Video and audio require a transcript or captions asset.",
    });
  }
});

export const videoBlockSchema = baseBlock.extend({
  type: z.literal("video"),
  config: mediaConfig,
}).strict();

export const audioBlockSchema = baseBlock.extend({
  type: z.literal("audio"),
  config: mediaConfig,
}).strict();

export const downloadBlockSchema = baseBlock.extend({
  type: z.literal("download"),
  config: z.object({ assetId, label: safeText.max(240), description: optionalSafeText }).strict(),
}).strict();

export const quizBlockSchema = baseBlock.extend({
  type: z.literal("quiz"),
  config: z.union([choiceInteractionConfig, structuredResponseConfig]),
}).strict();

export const interactiveBlockSchema = baseBlock.extend({
  type: z.literal("interactive"),
  config: z.union([choiceInteractionConfig, structuredResponseConfig]),
}).strict();

export const reflectionBlockSchema = baseBlock.extend({
  type: z.literal("reflection"),
  config: z.object({
    prompt: safeText.max(1_500),
    guidance: optionalSafeText,
    artifactKind: z.enum(["reflection", "ai_opportunity_blueprint"]).default("reflection"),
  }).strict(),
}).strict();

export const contentBlockSchema = z.discriminatedUnion("type", [
  richTextBlockSchema,
  calloutBlockSchema,
  imageBlockSchema,
  slidesBlockSchema,
  videoBlockSchema,
  audioBlockSchema,
  downloadBlockSchema,
  quizBlockSchema,
  interactiveBlockSchema,
  reflectionBlockSchema,
]);

export type ContentBlock = z.infer<typeof contentBlockSchema>;

export const contentBlockSchemas: Record<ContentBlockType, z.ZodType> = {
  rich_text: richTextBlockSchema,
  callout: calloutBlockSchema,
  image: imageBlockSchema,
  slides: slidesBlockSchema,
  video: videoBlockSchema,
  audio: audioBlockSchema,
  download: downloadBlockSchema,
  quiz: quizBlockSchema,
  interactive: interactiveBlockSchema,
  reflection: reflectionBlockSchema,
};

export function parseContentBlock(input: unknown): ContentBlock {
  return contentBlockSchema.parse(input);
}

export function isInteractionKind(value: string): value is (typeof LEARN_INTERACTION_KINDS)[number] {
  return (LEARN_INTERACTION_KINDS as readonly string[]).includes(value);
}

export function isContentBlockType(value: string): value is ContentBlockType {
  return (LEARN_BLOCK_TYPES as readonly string[]).includes(value);
}
