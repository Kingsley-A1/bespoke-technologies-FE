import { z } from "zod";
import { NEWS_CATEGORY_SLUGS } from "./categories";

export const NEWS_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Path segments under /news that belong to routes, not posts. */
export const RESERVED_NEWS_SLUGS = new Set(["media", "category", "feed", "feed-xml", "page", "new", "preview"]);

export function slugifyNewsTitle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

/** Fields saved from the editor. The body is validated separately by `normalizeNewsDocument`. */
export const newsPostInputSchema = z.object({
  title: z.string().trim().min(1, "Add a headline.").max(140, "Keep the headline under 140 characters."),
  dek: optionalText(320),
  category: z.enum(NEWS_CATEGORY_SLUGS),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80, "Keep the URL under 80 characters.")
    .optional()
    .transform((value) => value || undefined)
    .refine(
      (value) => value === undefined || NEWS_SLUG_PATTERN.test(value),
      "Use lowercase letters, numbers and single hyphens in the URL.",
    )
    .refine((value) => value === undefined || !RESERVED_NEWS_SLUGS.has(value), "That URL is reserved. Choose another."),
  seoTitle: optionalText(70),
  seoDescription: optionalText(200),
  authorName: z.string().trim().min(2, "Add an author name.").max(120),
  isFeatured: z.boolean().default(false),
  coverAlt: optionalText(300),
  /** Keep the URL in step with the headline until the post has been public. Ignored when `slug` is set. */
  autoSlug: z.boolean().optional().default(false),
  body: z.unknown(),
});

export type NewsPostInput = z.infer<typeof newsPostInputSchema>;

export const newsSaveRequestSchema = newsPostInputSchema.extend({
  version: z.number().int().min(1),
});

export const newsStatusRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish"), version: z.number().int().min(1) }),
  z.object({ action: z.literal("schedule"), version: z.number().int().min(1), publishAt: z.string().min(1) }),
  z.object({ action: z.literal("unpublish"), version: z.number().int().min(1) }),
  z.object({ action: z.literal("archive"), version: z.number().int().min(1) }),
  z.object({ action: z.literal("restore"), version: z.number().int().min(1) }),
]);

export const NEWS_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
/** Vercel functions accept request bodies up to 4.5 MB; the editor downsizes larger photos first. */
export const MAX_NEWS_IMAGE_BYTES = 4 * 1024 * 1024;
