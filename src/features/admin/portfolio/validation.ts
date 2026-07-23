import type { PortfolioProjectInput } from "./repository";
import type { ProjectType } from "@/types/portfolio";

const PROJECT_TYPES = new Set<ProjectType>(["web", "mobile", "ios", "desktop", "web+mobile"]);

export const PORTFOLIO_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const PORTFOLIO_IMAGE_LIMIT = 8 * 1024 * 1024;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function checked(form: FormData, key: string) {
  const value = form.get(key);
  return value === "true" || value === "on" || value === "1";
}

export function imageExtension(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return "webp";
}

export function validatePortfolioImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return { file: undefined };
  if (!PORTFOLIO_IMAGE_TYPES.includes(value.type as (typeof PORTFOLIO_IMAGE_TYPES)[number])) {
    return { error: "The project image must be a PNG, JPEG, or WebP file." };
  }
  if (value.size > PORTFOLIO_IMAGE_LIMIT) return { error: "The project image exceeds the 8 MB limit." };
  return { file: value };
}

export function parsePortfolioForm(
  form: FormData,
  options: { id?: string; imageUrl: string; imageKey?: string; imageMime?: string },
): { input: PortfolioProjectInput } | { error: string } {
  const id = options.id || text(form, "id").toLowerCase();
  const name = text(form, "name");
  const type = text(form, "type") as ProjectType;
  const category = text(form, "category");
  const description = text(form, "description");
  const liveUrl = text(form, "liveUrl");
  const year = text(form, "year");
  const tags = text(form, "tags").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
  const sortOrderRaw = text(form, "sortOrder");
  const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : undefined;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return { error: "Use a lowercase, hyphenated project ID." };
  if (name.length < 2 || name.length > 120) return { error: "Project name must be between 2 and 120 characters." };
  if (!PROJECT_TYPES.has(type)) return { error: "Choose a valid project type." };
  if (category.length < 2 || category.length > 100) return { error: "Category must be between 2 and 100 characters." };
  if (description.length < 20 || description.length > 1200) return { error: "Description must be between 20 and 1,200 characters." };
  if (!/^\d{4}$/.test(year)) return { error: "Enter a four-digit project year." };
  if (tags.length === 0) return { error: "Add at least one tag." };
  if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000)) {
    return { error: "Sort order must be a whole number between 0 and 10,000." };
  }
  if (liveUrl) {
    try {
      const url = new URL(liveUrl);
      if (!(["http:", "https:"] as string[]).includes(url.protocol)) throw new Error();
    } catch {
      return { error: "Live URL must be a valid HTTP or HTTPS address." };
    }
  }

  return {
    input: {
      id,
      name,
      type,
      category,
      description,
      imageUrl: options.imageUrl,
      imageKey: options.imageKey,
      imageMime: options.imageMime,
      liveUrl: liveUrl || undefined,
      tags,
      year,
      comingSoon: checked(form, "comingSoon"),
      featured: checked(form, "featured"),
      published: checked(form, "published"),
      sortOrder,
    },
  };
}
