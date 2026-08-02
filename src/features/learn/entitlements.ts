import type { LearnAccessPolicy } from "./types";

export type AccessDecision =
  | { allowed: true; mode: "preview" | "full" }
  | { allowed: false; reason: "unavailable" | "sign_in_required" | "access_required" | "revoked" | "expired" };

export type CourseAccessRepository = {
  findCourseAccessPolicy(courseId: string): Promise<{ accessPolicy: LearnAccessPolicy } | null>;
  findEntitlement?(input: { learnerId: string; courseId: string }): Promise<{
    state: "active" | "revoked" | "expired";
    expiresAt?: string | null;
    revokedAt?: string | null;
  } | null>;
};

export async function resolveCourseAccess(
  input: { courseId: string; learnerId?: string; now: Date },
  repository: CourseAccessRepository,
): Promise<AccessDecision> {
  const policy = await repository.findCourseAccessPolicy(input.courseId);
  if (!policy || policy.accessPolicy === "unavailable") return { allowed: false, reason: "unavailable" };
  if (policy.accessPolicy === "public_preview") return { allowed: true, mode: "preview" };
  if (!input.learnerId) return { allowed: false, reason: "sign_in_required" };
  if (policy.accessPolicy === "authenticated_free") return { allowed: true, mode: "full" };

  const entitlement = await repository.findEntitlement?.({ learnerId: input.learnerId, courseId: input.courseId });
  if (!entitlement) return { allowed: false, reason: "access_required" };
  if (entitlement.state === "revoked" || entitlement.revokedAt) return { allowed: false, reason: "revoked" };
  if (
    entitlement.state === "expired"
    || (entitlement.expiresAt && new Date(entitlement.expiresAt).getTime() <= input.now.getTime())
  ) {
    return { allowed: false, reason: "expired" };
  }
  return { allowed: true, mode: "full" };
}
