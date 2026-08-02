import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseCatalogue } from "./course-catalogue";

describe("CourseCatalogue", () => {
  it("renders an honest empty state before reviewed courses are published", () => {
    render(<CourseCatalogue courses={[]} />);

    expect(screen.getByRole("heading", { name: "Courses" })).toBeVisible();
    expect(screen.getByText(/Reviewed courses will appear here/i)).toBeVisible();
    expect(screen.queryByRole("link", { name: /start|enrol|continue/i })).not.toBeInTheDocument();
  });
});
