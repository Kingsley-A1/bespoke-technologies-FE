import type { z } from "zod";
import type { ContentBlockType } from "../types";
import {
  audioBlockSchema,
  calloutBlockSchema,
  contentBlockSchemas,
  downloadBlockSchema,
  imageBlockSchema,
  interactiveBlockSchema,
  quizBlockSchema,
  reflectionBlockSchema,
  richTextBlockSchema,
  slidesBlockSchema,
  videoBlockSchema,
} from "./schemas";

export type LearnBlockRegistryEntry = {
  schema: z.ZodType;
  editorKey: `learn-${string}`;
  rendererKey: `learn-${string}`;
};

export const LEARN_BLOCK_REGISTRY: Record<ContentBlockType, LearnBlockRegistryEntry> = {
  rich_text: { schema: richTextBlockSchema, editorKey: "learn-rich-text-editor", rendererKey: "learn-rich-text-renderer" },
  callout: { schema: calloutBlockSchema, editorKey: "learn-callout-editor", rendererKey: "learn-callout-renderer" },
  image: { schema: imageBlockSchema, editorKey: "learn-image-editor", rendererKey: "learn-image-renderer" },
  slides: { schema: slidesBlockSchema, editorKey: "learn-slides-editor", rendererKey: "learn-slides-renderer" },
  video: { schema: videoBlockSchema, editorKey: "learn-video-editor", rendererKey: "learn-video-renderer" },
  audio: { schema: audioBlockSchema, editorKey: "learn-audio-editor", rendererKey: "learn-audio-renderer" },
  download: { schema: downloadBlockSchema, editorKey: "learn-download-editor", rendererKey: "learn-download-renderer" },
  quiz: { schema: quizBlockSchema, editorKey: "learn-quiz-editor", rendererKey: "learn-quiz-renderer" },
  interactive: { schema: interactiveBlockSchema, editorKey: "learn-interactive-editor", rendererKey: "learn-interactive-renderer" },
  reflection: { schema: reflectionBlockSchema, editorKey: "learn-reflection-editor", rendererKey: "learn-reflection-renderer" },
};

export function getRegisteredBlock(type: string): LearnBlockRegistryEntry {
  const entry = LEARN_BLOCK_REGISTRY[type as ContentBlockType];
  if (!entry) throw new Error(`Unsupported Learn content block: ${type}`);
  return entry;
}

export function getContentSchema(type: ContentBlockType) {
  return contentBlockSchemas[type];
}
