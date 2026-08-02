import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ContentBlock } from "../content/schemas";
import { LessonBlockRenderer } from "./lesson-block-renderer";

const blocks: ContentBlock[] = [
  { id: "rich-text", type: "rich_text", order: 0, required: false, completionRule: "none", config: { paragraphs: ["Rich text explanation"] } },
  { id: "callout", type: "callout", order: 1, required: false, completionRule: "none", config: { title: "Callout title", body: "Callout explanation", tone: "info" } },
  { id: "image", type: "image", order: 2, required: false, completionRule: "none", config: { assetId: "image-asset", altText: "Meaningful image", decorative: false, caption: "Image caption" } },
  { id: "slides", type: "slides", order: 3, required: false, completionRule: "none", config: { slides: [{ assetId: "slide-asset", altText: "Slide one", decorative: false }] } },
  { id: "video", type: "video", order: 4, required: false, completionRule: "media_complete", config: { assetId: "video-asset", transcript: "Video transcript" } },
  { id: "audio", type: "audio", order: 5, required: false, completionRule: "media_complete", config: { assetId: "audio-asset", transcript: "Audio transcript" } },
  { id: "download", type: "download", order: 6, required: false, completionRule: "none", config: { assetId: "download-asset", label: "Download worksheet", description: "A worksheet" } },
  { id: "quiz", type: "quiz", order: 7, required: true, completionRule: "assessment_passed", config: { kind: "single_choice", prompt: "Quiz prompt", options: [{ id: "quiz-a", label: "Correct answer", feedback: "Why this is correct", correct: true }, { id: "quiz-b", label: "Other answer", feedback: "Why this is not correct", correct: false }], retryLimit: 1 } },
  { id: "interactive", type: "interactive", order: 8, required: true, completionRule: "submitted", config: { kind: "short_structured_response", prompt: "Interactive prompt", guidance: "Use a structure", retryLimit: 1 } },
  { id: "reflection", type: "reflection", order: 9, required: true, completionRule: "submitted", config: { prompt: "Reflection prompt", guidance: "Reflect clearly", artifactKind: "reflection" } },
];

describe("LessonBlockRenderer", () => {
  it("renders every approved content type through an explicit safe renderer", () => {
    render(<>{blocks.map((block) => <LessonBlockRenderer key={block.id} block={block} assetUrl={(assetId) => `/assets/${assetId}`} />)}</>);

    expect(screen.getByText("Rich text explanation")).toBeVisible();
    expect(screen.getByText("Callout title")).toBeVisible();
    expect(screen.getByRole("img", { name: "Meaningful image" })).toHaveAttribute("src", "/assets/image-asset");
    expect(screen.getByLabelText("Slides")).toBeVisible();
    expect(screen.getByText("Video transcript")).toBeInTheDocument();
    expect(screen.getByText("Audio transcript")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download worksheet" })).toHaveAttribute("href", "/assets/download-asset");
    expect(screen.getByText("Quiz prompt")).toBeVisible();
    expect(screen.getByText("Interactive prompt")).toBeVisible();
    expect(screen.getByText("Reflection prompt")).toBeVisible();
  });
});
