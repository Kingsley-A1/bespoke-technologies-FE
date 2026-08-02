import { describe, expect, it, vi } from "vitest";
import { createPublishingCommandRepository } from "./publishing-db";

describe("publishing command repository", () => {
  it("publishes a validated version transactionally and supersedes only older published versions", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ course_id: "course-1" }] })
      .mockResolvedValueOnce({ rows: [] });
    const transaction = vi.fn(async (work: (client: { query: typeof query }) => Promise<boolean>) => work({ query }));
    const repository = createPublishingCommandRepository({ transaction: transaction as never });

    await expect(repository.publishImmutableVersion({ versionId: "version-2", actorAdminUserId: "admin-1", publishedAt: "2026-08-02T12:00:00.000Z" })).resolves.toBe(true);
    expect(query.mock.calls[0]?.[0]).toContain("state = 'validated'");
    expect(query.mock.calls[1]?.[0]).toContain("id <> $2");
    expect(query.mock.calls[1]?.[1]).toEqual(["course-1", "version-2"]);
  });
});
