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
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://team.bespoketech.com.ng/team");
  });

  it("leaves ordinary website hosts unchanged", () => {
    const request = new NextRequest("https://www.bespoketech.com.ng/", {
      headers: { host: "www.bespoketech.com.ng" },
    });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps team APIs on the team host so portraits and app calls work", () => {
    const request = new NextRequest(
      "https://team.bespoketech.com.ng/api/team-members/member-id/portrait",
      { headers: { host: "team.bespoketech.com.ng" } },
    );
    const response = proxy(request);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

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
});
