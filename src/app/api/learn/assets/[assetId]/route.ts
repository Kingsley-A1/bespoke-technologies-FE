import { NextResponse } from "next/server";
import { adminQuery } from "@/features/admin/db";
import { getR2ObjectBytes } from "@/lib/storage/r2";
import { getLearnerSession } from "@/features/learn/learner-auth.server";
import { resolveCourseAccess } from "@/features/learn/entitlements";
import { createLearnRepository } from "@/features/learn/repository";

export const runtime = "nodejs";

const accessRepository = createLearnRepository({ query: adminQuery });

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const assetResult = await adminQuery<{ course_id: string; r2_key: string; filename: string; mime_type: string }>(
    `SELECT a.course_id, a.r2_key, a.filename, a.mime_type
     FROM learn_assets a JOIN learn_courses c ON c.id = a.course_id
     JOIN learn_course_versions v ON v.course_id = c.id
     WHERE a.id = $1 AND c.state = 'active' AND v.state = 'published' LIMIT 1`,
    [assetId],
  );
  const asset = assetResult.rows[0];
  if (!asset) return NextResponse.json({ ok: false, error: "Asset not found." }, { status: 404 });
  const learner = await getLearnerSession();
  const access = await resolveCourseAccess({ courseId: asset.course_id, learnerId: learner?.learnerId, now: new Date() }, accessRepository);
  if (!access.allowed) return NextResponse.json({ ok: false, error: "Course access is required." }, { status: access.reason === "sign_in_required" ? 401 : 403 });
  const stored = await getR2ObjectBytes(asset.r2_key);
  if (!stored) return NextResponse.json({ ok: false, error: "Asset is unavailable." }, { status: 404 });
  return new NextResponse(new Uint8Array(stored.bytes).buffer, {
    headers: {
      "content-type": stored.contentType ?? asset.mime_type,
      "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, max-age=300",
    },
  });
}
