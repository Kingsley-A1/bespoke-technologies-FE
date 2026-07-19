import { NextResponse } from "next/server";
import { getPublishedReviewByIdSafe } from "@/features/admin/reviews/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

/** Public project logo for a published review (admin-uploaded only). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getPublishedReviewByIdSafe(id);
  if (!review?.logoKey) return new NextResponse(null, { status: 404 });
  if (!isR2Configured()) return new NextResponse(null, { status: 404 });

  const object = await getR2ObjectBytes(review.logoKey);
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || review.logoMime || "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
