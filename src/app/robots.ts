import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { hostnameFromHeader, subdomainRobots } from "@/lib/subdomain-seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const hostname = hostnameFromHeader(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  return subdomainRobots(hostname);
}
