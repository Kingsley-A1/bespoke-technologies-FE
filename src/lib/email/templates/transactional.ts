import "server-only";

import {
  button,
  detailRow,
  escapeHtml,
  paragraphsToHtml,
  progressBar,
  renderLayout,
  sectionLabel,
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

export interface DigitalAuditEmailDimension {
  label: string;
  /** 0-100 */
  score: number;
}

export interface DigitalAuditEmailPriority {
  area: string;
  title: string;
  move: string;
}

export function digitalAuditReportEmail(input: {
  businessName: string;
  score: number;
  tier: string;
  interpretation: string;
  dimensions: DigitalAuditEmailDimension[];
  priorities: DigitalAuditEmailPriority[];
  reportUrl: string;
}): RenderedEmail {
  const name = escapeHtml(input.businessName);
  const subject = `Your Bespoke Business Audit report — ${input.businessName}`;

  const scoreCard = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:#0b1f3a;border-radius:14px;">
      <tr><td style="padding:24px 26px;">
        <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#8a94a3;">Readiness score</p>
        <p style="margin:8px 0 0;font-size:44px;line-height:1;font-weight:700;letter-spacing:-.03em;color:#ffffff;">
          ${input.score}<span style="font-size:18px;font-weight:600;color:#8a94a3;">&nbsp;/100</span>
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 0;"><tr>
          <td style="padding:5px 12px;border-radius:999px;background:#12345e;font-size:12px;font-weight:700;color:#9cc9ff;">${escapeHtml(input.tier)}</td>
        </tr></table>
        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#c4ccd6;">${escapeHtml(input.interpretation)}</p>
      </td></tr>
    </table>`;

  const dimensionRows = input.dimensions
    .map(
      (dimension) => `
      <tr><td style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:0 0 6px;font-size:14px;font-weight:600;color:#0b1f3a;">${escapeHtml(dimension.label)}</td>
          <td align="right" style="padding:0 0 6px;font-size:13px;color:#66707d;white-space:nowrap;">${Math.round(dimension.score)}/100</td>
        </tr></table>
        ${progressBar(dimension.score)}
      </td></tr>`,
    )
    .join("");

  const priorityRows = input.priorities
    .map(
      (priority, index) => `
      <tr>
        <td width="32" style="padding:0 0 18px;vertical-align:top;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="width:24px;height:24px;border-radius:999px;background:#e8f2ff;font-size:12px;font-weight:700;color:#0057d9;">${index + 1}</td>
          </tr></table>
        </td>
        <td style="padding:0 0 18px;vertical-align:top;">
          <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0057d9;">${escapeHtml(priority.area)}</p>
          <p style="margin:4px 0 0;font-size:15px;line-height:1.4;font-weight:700;color:#0b1f3a;">${escapeHtml(priority.title)}</p>
          <p style="margin:4px 0 0;font-size:14px;line-height:1.6;color:#49515c;">${escapeHtml(priority.move)}</p>
        </td>
      </tr>`,
    )
    .join("");

  const contentHtml = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#49515c;">
      Here is where <strong style="color:#0b1f3a;">${name}</strong> stands today, and the moves worth making first.
    </p>
    ${scoreCard}
    ${sectionLabel("Six-dimension overview")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${dimensionRows}</table>
    ${input.priorities.length ? `${sectionLabel("Where to focus first")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">${priorityRows}</table>` : ""}
    ${button("View your full report", input.reportUrl)}
    <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#66707d;">
      Share the link with your team, save it as a PDF, or reply to this email to talk the roadmap through with us.
    </p>
    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e8edf3;font-size:12px;line-height:1.6;color:#8a94a3;">
      This is a strategic self-assessment based on six responses, not a formal security, compliance or technical audit.
    </p>`;

  const text = [
    `Your Bespoke Business Audit report — ${input.businessName}`,
    "",
    `Readiness score: ${input.score}/100 (${input.tier})`,
    input.interpretation,
    "",
    "SIX-DIMENSION OVERVIEW",
    ...input.dimensions.map((dimension) => `- ${dimension.label}: ${Math.round(dimension.score)}/100`),
    ...(input.priorities.length
      ? [
          "",
          "WHERE TO FOCUS FIRST",
          ...input.priorities.flatMap((priority, index) => [
            `${index + 1}. ${priority.title} (${priority.area})`,
            `   ${priority.move}`,
          ]),
        ]
      : []),
    "",
    "View your full report:",
    input.reportUrl,
    "",
    "Reply to this email to talk the roadmap through with us.",
    "",
    "This is a strategic self-assessment, not a formal security, compliance or technical audit.",
  ].join("\n");

  const html = renderLayout({
    preheader: `${input.businessName} scored ${input.score}/100 — ${input.tier}. See the breakdown and where to focus first.`,
    heading: "Your business audit report",
    contentHtml,
  });
  return { subject, html, text };
}

export function ideaExecutionGateReportEmail(input: {
  ideaTitle: string;
  totalScore: number;
  maxScore: number;
  gatesPassed: number;
  decisionLabel: string;
  reportUrl: string;
}): RenderedEmail {
  const subject = `Your Idea Execution Gate result — ${input.ideaTitle}`;
  const text = `Your Bespoke Idea Execution Gate assessment is complete.

Idea: ${input.ideaTitle}
Score: ${input.totalScore}/${input.maxScore}
Gates passed: ${input.gatesPassed}/10
Verdict: ${input.decisionLabel}

View, download or share the full report:
${input.reportUrl}

From Idea to Execution. With Clarity.
Bespoke Technologies`;
  const html = renderLayout({
    preheader: `${input.ideaTitle} scored ${input.totalScore}/${input.maxScore} — ${input.decisionLabel}.`,
    heading: "Your Idea Execution Gate result",
    contentHtml: `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#49515c;">
        ${escapeHtml(input.ideaTitle)} has been assessed against the ten Bespoke execution gates.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid #e8edf3;border-bottom:1px solid #e8edf3;">
        ${detailRow("Score", `${input.totalScore}/${input.maxScore}`)}
        ${detailRow("Gates passed", `${input.gatesPassed}/10`)}
        ${detailRow("Verdict", escapeHtml(input.decisionLabel))}
      </table>
      <div style="margin:24px 0;">${button("View the full report", input.reportUrl)}</div>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#66707d;">
        The report includes the gate-by-gate breakdown, strengths, gaps, risks, a recommended first version
        and the first build target. It is a strategic assessment, not a guarantee of commercial outcome.
      </p>`,
  });
  return { subject, html, text };
}

export function ownershipCertificateEmail(input: {
  ownerName: string;
  projectName: string;
  certificateNumber: string;
  verificationUrl: string;
}): RenderedEmail {
  const firstName = input.ownerName.split(/\s+/)[0] || input.ownerName;
  const contentHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Your project has completed the Bespoke Technologies ownership workflow. The issued certificate is attached to this email and can be independently checked using the verification link below.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-top:1px solid #e8edf3;border-bottom:1px solid #e8edf3;">
      ${detailRow("Project", escapeHtml(input.projectName))}
      ${detailRow("Certificate", escapeHtml(input.certificateNumber))}
    </table>
    ${button("Verify ownership certificate", input.verificationUrl)}
    <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#66707d;">Keep the attached PDF with your project handover records. The verification page always shows the current issued or revoked status.</p>`;
  return {
    subject: `Project ownership certificate — ${input.projectName}`,
    html: renderLayout({ preheader: `${input.certificateNumber} has been issued for ${input.projectName}.`, heading: "Your ownership certificate is ready", contentHtml }),
    text: `Hi ${firstName},

Your Bespoke Technologies project ownership certificate for ${input.projectName} is attached.

Certificate: ${input.certificateNumber}
Verify: ${input.verificationUrl}

Keep the PDF with your project handover records.`,
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
