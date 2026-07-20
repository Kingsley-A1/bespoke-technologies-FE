import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BespokeAIMarkdown } from "./bespoke-ai-markdown";

describe("BespokeAIMarkdown", () => {
  it("renders bold syntax as <strong> without leaking asterisks", () => {
    const { container } = render(
      <BespokeAIMarkdown text="**Web Development**: Scalable full-stack apps." />,
    );

    expect(screen.getByText("Web Development").tagName).toBe("STRONG");
    expect(container.textContent).not.toContain("**");
  });

  it("renders bullet lines as a list, not raw asterisks", () => {
    const { container } = render(
      <BespokeAIMarkdown text={"* First point\n* Second point"} />,
    );

    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText("First point").tagName).toBe("LI");
    expect(container.textContent).not.toContain("* ");
  });

  it("renders safe links and ignores unsafe hrefs", () => {
    render(
      <BespokeAIMarkdown text="See the [contact page](/contact) for details." />,
    );

    expect(screen.getByRole("link", { name: "contact page" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
