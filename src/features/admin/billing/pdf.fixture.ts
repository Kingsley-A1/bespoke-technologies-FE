import { COMPANY_SETTINGS } from "../config";
import type { BillingDocument, Payment } from "../types";

/**
 * A representative, self-contained billing document used only by the PDF
 * regression test. This is test scaffolding — it is never imported by the
 * application runtime.
 */
export const SAMPLE_DOCUMENT: BillingDocument = {
  id: "40000000-0000-4000-8000-000000000002",
  documentNumber: "BT-INV-2026-0002",
  type: "standard",
  status: "sent",
  clientId: "10000000-0000-4000-8000-000000000002",
  client: {
    name: "Sample Client Ltd",
    contactName: "Sample Contact",
    email: "billing@example.com",
    phone: "+234 800 000 0000",
    address: "Lagos, Nigeria",
  },
  company: COMPANY_SETTINGS,
  issueDate: "2026-07-09",
  dueDate: "2026-07-23",
  currency: "NGN",
  items: [
    {
      id: "40000000-0000-4000-8000-000000000002-item-1",
      name: "Workflow automation implementation",
      description: "Discovery, process design, implementation, testing, and team onboarding.",
      quantity: 1,
      rate: 350_000,
      discountRate: 0,
      taxRate: 0,
    },
  ],
  notes: "Thank you for trusting Bespoke Technologies.",
  terms: "Payment is due on or before the stated due date.",
  paymentInstructions: "",
  purchaseOrder: "",
  revision: 1,
  issuedAt: "2026-07-09T09:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000002",
  createdAt: "2026-07-09T08:30:00.000Z",
  updatedAt: "2026-07-09T09:00:00.000Z",
};

export const SAMPLE_PAYMENTS: Payment[] = [];
