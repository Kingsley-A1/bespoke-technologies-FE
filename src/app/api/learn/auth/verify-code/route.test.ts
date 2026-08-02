import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock("@/features/learn/learner-auth.server", () => ({ verifyLearnerSignInCode: auth.verify }));
vi.mock("@/features/admin/access", () => ({ isSameOrigin: () => true }));

import { POST } from "./route";

describe("POST /api/learn/auth/verify-code", () => {
  it("does not identify a learner account when a code is rejected", async () => {
    auth.verify.mockResolvedValueOnce({ ok: false, reason: "invalid_code" });
    const response = await POST(new Request("https://learn.bespoketech.com.ng/api/learn/auth/verify-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "learner@example.com", code: "000000" }) }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "The code is invalid, expired, or has already been used." });
  });
});
