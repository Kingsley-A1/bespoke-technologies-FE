import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import { adminQuery } from "@/features/admin/db";
import { deleteR2Object, putR2Object } from "@/lib/storage/r2";
import { safeLearnAssetFilename, validateLearnAssetMetadata } from "@/features/learn/assets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 });
  const permission = await assertRecentAdminPermission("learn.manage");
  if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status });
  try {
    const data = await request.formData();
    const courseId = typeof data.get("courseId") === "string" ? String(data.get("courseId")).trim() : "";
    const file = data.get("file");
    if (!courseId || !(file instanceof File)) return NextResponse.json({ ok: false, error: "A course and file are required." }, { status: 400 });
    const decorative = data.get("decorative") === "true";
    const metadata = {
      filename: file.name,
      mimeType: file.type,
      byteSize: file.size,
      decorative,
      altText: typeof data.get("altText") === "string" ? String(data.get("altText")).trim() : undefined,
      caption: typeof data.get("caption") === "string" ? String(data.get("caption")).trim() : undefined,
      transcript: typeof data.get("transcript") === "string" ? String(data.get("transcript")).trim() : undefined,
    };
    const validation = validateLearnAssetMetadata(metadata);
    if (!validation.valid) return NextResponse.json({ ok: false, error: validation.errors.join(" ") }, { status: 400 });
    const course = await adminQuery<{ id: string }>("SELECT id FROM learn_courses WHERE id = $1 AND state = 'active'", [courseId]);
    if (!course.rows[0]) return NextResponse.json({ ok: false, error: "Course not found." }, { status: 404 });
    const key = `learn/${courseId}/${randomUUID()}-${safeLearnAssetFilename(file.name)}`;
    await putR2Object({ key, body: Buffer.from(await file.arrayBuffer()), contentType: file.type });
    try {
      const created = await adminQuery<{ id: string }>(
        `INSERT INTO learn_assets (course_id, r2_key, filename, mime_type, byte_size, alt_text, caption, transcript, decorative, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [courseId, key, file.name, file.type, file.size, metadata.altText ?? null, metadata.caption ?? null, metadata.transcript ?? null, decorative, permission.session.userId],
      );
      const id = created.rows[0]?.id;
      if (!id) throw new Error("Asset record could not be created.");
      return NextResponse.json({ ok: true, asset: { id, filename: file.name, mimeType: file.type, byteSize: file.size } }, { status: 201 });
    } catch (error) {
      await deleteR2Object(key).catch(() => undefined);
      throw error;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Asset upload could not be completed. Please try again." }, { status: 503 });
  }
}
