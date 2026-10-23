import { NextResponse } from "next/server";
import { authorizeNewsRequest, newsErrorResponse, UUID_PATTERN } from "@/features/news/api.server";
import { createShareImage, NewsImageError, processCoverImage } from "@/features/news/images.server";
import { getNewsPostById, insertNewsAsset, replaceNewsCover } from "@/features/news/repository";
import { readUploadedImage, removeNewsObjects, storeNewsImage } from "@/features/news/uploads.server";
import { isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

/** Replaces the cover and regenerates the 1200×630 share image derived from it. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const auth = await authorizeNewsRequest(request, "news.manage");
  if (!auth.ok) return auth.response;
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Image storage (Cloudflare R2) is not configured." }, { status: 503 });
  }

  const stored: string[] = [];
  try {
    const form = await request.formData().catch(() => {
      throw new NewsImageError("Expected an image upload.");
    });
    const input = await readUploadedImage(form);
    const alt =
      String(form.get("alt") ?? "")
        .trim()
        .slice(0, 300) || undefined;
    if (!(await getNewsPostById(id))) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    const [coverImage, shareImage] = await Promise.all([processCoverImage(input), createShareImage(input)]);
    const cover = await storeNewsImage(id, "cover", coverImage);
    stored.push(cover.r2Key);
    const share = await storeNewsImage(id, "share", shareImage);
    stored.push(share.r2Key);

    await insertNewsAsset(cover, auth.session);
    await insertNewsAsset(share, auth.session);
    const { post, replacedKeys } = await replaceNewsCover(id, cover, share, alt, auth.session);
    stored.length = 0;
    await removeNewsObjects(replacedKeys);
    return NextResponse.json({ post, shareImageBytes: share.byteSize });
  } catch (error) {
    await removeNewsObjects(stored);
    return newsErrorResponse(error);
  }
}
