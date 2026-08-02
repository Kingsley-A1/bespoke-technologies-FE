import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearnerDashboard } from "./learner-dashboard";

describe("LearnerDashboard", () => {
  it("shows a focused and truthful empty state when the reviewed catalogue is empty", () => {
    render(<LearnerDashboard learnerEmail="learner@example.com" courses={[]} />);

    expect(screen.getByRole("heading", { name: "Your learning" })).toBeVisible();
    expect(screen.getByText(/No courses are available to you yet/i)).toBeVisible();
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute("href", "/courses");
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
  });
});
