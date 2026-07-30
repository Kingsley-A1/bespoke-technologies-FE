import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeInput } from "./code-input";

describe("CodeInput", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a blinking caret in the active code cell", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <CodeInput />
      </form>,
    );

    await user.click(screen.getByLabelText("Six-digit access code"));

    expect(container.querySelector("[data-code-cell='0'] [data-code-caret]")).not.toBeNull();
  });

  it("submits the valid form once when the sixth digit is entered", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submitted}>
        <input
          aria-label="Work email"
          type="email"
          required
          defaultValue="admin@bespoketech.com.ng"
        />
        <CodeInput autoSubmit />
        <button type="submit">Continue securely</button>
      </form>,
    );

    await user.type(screen.getByLabelText("Six-digit access code"), "123456");

    await waitFor(() => expect(submitted).toHaveBeenCalledTimes(1));
  });

  it("does not auto-submit when another required login field is invalid", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submitted}>
        <input aria-label="Work email" type="email" required />
        <CodeInput autoSubmit />
        <button type="submit">Continue securely</button>
      </form>,
    );

    await user.type(screen.getByLabelText("Six-digit access code"), "123456");
    await waitFor(() => expect(submitted).not.toHaveBeenCalled());
  });

  it("does not submit an incomplete code", () => {
    vi.useFakeTimers();
    const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submitted}>
        <CodeInput autoSubmit />
      </form>,
    );

    fireEvent.change(screen.getByLabelText("Six-digit access code"), {
      target: { value: "12345" },
    });
    vi.runAllTimers();

    expect(submitted).not.toHaveBeenCalled();
  });
});
