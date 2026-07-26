import { NextResponse } from "next/server";
import { getTeamMember } from "@/features/admin/team/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getTeamMember((await params).id).catch(() => null);
  if (!member?.portraitKey || member.status !== "published" || !isR2Configured()) return new NextResponse(null, { status: 404 });
  const object = await getR2ObjectBytes(member.portraitKey);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || member.portraitMime || "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
