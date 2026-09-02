import { formatMoney } from "./money";
import type { BillingDocumentType, CurrencyCode, ProgressSummary } from "../types";

export const DEFAULT_PAYMENT_TERMS =
  "Payment is due on or before the stated due date.";

export const ZERO_BALANCE_TERMS =
  "No payment is due on this invoice. It records a zero-balance, complimentary, donated, or fully settled project arrangement.";

export function termsForBalance(terms: string, balance: number) {
  const clean = terms.trim();
  if (balance <= 0 && (!clean || clean === DEFAULT_PAYMENT_TERMS)) {
    return ZERO_BALANCE_TERMS;
  }
  if (balance > 0 && clean === ZERO_BALANCE_TERMS) {
    return DEFAULT_PAYMENT_TERMS;
  }
  return clean;
}

const PROGRESS_HEADINGS: Partial<Record<BillingDocumentType, string>> = {
  deposit: "Deposit against the engagement value",
  milestone: "Progress against the engagement value",
  final: "Final settlement of the engagement value",
  retainer: "Retainer against the engagement value",
};

export function progressHeading(type: BillingDocumentType) {
  return PROGRESS_HEADINGS[type] ?? "Engagement value";
}

function sharePercentage(share: number) {
  const percent = share * 100;
  if (percent > 0 && percent < 1) return "under 1%";
  if (percent > 99 && percent < 100) return "over 99%";
  return `${Math.round(percent)}%`;
}

/**
 * States, in one sentence, what this document covers and what is left. Written
 * for the client reading the invoice, not for the admin issuing it.
 */
export function progressStatement(
  summary: ProgressSummary,
  currency: CurrencyCode,
): string {
  const contract = formatMoney(summary.contractValue, currency);
  if (summary.overBilled) {
    return `This invoice, together with ${formatMoney(summary.previouslyInvoiced, currency)} invoiced earlier, exceeds the stated engagement value of ${contract}. Please contact us before paying.`;
  }
  if (summary.remaining <= 0) {
    return `This invoice settles the remaining balance of the ${contract} engagement value in full.`;
  }
  const covered = `This invoice covers ${sharePercentage(summary.share)} of the ${contract} engagement value.`;
  const earlier =
    summary.previouslyInvoiced > 0
      ? ` A further ${formatMoney(summary.previouslyInvoiced, currency)} was invoiced earlier.`
      : "";
  return `${covered}${earlier} A balance of ${formatMoney(summary.remaining, currency)} remains and is invoiced separately.`;
}

/**
 * The figures a progress-billing document shows, in reading order. Shared so
 * the web document, the PDF, and the editor preview cannot drift apart.
 */
export function progressFigures(summary: ProgressSummary, currency: CurrencyCode) {
  return [
    { label: "Engagement value", value: formatMoney(summary.contractValue, currency), emphasis: false },
    ...(summary.previouslyInvoiced > 0
      ? [{ label: "Invoiced earlier", value: formatMoney(summary.previouslyInvoiced, currency), emphasis: false }]
      : []),
    { label: "This invoice", value: formatMoney(summary.thisInvoice, currency), emphasis: true },
    { label: "Balance remaining", value: formatMoney(summary.remaining, currency), emphasis: false },
  ];
}

export function invoiceDateWarnings(
  issueDate: string,
  dueDate: string,
  today: string,
) {
  const warnings: string[] = [];
  const day = 86_400_000;
  const issue = Date.parse(`${issueDate}T00:00:00Z`);
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (![issue, due, now].every(Number.isFinite)) return warnings;

  if (issue > now + 90 * day) {
    warnings.push("The issue date is more than 90 days in the future. Confirm that this is intentional.");
  }
  if (issue < now - 366 * day) {
    warnings.push("The issue date is more than one year in the past. Confirm that this is a historical invoice.");
  }
  if (due - issue > 366 * day) {
    warnings.push("The payment window is longer than one year. Confirm the due date before saving.");
  }
  return warnings;
}
