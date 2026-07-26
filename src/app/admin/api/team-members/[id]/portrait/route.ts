import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/access";
import { getTeamMember } from "@/features/admin/team/repository";
import { getR2ObjectBytes } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("team.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const member = await getTeamMember((await params).id);
  if (!member?.portraitKey) return new NextResponse(null, { status: 404 });
  const object = await getR2ObjectBytes(member.portraitKey);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || member.portraitMime || "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}

