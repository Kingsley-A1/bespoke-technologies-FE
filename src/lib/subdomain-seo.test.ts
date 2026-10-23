import { describe, expect, it } from "vitest";
import {
  AUDIT_HOSTNAME,
  AUDIT_ORIGIN,
  TEAM_HOSTNAME,
  TEAM_ORIGIN,
  VERIFY_HOSTNAME,
  VERIFY_ORIGIN,
  hostnameFromHeader,
  isWebsiteHostname,
  subdomainRobots,
  subdomainSitemap,
} from "./subdomain-seo";

describe("subdomain SEO", () => {
  it("normalizes a forwarded hostname before selecting an SEO response", () => {
    expect(
      hostnameFromHeader("TEAM.BESPOKETECH.COM.NG:443, proxy.internal"),
    ).toBe(TEAM_HOSTNAME);
  });

  it("publishes a self-contained sitemap for each public subdomain", () => {
    expect(subdomainSitemap(TEAM_HOSTNAME)).toMatchObject([
      { url: TEAM_ORIGIN },
    ]);
    expect(subdomainSitemap(AUDIT_HOSTNAME)).toMatchObject([
      { url: AUDIT_ORIGIN },
    ]);
    expect(subdomainSitemap(VERIFY_HOSTNAME)).toMatchObject([
      { url: VERIFY_ORIGIN },
    ]);
    expect(subdomainSitemap("learn.bespoketech.com.ng")).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://learn.bespoketech.com.ng" }),
      expect.objectContaining({ url: "https://learn.bespoketech.com.ng/courses" }),
    ]));
    expect(subdomainSitemap()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: TEAM_ORIGIN }),
        expect.objectContaining({ url: AUDIT_ORIGIN }),
      ]),
    );
  });

  it("keeps Learn account and protected course paths out of crawler routes", () => {
    expect(subdomainRobots("learn.bespoketech.com.ng")).toMatchObject({
      sitemap: "https://learn.bespoketech.com.ng/sitemap.xml",
      rules: { disallow: expect.arrayContaining(["/dashboard", "/sign-in", "/courses/*/learn"]) },
    });
  });

  it("keeps individual verification records out of search indexes", () => {
    expect(subdomainRobots(VERIFY_HOSTNAME)).toMatchObject({
      sitemap: `${VERIFY_ORIGIN}/sitemap.xml`,
      rules: { disallow: expect.arrayContaining(["/BT-"]) },
    });
  });

  it("keeps private audit reports out of crawler paths", () => {
    expect(subdomainRobots(AUDIT_HOSTNAME)).toMatchObject({
      sitemap: `${AUDIT_ORIGIN}/sitemap.xml`,
      rules: { disallow: expect.arrayContaining(["/report/"]) },
    });
  });

  it("lists the library and lets link-preview crawlers fetch publication covers on the website", () => {
    expect(subdomainSitemap("www.bespoketech.com.ng")).toEqual(
      expect.arrayContaining([expect.objectContaining({ url: "https://www.bespoketech.com.ng/library" })]),
    );
    expect(subdomainRobots("www.bespoketech.com.ng")).toMatchObject({
      rules: { allow: expect.arrayContaining(["/", "/api/publications/"]), disallow: expect.arrayContaining(["/api/"]) },
    });
  });

  it("treats every non-subdomain host as the main website", () => {
    expect(isWebsiteHostname("www.bespoketech.com.ng")).toBe(true);
    expect(isWebsiteHostname("bespoke-preview.vercel.app")).toBe(true);
    expect(isWebsiteHostname(undefined)).toBe(true);
    expect(isWebsiteHostname(TEAM_HOSTNAME)).toBe(false);
    expect(isWebsiteHostname("learn.bespoketech.com.ng")).toBe(false);
  });
});
