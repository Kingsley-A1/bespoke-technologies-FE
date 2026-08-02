import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminCourseEditor } from "./admin-course-editor";

describe("AdminCourseEditor", () => {
  it("keeps a draft private while exposing structured module, lesson, and block authoring actions", () => {
    render(<AdminCourseEditor course={{ courseId: "course-1", assets: [], version: { id: "version-1", number: 1, state: "draft", title: "Draft course", summary: "Draft summary", description: "Draft description", outcomes: [], prerequisites: [], formats: [], accessPolicy: "unavailable" }, modules: [] }} />);

    expect(screen.getByRole("heading", { name: "Draft course" })).toBeVisible();
    expect(screen.getByText(/This draft is private/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Add module" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Grant access" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Revoke access" })).toBeVisible();
    expect(screen.queryByText(/published to learners/i)).not.toBeInTheDocument();
  });

  it("exposes the structured fields required by the typed block editors", () => {
    render(<AdminCourseEditor course={{ courseId: "course-1", assets: [], version: { id: "version-1", number: 1, state: "draft", title: "Draft course", summary: "Draft summary", description: "Draft description", outcomes: [], prerequisites: [], formats: [], accessPolicy: "unavailable" }, modules: [{ id: "module-1", title: "Module", sortOrder: 0, lessons: [{ id: "lesson-1", slug: "lesson", title: "Lesson", objective: "Objective", sortOrder: 0, blocks: [] }] }] }} />);

    fireEvent.click(screen.getByText("Add typed content block"));
    expect(screen.getByLabelText("Callout body")).toBeVisible();
    expect(screen.getByLabelText("Download description")).toBeVisible();
    expect(screen.getByLabelText("Reflection artifact")).toBeVisible();
    expect(screen.getByLabelText("Decorative image")).toBeVisible();
  });

  it("offers draft-only edit, duplicate, and remove controls for a typed block", () => {
    render(<AdminCourseEditor course={{ courseId: "course-1", assets: [], version: { id: "version-1", number: 1, state: "draft", title: "Draft course", summary: "Draft summary", description: "Draft description", outcomes: [], prerequisites: [], formats: [], accessPolicy: "unavailable" }, modules: [{ id: "module-1", title: "Module", sortOrder: 0, lessons: [{ id: "lesson-1", slug: "lesson", title: "Lesson", objective: "Objective", sortOrder: 0, blocks: [{ id: "block-row-1", stableId: "review", type: "rich_text", required: true, completionRule: "acknowledged", sortOrder: 0 }] }] }] }} />);

    expect(screen.getByText("Edit block")).toBeVisible();
    expect(screen.getByRole("button", { name: "Duplicate block" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Remove block" })).toBeVisible();
  });
});
