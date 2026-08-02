import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => <img {...props} />,
}));

import { LearnPublicShell } from "./learn-public-shell";

describe("LearnPublicShell", () => {
  it("introduces Bespoke Learn with the compact approved mark and focused navigation", () => {
    render(<LearnPublicShell><h1>Learning home</h1></LearnPublicShell>);

    expect(screen.getByRole("navigation", { name: "Bespoke Learn navigation" })).toBeVisible();
    expect(screen.getByRole("presentation")).toHaveAttribute("src", "/learn/brand/bespoke-learn-mark.png");
    expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "https://bespoketech.com.ng/privacy");
  });
});
