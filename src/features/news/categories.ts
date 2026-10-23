export const NEWS_CATEGORIES = [
  {
    slug: "announcements",
    label: "Announcements",
    description: "Official company announcements from Bespoke Technologies.",
  },
  {
    slug: "product-updates",
    label: "Product Updates",
    description: "Releases, improvements and changes across Bespoke products.",
  },
  {
    slug: "project-documentation",
    label: "Project Documentation",
    description: "Public documentation for projects we have built and shipped.",
  },
  {
    slug: "engineering-notes",
    label: "Engineering Notes",
    description: "How we design, build, secure and operate production software.",
  },
  {
    slug: "events",
    label: "Events",
    description: "Dated events, sessions and appearances from the Bespoke team.",
  },
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]["slug"];

export const NEWS_CATEGORY_SLUGS = NEWS_CATEGORIES.map((category) => category.slug) as [NewsCategory, ...NewsCategory[]];

export function isNewsCategory(value: unknown): value is NewsCategory {
  return typeof value === "string" && NEWS_CATEGORY_SLUGS.includes(value as NewsCategory);
}

export function newsCategoryLabel(category: NewsCategory) {
  return NEWS_CATEGORIES.find((item) => item.slug === category)?.label ?? category;
}

export function getNewsCategory(slug: string) {
  return NEWS_CATEGORIES.find((item) => item.slug === slug);
}
