import "server-only";

import { button, escapeHtml, paragraphsToHtml, renderLayout } from "./layout";

/**
 * Admin-composed email. Templates are data (starting points an admin edits),
 * and a single renderer turns the final fields into branded HTML + text. This
 * keeps every hand-sent email on-brand without hard-coding copy.
 */

export interface AdminEmailFields {
  subject: string;
  heading: string;
  /** Blank-line separated plain text authored by the admin. */
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  signOffName: string;
}

export interface AdminEmailTemplate {
  key: string;
  label: string;
  description: string;
  defaults: {
    subject: string;
    heading: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
}

export function renderAdminEmail(fields: AdminEmailFields) {
  const cta =
    fields.ctaLabel?.trim() && fields.ctaUrl?.trim()
      ? button(fields.ctaLabel.trim(), fields.ctaUrl.trim())
      : "";

  const contentHtml = `
    ${paragraphsToHtml(fields.body)}
    ${cta}
    <p style="margin:24px 0 0;font-size:15px;line-height:1.65;color:#1a1d23;">Warm regards,<br />${escapeHtml(fields.signOffName)}<br /><span style="color:#66707d;">Bespoke Technologies</span></p>
  `;

  const textCta =
    fields.ctaLabel?.trim() && fields.ctaUrl?.trim()
      ? `\n\n${fields.ctaLabel.trim()}: ${fields.ctaUrl.trim()}`
      : "";

  const text = `${fields.body.trim()}${textCta}\n\nWarm regards,\n${fields.signOffName}\nBespoke Technologies`;

  return {
    subject: fields.subject,
    html: renderLayout({
      preheader: fields.body.trim().slice(0, 100),
      heading: fields.heading,
      contentHtml,
    }),
    text,
  };
}

export const ADMIN_EMAIL_TEMPLATES: AdminEmailTemplate[] = [
  {
    key: "blank",
    label: "Blank message",
    description: "A branded shell — write everything yourself.",
    defaults: {
      subject: "",
      heading: "",
      body: "",
    },
  },
  {
    key: "enquiry_follow_up",
    label: "Enquiry follow-up",
    description: "Follow up on a website enquiry or first conversation.",
    defaults: {
      subject: "Following up on your enquiry — Bespoke Technologies",
      heading: "Following up on your enquiry",
      body: "Hi {{first_name}},\n\nThank you again for reaching out to Bespoke Technologies. I wanted to follow up personally to understand your project a little better and share how we can help.\n\nWould you be open to a short call this week? I'd be glad to walk you through our approach and answer any questions.",
      ctaLabel: "Book a call",
      ctaUrl: "https://www.bespoketech.com.ng/contact",
    },
  },
  {
    key: "proposal_ready",
    label: "Proposal ready",
    description: "Let a client know their proposal or quote is ready.",
    defaults: {
      subject: "Your proposal is ready — Bespoke Technologies",
      heading: "Your proposal is ready",
      body: "Hi {{first_name}},\n\nThank you for the opportunity to work with you. We've prepared a proposal outlining the scope, timeline, and investment for your project.\n\nPlease review it at your convenience — I'm happy to walk through any part of it and adjust the scope to fit your priorities.",
      ctaLabel: "View proposal",
      ctaUrl: "",
    },
  },
  {
    key: "thank_you",
    label: "Thank you",
    description: "A warm thank-you after a project or milestone.",
    defaults: {
      subject: "Thank you — Bespoke Technologies",
      heading: "Thank you",
      body: "Hi {{first_name}},\n\nOn behalf of the whole team at Bespoke Technologies, thank you for trusting us with your project. It has been a genuine pleasure building with you.\n\nWe remain a message away for anything you need going forward.",
    },
  },
];

export function findAdminTemplate(key: string) {
  return ADMIN_EMAIL_TEMPLATES.find((template) => template.key === key);
}
