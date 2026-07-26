import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CertificateManager, type ReadyCertificateProject } from "./certificate-manager";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const portfolioProject: ReadyCertificateProject = {
  id: "maxit-autos",
  source: "portfolio",
  name: "Maxit Autos",
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  commercialMode: "undisclosed",
  currency: "NGN",
  portfolioYear: "2026",
};

describe("CertificateManager", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it("prepares a portfolio-backed certificate without creating a delivery project", async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <CertificateManager readyProjects={[portfolioProject]} certificates={[]} canIssue />,
    );
    await user.click(screen.getByRole("button", { name: "Prepare certificate" }));
    await user.type(screen.getByLabelText("Project started"), "2026-01-10");
    await user.type(screen.getByLabelText("Project completed"), "2026-07-20");
    await user.selectOptions(screen.getByLabelText("Commercial basis"), "paid");
    await user.type(screen.getByLabelText("Project value (optional)"), "2500000");
    await user.type(screen.getByLabelText("Legal owner name"), "Maxit Autos Limited");

    fireEvent.submit(screen.getByRole("button", { name: "Create certificate draft" }).closest("form")!);

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const body = JSON.parse(String(request.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      portfolioProjectId: "maxit-autos",
      ownerName: "Maxit Autos Limited",
      portfolioStartDate: "2026-01-10",
      portfolioCompletionDate: "2026-07-20",
      portfolioCommercialMode: "paid",
      portfolioAmount: 2500000,
      portfolioCurrency: "NGN",
    });
    expect(body.projectId).toBeUndefined();
  });
});
