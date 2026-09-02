import { describe, expect, it } from "vitest";
import {
  BILLING_DOCUMENT_TYPE_OPTIONS,
  billingDocumentPrefix,
  billingDocumentTitle,
  billingDocumentTypeLabel,
  isPayableBillingType,
  isProgressBillingType,
} from "./document-types";

describe("billing document types", () => {
  it("exposes every supported professional invoice type", () => {
    expect(BILLING_DOCUMENT_TYPE_OPTIONS.map((option) => option.label)).toEqual([
      "Standard Invoice",
      "Proforma Invoice",
      "Recurring Billing Invoice",
      "Deposit / Advance Invoice",
      "Milestone / Progress Invoice",
      "Final Invoice",
      "Retainer Invoice",
      "Subscription Invoice",
      "Other",
    ]);
  });

  it("uses a persisted custom label and stable number prefix for Other", () => {
    expect(billingDocumentTypeLabel("other", "Grant Support Invoice")).toBe("Grant Support Invoice");
    expect(billingDocumentPrefix("other")).toBe("BT-OTH");
  });

  it("prints a short headline while the picker keeps the descriptive label", () => {
    expect(billingDocumentTypeLabel("deposit")).toBe("Deposit / Advance Invoice");
    expect(billingDocumentTitle("deposit")).toBe("Deposit Invoice");
    expect(billingDocumentTitle("standard")).toBe("Invoice");
    expect(billingDocumentTitle("other", "Grant Support Invoice")).toBe("Grant Support Invoice");
  });

  it("treats part-payment invoices as progress billing", () => {
    expect(isProgressBillingType("deposit")).toBe(true);
    expect(isProgressBillingType("milestone")).toBe(true);
    expect(isProgressBillingType("final")).toBe(true);
    expect(isProgressBillingType("standard")).toBe(false);
    expect(isProgressBillingType("proforma")).toBe(false);
  });

  it("allows payments only on actual invoice types", () => {
    expect(isPayableBillingType("final")).toBe(true);
    expect(isPayableBillingType("proforma")).toBe(false);
    expect(isPayableBillingType("recurring")).toBe(false);
  });
});
