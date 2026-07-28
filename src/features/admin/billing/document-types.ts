import type { BillingDocumentType } from "../types";

export const BILLING_DOCUMENT_TYPES = [
  "standard",
  "proforma",
  "recurring",
  "deposit",
  "milestone",
  "final",
  "retainer",
  "subscription",
  "other",
] as const satisfies readonly BillingDocumentType[];

export const BILLING_DOCUMENT_TYPE_OPTIONS: ReadonlyArray<{
  value: BillingDocumentType;
  label: string;
}> = [
  { value: "standard", label: "Standard Invoice" },
  { value: "proforma", label: "Proforma Invoice" },
  { value: "recurring", label: "Recurring Billing Invoice" },
  { value: "deposit", label: "Deposit / Advance Invoice" },
  { value: "milestone", label: "Milestone / Progress Invoice" },
  { value: "final", label: "Final Invoice" },
  { value: "retainer", label: "Retainer Invoice" },
  { value: "subscription", label: "Subscription Invoice" },
  { value: "other", label: "Other" },
];

const LABELS = Object.fromEntries(
  BILLING_DOCUMENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BillingDocumentType, string>;

const PREFIXES: Record<BillingDocumentType, string> = {
  standard: "BT-INV",
  proforma: "BT-PRO",
  recurring: "BT-REC",
  deposit: "BT-DEP",
  milestone: "BT-MIL",
  final: "BT-FIN",
  retainer: "BT-RET",
  subscription: "BT-SUB",
  other: "BT-OTH",
};

export function billingDocumentTypeLabel(
  type: BillingDocumentType,
  customTypeLabel?: string,
) {
  if (type === "other" && customTypeLabel?.trim()) return customTypeLabel.trim();
  return LABELS[type];
}

export function billingDocumentPrefix(type: BillingDocumentType) {
  return PREFIXES[type];
}

export function isRecurringBillingType(type: BillingDocumentType) {
  return type === "recurring";
}

export function isPayableBillingType(type: BillingDocumentType) {
  return type !== "proforma" && type !== "recurring";
}
