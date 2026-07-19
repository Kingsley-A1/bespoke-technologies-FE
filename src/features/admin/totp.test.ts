import { describe, expect, it } from "vitest";
import { generateTotp } from "./totp";

describe("TOTP generation", () => {
  it("matches the RFC 6238 SHA-1 test vector", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(generateTotp(secret, Math.floor(59 / 30), 8)).toBe("94287082");
  });

  it("always produces a six-digit admin code by default", () => {
    expect(generateTotp("JBSWY3DPEHPK3PXP", 123456)).toMatch(/^\d{6}$/);
  });
});
