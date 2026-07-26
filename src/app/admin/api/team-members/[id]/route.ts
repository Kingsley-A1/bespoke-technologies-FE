import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { archiveTeamMember, getTeamMember, updateTeamMember } from "@/features/admin/team/repository";
import { parseTeamMemberForm, teamImageExtension, validateTeamPortrait } from "@/features/admin/team/validation";
import { deleteR2Object, isR2Configured, putR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";

function refresh() {
  revalidatePath("/team");
  revalidatePath("/admin/team");
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("team.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const id = (await params).id;
  const existing = await getTeamMember(id);
  if (!existing) return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected a multipart form submission." }, { status: 400 });
  const portrait = validateTeamPortrait(form.get("portrait"));
  if ("error" in portrait) return NextResponse.json({ error: portrait.error }, { status: 400 });
  if (portrait.file && !isR2Configured()) return NextResponse.json({ error: "Team portrait storage is not configured." }, { status: 503 });
  const key = portrait.file ? `team/portraits/${id}-${randomUUID()}.${teamImageExtension(portrait.file.type)}` : existing.portraitKey;
  const parsed = parseTeamMemberForm(form, { key, mime: portrait.file?.type || existing.portraitMime });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    if (portrait.file && key) await putR2Object({ key, body: Buffer.from(await portrait.file.arrayBuffer()), contentType: portrait.file.type });
    const result = await updateTeamMember(id, parsed.input, access.session);
    if (portrait.file && result.previousPortraitKey && result.previousPortraitKey !== key) {
      await deleteR2Object(result.previousPortraitKey).catch(() => undefined);
    }
    refresh();
    return NextResponse.json({ ok: true, member: result.member });
  } catch (error) {
    if (portrait.file && key) await deleteR2Object(key).catch(() => undefined);
    const duplicate = typeof error === "object" && error && "code" in error && String(error.code) === "23505";
    return NextResponse.json({ error: duplicate ? "That profile slug is already in use." : "The team member could not be updated." }, { status: duplicate ? 409 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("team.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const member = await archiveTeamMember((await params).id, access.session);
  if (!member) return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  refresh();
  return NextResponse.json({ ok: true });
}

