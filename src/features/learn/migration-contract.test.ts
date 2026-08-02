import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Bespoke Learn migration contract", () => {
  it("is additive, has no catalogue fixtures, and makes lesson URLs unique within a course version", async () => {
    const sql = await readFile("migrations/015_create_bespoke_learn.sql", "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS learn_learners");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS learn_course_versions");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS learn_activity_attempts");
    expect(sql).toMatch(/course_version_id UUID NOT NULL REFERENCES learn_course_versions\(id\)/);
    expect(sql).toContain("UNIQUE (course_version_id, slug)");
    expect(sql).not.toMatch(/INSERT\s+INTO\s+learn_(courses|modules|lessons)/i);
  });
});
