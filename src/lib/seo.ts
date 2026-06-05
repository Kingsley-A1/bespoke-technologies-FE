import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export const SITE_ORIGIN = SITE_URL.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/") {
    return `${SITE_ORIGIN}/`;
  }

  return `${SITE_ORIGIN}${normalizedPath}`;
}

type SitemapRoute = {
  path: string;
  lastModified: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

export const PUBLIC_SITEMAP_ROUTES = [
  {
    path: "/",
    lastModified: "2026-06-05",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/services",
    lastModified: "2026-06-05",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/projects",
    lastModified: "2026-06-05",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/contact",
    lastModified: "2026-06-05",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/about",
    lastModified: "2026-06-05",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/partnerships",
    lastModified: "2026-06-05",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/partnerships/tiers",
    lastModified: "2026-06-05",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/reviews",
    lastModified: "2026-06-05",
    changeFrequency: "monthly",
    priority: 0.7,
  },
] satisfies SitemapRoute[];
