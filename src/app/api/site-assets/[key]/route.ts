import { NextResponse } from "next/server";
import { getSiteAsset, isSiteAssetKey } from "@/features/admin/site-assets/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

/**
 * Public stream for admin-managed appearance assets (hero screenshots).
 * Only allowlisted slot keys resolve; everything else 404s.
 */
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isSiteAssetKey(key)) return new NextResponse(null, { status: 404 });
  if (!isR2Configured()) return new NextResponse(null, { status: 404 });

  let asset;
  try {
    asset = await getSiteAsset(key);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  if (!asset) return new NextResponse(null, { status: 404 });

  const object = await getR2ObjectBytes(asset.r2Key);
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || asset.mime || "image/png",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
