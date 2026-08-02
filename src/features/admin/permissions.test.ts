import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";

describe("admin role permissions", () => {
  it("allows managers to run daily operations", () => {
    expect(hasPermission("admin_manager", "crm.manage")).toBe(true);
    expect(hasPermission("admin_manager", "billing.issue")).toBe(true);
    expect(hasPermission("admin_manager", "payments.record")).toBe(true);
    expect(hasPermission("admin_manager", "digital_audits.manage")).toBe(true);
    expect(hasPermission("admin_manager", "learn.manage")).toBe(true);
  });

  it("keeps sensitive controls founder-only", () => {
    expect(hasPermission("admin_manager", "users.manage")).toBe(false);
    expect(hasPermission("admin_manager", "payments.reverse")).toBe(false);
    expect(hasPermission("admin_manager", "billing.void")).toBe(false);
    expect(hasPermission("founder_admin", "users.manage")).toBe(true);
    expect(hasPermission("founder_admin", "exports.all")).toBe(true);
    expect(hasPermission("admin_manager", "digital_audits.export")).toBe(false);
    expect(hasPermission("founder_admin", "digital_audits.export")).toBe(true);
  });

  it("separates Learn draft authoring from consequential publishing controls", () => {
    expect(hasPermission("admin_manager", "learn.manage")).toBe(true);
    expect(hasPermission("admin_manager", "learn.publish")).toBe(false);
    expect(hasPermission("founder_admin", "learn.publish")).toBe(true);
  });

  it("limits employees to their own work and learning surfaces", () => {
    expect(hasPermission("employee", "dashboard.view")).toBe(true);
    expect(hasPermission("employee", "work.view")).toBe(true);
    expect(hasPermission("employee", "learning.view")).toBe(true);
    expect(hasPermission("employee", "projects.manage")).toBe(false);
    expect(hasPermission("employee", "crm.manage")).toBe(false);
    expect(hasPermission("employee", "learning.manage")).toBe(false);
    expect(hasPermission("employee", "learn.manage")).toBe(false);
    expect(hasPermission("employee", "users.manage")).toBe(false);
    expect(hasPermission("employee", "digital_audits.view")).toBe(false);
  });
});
