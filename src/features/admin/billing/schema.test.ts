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
