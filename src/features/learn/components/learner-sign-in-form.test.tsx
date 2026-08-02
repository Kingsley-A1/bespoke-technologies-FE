import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearnerSignInForm } from "./learner-sign-in-form";

describe("LearnerSignInForm", () => {
  it("starts with an email entry step and explains the passwordless verification flow", () => {
    render(<LearnerSignInForm />);

    expect(screen.getByRole("heading", { name: "Sign in to Bespoke Learn" })).toBeVisible();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: "Send sign-in code" })).toBeVisible();
    expect(screen.getByText(/six-digit verification code/i)).toBeVisible();
  });
});
