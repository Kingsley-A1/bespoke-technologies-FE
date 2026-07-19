import { NextResponse } from "next/server";
import { getPublicationById } from "@/features/admin/publications/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

/**
 * Public cover image for a publication. Cover images are safe to expose for
 * every kind (including handover documents); only the underlying document file
 * is access-controlled.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publication = await getPublicationById(id);
  if (!publication || publication.status !== "published" || !publication.coverKey) {
    return new NextResponse(null, { status: 404 });
  }
  if (!isR2Configured()) return new NextResponse(null, { status: 404 });

  const object = await getR2ObjectBytes(publication.coverKey);
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
