import "server-only";

import {
  button,
  detailRow,
  escapeHtml,
  paragraphsToHtml,
  renderLayout,
} from "./layout";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface ContactEnquiry {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
}

/**
 * Internal notification to the team when a website enquiry arrives. Sent from
 * no-reply, but Reply-To is set to the visitor's address by the caller so the
 * team can reply straight from Gmail.
 */
export function contactNotificationEmail(enquiry: ContactEnquiry): RenderedEmail {
  const rows = [
    detailRow("Name", escapeHtml(enquiry.name)),
    detailRow("Email", `<a href="mailto:${escapeHtml(enquiry.email)}" style="color:#0057d9;text-decoration:none;">${escapeHtml(enquiry.email)}</a>`),
    enquiry.phone ? detailRow("Phone", escapeHtml(enquiry.phone)) : "",
    enquiry.company ? detailRow("Company", escapeHtml(enquiry.company)) : "",
    detailRow("Subject", escapeHtml(enquiry.service)),
  ]
    .filter(Boolean)
    .join("");

  const contentHtml = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#1a1d23;">A new enquiry was submitted through the website contact form.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid #e8edf3;border-bottom:1px solid #e8edf3;">
      ${rows}
    </table>
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#66707d;">Message</p>
    <div style="padding:16px;background:#f6f8fb;border-radius:12px;">${paragraphsToHtml(enquiry.message)}</div>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#66707d;">Reply to this email to respond to ${escapeHtml(enquiry.name)} directly.</p>
  `;

  const text = [
    `New website enquiry`,
    ``,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    enquiry.phone ? `Phone: ${enquiry.phone}` : "",
    enquiry.company ? `Company: ${enquiry.company}` : "",
    `Subject: ${enquiry.service}`,
    ``,
    `Message:`,
    enquiry.message,
    ``,
    `Reply to this email to respond to ${enquiry.name} directly.`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: `New ${enquiry.service} — ${enquiry.name}`,
    html: renderLayout({
      preheader: `New enquiry from ${enquiry.name}: ${enquiry.message.slice(0, 90)}`,
      heading: "New website enquiry",
      contentHtml,
    }),
    text,
  };
}

/**
 * Auto-acknowledgement to the visitor. Sent from no-reply with Reply-To set to
 * support@, so a reply routes to the monitored inbox via Cloudflare.
 */
export function contactAcknowledgementEmail(
  enquiry: Pick<ContactEnquiry, "name" | "service" | "message">,
): RenderedEmail {
  const firstName = enquiry.name.split(/\s+/)[0] || enquiry.name;

  const contentHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Thank you for reaching out to Bespoke Technologies. We've received your enquiry and a member of our team will respond within one business day.</p>
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#66707d;">Your message</p>
    <div style="padding:16px;background:#f6f8fb;border-radius:12px;margin:0 0 20px;">${paragraphsToHtml(enquiry.message)}</div>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#1a1d23;">In the meantime, feel free to explore our recent work and services.</p>
    ${button("View our work", "https://www.bespoketech.com.ng/projects")}
    <p style="margin:24px 0 0;font-size:15px;line-height:1.65;color:#1a1d23;">Warm regards,<br />The Bespoke Technologies Team</p>
  `;

  const text = [
    `Hi ${firstName},`,
    ``,
    `Thank you for reaching out to Bespoke Technologies. We've received your enquiry and a member of our team will respond within one business day.`,
    ``,
    `Your message:`,
    enquiry.message,
    ``,
    `View our work: https://www.bespoketech.com.ng/projects`,
    ``,
    `Warm regards,`,
    `The Bespoke Technologies Team`,
  ].join("\n");

  return {
    subject: "We've received your message — Bespoke Technologies",
    html: renderLayout({
      preheader: "Thanks for reaching out — we'll respond within one business day.",
      heading: "We've received your message",
      contentHtml,
    }),
    text,
  };
}
