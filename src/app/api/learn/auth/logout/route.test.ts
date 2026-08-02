import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ clear: vi.fn() }));
vi.mock("@/features/learn/learner-auth.server", () => ({ clearLearnerSession: auth.clear }));
vi.mock("@/features/admin/access", () => ({ isSameOrigin: () => true }));

import { POST } from "./route";

describe("POST /api/learn/auth/logout", () => {
  it("revokes the learner session and returns to the Learn sign-in route", async () => {
    const response = await POST(new Request("https://learn.bespoketech.com.ng/api/learn/auth/logout", { method: "POST" }));

    expect(auth.clear).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://learn.bespoketech.com.ng/sign-in");
  });
});
