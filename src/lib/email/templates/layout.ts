import "server-only";

import { EMAIL_ADDRESSES, EMAIL_DOMAIN } from "../addresses";

/**
 * Shared branded shell for every outbound email. Table-based with fully inline
 * styles for broad email-client support (Gmail, Outlook, Apple Mail). Brand
 * palette mirrors globals.css: navy #0b1f3a, blue #0a84ff, deep blue #0057d9.
 */

const NAVY = "#0b1f3a";
const BLUE = "#0a84ff";
const BLUE_DEEP = "#0057d9";
const INK = "#1a1d23";
const MUTED = "#66707d";
const HAIRLINE = "#e8edf3";
const SURFACE = "#f6f8fb";

const SITE_URL = "https://www.bespoketech.com.ng";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Convert user-authored plain text (blank-line separated) into paragraph HTML. */
export function paragraphsToHtml(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block).replace(/\n/g, "<br />"))
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${INK};">${block}</p>`,
    )
    .join("");
}

export function button(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr><td style="border-radius:8px;background:${BLUE_DEEP};">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
    </td></tr></table>`;
}

/** A key/value definition row, e.g. for the internal enquiry notification. */
export function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:${MUTED};width:120px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;line-height:1.55;color:${INK};vertical-align:top;">${value}</td>
  </tr>`;
}

interface LayoutInput {
  /** Hidden inbox-preview text. */
  preheader: string;
  heading: string;
  /** Pre-rendered, trusted HTML for the body (built by templates, not raw user input). */
  contentHtml: string;
}

export function renderLayout({ preheader, heading, contentHtml }: LayoutInput) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:760px;background:#ffffff;">
        <tr><td style="height:4px;background:${BLUE};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:24px 32px 20px;border-bottom:1px solid ${HAIRLINE};">
          <a href="${SITE_URL}" style="text-decoration:none;">
            <img src="${SITE_URL}/brand/bespoke-technologies-logo.png" width="210" alt="Bespoke Technologies" style="display:block;width:210px;max-width:64%;height:auto;border:0;" />
          </a>
        </td></tr>
        <tr><td style="padding:32px 32px 12px;">
          <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-.02em;color:${NAVY};">${escapeHtml(heading)}</h1>
          ${contentHtml}
        </td></tr>
        <tr><td style="padding:22px 32px 28px;border-top:1px solid ${HAIRLINE};background:${SURFACE};">
          <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${MUTED};">Bespoke Technologies · Engineering the solutions for this, and The Next Generations_</p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
            <a href="${SITE_URL}" style="color:${BLUE_DEEP};text-decoration:none;">www.bespoketech.com.ng</a>
            &nbsp;·&nbsp;
            <a href="mailto:${EMAIL_ADDRESSES.support}" style="color:${BLUE_DEEP};text-decoration:none;">${EMAIL_ADDRESSES.support}</a>
          </p>
          <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#9aa4b2;">© ${year} Bespoke Technologies (${EMAIL_DOMAIN}). All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
