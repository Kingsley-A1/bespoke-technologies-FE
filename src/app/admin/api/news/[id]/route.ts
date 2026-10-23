import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeNewsRequest, newsErrorResponse, readJson, UUID_PATTERN } from "@/features/news/api.server";
import { newsSaveRequestSchema } from "@/features/news/editor-input";
import { deleteNewsPost, updateNewsPost } from "@/features/news/repository";
import { deleteR2Object, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const auth = await authorizeNewsRequest(request, "news.manage");
  if (!auth.ok) return auth.response;
  try {
    const { version, ...input } = newsSaveRequestSchema.parse(await readJson(request));
    const post = await updateNewsPost(id, input, version, auth.session);
    return NextResponse.json({ post });
  } catch (error) {
    return newsErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const auth = await authorizeNewsRequest(request, "news.publish", { recent: true });
  if (!auth.ok) return auth.response;
  try {
    const { version } = z.object({ version: z.number().int().min(1) }).parse(await readJson(request));
    const keys = await deleteNewsPost(id, version, auth.session);
    if (isR2Configured()) await Promise.all(keys.map((key) => deleteR2Object(key).catch(() => undefined)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return newsErrorResponse(error);
  }
}
