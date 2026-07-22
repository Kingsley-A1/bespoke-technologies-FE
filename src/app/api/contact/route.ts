import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createContactSubmission } from "@/features/admin/repository";
import { adminQuery } from "@/features/admin/db";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail } from "@/lib/email/client";
import { CONTACT_NOTIFY_TO, EMAIL_ADDRESSES } from "@/lib/email/addresses";
import {
  contactAcknowledgementEmail,
  contactNotificationEmail,
} from "@/lib/email/templates/transactional";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(240),
  company: z.string().trim().max(160).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  subject: z.string().trim().max(80).optional().default("Project enquiry"),
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(0).optional().default(""),
  turnstileToken: z.string().max(4000).optional().default(""),
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

/**
 * Send the internal notification and the visitor acknowledgement. Best-effort:
 * the DB record (persisted above) is the source of truth, so a failed send is
 * logged but never fails the request or blocks the visitor's confirmation.
 */
async function dispatchContactEmails(enquiry: {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
}) {
  const notification = contactNotificationEmail(enquiry);
  const acknowledgement = contactAcknowledgementEmail(enquiry);

  const results = await Promise.allSettled([
    sendEmail({
      from: { address: EMAIL_ADDRESSES.noReply },
      to: CONTACT_NOTIFY_TO,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
      replyTo: enquiry.email, // team can reply straight to the visitor
    }),
    sendEmail({
      from: { address: EMAIL_ADDRESSES.noReply },
      to: enquiry.email,
      subject: acknowledgement.subject,
      html: acknowledgement.html,
      text: acknowledgement.text,
      replyTo: EMAIL_ADDRESSES.support, // replies route to the monitored inbox
    }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[contact] email dispatch rejected:", result.reason);
    } else if (!result.value.ok && !result.value.skipped) {
      console.error("[contact] email send failed:", result.value.error);
    }
  }
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

  const humanVerified = await verifyTurnstile(parsed.data.turnstileToken, requestKey(request));
  if (!humanVerified) {
    return NextResponse.json({ message: "Verification failed. Please refresh and try again." }, { status: 400 });
  }

  const enquiry = {
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone,
    company: parsed.data.company,
    service: parsed.data.subject.replaceAll("_", " "),
    message: parsed.data.message,
  };

  await createContactSubmission(enquiry);
  await dispatchContactEmails(enquiry);

  return NextResponse.json({ received: true }, { status: 201 });
}
