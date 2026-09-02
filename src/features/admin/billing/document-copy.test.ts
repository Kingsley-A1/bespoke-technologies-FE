import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAYMENT_TERMS,
  ZERO_BALANCE_TERMS,
  invoiceDateWarnings,
  progressFigures,
  progressStatement,
  termsForBalance,
} from "./document-copy";
import { calculateProgressSummary } from "./money";

describe("invoice document copy", () => {
  it("replaces contradictory payment-due copy on a zero balance", () => {
    expect(termsForBalance(DEFAULT_PAYMENT_TERMS, 0)).toBe(ZERO_BALANCE_TERMS);
  });

  it("preserves intentional project wording", () => {
    expect(termsForBalance("But Jesus Paid It All.", 0)).toBe("But Jesus Paid It All.");
    expect(termsForBalance("To the Glory of Jesus.", 0)).toBe("To the Glory of Jesus.");
  });

  it("tells the client what a deposit covers and what is left", () => {
    const summary = calculateProgressSummary({ contractValue: 500_000 }, { total: 200_000 })!;
    const statement = progressStatement(summary, "NGN");
    expect(statement).toContain("40%");
    expect(statement).toContain("₦300,000");
    expect(statement).toContain("invoiced separately");
  });

  it("says plainly when a final invoice closes the engagement", () => {
    const summary = calculateProgressSummary({ contractValue: 500_000, previouslyInvoiced: 300_000 }, { total: 200_000 })!;
    expect(progressStatement(summary, "NGN")).toContain("in full");
  });

  it("warns rather than under-reports when the parts exceed the whole", () => {
    const summary = calculateProgressSummary({ contractValue: 500_000, previouslyInvoiced: 400_000 }, { total: 250_000 })!;
    expect(progressStatement(summary, "NGN")).toContain("exceeds the stated engagement value");
  });

  it("omits the earlier-invoiced figure when there is nothing earlier", () => {
    const first = calculateProgressSummary({ contractValue: 500_000 }, { total: 200_000 })!;
    expect(progressFigures(first, "NGN").map((figure) => figure.label)).toEqual([
      "Engagement value",
      "This invoice",
      "Balance remaining",
    ]);
    const later = calculateProgressSummary({ contractValue: 500_000, previouslyInvoiced: 200_000 }, { total: 150_000 })!;
    expect(progressFigures(later, "NGN").map((figure) => figure.label)).toContain("Invoiced earlier");
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
