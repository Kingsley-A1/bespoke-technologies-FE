import { z } from "zod";

export const PUBLICATION_KINDS = ["handover", "book", "research"] as const;
export const PUBLICATION_CARD_VARIANTS = ["standard", "field-guide", "playbook", "deep-dive"] as const;
export const PUBLICATION_CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;

/** Text fields of the publication upload form (files are validated separately). */
export const publicationFormSchema = z.object({
  kind: z.enum(PUBLICATION_KINDS),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().max(600).optional().default(""),
  pageCount: z.coerce.number().int().min(0).max(100_000).optional(),
  clientLabel: z.string().trim().max(160).optional().default(""),
  projectLabel: z.string().trim().max(160).optional().default(""),
  authorLabel: z.string().trim().max(160).optional().default(""),
  cardVariant: z.enum(PUBLICATION_CARD_VARIANTS).optional().default("standard"),
  isFree: z.coerce.boolean().optional().default(true),
  priceAmount: z.coerce.number().min(0).max(100_000_000).optional(),
  priceCurrency: z.enum(PUBLICATION_CURRENCIES).optional().default("NGN"),
  publish: z.coerce.boolean().optional().default(false),
});

export type PublicationFormValues = z.infer<typeof publicationFormSchema>;

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_COVER_MIME = ["image/png", "image/jpeg", "image/webp"];
export const ALLOWED_DOCUMENT_MIME = ["application/pdf"];
