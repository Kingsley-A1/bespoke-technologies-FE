"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle2, Copy, Loader2, ShieldCheck } from "lucide-react";

const inputClass = "h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-xs outline-none transition focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15";

export function RecoverySetupFlow({
  email,
  secret,
  qrDataUrl,
  expiresAt,
}: {
  email: string;
  secret: string;
  qrDataUrl: string;
  expiresAt: string;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/admin/api/auth/recover/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; next?: string };
      if (!response.ok || !payload.next) throw new Error(payload.error ?? "The new authenticator could not be confirmed.");
      window.location.assign(payload.next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The new authenticator could not be confirmed.");
      setBusy(false);
    }
  }

  async function copySecret() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <p className="text-[13px] font-semibold text-slate-800">1 · Scan with the new authenticator app</p>
        <p className="mt-1 break-all text-xs text-slate-500">{email}</p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Image src={qrDataUrl} alt="Recovery authenticator setup QR code" width={176} height={176} unoptimized className="h-44 w-44 shrink-0 rounded-md border border-slate-200" />
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-xs leading-5 text-slate-500">Manual setup key</p>
            <code className="mt-2 block break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] tracking-wide text-slate-800">{secret}</code>
            <button type="button" onClick={() => void copySecret()} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-ktf-blue">
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy setup key"}
            </button>
          </div>
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-slate-800">2 · Enter the code from the new app</span>
        <input
          className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          required
          autoFocus
        />
      </label>
      {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}
      <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ktf-blue text-sm font-semibold text-white shadow-sm hover:bg-ktf-blue-deep disabled:opacity-50" disabled={busy || code.length !== 6}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm new authenticator
      </button>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        This restricted session expires <time dateTime={expiresAt}>within ten minutes</time>. Confirmation revokes every older admin session.
      </p>
    </form>
  );
}
