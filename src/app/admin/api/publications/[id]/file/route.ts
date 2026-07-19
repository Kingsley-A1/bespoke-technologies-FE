import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/access";
import { getPublicationById } from "@/features/admin/publications/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

/**
 * Admin-only document stream. This is the ONLY way a handover document file can
 * be retrieved — there is no public route for it. Guarded by the
 * `publications.manage` permission and served no-store.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("publications.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { id } = await params;
  const publication = await getPublicationById(id);
  if (!publication || !publication.documentKey) return new NextResponse(null, { status: 404 });
  if (!isR2Configured()) return new NextResponse(null, { status: 404 });

  const object = await getR2ObjectBytes(publication.documentKey);
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || publication.documentMime || "application/pdf",
      "Content-Disposition": `inline; filename="${publication.slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
