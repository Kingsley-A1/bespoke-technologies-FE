import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createContactSubmission } from "@/features/admin/repository";
import { adminQuery } from "@/features/admin/db";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(240),
  company: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  subject: z.string().trim().max(80).optional().default("Project enquiry"),
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(0).optional().default(""),
});

const MAX_REQUESTS_PER_WINDOW = 10;

function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

async function isRateLimited(request: Request) {
  const networkHash = createHash("sha256").update(requestKey(request)).digest("hex");
  const result = await adminQuery<{ count: string }>(
    "SELECT count(*)::STRING AS count FROM contact_submission_attempts WHERE network_hash=$1 AND attempted_at >= now() - INTERVAL '1 hour'",
    [networkHash],
  );
  if (Number(result.rows[0]?.count ?? 0) >= MAX_REQUESTS_PER_WINDOW) return true;
  await adminQuery("INSERT INTO contact_submission_attempts (network_hash) VALUES ($1)", [networkHash]);
  return false;
}

export async function POST(request: Request) {
  if (await isRateLimited(request)) {
    return NextResponse.json({ message: "Too many enquiries. Please try again later." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "The request body must be valid JSON." }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the enquiry fields." }, { status: 400 });
  if (parsed.data.website) return new NextResponse(null, { status: 204 });
  await createContactSubmission({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone,
    company: parsed.data.company,
    service: parsed.data.subject.replaceAll("_", " "),
    message: parsed.data.message,
  });
  return NextResponse.json({ received: true }, { status: 201 });
}
