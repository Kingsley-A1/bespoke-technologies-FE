import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";
import { BespokeAIMessage } from "./bespoke-ai-message";

describe("BespokeAIMessage", () => {
  it("renders tool results as full-width action UI after assistant text", () => {
    const message = {
      id: "assistant-1",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "These are the most relevant examples.",
        },
        {
          type: "tool-listProjects",
          state: "output-available",
          output: {
            type: "project-list",
            label: "Relevant product examples",
            projects: [
              {
                id: "project-1",
                name: "LaunchOS",
                category: "SaaS Platform",
                description: "A production SaaS platform for launch teams.",
                year: "2026",
                tags: ["SaaS", "UX", "Cloud"],
                type: "web",
                path: "/projects/launchos",
              },
            ],
          },
        },
      ],
    } as unknown as BespokeAIUIMessage;

    const { container } = render(<BespokeAIMessage message={message} />);

    expect(
      screen.getByText("These are the most relevant examples."),
    ).toBeInTheDocument();
    expect(screen.getByText("Relevant product examples")).toBeInTheDocument();
    expect(screen.getByText("LaunchOS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open projects/i })).toHaveAttribute(
      "href",
      "/projects",
    );

    const actionRegion = container.querySelector(".w-full");
    expect(actionRegion).toBeInTheDocument();
  });
});
