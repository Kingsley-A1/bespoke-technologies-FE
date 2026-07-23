import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BESPOKE_AI_SUGGESTIONS, BespokeAISuggestions } from "./bespoke-ai-suggestions";

describe("BespokeAISuggestions", () => {
  it("shows exactly three public quick starts", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BespokeAISuggestions onSelect={onSelect} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: /shape my big idea/i }));
    expect(onSelect).toHaveBeenCalledWith(BESPOKE_AI_SUGGESTIONS[2].prompt);
  });

  it("shows exactly three role-aware Coworker starts", () => {
    render(<BespokeAISuggestions experience="admin" onSelect={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: /prioritise today/i })).toBeInTheDocument();
  });
});
