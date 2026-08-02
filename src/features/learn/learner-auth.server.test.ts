import { describe, expect, it } from "vitest";
import { learnerRuntimeSecrets } from "./learner-auth.server";

describe("learner runtime secret configuration", () => {
  it("requires separate strong learner secrets in production", () => {
    expect(() => learnerRuntimeSecrets({ NODE_ENV: "production", LEARN_SESSION_SECRET: "", LEARN_CODE_PEPPER: "" })).toThrow(/LEARN_SESSION_SECRET.*LEARN_CODE_PEPPER/i);
  });

  it("does not borrow Admin session or code secrets", () => {
    const secrets = learnerRuntimeSecrets({ NODE_ENV: "test", LEARN_SESSION_SECRET: "s".repeat(40), LEARN_CODE_PEPPER: "p".repeat(40), ADMIN_SESSION_SECRET: "admin-session-secret" });
    expect(secrets).toEqual({ sessionSecret: "s".repeat(40), codePepper: "p".repeat(40) });
  });
});
