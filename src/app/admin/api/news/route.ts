import { NextResponse } from "next/server";
import { authorizeNewsRequest, newsErrorResponse, readJson } from "@/features/news/api.server";
import { newsPostInputSchema } from "@/features/news/editor-input";
import { createNewsPost } from "@/features/news/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authorizeNewsRequest(request, "news.manage");
  if (!auth.ok) return auth.response;
  try {
    const input = newsPostInputSchema.parse(await readJson(request));
    const post = await createNewsPost(input, auth.session);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return newsErrorResponse(error);
  }
}
