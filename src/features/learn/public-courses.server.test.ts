import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  configured: false,
  query: vi.fn(),
}));

vi.mock("@/features/admin/db", () => ({
  isAdminDatabaseConfigured: () => database.configured,
  adminQuery: database.query,
}));

import { listReviewedCourseCatalogue } from "./public-courses.server";

describe("listReviewedCourseCatalogue", () => {
  beforeEach(() => {
    database.configured = false;
    database.query.mockReset();
  });

  it("returns an intentional empty catalogue when no database is configured for a local build", async () => {
    await expect(listReviewedCourseCatalogue()).resolves.toEqual([]);
    expect(database.query).not.toHaveBeenCalled();
  });

  it("maps only active published versions when the learning schema is available", async () => {
    database.configured = true;
    database.query.mockResolvedValue({ rows: [{ course_id: "course-1", slug: "reviewed-course", version_id: "version-1", version_number: 1, title: "Reviewed course", summary: "A reviewed description", access_policy: "public_preview", reviewed_at: "2026-08-02T00:00:00.000Z", published_at: "2026-08-02T00:00:00.000Z" }] });

    await expect(listReviewedCourseCatalogue()).resolves.toMatchObject([{ id: "course-1", slug: "reviewed-course", title: "Reviewed course" }]);
    expect(database.query).toHaveBeenCalledWith(expect.stringContaining("v.state = 'published'"), [""]);
  });
});
