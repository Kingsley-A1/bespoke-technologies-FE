import { describe, expect, it } from "vitest";
import { createLearnRepository } from "./repository";

describe("Learn repository", () => {
  it("returns only mapped published-course summaries from the public query boundary", async () => {
    const calls: Array<{ text: string; values: unknown[] }> = [];
    const repository = createLearnRepository({
      query: async (text, values) => {
        calls.push({ text, values: values ?? [] });
        return {
          rows: [{
            course_id: "course-1", slug: "practical-ai", version_id: "version-1", version_number: 1, title: "Practical AI",
            summary: "A reviewed course.", access_policy: "authenticated_free", reviewed_at: new Date("2026-08-01"), published_at: new Date("2026-08-02"),
          }],
        };
      },
    });

    await expect(repository.listPublishedCourses(" AI ")).resolves.toEqual([{
      id: "course-1", slug: "practical-ai", versionId: "version-1", versionNumber: 1, title: "Practical AI",
      summary: "A reviewed course.", accessPolicy: "authenticated_free",
      reviewedAt: "2026-08-01T00:00:00.000Z", publishedAt: "2026-08-02T00:00:00.000Z",
    }]);
    expect(calls[0]).toMatchObject({ values: ["ai"] });
    expect(calls[0]?.text).toContain("v.state = 'published'");
  });

  it("returns an entitlement only from the exact learner and course boundary", async () => {
    const repository = createLearnRepository({
      query: async () => ({ rows: [{ state: "revoked", expires_at: null, revoked_at: new Date("2026-08-02T09:00:00.000Z") }] }),
    });

    await expect(repository.findEntitlement({ learnerId: "learner-1", courseId: "course-1" })).resolves.toEqual({
      state: "revoked", revokedAt: "2026-08-02T09:00:00.000Z", expiresAt: undefined,
    });
  });
});
