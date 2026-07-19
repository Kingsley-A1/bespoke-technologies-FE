import { NextResponse } from "next/server";
import { getPublicationBySlug } from "@/features/admin/publications/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

/**
 * Public document stream for READABLE publications only (books and research).
 * Handover documents are never downloadable — `is_downloadable` is false for
 * them and this route refuses to serve them, and they have no other public
 * endpoint. `?download=1` forces an attachment; otherwise the PDF renders
 * inline for the in-browser reader.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = await getPublicationBySlug(slug);

  if (
    !publication ||
    publication.status !== "published" ||
    !publication.isDownloadable ||
    !publication.documentKey
  ) {
    return new NextResponse(null, { status: 404 });
  }
  if (!isR2Configured()) return new NextResponse(null, { status: 404 });

  const object = await getR2ObjectBytes(publication.documentKey);
  if (!object) return new NextResponse(null, { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = `${publication.slug}.pdf`;

  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || publication.documentMime || "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
