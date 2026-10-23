import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroHeadline, heroWordForProjectType } from "./hero-headline";

describe("HeroHeadline", () => {
  it("exposes the complete product promise as one accessible heading", () => {
    render(<HeroHeadline word="Website" />);

    expect(
      screen.getByRole("heading", {
        name: /we do the engineering, you own the software/i,
      }),
    ).toBeInTheDocument();
  });

  it("names the product of the project currently on stage", () => {
    const { rerender } = render(<HeroHeadline word="Website" />);
    expect(screen.getByText("We do the engineering,")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();

    rerender(<HeroHeadline word="Mobile App" />);
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
    expect(screen.queryByText("Website")).not.toBeInTheDocument();
  });
});

describe("heroWordForProjectType", () => {
  it("maps each delivered project type to the word the headline shows", () => {
    expect(heroWordForProjectType("web")).toBe("Website");
    expect(heroWordForProjectType("mobile")).toBe("Mobile App");
    expect(heroWordForProjectType("ios")).toBe("Mobile App");
    expect(heroWordForProjectType("web+mobile")).toBe("Mobile App");
    expect(heroWordForProjectType("desktop")).toBe("Desktop App");
    expect(heroWordForProjectType(undefined)).toBe("Website");
  });
});
