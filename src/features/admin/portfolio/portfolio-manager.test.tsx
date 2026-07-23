import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioForm } from "./portfolio-manager";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("PortfolioForm", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it("uploads and resets a new project form after the asynchronous request", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<PortfolioForm />);
    await user.type(screen.getByLabelText(/Project ID/i), "client-portal");
    await user.type(screen.getByLabelText(/Project name/i), "Client Portal");
    await user.type(screen.getByLabelText(/Category/i), "Business software");
    await user.clear(screen.getByLabelText(/Year/i));
    await user.type(screen.getByLabelText(/Year/i), "2026");
    await user.type(screen.getByLabelText(/Description/i), "A finished client portal with secure account and reporting workflows.");
    await user.type(screen.getByLabelText(/Tags/i), "Next.js, Portal");
    const fileInput = document.querySelector<HTMLInputElement>('input[name="image"]');
    expect(fileInput).not.toBeNull();
    await user.upload(fileInput!, new File(["image"], "project.png", { type: "image/png" }));
    fireEvent.submit(screen.getByRole("button", { name: "Upload finished project" }).closest("form")!);

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByLabelText(/Project name/i)).toHaveValue("");
    expect(screen.getByText("Finished project uploaded.")).toBeInTheDocument();
  });
});
