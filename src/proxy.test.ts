// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

describe("subdomain routing", () => {
  it("rewrites the team subdomain root to the public team experience", () => {
    const request = new NextRequest("https://team.bespoketech.com.ng/", {
      headers: { host: "team.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://team.bespoketech.com.ng/team",
    );
  });

  it("leaves ordinary website hosts unchanged", () => {
    const request = new NextRequest("https://www.bespoketech.com.ng/", {
      headers: { host: "www.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("rewrites clean Learn-host routes to the internal Learn route tree", () => {
    const request = new NextRequest("https://learn.bespoketech.com.ng/courses", {
      headers: { host: "learn.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://learn.bespoketech.com.ng/learn/courses",
    );
  });

  it("returns unrelated company routes to the canonical website from the Learn host", () => {
    const request = new NextRequest("https://learn.bespoketech.com.ng/services", {
      headers: { host: "learn.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://www.bespoketech.com.ng/services");
  });

  it("keeps internal Learn implementation paths off the main website hostname", () => {
    const request = new NextRequest("https://www.bespoketech.com.ng/learn/courses", {
      headers: { host: "www.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://learn.bespoketech.com.ng/courses");
  });

  it("keeps team APIs on the team host so portraits and app calls work", () => {
    const request = new NextRequest(
      "https://team.bespoketech.com.ng/api/team-members/member-id/portrait",
      { headers: { host: "team.bespoketech.com.ng" } },
    );
    const response = proxy(request);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/robots.txt", "/sitemap.xml"])(
    "serves team %s from the team host",
    (pathname) => {
      const request = new NextRequest(
        `https://team.bespoketech.com.ng${pathname}`,
        { headers: { host: "team.bespoketech.com.ng" } },
      );
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("returns ordinary team-host navigation to the canonical website host", () => {
    const request = new NextRequest(
      "https://team.bespoketech.com.ng/services?from=team",
      { headers: { host: "team.bespoketech.com.ng" } },
    );
    const response = proxy(request);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.bespoketech.com.ng/services?from=team",
    );
  });

  it("rewrites the audit subdomain root to the audit experience", () => {
    const request = new NextRequest("https://audit.bespoketech.com.ng/", {
      headers: { host: "audit.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://audit.bespoketech.com.ng/digital-readiness-audit",
    );
  });

  it.each(["/robots.txt", "/sitemap.xml"])(
    "serves audit %s from the audit host",
    (pathname) => {
      const request = new NextRequest(
        `https://audit.bespoketech.com.ng${pathname}`,
        { headers: { host: "audit.bespoketech.com.ng" } },
      );
      const response = proxy(request);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("redirects the audit implementation route to the canonical audit URL", () => {
    const request = new NextRequest(
      "https://audit.bespoketech.com.ng/digital-readiness-audit",
      { headers: { host: "audit.bespoketech.com.ng" } },
    );
    const response = proxy(request);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://audit.bespoketech.com.ng/",
    );
  });

  it("rewrites the verification subdomain root to the lookup experience", () => {
    const request = new NextRequest("https://verify.bespoketech.com.ng/", {
      headers: { host: "verify.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://verify.bespoketech.com.ng/document-verification",
    );
  });

  it("rewrites a public document ID to the verification record", () => {
    const request = new NextRequest(
      "https://verify.bespoketech.com.ng/BT-OWN-2026-0002",
      { headers: { host: "verify.bespoketech.com.ng" } },
    );
    const response = proxy(request);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://verify.bespoketech.com.ng/document-verification/BT-OWN-2026-0002",
    );
  });

  it("rewrites a document ID and cryptographic code to the secure verification record", () => {
    const verificationCode = "0123456789ABCDEF0123456789ABCDEF";
    const request = new NextRequest(
      `https://verify.bespoketech.com.ng/BT-OWN-2026-0002/${verificationCode}`,
      { headers: { host: "verify.bespoketech.com.ng" } },
    );
    const response = proxy(request);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      `https://verify.bespoketech.com.ng/document-verification/BT-OWN-2026-0002/${verificationCode}`,
    );
  });
});
