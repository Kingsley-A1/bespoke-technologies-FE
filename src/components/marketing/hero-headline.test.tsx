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

  it("renders the visual product promise around the rotating product word", () => {
    render(<HeroHeadline />);

    expect(screen.getByText("Launch Secure,")).toBeInTheDocument();
    expect(screen.getByText("Production-ready")).toBeInTheDocument();
    expect(screen.getByText("your business can own.")).toBeInTheDocument();
    // First product in the rotation is shown on initial render.
    expect(screen.getByText("Website")).toBeInTheDocument();
  });
});
