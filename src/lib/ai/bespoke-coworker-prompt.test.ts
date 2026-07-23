import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminSession, AdminSnapshot } from "@/features/admin/types";

const { getAdminSnapshot, listLearningGoals } = vi.hoisted(() => ({
  getAdminSnapshot: vi.fn(),
  listLearningGoals: vi.fn(),
}));

vi.mock("@/features/admin/repository", () => ({ getAdminSnapshot }));
vi.mock("@/features/admin/learning/repository", () => ({ listLearningGoals }));

import { buildBespokeCoworkerPrompt } from "./bespoke-coworker-prompt";

describe("buildBespokeCoworkerPrompt", () => {
  beforeEach(() => {
    getAdminSnapshot.mockReset();
    listLearningGoals.mockReset();
  });

  it("keeps employee context limited to that employee's work and learning", async () => {
    getAdminSnapshot.mockResolvedValue({
      clients: [{ id: "client-secret", name: "Private Client" }],
      leads: [{ companyName: "Private Lead" }],
      documents: [{ documentNumber: "INV-SECRET" }],
      projects: [{ id: "project-own", name: "Employee Project" }, { id: "project-other", name: "Restricted Project" }],
      tasks: [
        { id: "task-own", title: "Prepare launch checklist", assigneeUserId: "employee-1", projectId: "project-own", priority: "high", status: "todo", dueDate: "2026-07-30" },
        { id: "task-other", title: "Founder-only finance review", assigneeUserId: "founder-1", projectId: "project-other", priority: "urgent", status: "todo" },
      ],
    } as unknown as AdminSnapshot);
    listLearningGoals.mockResolvedValue([{ id: "goal-1", title: "Cloud foundations", provider: "Example Academy", assignments: [{ userId: "employee-1", status: "in_progress", progress: 40 }] }]);
    const session = { userId: "employee-1", displayName: "Ada Employee", role: "employee" } as AdminSession;

    const prompt = await buildBespokeCoworkerPrompt(session);

    expect(prompt).toContain("Prepare launch checklist");
    expect(prompt).toContain("Cloud foundations");
    expect(prompt).toContain("Coworker /admin/coworker");
    expect(prompt).not.toContain("Private Client");
    expect(prompt).not.toContain("Private Lead");
    expect(prompt).not.toContain("INV-SECRET");
    expect(prompt).not.toContain("Founder-only finance review");
    expect(prompt).not.toContain("Billing /admin/billing");
  });
});
