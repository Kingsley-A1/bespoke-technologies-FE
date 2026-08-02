import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LessonPlayer } from "./lesson-player";

const lesson = {
  course: { slug: "reviewed-course", versionNumber: 1, title: "Reviewed course" },
  module: { title: "First module", sortOrder: 0 },
  lesson: { slug: "first-lesson", title: "First lesson", objective: "Understand the learning boundary", estimatedMinutes: 10, blocks: [{ id: "explain", type: "rich_text" as const, order: 0, required: true, completionRule: "acknowledged" as const, config: { paragraphs: ["A reviewed explanation."] } }] },
};

describe("LessonPlayer", () => {
  it("persists an explicit required-block action while keeping course navigation collapsible", async () => {
    const saveProgress = vi.fn().mockResolvedValue(undefined);
    render(<LessonPlayer lesson={lesson} saveProgress={saveProgress} />);

    expect(screen.getByText("Understand the learning boundary")).toBeVisible();
    expect(screen.getByText("Course navigation")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Mark as understood" }));
    await waitFor(() => expect(saveProgress).toHaveBeenCalledWith({ blockId: "explain", completed: true }));
    expect(screen.getByText("Progress saved.")).toBeVisible();
  });

  it("keeps the learner's work on screen and announces a recoverable save failure", async () => {
    render(<LessonPlayer lesson={lesson} saveProgress={vi.fn().mockRejectedValue(new Error("offline"))} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark as understood" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't save your progress/i);
  });

  it("does not try to persist public-preview interaction state", async () => {
    const saveProgress = vi.fn();
    render(<LessonPlayer lesson={lesson} progressEnabled={false} saveProgress={saveProgress} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark as understood" }));
    expect(saveProgress).not.toHaveBeenCalled();
  });

  it("uses the ordered course hierarchy for stable previous and next lesson links", () => {
    render(<LessonPlayer lesson={{ ...lesson, navigation: { previous: { slug: "orientation", title: "Orientation" }, next: { slug: "apply-it", title: "Apply it" } } }} />);

    expect(screen.getByRole("link", { name: /Previous: Orientation/i })).toHaveAttribute("href", "/courses/reviewed-course/lessons/orientation");
    expect(screen.getByRole("link", { name: /Next: Apply it/i })).toHaveAttribute("href", "/courses/reviewed-course/lessons/apply-it");
  });
});
