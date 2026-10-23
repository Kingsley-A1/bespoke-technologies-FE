import { NextResponse } from "next/server";
import { authorizeNewsRequest, newsErrorResponse, UUID_PATTERN } from "@/features/news/api.server";
import { newsMediaPath } from "@/features/news/content";
import { NewsImageError, processInlineImage } from "@/features/news/images.server";
import { getNewsPostById, insertNewsAsset } from "@/features/news/repository";
import { readUploadedImage, removeNewsObjects, storeNewsImage } from "@/features/news/uploads.server";
import { isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

/** Uploads an in-article image and returns the URL the editor inserts. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const auth = await authorizeNewsRequest(request, "news.manage");
  if (!auth.ok) return auth.response;
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Image storage (Cloudflare R2) is not configured." }, { status: 503 });
  }

  let storedKey: string | undefined;
  try {
    const form = await request.formData().catch(() => {
      throw new NewsImageError("Expected an image upload.");
    });
    const input = await readUploadedImage(form);
    if (!(await getNewsPostById(id))) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const asset = await storeNewsImage(id, "inline", await processInlineImage(input));
    storedKey = asset.r2Key;
    await insertNewsAsset(asset, auth.session);
    storedKey = undefined;
    return NextResponse.json({ src: newsMediaPath(asset.id), width: asset.width, height: asset.height }, { status: 201 });
  } catch (error) {
    if (storedKey) await removeNewsObjects([storedKey]);
    return newsErrorResponse(error);
  }
}
