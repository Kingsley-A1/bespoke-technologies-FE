import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminLearnWorkspace } from "./admin-learn-workspace";

describe("AdminLearnWorkspace", () => {
  it("makes the deliberate lack of reviewed courses clear while offering a draft-only creation action", () => {
    render(<AdminLearnWorkspace courses={[]} />);

    expect(screen.getByRole("heading", { name: "Course publishing" })).toBeVisible();
    expect(screen.getByText(/No course drafts exist yet/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Create draft course" })).toBeVisible();
    expect(screen.queryByText("Bespoke AI Foundations")).not.toBeInTheDocument();
  });
});
