import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroHeadline } from "./hero-headline";

describe("HeroHeadline", () => {
  it("exposes the complete product promise as one accessible heading", () => {
    render(<HeroHeadline />);

    expect(
      screen.getByRole("heading", {
        name: /launch secure, production-ready software your business can own/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the visual product promise without motion-dependent text", () => {
    render(<HeroHeadline />);

    expect(screen.getByText("Launch secure,")).toBeInTheDocument();
    expect(screen.getByText("production-ready software")).toBeInTheDocument();
    expect(screen.getByText("your business can own.")).toBeInTheDocument();
  });
});
