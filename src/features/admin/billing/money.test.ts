import { describe, expect, it } from "vitest";
import { calculateDocumentTotals, calculateLine, calculateProgressSummary, toIsoDate } from "./money";
import type { BillingDocument, Payment } from "../types";

describe("billing money", () => {
  it("calculates a discounted taxable line", () => {
    expect(calculateLine({ quantity: 2, rate: 1000, discountRate: 10, taxRate: 7.5 })).toEqual({
      base: 2000,
      discount: 200,
      tax: 135,
      total: 1935,
    });
  });

  it("reconciles recorded payments without counting reversals", () => {
    const document = {
      id: "invoice-1",
      items: [{ id: "line", name: "Build", description: "", quantity: 1, rate: 5000, discountRate: 0, taxRate: 0 }],
    } as BillingDocument;
    const payments = [
      { id: "payment-1", documentId: "invoice-1", amount: 2000, state: "recorded" },
      { id: "payment-2", documentId: "invoice-1", amount: 1000, state: "reversed" },
    ] as Payment[];
    expect(calculateDocumentTotals(document, payments)).toMatchObject({ total: 5000, paid: 2000, balance: 3000 });
  });

  it("places a deposit inside the engagement it bills part of", () => {
    expect(calculateProgressSummary({ contractValue: 500_000 }, { total: 200_000 })).toEqual({
      contractValue: 500_000,
      previouslyInvoiced: 0,
      thisInvoice: 200_000,
      remaining: 300_000,
      share: 0.4,
      overBilled: false,
    });
  });

  it("counts what was invoiced earlier when reporting the remaining balance", () => {
    expect(calculateProgressSummary({ contractValue: 500_000, previouslyInvoiced: 200_000 }, { total: 150_000 })).toMatchObject({
      remaining: 150_000,
      overBilled: false,
    });
  });

  it("never reports a negative balance, and flags the overrun instead", () => {
    expect(calculateProgressSummary({ contractValue: 500_000, previouslyInvoiced: 400_000 }, { total: 250_000 })).toMatchObject({
      remaining: 0,
      overBilled: true,
    });
  });

  it("stays absent for an ordinary invoice with no engagement value", () => {
    expect(calculateProgressSummary({}, { total: 200_000 })).toBeNull();
  });

  it("allocates invoice dates using the company's Lagos calendar day", () => {
    expect(toIsoDate(new Date("2026-07-27T23:30:00.000Z"))).toBe("2026-07-28");
  });
});
