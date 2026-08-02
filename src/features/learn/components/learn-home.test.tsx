import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => <img {...props} />,
}));

import { LearnHome } from "./learn-home";

describe("LearnHome", () => {
  it("uses the approved lockup and an honest public-ready empty-catalogue message", () => {
    render(<LearnHome publishedCourseCount={0} />);

    expect(screen.getByRole("img", { name: "Bespoke Learn" })).toHaveAttribute("src", "/learn/brand/bespoke-learn-lockup.png");
    expect(screen.getByRole("heading", { name: /Practical technology learning/i })).toBeVisible();
    expect(screen.getByText(/There are no reviewed courses available yet/i)).toBeVisible();
    expect(screen.getByRole("link", { name: "View course catalogue" })).toHaveAttribute("href", "/courses");
  });
});
