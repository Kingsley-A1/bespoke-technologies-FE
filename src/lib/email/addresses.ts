import "server-only";

/**
 * Central email address book. Every outbound send resolves its identities here
 * so swapping a real address is a single-source change.
 *
 * Sending (Resend) is outbound only; inbound to these addresses is handled by
 * Cloudflare Email Routing, which forwards founder@/manager@/support@ to the
 * team Gmail. That is why automated mail sends *from* no-reply but sets a
 * real Reply-To — a customer reply then routes to a monitored inbox.
 */

export const EMAIL_DOMAIN = "bespoketech.com.ng";

const BRAND_NAME = process.env.EMAIL_BRAND_NAME?.trim() || "Bespoke Technologies";

function resolve(value: string | undefined, fallback: string) {
  return value?.trim().toLowerCase() || fallback;
}

export const EMAIL_ADDRESSES = {
  /** System sender for automated mail. Not monitored — always pair with a Reply-To. */
  noReply: resolve(process.env.EMAIL_FROM_NOREPLY, `no-reply@${EMAIL_DOMAIN}`),
  /** Monitored role inbox (Cloudflare → Gmail). Default Reply-To for automated mail. */
  support: resolve(process.env.EMAIL_SUPPORT, `support@${EMAIL_DOMAIN}`),
  /**
   * Deliberately NOT derived from ADMIN_FOUNDER_EMAIL/ADMIN_MANAGER_EMAIL —
   * those configure the *admin login* identity and may be a personal inbox
   * (e.g. a Gmail) that Resend cannot send from. EMAIL_FOUNDER/EMAIL_MANAGER
   * are the only overrides for the outbound *sending* identity.
   */
  founder: resolve(process.env.EMAIL_FOUNDER, `founder@${EMAIL_DOMAIN}`),
  manager: resolve(process.env.EMAIL_MANAGER, `manager@${EMAIL_DOMAIN}`),
} as const;

/** Where new website contact enquiries are delivered internally. */
export const CONTACT_NOTIFY_TO = resolve(process.env.EMAIL_CONTACT_NOTIFY, EMAIL_ADDRESSES.support);

/**
 * Identities an admin may send *as* from the compose tool. Role addresses plus
 * the two personal identities — replies to any of them route to Gmail.
 */
export const EMAIL_SENDERS = {
  support: { address: EMAIL_ADDRESSES.support, name: `${BRAND_NAME} Support` },
  founder: { address: EMAIL_ADDRESSES.founder, name: `${BRAND_NAME} — Founder` },
  manager: { address: EMAIL_ADDRESSES.manager, name: `${BRAND_NAME} — Manager` },
} as const;

export type SenderKey = keyof typeof EMAIL_SENDERS;

export const SENDER_KEYS = Object.keys(EMAIL_SENDERS) as SenderKey[];

/** Format an address into an RFC 5322 "Name <addr>" display sender. */
export function branded(address: string, name: string = BRAND_NAME) {
  return `${name} <${address}>`;
}

export { BRAND_NAME };
