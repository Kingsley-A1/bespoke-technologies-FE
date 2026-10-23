// @vitest-environment node
/**
 * Exercises the What's New repository against a real, migrated CockroachDB.
 * Runs only when NEWS_TEST_DATABASE_URL points at a disposable database, e.g.
 *   NEWS_TEST_DATABASE_URL=postgresql://root@localhost:26257/bespoke_test?sslmode=disable
 * Never point it at production: it writes and deletes rows.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminSession } from "@/features/admin/types";

const databaseUrl = process.env.NEWS_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("news repository (CockroachDB)", () => {
  let repo: typeof import("./repository");
  let db: typeof import("@/features/admin/db");
  let session: AdminSession;
  const userId = randomUUID();
  const suffix = randomUUID().slice(0, 8);

  const body = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "A complete article body with enough words to publish." }] }],
  };
  const input = (overrides: Record<string, unknown> = {}) => ({
    title: `Integration post ${suffix}`,
    dek: "Summary",
    category: "announcements" as const,
    slug: undefined,
    autoSlug: true,
    seoTitle: undefined,
    seoDescription: undefined,
    authorName: "Integration Tester",
    isFeatured: false,
    coverAlt: undefined,
    body,
    ...overrides,
  });

  async function attachCover(postId: string) {
    const cover = await repo.insertNewsAsset(
      { postId, purpose: "cover", r2Key: `test/${randomUUID()}.webp`, mime: "image/webp", width: 2400, height: 1350, byteSize: 1 },
      session,
    );
    const share = await repo.insertNewsAsset(
      { postId, purpose: "share", r2Key: `test/${randomUUID()}.jpg`, mime: "image/jpeg", width: 1200, height: 630, byteSize: 1 },
      session,
    );
    return repo.replaceNewsCover(postId, cover, share, "Cover description", session);
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    db = await import("@/features/admin/db");
    repo = await import("./repository");
    await db.adminQuery("INSERT INTO admin_users (id, email, display_name, role) VALUES ($1, $2, $3, 'admin_manager')", [
      userId,
      `news-test-${suffix}@example.test`,
      "Integration Tester",
    ]);
    const now = new Date().toISOString();
    session = {
      id: randomUUID(),
      userId,
      email: `news-test-${suffix}@example.test`,
      displayName: "Integration Tester",
      role: "admin_manager",
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now,
    };
  });

  afterAll(async () => {
    if (!db) return;
    await db.adminQuery("DELETE FROM news_posts WHERE created_by = $1", [userId]);
    await db.adminQuery("DELETE FROM admin_audit_events WHERE actor_user_id = $1", [userId]);
    await db.adminQuery("DELETE FROM admin_users WHERE id = $1", [userId]);
  });

  it("creates, versions, publishes, redirects and deletes a post", async () => {
    const created = await repo.createNewsPost(input(), session);
    expect(created).toMatchObject({ status: "draft", version: 1, slug: `integration-post-${suffix}`, readingMinutes: 1 });

    // Stale versions are refused instead of silently overwriting.
    const updated = await repo.updateNewsPost(created.id, input({ title: `Renamed post ${suffix}` }), 1, session);
    expect(updated).toMatchObject({ version: 2, slug: `renamed-post-${suffix}` });
    await expect(repo.updateNewsPost(created.id, input(), 1, session)).rejects.toBeInstanceOf(repo.NewsConflictError);

    // A cover is required to publish.
    await expect(repo.changeNewsStatus(created.id, { action: "publish" }, 2, session)).rejects.toThrow(/cover image/);
    const { post: withCover } = await attachCover(created.id);
    const live = await repo.changeNewsStatus(created.id, { action: "publish" }, withCover.version, session);
    expect(live.status).toBe("published");
    expect(await repo.getPublicNewsBySlug(live.slug)).toMatchObject({ kind: "post" });

    // Renaming a public post keeps the old link working; autoSlug no longer applies.
    const auto = await repo.updateNewsPost(created.id, input({ title: "Headline changed after launch" }), live.version, session);
    expect(auto.slug).toBe(live.slug);
    const renamed = await repo.updateNewsPost(created.id, input({ slug: `custom-${suffix}` }), auto.version, session);
    expect(await repo.getPublicNewsBySlug(live.slug)).toEqual({ kind: "redirect", slug: `custom-${suffix}` });

    // Live posts must be withdrawn before deletion.
    await expect(repo.deleteNewsPost(created.id, renamed.version, session)).rejects.toThrow(/Unpublish or archive/);
    const archived = await repo.changeNewsStatus(created.id, { action: "archive" }, renamed.version, session);
    expect(await repo.getPublicNewsBySlug(`custom-${suffix}`)).toBeNull();
    const keys = await repo.deleteNewsPost(created.id, archived.version, session);
    expect(keys).toHaveLength(2);
    expect(await repo.getNewsPostById(created.id)).toBeNull();
  });

  it("keeps scheduled posts out of public reads until their time", async () => {
    const created = await repo.createNewsPost(input({ title: `Scheduled ${suffix}`, category: "events" }), session);
    const { post } = await attachCover(created.id);
    const scheduled = await repo.changeNewsStatus(
      created.id,
      { action: "schedule", publishAt: new Date(Date.now() + 60 * 60 * 1000) },
      post.version,
      session,
    );
    expect(scheduled.status).toBe("published");
    expect(await repo.getPublicNewsBySlug(scheduled.slug)).toBeNull();
    const listed = await repo.listPublicNews({ category: "events", limit: 50 });
    expect(listed.posts.some((item) => item.id === created.id)).toBe(false);
    expect((await repo.listAdminNews({ state: "scheduled" })).some((item) => item.id === created.id)).toBe(true);
    expect((await repo.listPublicNewsForSitemap()).some((item) => item.slug === scheduled.slug)).toBe(false);
  });

  it("refuses a slug another post already uses", async () => {
    const first = await repo.createNewsPost(input({ title: `Taken ${suffix}` }), session);
    const second = await repo.createNewsPost(input({ title: `Other ${suffix}` }), session);
    await expect(repo.updateNewsPost(second.id, input({ slug: first.slug }), second.version, session)).rejects.toBeInstanceOf(
      repo.NewsSlugTakenError,
    );
  });

  it("rejects article images that belong to another post", async () => {
    const owner = await repo.createNewsPost(input({ title: `Owner ${suffix}` }), session);
    const other = await repo.createNewsPost(input({ title: `Borrower ${suffix}` }), session);
    const asset = await repo.insertNewsAsset(
      { postId: owner.id, purpose: "inline", r2Key: `test/${randomUUID()}.webp`, mime: "image/webp", width: 800, height: 600, byteSize: 1 },
      session,
    );
    const borrowed = { type: "doc", content: [{ type: "image", attrs: { src: `/news/media/${asset.id}`, alt: "Borrowed" } }] };
    await expect(repo.updateNewsPost(other.id, input({ body: borrowed }), other.version, session)).rejects.toThrow(/another post/);
    const own = await repo.updateNewsPost(owner.id, input({ body: borrowed }), owner.version, session);
    expect(own.body.content[0]).toMatchObject({ type: "image" });
  });
});
