import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseHome } from "./course-home";

const course = {
  id: "course-1", slug: "reviewed-course", versionId: "version-1", versionNumber: 1, title: "Reviewed course", summary: "Clear summary", description: "A reviewed description", accessPolicy: "manual_grant" as const, outcomes: [], prerequisites: [], formats: [],
  authors: [], modules: [{ id: "module-1", title: "First module", sortOrder: 0, lessons: [{ id: "lesson-1", slug: "lesson-one", title: "First lesson", objective: "Use the model", estimatedMinutes: 10, sortOrder: 0 }, { id: "lesson-2", slug: "lesson-two", title: "Second lesson", objective: "Apply the model", estimatedMinutes: 10, sortOrder: 1 }] }],
};

describe("CourseHome", () => {
  it("gives a learner one dominant Continue action while communicating module state without colour alone", () => {
    render(<CourseHome course={course} progress={[{ lessonId: "lesson-1", state: "in_progress" }]} />);

    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/courses/reviewed-course/lessons/lesson-one");
    expect(screen.getByText("In progress")).toBeVisible();
    expect(screen.getByText("Next")).toBeVisible();
    expect(screen.getByText(/Version 1/)).toBeVisible();
  });

  it("keeps access-denied state separate from a missing course", () => {
    render(<CourseHome course={course} progress={[]} deniedReason="revoked" />);
    expect(screen.getByRole("heading", { name: "Course access is unavailable" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Contact support" })).toBeVisible();
  });
});
