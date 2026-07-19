import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminQuery } from "@/features/admin/db";
import { createReviewSubmission } from "@/features/admin/reviews/repository";

const reviewSchema = z.object({
  reviewerName: z.string().trim().min(2, "Add your name.").max(120),
  projectName: z.string().trim().min(2, "Add the project name.").max(160),
  projectUrl: z
    .union([z.url("The project URL must be a valid link."), z.literal("")])
    .optional()
    .default(""),
  body: z.string().trim().min(10, "Your review needs at least 10 characters.").max(2000),
  rating: z.coerce.number().int().min(1, "Pick a star rating.").max(5),
  // Honeypot — real users never fill this.
  website: z.string().max(0).optional().default(""),
});

const MAX_REQUESTS_PER_WINDOW = 5;

function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

async function isRateLimited(request: Request) {
  const networkHash = createHash("sha256").update(requestKey(request)).digest("hex");
  const result = await adminQuery<{ count: string }>(
    "SELECT count(*)::STRING AS count FROM review_submission_attempts WHERE network_hash=$1 AND attempted_at >= now() - INTERVAL '1 hour'",
    [networkHash],
  );
  if (Number(result.rows[0]?.count ?? 0) >= MAX_REQUESTS_PER_WINDOW) return true;
  await adminQuery("INSERT INTO review_submission_attempts (network_hash) VALUES ($1)", [networkHash]);
  return false;
}

export async function POST(request: Request) {
  if (await isRateLimited(request)) {
    return NextResponse.json(
      { message: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "The request body must be valid JSON." }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the review fields." },
      { status: 400 },
    );
  }
  if (parsed.data.website) return new NextResponse(null, { status: 204 });

  await createReviewSubmission({
    reviewerName: parsed.data.reviewerName,
    projectName: parsed.data.projectName,
    projectUrl: parsed.data.projectUrl || undefined,
    body: parsed.data.body,
    rating: parsed.data.rating,
  });
  return NextResponse.json({ received: true }, { status: 201 });
}
