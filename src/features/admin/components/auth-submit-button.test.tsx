import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthSubmitButton } from "./auth-submit-button";

describe("AuthSubmitButton", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the native submit before entering its loading state", () => {
    vi.useFakeTimers();
    render(
      <form>
        <AuthSubmitButton pendingLabel="Verifying access…">
          Continue securely
        </AuthSubmitButton>
      </form>,
    );

    const form = screen.getByRole("button").closest("form");
    let enabledWhenSubmitted = false;
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      enabledWhenSubmitted = !(event.submitter as HTMLButtonElement | null)?.disabled;
    });

    fireEvent.submit(form!);

    expect(enabledWhenSubmitted).toBe(true);
    expect(screen.getByRole("button")).not.toBeDisabled();

    act(() => vi.runAllTimers());

    expect(screen.getByRole("button", { name: "Verifying access…" })).toBeDisabled();
  });
});
