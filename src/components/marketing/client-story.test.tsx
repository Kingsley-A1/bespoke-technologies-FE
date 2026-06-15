import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ClientStory } from "./client-story";

describe("ClientStory", () => {
  it("moves between client stories with accessible controls", async () => {
    const user = userEvent.setup();
    render(<ClientStory />);

    expect(
      screen.getByRole("button", {
        name: "Show story 1: FinEdge Technologies",
      }),
    ).toHaveAttribute("aria-current", "true");

    await user.click(
      screen.getByRole("button", { name: "Next client story" }),
    );

    expect(
      screen.getByRole("button", {
        name: "Show story 2: Debranded Studio",
      }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("allows automatic rotation to be paused and resumed", async () => {
    const user = userEvent.setup();
    render(<ClientStory />);

    const pauseButton = screen.getByRole("button", {
      name: "Pause client story rotation",
    });
    await user.click(pauseButton);

    expect(
      screen.getByRole("button", { name: "Resume client story rotation" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
