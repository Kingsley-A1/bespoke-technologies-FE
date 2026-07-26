import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_SITEMAP_ROUTES } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    })),
    {
      url: "https://team.bespoketech.com.ng/",
      lastModified: new Date("2026-07-26"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
