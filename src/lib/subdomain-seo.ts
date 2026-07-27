import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_SITEMAP_ROUTES } from "@/lib/seo";

export const WEBSITE_HOSTNAME = "www.bespoketech.com.ng";
export const AUDIT_HOSTNAME = "audit.bespoketech.com.ng";
export const TEAM_HOSTNAME = "team.bespoketech.com.ng";

export const WEBSITE_ORIGIN = `https://${WEBSITE_HOSTNAME}`;
export const AUDIT_ORIGIN = `https://${AUDIT_HOSTNAME}`;
export const TEAM_ORIGIN = `https://${TEAM_HOSTNAME}`;

export function hostnameFromHeader(value?: string | null) {
  return value?.split(",")[0]?.trim().split(":")[0]?.toLowerCase();
}

export function subdomainSitemap(hostname?: string): MetadataRoute.Sitemap {
  if (hostname === TEAM_HOSTNAME) {
    return [
      {
        url: TEAM_ORIGIN,
        lastModified: new Date("2026-07-26"),
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ];
  }

  if (hostname === AUDIT_HOSTNAME) {
    return [
      {
        url: AUDIT_ORIGIN,
        lastModified: new Date("2026-07-27"),
        changeFrequency: "monthly",
        priority: 0.9,
      },
    ];
  }

  return PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

export function subdomainRobots(hostname?: string): MetadataRoute.Robots {
  if (hostname === TEAM_HOSTNAME) {
    return {
      rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
      sitemap: `${TEAM_ORIGIN}/sitemap.xml`,
    };
  }

  if (hostname === AUDIT_HOSTNAME) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/report/", "/digital-readiness-audit/report/"],
      },
      sitemap: `${AUDIT_ORIGIN}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/digital-readiness-audit/report/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
