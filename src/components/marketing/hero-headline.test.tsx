import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroHeadline } from "./hero-headline";

describe("HeroHeadline", () => {
  it("exposes the complete product promise as one accessible heading", () => {
    render(<HeroHeadline />);

    expect(
      screen.getByRole("heading", {
        name: /ship your saas product, website, mobile app, business software, ai app, or social platform faster/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the secured ownership statement", () => {
    render(<HeroHeadline />);

    expect(screen.getAllByText(/own the system from day one/i)).toHaveLength(2);
    expect(screen.getByText("Secured.")).toBeInTheDocument();
  });
});
