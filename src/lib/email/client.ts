import "server-only";

import { Resend } from "resend";
import { branded } from "./addresses";

/**
 * Thin, dependency-injected wrapper around Resend. Every send in the app flows
 * through here so From/Reply-To formatting, configuration checks, and error
 * handling live in one place.
 *
 * Sends never throw — callers get a typed result and decide whether a failed
 * send should surface to the user. For transactional flows (contact form) the
 * database record is the source of truth and email is best-effort.
 */

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  cached ??= new Resend(key);
  return cached;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export interface SendEmailInput {
  from: { address: string; name?: string };
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
}

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; skipped?: boolean };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped send: "${input.subject}"`);
    return { ok: false, error: "Email service is not configured.", skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: branded(input.from.address, input.from.name),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });

    if (error) {
      console.error("[email] send failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error("[email] send threw:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error.",
    };
  }
}
