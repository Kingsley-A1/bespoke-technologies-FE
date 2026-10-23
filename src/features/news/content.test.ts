import { describe, expect, it } from "vitest";
import {
  collectNewsImageIds,
  excerpt,
  isExternalNewsHref,
  NewsContentError,
  newsDocumentText,
  newsReadingMinutes,
  normalizeNewsDocument,
  readStoredNewsDocument,
  safeNewsHref,
} from "./content";

const IMAGE_ID = "3f2a7c1e-9b4d-4e2a-8f61-0c5d2b7a9e10";

const text = (value: string, marks?: unknown[]) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });
const paragraph = (...content: unknown[]) => ({ type: "paragraph", content });

describe("safeNewsHref", () => {
  it.each([
    ["https://www.bespoketech.com.ng/contact", "https://www.bespoketech.com.ng/contact"],
    ["http://example.com", "http://example.com/"],
    ["mailto:hello@bespoketech.com.ng", "mailto:hello@bespoketech.com.ng"],
    ["tel:+2348088071657", "tel:+2348088071657"],
    ["/contact", "/contact"],
    ["#pricing", "#pricing"],
  ])("allows %s", (input, expected) => {
    expect(safeNewsHref(input)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox",
    "//evil.example/path",
    "/\\evil.example",
    "https://exa\nmple.com",
    "",
    "   ",
    42,
  ])("rejects %s", (input) => {
    expect(safeNewsHref(input)).toBeNull();
  });

  it("treats only bespoketech.com.ng hosts as internal", () => {
    expect(isExternalNewsHref("https://learn.bespoketech.com.ng/courses")).toBe(false);
    expect(isExternalNewsHref("https://bespoketech.com.ng.evil.example/")).toBe(true);
    expect(isExternalNewsHref("/contact")).toBe(false);
  });
});

describe("normalizeNewsDocument", () => {
  it("keeps every supported block and mark, and drops unknown attributes", () => {
    const doc = normalizeNewsDocument({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2, id: "x", style: "color:red" }, content: [text("Launch")] },
        paragraph(
          text("Read ", [{ type: "bold" }]),
          text("the docs", [{ type: "link", attrs: { href: "https://www.bespoketech.com.ng/library", target: "_self", onclick: "x" } }]),
          { type: "hardBreak" },
          text("now", [{ type: "italic" }, { type: "underline" }, { type: "strike" }, { type: "code" }]),
        ),
        { type: "bulletList", content: [{ type: "listItem", content: [paragraph(text("One"))] }] },
        { type: "orderedList", attrs: { start: 3, type: null }, content: [{ type: "listItem", content: [paragraph(text("Two"))] }] },
        { type: "blockquote", content: [paragraph(text("Quote"))] },
        { type: "codeBlock", attrs: { language: "ts" }, content: [text("const a = 1;")] },
        { type: "horizontalRule" },
        { type: "image", attrs: { src: `/news/media/${IMAGE_ID}`, alt: "Team at work", title: "Caption", width: 1600, height: 900 } },
        {
          type: "table",
          content: [
            { type: "tableRow", content: [{ type: "tableHeader", attrs: { colspan: 1, rowspan: 1, colwidth: [200] }, content: [paragraph(text("Plan"))] }] },
            { type: "tableRow", content: [{ type: "tableCell", attrs: { colspan: 99 }, content: [paragraph(text("Pro"))] }] },
          ],
        },
      ],
    });

    expect(doc.content.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "bulletList",
      "orderedList",
      "blockquote",
      "codeBlock",
      "horizontalRule",
      "image",
      "table",
    ]);
    expect(doc.content[0]).toEqual({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Launch" }] });
    expect(doc.content[1]).toMatchObject({
      content: [
        { marks: [{ type: "bold" }] },
        { marks: [{ type: "link", attrs: { href: "https://www.bespoketech.com.ng/library" } }] },
        { type: "hardBreak" },
        {},
      ],
    });
    const table = doc.content[8];
    expect(table.type === "table" && table.content[1].content[0].attrs).toEqual({ colspan: 20, rowspan: 1 });
    expect(JSON.stringify(doc)).not.toMatch(/onclick|style|colwidth|target/);
  });

  it("clamps heading levels to the article outline (H2–H4)", () => {
    const doc = normalizeNewsDocument({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [text("A")] },
        { type: "heading", attrs: { level: 6 }, content: [text("B")] },
      ],
    });
    expect(doc.content.map((block) => block.type === "heading" && block.attrs.level)).toEqual([2, 4]);
  });

  it("removes the trailing empty paragraph the editor keeps for the cursor", () => {
    const doc = normalizeNewsDocument({ type: "doc", content: [paragraph(text("Hello")), { type: "paragraph" }] });
    expect(doc.content).toHaveLength(1);
  });

  it.each([
    ["a script link", { type: "doc", content: [paragraph(text("x", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]))] }],
    ["an external image", { type: "doc", content: [{ type: "image", attrs: { src: "https://evil.example/a.png", alt: "x" } }] }],
    ["an image without alt text", { type: "doc", content: [{ type: "image", attrs: { src: `/news/media/${IMAGE_ID}`, alt: " " } }] }],
    ["an unknown block", { type: "doc", content: [{ type: "iframe", attrs: { src: "https://evil.example" } }] }],
    ["an unknown mark", { type: "doc", content: [paragraph(text("x", [{ type: "textStyle", attrs: { color: "red" } }]))] }],
    ["a non-doc root", { type: "paragraph", content: [] }],
    ["malformed content", { type: "doc", content: "nope" }],
  ])("rejects %s", (_label, input) => {
    expect(() => normalizeNewsDocument(input)).toThrow(NewsContentError);
  });

  it("rejects documents that nest too deeply", () => {
    let node: Record<string, unknown> = paragraph(text("deep"));
    for (let index = 0; index < 20; index += 1) node = { type: "blockquote", content: [node] };
    expect(() => normalizeNewsDocument({ type: "doc", content: [node] })).toThrow(/nests too many/);
  });

  it("reads corrupt stored rows as an empty document", () => {
    expect(readStoredNewsDocument("{not json")).toEqual({ type: "doc", content: [] });
    expect(readStoredNewsDocument(JSON.stringify({ type: "doc", content: [paragraph(text("Saved"))] })).content).toHaveLength(1);
  });
});

describe("derived article text", () => {
  const doc = normalizeNewsDocument({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [text("Heading")] },
      paragraph(text("First paragraph.")),
      { type: "image", attrs: { src: `/news/media/${IMAGE_ID}`, alt: "Alt", title: "A caption" } },
      {
        type: "table",
        content: [{ type: "tableRow", content: [{ type: "tableCell", content: [paragraph(text("Cell"))] }] }],
      },
    ],
  });

  it("extracts plain text across blocks", () => {
    expect(newsDocumentText(doc)).toBe("Heading\n\nFirst paragraph.\n\nA caption\n\nCell");
  });

  it("finds uploaded images", () => {
    expect(collectNewsImageIds(doc)).toEqual([IMAGE_ID]);
  });

  it("estimates reading time at 220 words per minute, minimum one", () => {
    expect(newsReadingMinutes("one two")).toBe(1);
    expect(newsReadingMinutes(Array.from({ length: 1100 }, () => "word").join(" "))).toBe(5);
  });

  it("cuts excerpts on a word boundary", () => {
    const result = excerpt("Bespoke Technologies builds practical, secure and scalable software for real businesses.", 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });
});
