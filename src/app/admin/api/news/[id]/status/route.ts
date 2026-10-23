import { NextResponse } from "next/server";
import { authorizeNewsRequest, newsErrorResponse, readJson, UUID_PATTERN } from "@/features/news/api.server";
import { newsStatusRequestSchema } from "@/features/news/editor-input";
import { changeNewsStatus } from "@/features/news/repository";
import { NewsTransitionError, parseLagosDateTime, type NewsStatusCommand } from "@/features/news/status";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const auth = await authorizeNewsRequest(request, "news.publish", { recent: true });
  if (!auth.ok) return auth.response;
  try {
    const body = newsStatusRequestSchema.parse(await readJson(request));
    let command: NewsStatusCommand;
    if (body.action === "schedule") {
      const publishAt = parseLagosDateTime(body.publishAt);
      if (!publishAt) throw new NewsTransitionError("Choose a valid date and time.");
      command = { action: "schedule", publishAt };
    } else {
      command = { action: body.action };
    }
    const post = await changeNewsStatus(id, command, body.version, auth.session);
    return NextResponse.json({ post });
  } catch (error) {
    return newsErrorResponse(error);
  }
}
