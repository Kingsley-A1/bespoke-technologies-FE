import { describe, expect, it } from "vitest";
import { parseContentBlock } from "./schemas";

const base = {
  id: "block-intro",
  order: 1,
  required: true,
  completionRule: "submitted" as const,
};

describe("Learn content block schemas", () => {
  it.each([
    { type: "rich_text", config: { paragraphs: ["A structured explanation."] } },
    { type: "callout", config: { title: "Remember", body: "A focused point.", tone: "info" } },
    { type: "image", config: { assetId: "asset-image", altText: "A person reviewing a diagram", decorative: false } },
    { type: "slides", config: { slides: [{ assetId: "slide-one", altText: "The first slide" }] } },
    { type: "video", config: { assetId: "video-one", transcript: "A supplied transcript." } },
    { type: "audio", config: { assetId: "audio-one", transcript: "A supplied transcript." } },
    { type: "download", config: { assetId: "download-one", label: "Download the worksheet" } },
    { type: "quiz", config: { kind: "single_choice", prompt: "Choose one.", options: [{ id: "option-a", label: "A", feedback: "Why A is useful.", correct: true }, { id: "option-b", label: "B", feedback: "Why B is incomplete.", correct: false }], retryLimit: 2 } },
    { type: "interactive", config: { kind: "short_structured_response", prompt: "Write a response.", guidance: "Use two sentences.", retryLimit: 1 } },
    { type: "reflection", config: { prompt: "What will you apply?", artifactKind: "ai_opportunity_blueprint" } },
  ])("accepts the required $type block type", (block) => {
    expect(parseContentBlock({ ...base, ...block }).type).toBe(block.type);
  });

  it("accepts a required single-choice interaction with explanatory feedback", () => {
    expect(
      parseContentBlock({
        ...base,
        type: "interactive",
        config: {
          kind: "single_choice",
          prompt: "Choose the safe next action.",
          options: [
            { id: "review", label: "Review the output", feedback: "Reviewing catches unsupported assumptions.", correct: true },
            { id: "publish", label: "Publish immediately", feedback: "Unchecked output can be inaccurate.", correct: false },
          ],
          retryLimit: 2,
        },
      }),
    ).toMatchObject({ type: "interactive", config: { kind: "single_choice" } });
  });

  it.each([
    "<script>alert(1)</script>",
    '<iframe src="https://untrusted.example"></iframe>',
  ])("rejects executable rich text: %s", (paragraph) => {
    expect(() =>
      parseContentBlock({
        ...base,
        type: "rich_text",
        completionRule: "none",
        config: { paragraphs: [paragraph] },
      }),
    ).toThrow();
  });

  it("rejects a meaningful image without alternative text", () => {
    expect(() =>
      parseContentBlock({
        ...base,
        type: "image",
        completionRule: "acknowledged",
        config: { assetId: "asset-image", altText: "", decorative: false },
      }),
    ).toThrow();
  });

  it("rejects media without a transcript or captions reference", () => {
    expect(() =>
      parseContentBlock({
        ...base,
        type: "video",
        completionRule: "media_complete",
        config: { assetId: "video-one" },
      }),
    ).toThrow();
  });
});
