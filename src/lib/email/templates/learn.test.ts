import { describe, expect, it } from "vitest";
import { learnerSignInCodeEmail } from "./learn";

describe("learnerSignInCodeEmail", () => {
  it("renders a six-digit passwordless sign-in code without an account-existence claim", () => {
    const email = learnerSignInCodeEmail({ code: "123456", expiresAt: "2026-08-02T10:10:00.000Z" });

    expect(email.subject).toMatch(/Bespoke Learn sign-in code/i);
    expect(email.text).toContain("123456");
    expect(email.html).toContain("123456");
    expect(email.text).toMatch(/10 minutes/i);
  });
});
