import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroHeadline } from "./hero-headline";

describe("HeroHeadline", () => {
  it("exposes the complete product promise as one accessible heading", () => {
    render(<HeroHeadline />);

    expect(
      screen.getByRole("heading", {
        name: /we do the engineering, you own the software/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the visual product promise around the rotating product word", () => {
    render(<HeroHeadline />);

    expect(screen.getByText("We do the engineering,")).toBeInTheDocument();
    expect(screen.getAllByText(/you own the/).length).toBeGreaterThan(0);
    // First product in the rotation is shown on initial render.
    expect(screen.getByText("Website")).toBeInTheDocument();
  });
});
