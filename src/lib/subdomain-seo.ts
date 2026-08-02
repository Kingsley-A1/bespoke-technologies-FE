import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_SITEMAP_ROUTES } from "@/lib/seo";

export const WEBSITE_HOSTNAME = "www.bespoketech.com.ng";
export const AUDIT_HOSTNAME = "audit.bespoketech.com.ng";
export const TEAM_HOSTNAME = "team.bespoketech.com.ng";
export const VERIFY_HOSTNAME = "verify.bespoketech.com.ng";
export const LEARN_HOSTNAME = "learn.bespoketech.com.ng";

export const WEBSITE_ORIGIN = `https://${WEBSITE_HOSTNAME}`;
export const AUDIT_ORIGIN = `https://${AUDIT_HOSTNAME}`;
export const TEAM_ORIGIN = `https://${TEAM_HOSTNAME}`;
export const VERIFY_ORIGIN = `https://${VERIFY_HOSTNAME}`;
export const LEARN_ORIGIN = `https://${LEARN_HOSTNAME}`;

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

  if (hostname === VERIFY_HOSTNAME) {
    return [
      {
        url: VERIFY_ORIGIN,
        lastModified: new Date("2026-07-28"),
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ];
  }

  if (hostname === LEARN_HOSTNAME) {
    return [
      {
        url: LEARN_ORIGIN,
        lastModified: new Date("2026-08-02"),
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `${LEARN_ORIGIN}/courses`,
        lastModified: new Date("2026-08-02"),
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: `${LEARN_ORIGIN}/support`,
        lastModified: new Date("2026-08-02"),
        changeFrequency: "monthly",
        priority: 0.5,
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

  if (hostname === VERIFY_HOSTNAME) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/BT-"],
      },
      sitemap: `${VERIFY_ORIGIN}/sitemap.xml`,
    };
  }

  if (hostname === LEARN_HOSTNAME) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/sign-in", "/courses/*/learn", "/courses/*/lessons/"],
      },
      sitemap: `${LEARN_ORIGIN}/sitemap.xml`,
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
