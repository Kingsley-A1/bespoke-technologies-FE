import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSpinner, PageLoader, UploadLoading } from "./admin-loading";

describe("admin loading states", () => {
  it("announces compact loading without exposing the icon", () => {
    render(<LoadingSpinner label="Saving invoice" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saving invoice");
  });

  it("renders a route-level skeleton with a live status", () => {
    render(<PageLoader label="Loading billing" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading billing");
  });

  it("shows known upload progress", () => {
    render(<UploadLoading progress={42} />);
    expect(screen.getByRole("status")).toHaveTextContent("42%");
  });
});
