import { describe, expect, it } from "vitest";
import { blockFromAuthoringInput } from "./authoring-block-input";

describe("blockFromAuthoringInput", () => {
  it("builds a structured image block from explicit accessible fields", () => {
    expect(blockFromAuthoringInput({ id: "image-one", type: "image", order: 0, required: false, completionRule: "none", fields: { assetId: "asset-one", altText: "A meaningful image", decorative: "false" } })).toMatchObject({ type: "image", config: { assetId: "asset-one", altText: "A meaningful image" } });
  });

  it("rejects executable markup from a rich-text authoring input", () => {
    expect(() => blockFromAuthoringInput({ id: "unsafe", type: "rich_text", order: 0, required: false, completionRule: "none", fields: { paragraphs: "<script>alert(1)</script>" } })).toThrow(/Text cannot contain markup/i);
  });
});
