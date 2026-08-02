import { NextResponse } from "next/server";
import { isSameOrigin } from "@/features/admin/access";
import { getLearnerSession } from "@/features/learn/learner-auth.server";
import { saveLearnerReflection, submitLearnerActivity } from "@/features/learn/activity-submission.server";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ blockId: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 });
  const learner = await getLearnerSession();
  if (!learner) return NextResponse.json({ ok: false, error: "Learner sign-in is required." }, { status: 401 });
  try {
    const { blockId } = await params;
    const body = await request.json() as { courseSlug?: unknown; lessonSlug?: unknown; response?: unknown; idempotencyKey?: unknown; reflection?: unknown };
    const courseSlug = typeof body.courseSlug === "string" ? body.courseSlug.trim() : "";
    const lessonSlug = typeof body.lessonSlug === "string" ? body.lessonSlug.trim() : "";
    if (!courseSlug || !lessonSlug || !blockId) return NextResponse.json({ ok: false, error: "Invalid activity request." }, { status: 400 });
    const result = typeof body.reflection === "string"
      ? await saveLearnerReflection({ learnerId: learner.learnerId, courseSlug, lessonSlug, stableBlockId: blockId, body: body.reflection })
      : await submitLearnerActivity({
        learnerId: learner.learnerId,
        courseSlug,
        lessonSlug,
        stableBlockId: blockId,
        idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : "",
        response: Array.isArray(body.response) ? body.response.filter((value): value is string => typeof value === "string") : [],
      });
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "Your response could not be saved. Please try again." }, { status: 503 });
  }
}
