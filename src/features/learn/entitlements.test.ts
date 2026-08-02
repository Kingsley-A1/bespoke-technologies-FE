import { describe, expect, it } from "vitest";
import { resolveCourseAccess } from "./entitlements";
import type { CourseAccessRepository } from "./entitlements";

const courseId = "course-1";
const learnerId = "learner-1";
const now = new Date("2026-08-02T10:00:00.000Z");

describe("server-side course entitlements", () => {
  it("permits a public preview without a learner identity", async () => {
    const result = await resolveCourseAccess(
      { courseId, now },
      { findCourseAccessPolicy: async () => ({ accessPolicy: "public_preview" }) },
    );

    expect(result).toEqual({ allowed: true, mode: "preview" });
  });

  it("requires a verified learner for authenticated-free content", async () => {
    const repository = {
      findCourseAccessPolicy: async () => ({ accessPolicy: "authenticated_free" as const }),
    } satisfies CourseAccessRepository;

    await expect(resolveCourseAccess({ courseId, now }, repository)).resolves.toEqual({ allowed: false, reason: "sign_in_required" });
    await expect(resolveCourseAccess({ courseId, learnerId, now }, repository)).resolves.toEqual({ allowed: true, mode: "full" });
  });

  it("denies a revoked manual grant before protected content can render", async () => {
    const result = await resolveCourseAccess(
      { courseId, learnerId, now },
      {
        findCourseAccessPolicy: async () => ({ accessPolicy: "manual_grant" }),
        findEntitlement: async () => ({ state: "revoked", revokedAt: "2026-08-02T09:59:59.000Z" }),
      },
    );

    expect(result).toEqual({ allowed: false, reason: "revoked" });
  });

  it("fails closed when the course is not a published course", async () => {
    await expect(
      resolveCourseAccess({ courseId, learnerId, now }, { findCourseAccessPolicy: async () => null }),
    ).resolves.toEqual({ allowed: false, reason: "unavailable" });
  });
});
