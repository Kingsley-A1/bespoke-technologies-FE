"use server";

import { z } from "zod";
import { requireAdminPermission } from "@/features/admin/access";
import { appendAudit } from "@/features/admin/repository";
import { sendEmail } from "@/lib/email/client";
import { EMAIL_SENDERS, SENDER_KEYS, type SenderKey } from "@/lib/email/addresses";
import { renderAdminEmail } from "@/lib/email/templates/admin";

export interface ComposeResult {
  ok: boolean;
  message: string;
}

const composeSchema = z.object({
  templateKey: z.string().trim().max(60).default("blank"),
  senderKey: z.enum(SENDER_KEYS as [SenderKey, ...SenderKey[]]),
  to: z.email().max(240),
  subject: z.string().trim().min(2).max(200),
  heading: z.string().trim().min(2).max(160),
  body: z.string().trim().min(10).max(8000),
  ctaLabel: z.string().trim().max(60).optional().default(""),
  ctaUrl: z.union([z.url(), z.literal("")]).optional().default(""),
  signOffName: z.string().trim().min(2).max(120),
});

export async function sendAdminEmailAction(
  _prev: ComposeResult | null,
  formData: FormData,
): Promise<ComposeResult> {
  const session = await requireAdminPermission("crm.manage");

  const parsed = composeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }
  const input = parsed.data;

  if (input.ctaLabel && !input.ctaUrl) {
    return { ok: false, message: "Add a button URL, or clear the button label." };
  }

  const sender = EMAIL_SENDERS[input.senderKey];
  const rendered = renderAdminEmail({
    subject: input.subject,
    heading: input.heading,
    body: input.body,
    ctaLabel: input.ctaLabel || undefined,
    ctaUrl: input.ctaUrl || undefined,
    signOffName: input.signOffName,
  });

  const result = await sendEmail({
    from: { address: sender.address, name: sender.name },
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: sender.address, // replies route to the sending role inbox
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.skipped
        ? "Email is not configured yet (RESEND_API_KEY missing)."
        : `Send failed: ${result.error}`,
    };
  }

  await appendAudit(session, "email.sent", "email", result.id ?? undefined, undefined, {
    to: input.to,
    from: sender.address,
    template: input.templateKey,
    subject: input.subject,
  });

  return { ok: true, message: `Email sent to ${input.to}.` };
}
