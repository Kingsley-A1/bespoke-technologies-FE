import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import {
  deleteSiteAsset,
  isSiteAssetKey,
  upsertSiteAsset,
} from "@/features/admin/site-assets/repository";
import { deleteR2Object, isR2Configured, putR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";

const ALLOWED_IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return "webp";
}

async function cleanupR2Object(key?: string) {
  if (!key) return;
  try {
    await deleteR2Object(key);
  } catch {
    // Replacement already succeeded; an orphaned object is acceptable.
  }
}

/** Upload or replace one appearance slot (multipart: key + image). */
export async function POST(request: Request) {
  const access = await assertRecentAdminPermission("settings.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Image storage is not configured. Add the Cloudflare R2 environment variables." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form submission." }, { status: 400 });
  }

  const key = String(form.get("key") ?? "");
  if (!isSiteAssetKey(key)) {
    return NextResponse.json({ error: "Unknown appearance slot." }, { status: 400 });
  }

  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_MIME.includes(image.type)) {
    return NextResponse.json({ error: "The image must be a PNG, JPEG, or WebP file." }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "The image exceeds the 5 MB limit." }, { status: 400 });
  }

  const r2Key = `site/appearance/${key}-${randomUUID()}.${extensionForMime(image.type)}`;
  await putR2Object({
    key: r2Key,
    body: Buffer.from(await image.arrayBuffer()),
    contentType: image.type,
  });

  const { previousR2Key } = await upsertSiteAsset(
    { assetKey: key, r2Key, mime: image.type },
    access.session,
  );
  await cleanupR2Object(previousR2Key);

  revalidatePath("/");
  return NextResponse.json({ ok: true, key }, { status: 201 });
}

/** Clear one appearance slot so the designed fallback renders again. */
export async function DELETE(request: Request) {
  const access = await assertRecentAdminPermission("settings.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") ?? "");
  if (!isSiteAssetKey(key)) {
    return NextResponse.json({ error: "Unknown appearance slot." }, { status: 400 });
  }

  const { removedR2Key } = await deleteSiteAsset(key, access.session);
  await cleanupR2Object(removedR2Key);

  revalidatePath("/");
  return NextResponse.json({ ok: true, key });
}
