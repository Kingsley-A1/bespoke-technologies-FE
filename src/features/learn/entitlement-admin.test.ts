import { describe, expect, it, vi } from "vitest";
import { createEntitlementAdminService } from "./entitlement-admin";

describe("entitlement admin service", () => {
  it("grants and revokes an individual course entitlement through the server-side repository", async () => {
    const repository = { findLearnerByEmail: vi.fn().mockResolvedValue({ id: "learner-1" }), grantManual: vi.fn().mockResolvedValue(undefined), revokeManual: vi.fn().mockResolvedValue(true), recordAudit: vi.fn().mockResolvedValue(undefined) };
    const service = createEntitlementAdminService({ repository });

    await expect(service.grant({ learnerEmail: "Learner@example.com", courseId: "course-1", actorAdminUserId: "admin-1", actorLabel: "Admin" })).resolves.toEqual({ ok: true });
    await expect(service.revoke({ learnerEmail: "learner@example.com", courseId: "course-1", actorAdminUserId: "admin-1", actorLabel: "Admin", reason: "Access no longer required" })).resolves.toEqual({ ok: true });
    expect(repository.grantManual).toHaveBeenCalledWith(expect.objectContaining({ learnerId: "learner-1", courseId: "course-1" }));
    expect(repository.revokeManual).toHaveBeenCalledWith(expect.objectContaining({ learnerId: "learner-1", courseId: "course-1" }));
  });

  it("does not disclose or create a learner when the email is unknown", async () => {
    const repository = { findLearnerByEmail: vi.fn().mockResolvedValue(null), grantManual: vi.fn(), revokeManual: vi.fn(), recordAudit: vi.fn() };
    const service = createEntitlementAdminService({ repository });

    await expect(service.grant({ learnerEmail: "unknown@example.com", courseId: "course-1", actorAdminUserId: "admin-1", actorLabel: "Admin" })).resolves.toEqual({ ok: false, error: "Learner not found." });
    expect(repository.grantManual).not.toHaveBeenCalled();
  });
});
