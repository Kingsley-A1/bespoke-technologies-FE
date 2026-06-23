import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createBespokeAIError,
  serializeBespokeAIError,
} from "@/lib/ai/bespoke-ai-errors";
import { BespokeAIErrorState } from "./bespoke-ai-error-state";

describe("BespokeAIErrorState", () => {
  it("renders a retry action for retryable AI outages", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const error = new Error(
      serializeBespokeAIError(createBespokeAIError("provider-overloaded")),
    );

    render(<BespokeAIErrorState error={error} onRetry={onRetry} />);

    expect(
      screen.getByRole("heading", {
        name: "Bespoke AI is taking a short pause.",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("keeps the UI in handoff mode when the assistant is not configured", () => {
    const error = new Error(
      serializeBespokeAIError(createBespokeAIError("not-configured")),
    );

    render(<BespokeAIErrorState error={error} />);

    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact the team" }),
    ).toBeInTheDocument();
  });
});
