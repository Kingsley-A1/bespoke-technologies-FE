import "server-only";

import { renderLayout } from "./layout";

export function learnerSignInCodeEmail(input: { code: string; expiresAt: string }) {
  const contentHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1a1d23;">Use this code to sign in to Bespoke Learn:</p>
    <p style="margin:0 0 20px;padding:14px 16px;border-left:3px solid #0a84ff;background:#f6f8fb;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:24px;font-weight:700;letter-spacing:.18em;color:#0b1f3a;">${input.code}</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#49515c;">This code expires in 10 minutes and a new code replaces an earlier one.</p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#66707d;">If you did not request this code, you can ignore this email.</p>
  `;
  return {
    subject: "Your Bespoke Learn sign-in code",
    html: renderLayout({ preheader: "Your Bespoke Learn sign-in code", heading: "Sign in to Bespoke Learn", contentHtml }),
    text: `Use this code to sign in to Bespoke Learn:\n\n${input.code}\n\nThis code expires in 10 minutes and a new code replaces an earlier one. If you did not request this code, you can ignore this email.`,
  };
}
