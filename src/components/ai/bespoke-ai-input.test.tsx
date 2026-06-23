import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BespokeAIInput } from "./bespoke-ai-input";

describe("BespokeAIInput", () => {
  it("uses conversion-focused placeholder copy", () => {
    render(<BespokeAIInput onSubmit={vi.fn()} onStop={vi.fn()} />);

    expect(
      screen.getByPlaceholderText("Describe what you want to build"),
    ).toBeInTheDocument();
  });

  it("fills the composer from a quick action and submits it", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BespokeAIInput onSubmit={onSubmit} onStop={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Open Bespoke AI actions" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Choose build path" }));

    const input = screen.getByLabelText("Message Bespoke AI");
    expect(input).toHaveValue(
      "Help me choose the right build path for my product or business idea.",
    );

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSubmit).toHaveBeenCalledWith(
      "Help me choose the right build path for my product or business idea.",
    );
  });

  it("closes open menus with Escape", async () => {
    const user = userEvent.setup();
    render(<BespokeAIInput onSubmit={vi.fn()} onStop={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Open Bespoke AI actions" }),
    );
    expect(
      screen.getByRole("menu", { name: "Bespoke AI quick actions" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("menu", { name: "Bespoke AI quick actions" }),
    ).not.toBeInTheDocument();
  });
});
