import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The brand lockup is exercised by the PDF and visual fixtures; these tests
// are about what the document says.
vi.mock("next/image", () => ({ default: () => <span data-testid="company-logo" /> }));

import { InvoiceDocument } from "./invoice-document";
import { SAMPLE_DOCUMENT } from "./pdf.fixture";
import type { BillingDocument } from "../types";

const LONG_DESCRIPTION =
  "Forty percent advance deposit against the agreed engagement value, covering discovery, information architecture, brand-aligned interface design, and the first delivery sprint.";

function depositDocument(overrides: Partial<BillingDocument> = {}): BillingDocument {
  return {
    ...SAMPLE_DOCUMENT,
    documentNumber: "BT-DEP-2026-0001",
    type: "deposit",
    contractValue: 500_000,
    items: [{ ...SAMPLE_DOCUMENT.items[0], description: LONG_DESCRIPTION, rate: 200_000 }],
    ...overrides,
  };
}

describe("InvoiceDocument", () => {
  it("prints the whole item description rather than a shortened one", () => {
    render(<InvoiceDocument document={depositDocument()} payments={[]} />);
    expect(screen.getByText(LONG_DESCRIPTION)).toBeInTheDocument();
  });

  it("uses the short printed title, not the picker label", () => {
    render(<InvoiceDocument document={depositDocument()} payments={[]} />);
    expect(screen.getByText("Deposit Invoice")).toBeInTheDocument();
    expect(screen.queryByText("Deposit / Advance Invoice")).not.toBeInTheDocument();
  });

  it("shows what the deposit covers and what remains", () => {
    render(<InvoiceDocument document={depositDocument()} payments={[]} />);
    expect(screen.getByText("Deposit against the engagement value")).toBeInTheDocument();
    expect(screen.getByText("Deposit on this invoice")).toBeInTheDocument();
    expect(screen.getByText("Remaining to invoice")).toBeInTheDocument();
    expect(screen.getByText(/remaining .*300,000 will be invoiced separately/)).toBeInTheDocument();
    expect(screen.getByText(/covers 40%/)).toBeInTheDocument();
    expect(screen.queryByText("Invoiced earlier")).not.toBeInTheDocument();
  });

  it("reports the earlier total once the engagement has been part-billed", () => {
    render(<InvoiceDocument document={depositDocument({ previouslyInvoiced: 150_000 })} payments={[]} />);
    expect(screen.getByText("Invoiced earlier")).toBeInTheDocument();
    expect(screen.getByText(/was invoiced earlier/)).toBeInTheDocument();
  });

  it("leaves an ordinary invoice with no engagement value unchanged", () => {
    render(<InvoiceDocument document={SAMPLE_DOCUMENT} payments={[]} />);
    expect(screen.queryByText("Remaining to invoice")).not.toBeInTheDocument();
    expect(screen.getByText("Invoice")).toBeInTheDocument();
  });
});
