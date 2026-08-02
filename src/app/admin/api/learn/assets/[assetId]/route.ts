import { NextResponse } from "next/server";
import { assertRecentAdminPermission } from "@/features/admin/access";
import { adminQuery } from "@/features/admin/db";
import { getR2ObjectBytes } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const permission = await assertRecentAdminPermission("learn.manage");
  if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status });
  const { assetId } = await params;
  const result = await adminQuery<{ r2_key: string; filename: string; mime_type: string }>("SELECT r2_key, filename, mime_type FROM learn_assets WHERE id = $1", [assetId]);
  const asset = result.rows[0];
  if (!asset) return NextResponse.json({ ok: false, error: "Asset not found." }, { status: 404 });
  const stored = await getR2ObjectBytes(asset.r2_key);
  if (!stored) return NextResponse.json({ ok: false, error: "Asset is unavailable." }, { status: 404 });
  return new NextResponse(new Uint8Array(stored.bytes).buffer, { headers: { "content-type": stored.contentType ?? asset.mime_type, "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.filename)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex, nofollow" } });
}
