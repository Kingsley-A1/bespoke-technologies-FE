import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameFromHeader, subdomainSitemap } from "@/lib/subdomain-seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const hostname = hostnameFromHeader(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  return subdomainSitemap(hostname);
}
