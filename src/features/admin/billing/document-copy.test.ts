import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAYMENT_TERMS,
  ZERO_BALANCE_TERMS,
  invoiceDateWarnings,
  termsForBalance,
} from "./document-copy";

describe("invoice document copy", () => {
  it("replaces contradictory payment-due copy on a zero balance", () => {
    expect(termsForBalance(DEFAULT_PAYMENT_TERMS, 0)).toBe(ZERO_BALANCE_TERMS);
  });

  it("preserves intentional project wording", () => {
    expect(termsForBalance("But Jesus Paid It All.", 0)).toBe("But Jesus Paid It All.");
    expect(termsForBalance("To the Glory of Jesus.", 0)).toBe("To the Glory of Jesus.");
  });

  it("warns about abnormal future dates without rejecting them", () => {
    expect(invoiceDateWarnings("2027-02-01", "2028-04-01", "2026-07-28")).toEqual(
      expect.arrayContaining([
        expect.stringContaining("future"),
        expect.stringContaining("longer than one year"),
      ]),
    );
  });
});
