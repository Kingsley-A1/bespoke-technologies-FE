import "server-only";

/**
 * Server-side verification for Cloudflare Turnstile tokens.
 *
 * If TURNSTILE_SECRET is not configured the check is treated as "not
 * required" and passes — the contact form keeps working before keys are added,
 * with the existing honeypot + rate limiter as backstops. Set the secret in
 * production to enforce it.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET?.trim());
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET?.trim();
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET not set — skipping verification.");
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verification request failed:", err);
    return false;
  }
}
