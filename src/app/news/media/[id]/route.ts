import { NextResponse } from "next/server";
import { getNewsAsset } from "@/features/news/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Serves What's New images (covers, 1200×630 share images and in-article
 * images). Asset ids are random and objects are never rewritten — a replaced
 * image gets a new id — so responses are cached as immutable by browsers,
 * the CDN and link-preview crawlers such as WhatsApp.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id) || !isR2Configured()) return new NextResponse(null, { status: 404 });
  const asset = await getNewsAsset(id);
  if (!asset) return new NextResponse(null, { status: 404 });
  const object = await getR2ObjectBytes(asset.r2Key);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": asset.mime,
      "Content-Length": String(object.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
