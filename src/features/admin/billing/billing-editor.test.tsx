import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

// The brand lockup is exercised elsewhere; these tests are about the
// engagement panel and what the preview says.
vi.mock("next/image", () => ({ default: () => <span data-testid="company-logo" /> }));

import { BillingEditor } from "./billing-editor";
import { COMPANY_SETTINGS } from "../config";
import type { Client, CompanySettings } from "../types";

const SETTINGS: CompanySettings = {
  ...COMPANY_SETTINGS,
  defaultCurrency: "NGN",
  defaultPaymentTermsDays: 14,
  paymentInstructions: "Bank transfer to the account on file.",
  invoiceApprovalThreshold: 1_000_000,
  ceoName: "Sample CEO",
  ceoTitle: "Chief Executive Officer",
  updatedAt: "2026-07-09T09:00:00.000Z",
};

const CLIENT: Client = {
  id: "10000000-0000-4000-8000-000000000002",
  name: "Sample Client Ltd",
  email: "billing@example.com",
  phone: "+234 800 000 0000",
  address: "Lagos, Nigeria",
  currency: "NGN",
  paymentTermsDays: 14,
  state: "active",
  contacts: [],
  createdAt: "2026-07-09T08:30:00.000Z",
  updatedAt: "2026-07-09T08:30:00.000Z",
};

function renderEditor() {
  return render(<BillingEditor clients={[CLIENT]} projects={[]} settings={SETTINGS} />);
}

async function openDepositEngagement(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText(/Invoice type/i), "deposit");
  await user.type(screen.getByLabelText(/Total engagement value/i), "300000");
  await user.type(screen.getByLabelText(/^Rate$/i), "150000");
}

describe("BillingEditor engagement panel", () => {
  it("treats a deposit as the first invoice and never asks what came earlier", async () => {
    const user = userEvent.setup();
    renderEditor();
    await openDepositEngagement(user);

    expect(screen.getByLabelText(/First invoice on this engagement/i)).toBeChecked();
    expect(screen.queryByLabelText(/Invoiced earlier/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/This is the first invoice on the/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("Invoiced earlier")).not.toBeInTheDocument();
  });

  it("reads back the total, the deposit, and what is left before the invoice is saved", async () => {
    const user = userEvent.setup();
    renderEditor();
    await openDepositEngagement(user);

    // The three figures the admin is reconciling, on the panel they type into.
    expect(screen.getAllByText("Engagement value").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deposit on this invoice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Remaining to invoice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₦150,000").length).toBeGreaterThan(1);
    expect(screen.getAllByText("₦300,000").length).toBeGreaterThan(0);
  });

  it("asks for the earlier total only once the engagement is marked part-billed", async () => {
    const user = userEvent.setup();
    renderEditor();
    await openDepositEngagement(user);

    await user.click(screen.getByLabelText(/Earlier invoices already issued/i));
    const earlier = screen.getByLabelText(/Invoiced earlier/i);
    expect(earlier).toBeInTheDocument();
    expect(screen.getByText(/Enter what was invoiced earlier/i)).toBeInTheDocument();
    // Nothing is claimed about the engagement until the earlier total is known.
    expect(screen.queryByText(/This is the first invoice on the/i)).not.toBeInTheDocument();

    await user.type(earlier, "100000");
    expect(screen.queryByText(/Enter what was invoiced earlier/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/was invoiced earlier/i).length).toBeGreaterThan(0);
  });

  it("clears a stale earlier total when the stage is set back to first invoice", async () => {
    const user = userEvent.setup();
    renderEditor();
    await openDepositEngagement(user);

    await user.click(screen.getByLabelText(/Earlier invoices already issued/i));
    await user.type(screen.getByLabelText(/Invoiced earlier/i), "100000");
    await user.click(screen.getByLabelText(/First invoice on this engagement/i));

    expect(screen.queryByLabelText(/Invoiced earlier/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/This is the first invoice on the/i).length).toBeGreaterThan(0);

    await user.click(screen.getByLabelText(/Earlier invoices already issued/i));
    expect(screen.getByLabelText(/Invoiced earlier/i)).toHaveValue(null);
  });
});
