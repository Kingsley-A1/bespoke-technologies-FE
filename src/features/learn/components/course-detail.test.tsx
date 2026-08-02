import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseDetail } from "./course-detail";

const course = {
  id: "course-1", slug: "reviewed-course", versionId: "version-1", versionNumber: 1, title: "Reviewed course", summary: "Clear summary", description: "A reviewed description", accessPolicy: "manual_grant" as const,
  outcomes: ["Use a reviewed workflow"], audience: "People making practical technology decisions", prerequisites: ["No prior specialist knowledge"], commitment: "About 2 hours", formats: ["Reading", "Practice"],
  reviewedAt: "2026-08-02T00:00:00.000Z", authors: [{ id: "author-1", displayName: "Author One" }], modules: [{ id: "module-1", title: "First module", sortOrder: 0, lessons: [{ id: "lesson-1", slug: "lesson-one", title: "First lesson", objective: "Use the model", estimatedMinutes: 10, sortOrder: 0 }] }],
};

describe("CourseDetail", () => {
  it("uses access state to expose one truthful primary action without invented learning claims", () => {
    render(<CourseDetail course={course} access={{ allowed: false, reason: "access_required" }} />);

    expect(screen.getByRole("link", { name: "Request access" })).toBeVisible();
    expect(screen.getByText("Version 1")).toBeVisible();
    expect(screen.getByText("Author One")).toBeVisible();
    expect(screen.getByRole("heading", { name: "What you will work toward" })).toBeVisible();
    expect(screen.getByText("About 2 hours")).toBeVisible();
    expect(screen.getByText("No prior specialist knowledge")).toBeVisible();
    expect(screen.queryByText(/students|rating|accredited/i)).not.toBeInTheDocument();
  });

  it("directs an allowed learner to continue the actual course route", () => {
    render(<CourseDetail course={course} access={{ allowed: true, mode: "full" }} />);
    expect(screen.getByRole("link", { name: "Continue course" })).toHaveAttribute("href", "/courses/reviewed-course/learn");
  });
});
