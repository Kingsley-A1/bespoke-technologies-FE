import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { attachLearningCertification } from "@/features/admin/learning/repository";
import { isR2Configured, putR2Object } from "@/lib/storage/r2";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("learning.view");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isR2Configured()) return NextResponse.json({ error: "Certification storage is not configured." }, { status: 503 });
  const form = await request.formData();
  const assignmentId = String(form.get("assignmentId") || "");
  const file = form.get("certificate");
  if (!/^[0-9a-f-]{36}$/i.test(assignmentId)) return NextResponse.json({ error: "Invalid assignment." }, { status: 400 });
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a certificate file." }, { status: 400 });
  if (!ALLOWED.includes(file.type) || file.size > MAX_BYTES) return NextResponse.json({ error: "Use a PDF, PNG, or JPEG up to 10 MB." }, { status: 400 });
  const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const key = `learning/certifications/${assignmentId}/${randomUUID()}.${extension}`;
  await putR2Object({ key, body: Buffer.from(await file.arrayBuffer()), contentType: file.type });
  await attachLearningCertification({ assignmentId, key, mime: file.type }, access.session);
  return NextResponse.json({ ok: true });
}
