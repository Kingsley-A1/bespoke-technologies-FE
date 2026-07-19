import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import { setReviewLogo } from "@/features/admin/reviews/repository";
import { deleteR2Object, isR2Configured, putR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";

const ALLOWED_IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function extensionForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return "webp";
}

/** Admin-only: set/replace the project logo shown with a review and its OG card. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertRecentAdminPermission("reviews.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Image storage is not configured. Add the Cloudflare R2 environment variables." },
      { status: 503 },
    );
  }

  const { id } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form submission." }, { status: 400 });
  }

  const image = form.get("logo");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Choose a logo image to upload." }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_MIME.includes(image.type)) {
    return NextResponse.json({ error: "The logo must be a PNG, JPEG, or WebP image." }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "The logo exceeds the 2 MB limit." }, { status: 400 });
  }

  const r2Key = `reviews/logos/${id}-${randomUUID()}.${extensionForMime(image.type)}`;
  await putR2Object({
    key: r2Key,
    body: Buffer.from(await image.arrayBuffer()),
    contentType: image.type,
  });

  const result = await setReviewLogo(id, { logoKey: r2Key, logoMime: image.type }, access.session);
  if (!result) {
    await deleteR2Object(r2Key).catch(() => undefined);
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  if (result.previousLogoKey) {
    await deleteR2Object(result.previousLogoKey).catch(() => undefined);
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return NextResponse.json({ ok: true }, { status: 201 });
}
