import { describe, expect, it } from "vitest";
import { getRegisteredBlock, LEARN_BLOCK_REGISTRY } from "./registry";

describe("Learn content block registry", () => {
  it("registers every required V1 block with a schema, editor and renderer key", () => {
    expect(Object.keys(LEARN_BLOCK_REGISTRY).sort()).toEqual([
      "audio",
      "callout",
      "download",
      "image",
      "interactive",
      "quiz",
      "reflection",
      "rich_text",
      "slides",
      "video",
    ]);

    for (const entry of Object.values(LEARN_BLOCK_REGISTRY)) {
      expect(entry.schema).toBeDefined();
      expect(entry.editorKey).toMatch(/^learn-/);
      expect(entry.rendererKey).toMatch(/^learn-/);
    }
  });

  it("fails closed for an unregistered renderer type", () => {
    expect(() => getRegisteredBlock("unsafe_html" as never)).toThrow(
      "Unsupported Learn content block",
    );
  });
});
