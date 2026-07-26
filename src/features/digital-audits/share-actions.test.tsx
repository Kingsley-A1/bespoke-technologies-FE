import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DigitalAuditAdminShareLink } from "./share-actions";

describe("DigitalAuditAdminShareLink", () => {
  it("copies the completed report URL from the admin interface", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<DigitalAuditAdminShareLink shareToken="share-token-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy audit report link" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/digital-readiness-audit/report/share-token-123`,
      );
    });
    expect(screen.getByRole("button", { name: "Audit report link copied" })).toHaveTextContent("Copied");
  });
});
