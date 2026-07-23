import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BespokeAIInput } from "./bespoke-ai-input";

describe("BespokeAIInput", () => {
  it("makes the public action obvious and sends the message", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BespokeAIInput onSubmit={onSubmit} onStop={vi.fn()} />);

    const input = screen.getByLabelText("Message Bespoke AI");
    expect(input).toHaveAttribute("placeholder", "What would you like to build?");
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();

    await user.type(input, "Help me plan a client portal");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSubmit).toHaveBeenCalledWith("Help me plan a client portal");
    expect(input).toHaveValue("");
  });

  it("adapts its accessible language for Bespoke Coworker", () => {
    render(<BespokeAIInput assistantName="Bespoke Coworker" placeholder="Ask about your work" onSubmit={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByLabelText("Message Bespoke Coworker")).toHaveAttribute("placeholder", "Ask about your work");
    expect(screen.queryByText(/Shift \+ Enter/i)).not.toBeInTheDocument();
  });

  it("turns the primary action into a stop control while streaming", () => {
    render(<BespokeAIInput isStreaming onSubmit={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Stop Bespoke AI response" })).toBeEnabled();
  });
});
