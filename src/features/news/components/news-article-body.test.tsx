import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { normalizeNewsDocument, type NewsDocument } from "../content";
import { NewsArticleBody, newsOutline } from "./news-article-body";

const IMAGE_ID = "3f2a7c1e-9b4d-4e2a-8f61-0c5d2b7a9e10";
const text = (value: string, marks?: unknown[]) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });

const doc: NewsDocument = normalizeNewsDocument({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [text("What changed")] },
    {
      type: "paragraph",
      content: [
        text("<script>alert(1)</script> Read "),
        text("our guide", [{ type: "link", attrs: { href: "/library" } }]),
        text(" or "),
        text("the spec", [{ type: "link", attrs: { href: "https://example.com/spec" } }, { type: "italic" }]),
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [text("What changed")] },
    { type: "image", attrs: { src: `/news/media/${IMAGE_ID}`, alt: "Release dashboard", title: "The new dashboard" } },
    {
      type: "table",
      content: [
        { type: "tableRow", content: [{ type: "tableHeader", content: [{ type: "paragraph", content: [text("Plan")] }] }] },
        { type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph", content: [text("Pro")] }] }] },
      ],
    },
  ],
});

describe("NewsArticleBody", () => {
  it("renders text as text, never as HTML", () => {
    const { container } = render(<NewsArticleBody doc={doc} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
  });

  it("renders named links, opening only external links in a new tab", () => {
    render(<NewsArticleBody doc={doc} />);
    const internal = screen.getByRole("link", { name: "our guide" });
    expect(internal).toHaveAttribute("href", "/library");
    expect(internal).not.toHaveAttribute("target");
    const external = screen.getByRole("link", { name: "the spec" });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(external.querySelector("em")).not.toBeNull();
  });

  it("gives headings unique anchors that match the outline", () => {
    render(<NewsArticleBody doc={doc} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.id)).toEqual(["what-changed", "what-changed-2"]);
    expect(newsOutline(doc).map((item) => item.id)).toEqual(["what-changed", "what-changed-2"]);
  });

  it("renders images with alt text and captions, and tables with header cells", () => {
    render(<NewsArticleBody doc={doc} />);
    expect(screen.getByRole("img", { name: "Release dashboard" })).toHaveAttribute("src", `/news/media/${IMAGE_ID}`);
    expect(screen.getByText("The new dashboard").tagName).toBe("FIGCAPTION");
    expect(screen.getByRole("columnheader", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Pro" })).toBeInTheDocument();
  });
});
