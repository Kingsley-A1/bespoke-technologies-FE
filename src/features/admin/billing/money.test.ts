import { describe, expect, it } from "vitest";
import { calculateDocumentTotals, calculateLine } from "./money";
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
});
