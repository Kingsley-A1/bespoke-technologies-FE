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
