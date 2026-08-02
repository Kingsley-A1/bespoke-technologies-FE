import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/features/learn/learner-auth.server", () => ({ requestLearnerSignInCode: auth.request }));
vi.mock("@/features/admin/access", () => ({ isSameOrigin: () => true }));

import { POST } from "./route";

describe("POST /api/learn/auth/request-code", () => {
  it("returns the same accepted response when delivery fails, avoiding account enumeration", async () => {
    auth.request.mockRejectedValueOnce(new Error("delivery unavailable"));
    const response = await POST(new Request("https://learn.bespoketech.com.ng/api/learn/auth/request-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "learner@example.com" }) }));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ ok: true, message: "If that address can receive a sign-in code, it has been sent." });
  });
});
