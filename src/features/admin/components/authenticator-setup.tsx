"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { authInputClass, authLabelClass } from "./admin-auth-ui";

/**
 * The two steps of adding an authenticator app: scan the QR code (or type the
 * setup key), then enter the first code it shows. Used by first-time
 * registration and by recovery.
 */
export function AuthenticatorSetup({
  qrDataUrl,
  secret,
  qrAlt,
  code,
  onCodeChange,
}: {
  qrDataUrl: string;
  secret: string;
  qrAlt: string;
  code: string;
  onCodeChange: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the key is still shown for manual entry.
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className={authLabelClass}>
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">1</span>
          Scan with your authenticator app
        </p>
        <div className="mt-3 flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          <Image src={qrDataUrl} alt={qrAlt} width={176} height={176} unoptimized className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-1.5" />
          <p className="mt-4 text-xs text-slate-500">Can&apos;t scan? Enter this setup key instead.</p>
          <div className="mt-2 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-1.5">
            <code className="min-w-0 flex-1 break-all font-mono text-[11px] tracking-wide text-slate-800">{secret}</code>
            <button
              type="button"
              onClick={() => void copySecret()}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </section>

      <label className="block">
        <span className={authLabelClass}>
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">2</span>
          Enter the 6-digit code it shows
        </span>
        <input
          value={code}
          onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          required
          placeholder="000000"
          className={`${authInputClass} h-12 text-center font-mono text-lg tracking-[0.4em]`}
        />
      </label>
    </div>
  );
}
