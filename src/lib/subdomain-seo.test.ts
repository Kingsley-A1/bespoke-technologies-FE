import { describe, expect, it } from "vitest";
import {
  AUDIT_HOSTNAME,
  AUDIT_ORIGIN,
  TEAM_HOSTNAME,
  TEAM_ORIGIN,
  hostnameFromHeader,
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
    expect(subdomainSitemap()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: TEAM_ORIGIN }),
        expect.objectContaining({ url: AUDIT_ORIGIN }),
      ]),
    );
  });

  it("keeps private audit reports out of crawler paths", () => {
    expect(subdomainRobots(AUDIT_HOSTNAME)).toMatchObject({
      sitemap: `${AUDIT_ORIGIN}/sitemap.xml`,
      rules: { disallow: expect.arrayContaining(["/report/"]) },
    });
  });
});
