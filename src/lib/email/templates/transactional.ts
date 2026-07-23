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

export function employeeInvitationEmail(input: { name: string; email: string; enrollmentCode: string; expiresAt: string }): RenderedEmail {
  const registerUrl = `https://www.bespoketech.com.ng/admin/register?email=${encodeURIComponent(input.email)}`;
  const contentHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Hi ${escapeHtml(input.name.split(/\s+/)[0] || input.name)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Your Bespoke Technologies employee identity has been created. You will set up your own authenticator; no password has been assigned to you.</p>
    <div style="margin:20px 0;padding:16px;border-left:3px solid #0a84ff;background:#f6f8fb;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#66707d;">Employee email</p>
      <p style="margin:0 0 14px;font-size:15px;color:#0b1f3a;">${escapeHtml(input.email)}</p>
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#66707d;">Single-use enrollment code</p>
      <p style="margin:0;font-family:monospace;font-size:16px;font-weight:700;color:#0b1f3a;word-break:break-all;">${escapeHtml(input.enrollmentCode)}</p>
    </div>
    ${button("Set up authenticator", registerUrl)}
    <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#66707d;">This invitation expires ${escapeHtml(new Date(input.expiresAt).toUTCString())}. If you did not expect it, contact the founder admin.</p>`;
  return {
    subject: "Set up your Bespoke Technologies employee access",
    html: renderLayout({ preheader: "Your employee identity is ready for authenticator setup.", heading: "Your employee access is ready", contentHtml }),
    text: `Hi ${input.name},\n\nYour employee identity is ready. Open ${registerUrl} and use this single-use enrollment code:\n\n${input.enrollmentCode}\n\nIt expires ${new Date(input.expiresAt).toUTCString()}.`,
  };
}

export function taskAssignmentEmail(input: { assigneeName: string; taskTitle: string; projectName?: string; dueDate?: string; assignedBy: string }): RenderedEmail {
  const contentHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Hi ${escapeHtml(input.assigneeName.split(/\s+/)[0] || input.assigneeName)},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#1a1d23;">${escapeHtml(input.assignedBy)} assigned a task to you.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid #e8edf3;border-bottom:1px solid #e8edf3;">
      ${detailRow("Task", escapeHtml(input.taskTitle))}
      ${input.projectName ? detailRow("Project", escapeHtml(input.projectName)) : ""}
      ${input.dueDate ? detailRow("Due", escapeHtml(input.dueDate)) : ""}
    </table>
    ${button("Open my work", "https://www.bespoketech.com.ng/admin")}`;
  return {
    subject: `Task assigned: ${input.taskTitle}`,
    html: renderLayout({ preheader: `${input.taskTitle}${input.dueDate ? ` · due ${input.dueDate}` : ""}`, heading: "A task has been assigned to you", contentHtml }),
    text: `Hi ${input.assigneeName},\n\n${input.assignedBy} assigned you: ${input.taskTitle}${input.projectName ? `\nProject: ${input.projectName}` : ""}${input.dueDate ? `\nDue: ${input.dueDate}` : ""}\n\nOpen: https://www.bespoketech.com.ng/admin`,
  };
}
