import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameFromHeader, LEARN_HOSTNAME, LEARN_ORIGIN, subdomainSitemap } from "@/lib/subdomain-seo";
import { listReviewedCourseCatalogue } from "@/features/learn/public-courses.server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const hostname = hostnameFromHeader(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  const base = subdomainSitemap(hostname);
  if (hostname !== LEARN_HOSTNAME) return base;
  const courses = await listReviewedCourseCatalogue();
  return [
    ...base,
    ...courses.map((course) => ({
      url: `${LEARN_ORIGIN}/courses/${course.slug}`,
      lastModified: course.publishedAt ? new Date(course.publishedAt) : new Date("2026-08-02"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
