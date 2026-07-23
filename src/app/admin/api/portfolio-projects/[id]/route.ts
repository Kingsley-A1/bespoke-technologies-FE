import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import {
  deletePortfolioProject,
  getPortfolioProject,
  updatePortfolioProject,
} from "@/features/admin/portfolio/repository";
import { imageExtension, parsePortfolioForm, validatePortfolioImage } from "@/features/admin/portfolio/validation";
import { deleteR2Object, isR2Configured, putR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";

function refreshPortfolio() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/portfolio");
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("projects.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { id } = await context.params;
  const existing = await getPortfolioProject(id);
  if (!existing) return NextResponse.json({ error: "Portfolio project not found." }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form submission." }, { status: 400 });
  }
  const imageResult = validatePortfolioImage(form.get("image"));
  if ("error" in imageResult) return NextResponse.json({ error: imageResult.error }, { status: 400 });
  if (imageResult.file && !isR2Configured()) {
    return NextResponse.json({ error: "Project image storage is not configured." }, { status: 503 });
  }

  const nextImageKey = imageResult.file
    ? `portfolio/${id}-${randomUUID()}.${imageExtension(imageResult.file.type)}`
    : existing.imageKey;
  const parsed = parsePortfolioForm(form, {
    id,
    imageUrl: existing.imageUrl || (existing.imageKey ? "" : existing.image),
    imageKey: nextImageKey,
    imageMime: imageResult.file?.type || existing.imageMime,
  });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    if (imageResult.file && nextImageKey) {
      await putR2Object({
        key: nextImageKey,
        body: Buffer.from(await imageResult.file.arrayBuffer()),
        contentType: imageResult.file.type,
      });
    }
    const result = await updatePortfolioProject(id, parsed.input, access.session);
    if (imageResult.file && result.previousImageKey && result.previousImageKey !== nextImageKey) {
      await deleteR2Object(result.previousImageKey).catch(() => undefined);
    }
    refreshPortfolio();
    return NextResponse.json({ ok: true, project: result.project });
  } catch (error) {
    if (imageResult.file && nextImageKey) await deleteR2Object(nextImageKey).catch(() => undefined);
    console.error("Portfolio project update failed", error);
    return NextResponse.json({ error: "The project could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("projects.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { id } = await context.params;
  const result = await deletePortfolioProject(id, access.session);
  if (result.imageKey && isR2Configured()) await deleteR2Object(result.imageKey).catch(() => undefined);
  refreshPortfolio();
  return NextResponse.json({ ok: true });
}
