import { afterEach, describe, expect, it } from "vitest";
import { isAdminDatabaseConfigured } from "./db";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("admin database configuration", () => {
  it("reports configured when a database URL is present", () => {
    process.env.DATABASE_URL = "postgresql://local/example";
    expect(isAdminDatabaseConfigured()).toBe(true);
  });

  it("fails closed when no database URL is configured", () => {
    delete process.env.DATABASE_URL;
    expect(isAdminDatabaseConfigured()).toBe(false);
  });
});
