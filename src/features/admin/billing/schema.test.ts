import { describe, expect, it } from "vitest";
import { billingInputSchema } from "./schema";

const validInput = {
  type: "standard",
  clientId: "10000000-0000-4000-8000-000000000001",
  issueDate: "2026-07-28",
  dueDate: "2026-08-11",
  currency: "NGN",
  items: [{
    id: "line-1",
    name: "Project delivery",
    description: "",
    quantity: 1,
    rate: 0,
    discountRate: 0,
    taxRate: 0,
  }],
  notes: "",
  terms: "",
  paymentInstructions: "",
  purchaseOrder: "",
} as const;

describe("billing input schema", () => {
  it("requires the manual type when Other is selected", () => {
    expect(billingInputSchema.safeParse({ ...validInput, type: "other" }).success).toBe(false);
    expect(billingInputSchema.safeParse({
      ...validInput,
      type: "other",
      customTypeLabel: "Grant Support Invoice",
    }).success).toBe(true);
  });

  it("accepts a legitimate future invoice while rejecting an inverted date range", () => {
    expect(billingInputSchema.safeParse({
      ...validInput,
      issueDate: "2028-01-10",
      dueDate: "2028-02-10",
    }).success).toBe(true);
    expect(billingInputSchema.safeParse({
      ...validInput,
      issueDate: "2028-02-10",
      dueDate: "2028-01-10",
    }).success).toBe(false);
  });
});

describe("progress billing input", () => {
  const deposit = { ...validInput, type: "deposit" } as const;

  it("accepts an engagement value on a deposit invoice", () => {
    expect(billingInputSchema.safeParse({ ...deposit, contractValue: 500_000, previouslyInvoiced: 0 }).success).toBe(true);
  });

  it("rejects an engagement value on an invoice type that never prints it", () => {
    const result = billingInputSchema.safeParse({ ...validInput, contractValue: 500_000 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("deposit, milestone, final, or retainer");
  });

  it("rejects an earlier-invoiced figure with no engagement value to measure it against", () => {
    const result = billingInputSchema.safeParse({ ...deposit, previouslyInvoiced: 200_000 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("total engagement value");
  });
});

describe("payment already received", () => {
  const received = { amount: 150_000, paidAt: "2026-09-01T10:00", method: "Bank transfer", reference: "TRF-001", note: "" };

  it("accepts money already paid on a payable invoice", () => {
    expect(billingInputSchema.safeParse({ ...validInput, type: "deposit", depositReceived: received }).success).toBe(true);
  });

  it("rejects money already paid on a proforma, which never takes payment", () => {
    const result = billingInputSchema.safeParse({ ...validInput, type: "proforma", depositReceived: received });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("payable invoice");
  });

  it("rejects a payment with no reference to trace it by", () => {
    expect(billingInputSchema.safeParse({ ...validInput, depositReceived: { ...received, reference: "" } }).success).toBe(false);
  });

  it("rejects a zero or negative payment rather than storing a meaningless one", () => {
    expect(billingInputSchema.safeParse({ ...validInput, depositReceived: { ...received, amount: 0 } }).success).toBe(false);
    expect(billingInputSchema.safeParse({ ...validInput, depositReceived: { ...received, amount: -1 } }).success).toBe(false);
  });
});
