import { describe, expect, it } from "vitest";
import {
  formatRecoveryCode,
  generateRecoveryCodes,
  isValidRecoveryCode,
  normalizeRecoveryCode,
} from "./recovery-codes";

describe("admin recovery codes", () => {
  it("generates distinct, readable, valid codes", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^BT-(?:[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-){3}[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
      expect(isValidRecoveryCode(code)).toBe(true);
    }
  });

  it("normalizes case, spacing, and separators consistently", () => {
    expect(normalizeRecoveryCode(" bt-abcd-2345-efgh-6789 ")).toBe("ABCD2345EFGH6789");
    expect(formatRecoveryCode("ABCD2345EFGH6789")).toBe("BT-ABCD-2345-EFGH-6789");
  });

  it("keeps legacy six-digit codes valid only for migration compatibility", () => {
    expect(isValidRecoveryCode("123456")).toBe(true);
    expect(isValidRecoveryCode("12345")).toBe(false);
    expect(isValidRecoveryCode("BT-OOOO-OOOO-OOOO-OOOO")).toBe(false);
  });
});
