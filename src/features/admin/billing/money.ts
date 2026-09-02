import type { BillingDocument, BillingItem, CurrencyCode, InvoiceTotals, Payment, ProgressSummary } from "../types";

export function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateLine(item: Pick<BillingItem, "quantity" | "rate" | "discountRate" | "taxRate">) {
  const base = roundMoney(Number(item.quantity || 0) * Number(item.rate || 0));
  const discount = roundMoney(base * (Number(item.discountRate || 0) / 100));
  const taxable = roundMoney(base - discount);
  const tax = roundMoney(taxable * (Number(item.taxRate || 0) / 100));
  return { base, discount, tax, total: roundMoney(taxable + tax) };
}

export function calculateDocumentTotals(
  document: Pick<BillingDocument, "id" | "items">,
  payments: Payment[] = [],
): InvoiceTotals {
  const totals = document.items.reduce(
    (value, item) => {
      const line = calculateLine(item);
      value.subtotal = roundMoney(value.subtotal + line.base);
      value.discount = roundMoney(value.discount + line.discount);
      value.tax = roundMoney(value.tax + line.tax);
      value.total = roundMoney(value.total + line.total);
      return value;
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );
  const paid = roundMoney(
    payments
      .filter((payment) => payment.documentId === document.id && payment.state === "recorded")
      .reduce((sum, payment) => sum + payment.amount, 0),
  );
  return { ...totals, paid, balance: roundMoney(Math.max(0, totals.total - paid)) };
}

/**
 * Places this document inside the engagement it bills a part of. Returns null
 * when no engagement value was stated, which is the case for every ordinary
 * one-off invoice.
 */
export function calculateProgressSummary(
  document: Pick<BillingDocument, "contractValue" | "previouslyInvoiced">,
  totals: Pick<InvoiceTotals, "total">,
): ProgressSummary | null {
  const contractValue = roundMoney(Math.max(0, Number(document.contractValue || 0)));
  if (contractValue <= 0) return null;
  const previouslyInvoiced = roundMoney(Math.max(0, Number(document.previouslyInvoiced || 0)));
  const thisInvoice = roundMoney(Number(totals.total || 0));
  const billed = roundMoney(previouslyInvoiced + thisInvoice);
  return {
    contractValue,
    previouslyInvoiced,
    thisInvoice,
    remaining: roundMoney(Math.max(0, contractValue - billed)),
    share: contractValue > 0 ? thisInvoice / contractValue : 0,
    overBilled: billed > contractValue,
  };
}

export function formatMoney(value: number, currency: CurrencyCode = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
    maximumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(Number(value || 0));
}

export function formatAdminDate(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function toIsoDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
