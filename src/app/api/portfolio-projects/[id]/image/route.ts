import { NextResponse } from "next/server";
import { getPortfolioProject } from "@/features/admin/portfolio/repository";
import { getR2ObjectBytes, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = await getPortfolioProject(id).catch(() => null);
  if (!project?.published || !project.imageKey || !isR2Configured()) {
    return new NextResponse(null, { status: 404 });
  }
  const object = await getR2ObjectBytes(project.imageKey);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(object.bytes), {
    headers: {
      "Content-Type": object.contentType || project.imageMime || "image/webp",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
