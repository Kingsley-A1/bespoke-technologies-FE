import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { updateProjectCompletion } from "@/features/admin/projects/completion";
import { getAdminSnapshot } from "@/features/admin/repository";
import { deleteR2Object, isR2Configured, putR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";
const ALLOWED = ["image/png", "image/jpeg"];
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("projects.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const id = (await params).id;
  const project = (await getAdminSnapshot()).projects.find((candidate) => candidate.id === id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected a multipart form submission." }, { status: 400 });
  const parsed = z.object({
    projectType: z.string().trim().min(2).max(100),
    description: z.string().trim().min(20).max(1000),
    startDate: z.iso.date(),
    completedAt: z.iso.date(),
    portfolioProjectId: z.string().trim().max(160).optional(),
    finalInvoiceId: z.union([z.string().uuid(), z.literal("")]).optional(),
    commercialMode: z.enum(["paid", "free", "donation", "undisclosed"]),
    showValuePublicly: z.string().optional(),
    valueNote: z.string().trim().max(240).optional(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the completion details." }, { status: 400 });
  const logo = form.get("projectLogo");
  if (logo instanceof File && logo.size > 0 && (!ALLOWED.includes(logo.type) || logo.size > MAX_BYTES)) {
    return NextResponse.json({ error: "Project logo must be a PNG or JPEG up to 3 MB." }, { status: 400 });
  }
  if (logo instanceof File && logo.size > 0 && !isR2Configured()) return NextResponse.json({ error: "Project logo storage is not configured." }, { status: 503 });
  const nextKey = logo instanceof File && logo.size > 0
    ? `projects/logos/${id}-${randomUUID()}.${logo.type === "image/png" ? "png" : "jpg"}`
    : project.projectLogoKey;
  try {
    if (logo instanceof File && logo.size > 0 && nextKey) {
      await putR2Object({ key: nextKey, body: Buffer.from(await logo.arrayBuffer()), contentType: logo.type });
    }
    const updated = await updateProjectCompletion(id, {
      ...parsed.data,
      portfolioProjectId: parsed.data.portfolioProjectId || undefined,
      finalInvoiceId: parsed.data.finalInvoiceId || undefined,
      showValuePublicly: parsed.data.showValuePublicly === "on",
      projectLogoKey: nextKey,
      projectLogoMime: logo instanceof File && logo.size > 0 ? logo.type : project.projectLogoMime,
    }, access.session);
    if (logo instanceof File && logo.size > 0 && project.projectLogoKey && project.projectLogoKey !== nextKey) {
      await deleteR2Object(project.projectLogoKey).catch(() => undefined);
    }
    revalidatePath("/admin/projects");
    revalidatePath("/admin/certificates");
    return NextResponse.json({ ok: true, project: updated });
  } catch (error) {
    if (logo instanceof File && logo.size > 0 && nextKey) await deleteR2Object(nextKey).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The completion record could not be saved." }, { status: 400 });
  }
}
