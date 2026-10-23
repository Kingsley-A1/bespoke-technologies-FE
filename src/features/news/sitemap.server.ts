import "server-only";

import type { MetadataRoute } from "next";
import { listPublishedPublications } from "@/features/admin/publications/repository";
import { absoluteUrl } from "@/lib/seo";
import { NEWS_CATEGORIES } from "./categories";
import { listPublicNewsForSitemap } from "./repository";
import { newsCategoryPath, newsPostPath } from "./seo";

/**
 * Dynamic website sitemap entries: What's New and the public library. A
 * database failure omits these entries (and is logged) instead of failing the
 * whole sitemap.
 */
export async function dynamicWebsiteSitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, publications] = await Promise.all([
    listPublicNewsForSitemap().catch((error) => {
      console.error("[sitemap] news entries unavailable", error);
      return [];
    }),
    listPublishedPublications().catch((error) => {
      console.error("[sitemap] library entries unavailable", error);
      return [];
    }),
  ]);

  const latestByCategory = new Map<string, string>();
  for (const post of news) {
    const current = latestByCategory.get(post.category);
    if (!current || post.updatedAt > current) latestByCategory.set(post.category, post.updatedAt);
  }
  const latest = news
    .map((post) => post.updatedAt)
    .sort()
    .at(-1);

  return [
    {
      url: absoluteUrl("/news"),
      lastModified: latest ? new Date(latest) : new Date("2026-10-23"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...NEWS_CATEGORIES.filter((category) => latestByCategory.has(category.slug)).map((category) => ({
      url: absoluteUrl(newsCategoryPath(category.slug)),
      lastModified: new Date(latestByCategory.get(category.slug)!),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...news.map((post) => ({
      url: absoluteUrl(newsPostPath(post.slug)),
      lastModified: new Date(post.updatedAt > post.publishedAt ? post.updatedAt : post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Handover pages are client-private notices with no readable content; only books and research are listed.
    ...publications
      .filter((publication) => publication.kind !== "handover")
      .map((publication) => ({
        url: absoluteUrl(`/library/${publication.slug}`),
        lastModified: new Date(publication.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}
