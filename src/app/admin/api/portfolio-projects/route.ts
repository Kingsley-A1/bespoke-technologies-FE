import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { createPortfolioProject } from "@/features/admin/portfolio/repository";
import { imageExtension, parsePortfolioForm, validatePortfolioImage } from "@/features/admin/portfolio/validation";
import { deleteR2Object, isR2Configured, putR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await assertAdminPermission("projects.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isR2Configured()) return NextResponse.json({ error: "Project image storage is not configured." }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form submission." }, { status: 400 });
  }
  const imageResult = validatePortfolioImage(form.get("image"));
  if ("error" in imageResult) return NextResponse.json({ error: imageResult.error }, { status: 400 });
  if (!imageResult.file) return NextResponse.json({ error: "Upload a finished-project image." }, { status: 400 });
  const screenshotResult = validatePortfolioImage(form.get("heroScreenshot"));
  if ("error" in screenshotResult) {
    return NextResponse.json({ error: screenshotResult.error }, { status: 400 });
  }

  const id = String(form.get("id") ?? "").trim().toLowerCase();
  const imageKey = `portfolio/${id || "project"}-${randomUUID()}.${imageExtension(imageResult.file.type)}`;
  const heroScreenshotKey = screenshotResult.file
    ? `portfolio/hero/${id || "project"}-${randomUUID()}.${imageExtension(screenshotResult.file.type)}`
    : undefined;
  const parsed = parsePortfolioForm(form, {
    imageUrl: "",
    imageKey,
    imageMime: imageResult.file.type,
    heroScreenshotKey,
    heroScreenshotMime: screenshotResult.file?.type,
  });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await putR2Object({
      key: imageKey,
      body: Buffer.from(await imageResult.file.arrayBuffer()),
      contentType: imageResult.file.type,
    });
    if (screenshotResult.file && heroScreenshotKey) {
      await putR2Object({
        key: heroScreenshotKey,
        body: Buffer.from(await screenshotResult.file.arrayBuffer()),
        contentType: screenshotResult.file.type,
      });
    }
    const project = await createPortfolioProject(parsed.input, access.session);
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin/portfolio");
    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    await deleteR2Object(imageKey).catch(() => undefined);
    if (heroScreenshotKey) {
      await deleteR2Object(heroScreenshotKey).catch(() => undefined);
    }
    console.error("Portfolio project creation failed", error);
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const message = code === "23505" ? "A portfolio project already uses this ID." : "The project could not be saved.";
    return NextResponse.json({ error: message }, { status: code === "23505" ? 409 : 500 });
  }
}
