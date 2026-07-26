"use client";

import { useState } from "react";
import { Check, Copy, Printer, Share2 } from "lucide-react";

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = url;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  }
}

export function DigitalAuditStartShare() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/digital-readiness-audit`;
    const data = {
      title: "Bespoke Digital Readiness Audit",
      text: "Assess six practical dimensions of your organisation's digital readiness.",
      url,
    };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    if (await copyUrl(url)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ktf-gray-300 bg-white px-5 text-sm font-semibold text-ktf-gray-700 transition hover:border-ktf-blue/40 hover:text-ktf-blue"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copied" : "Share audit"}
    </button>
  );
}

export function DigitalAuditShareActions({ businessName }: { businessName: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = {
      title: `${businessName} — Digital Readiness Report`,
      text: `View ${businessName}'s Bespoke Digital Readiness Report.`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await copy();
  }

  async function copy() {
    if (await copyUrl(window.location.href)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  const buttonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ktf-gray-300 bg-white px-3 text-xs font-semibold text-ktf-gray-700 transition hover:border-ktf-blue/40 hover:text-ktf-blue print:hidden";

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => void share()} className={buttonClass}>
        <Share2 className="h-4 w-4" /> Share
      </button>
      <button onClick={() => void copy()} className={buttonClass}>
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <button onClick={() => window.print()} className={buttonClass}>
        <Printer className="h-4 w-4" /> Print / PDF
      </button>
    </div>
  );
}

export function DigitalAuditAdminShareLink({
  shareToken,
  className,
}: {
  shareToken: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/digital-readiness-audit/report/${shareToken}`;
    if (await copyUrl(url)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={className || "inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600"}
      aria-label={copied ? "Audit report link copied" : "Copy audit report link"}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
