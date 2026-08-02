import { NextResponse } from "next/server";
import { isSameOrigin } from "@/features/admin/access";
import { getLearnerSession } from "@/features/learn/learner-auth.server";
import { recordLearnerProgress } from "@/features/learn/progress-write.server";

export const runtime = "nodejs";

function position(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] >= 0 && entry[1] <= 86_400);
  return entries.length === Object.keys(value).length ? Object.fromEntries(entries) : undefined;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 });
  const learner = await getLearnerSession();
  if (!learner) return NextResponse.json({ ok: false, error: "Learner sign-in is required." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const blockId = typeof body.blockId === "string" ? body.blockId.trim() : "";
    const courseSlug = typeof body.courseSlug === "string" ? body.courseSlug.trim() : "";
    const lessonSlug = typeof body.lessonSlug === "string" ? body.lessonSlug.trim() : "";
    const completed = body.completed === true;
    const savedPosition = position(body.position);
    if (!blockId || !courseSlug || !lessonSlug || (!completed && !savedPosition)) return NextResponse.json({ ok: false, error: "Invalid progress update." }, { status: 400 });
    const result = await recordLearnerProgress({ learnerId: learner.learnerId, courseSlug, lessonSlug, stableBlockId: blockId, completed, position: savedPosition });
    if (!result.ok) return NextResponse.json({ ok: false, error: "Progress is unavailable for this course." }, { status: result.status });
    return NextResponse.json({ ok: true, completed: result.completed });
  } catch {
    return NextResponse.json({ ok: false, error: "Progress could not be saved. Please try again." }, { status: 503 });
  }
}
