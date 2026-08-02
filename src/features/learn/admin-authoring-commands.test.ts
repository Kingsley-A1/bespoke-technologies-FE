import { describe, expect, it, vi } from "vitest";
import { createAdminAuthoringCommands } from "./admin-authoring-commands";

describe("admin authoring commands", () => {
  it("adds a typed block only to a draft version hierarchy", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "block-1" }] });
    const commands = createAdminAuthoringCommands({ query });

    await expect(commands.appendBlock({ lessonId: "lesson-1", block: { id: "explain-one", type: "rich_text", order: 0, required: true, completionRule: "acknowledged", config: { paragraphs: ["A reviewed explanation."] } } })).resolves.toEqual({ id: "block-1" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("v.state = 'draft'"), expect.arrayContaining(["lesson-1", "explain-one", "rich_text"]));
    expect(query.mock.calls[0]?.[0]).toContain("MAX(sort_order) + 1 FROM learn_content_blocks");
    expect(query.mock.calls[0]?.[1]).toHaveLength(6);
  });

  it("refuses arbitrary block configuration before it reaches the database", async () => {
    const query = vi.fn();
    const commands = createAdminAuthoringCommands({ query });

    await expect(commands.appendBlock({ lessonId: "lesson-1", block: { id: "unsafe", type: "rich_text", order: 0, required: false, completionRule: "none", config: { paragraphs: ["<script>alert(1)</script>"] } } })).rejects.toThrow(/Text cannot contain markup/i);
    expect(query).not.toHaveBeenCalled();
  });

  it("links a first-class author to a draft version without using an Admin identity as the author record", async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ id: "author-1" }] }).mockResolvedValueOnce({ rows: [{ author_id: "author-1" }] });
    const commands = createAdminAuthoringCommands({ query });

    await expect(commands.attachAuthor({ courseVersionId: "version-1", author: { slug: "reviewer-one", displayName: "Reviewer One" } })).resolves.toEqual({ authorId: "author-1" });
    expect(query.mock.calls[0]?.[0]).toContain("learn_authors");
    expect(query.mock.calls[1]?.[0]).toContain("learn_course_authors");
    expect(query.mock.calls[1]?.[0]).toContain("v.state = 'draft'");
  });

  it("updates factual course metadata only on a private draft", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "version-1" }] });
    const commands = createAdminAuthoringCommands({ query });

    await expect(commands.updateCourseDraft({ courseVersionId: "version-1", course: { title: "Reviewed course", summary: "A concise summary.", description: "A complete description.", outcomes: ["Use the reviewed workflow"], prerequisites: [], formats: ["Reading"], accessPolicy: "manual_grant", seoTitle: "Reviewed course", seoDescription: "A factual SEO description." } })).resolves.toEqual({ id: "version-1" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("state = 'draft'"), expect.arrayContaining(["version-1", "Reviewed course", "manual_grant"]));
    expect(query.mock.calls[0]?.[1]).toContain(JSON.stringify(["Use the reviewed workflow"]));
  });

  it("edits, duplicates, and removes a content block only while its version is a draft", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "block-2" }] });
    const commands = createAdminAuthoringCommands({ query });
    const block = { id: "review", type: "rich_text" as const, order: 0, required: false, completionRule: "none" as const, config: { paragraphs: ["Edited reviewed copy."] } };

    await expect(commands.updateBlock({ blockRowId: "block-1", block })).resolves.toEqual({ id: "block-2" });
    await expect(commands.duplicateBlock({ sourceBlockId: "block-1", stableId: "review-copy" })).resolves.toEqual({ id: "block-2" });
    await expect(commands.removeBlock({ blockRowId: "block-1" })).resolves.toEqual({ id: "block-2" });
    for (const [sql] of query.mock.calls) expect(sql).toContain("v.state = 'draft'");
  });
});
