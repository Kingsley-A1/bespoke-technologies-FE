"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Copy, Loader2, ShieldCheck } from "lucide-react";

const inputClass =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-xs outline-none transition focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-800";

type Step = "identify" | "confirm" | "done";

export function RegisterFlow({ defaultEmail = "" }: { defaultEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identify");
  const [email, setEmail] = useState(defaultEmail);
  const [registrationCode, setRegistrationCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totp, setTotp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function begin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/admin/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, registrationCode }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        qrDataUrl?: string;
        secret?: string;
      };
      if (!response.ok || !payload.qrDataUrl || !payload.secret) {
        throw new Error(payload.error ?? "Registration could not be verified.");
      }
      setQrDataUrl(payload.qrDataUrl);
      setSecret(payload.secret);
      setStep("confirm");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/admin/api/auth/register/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: totp }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The code could not be verified.");
      setStep("done");
      window.setTimeout(() => router.push(`/admin/login?email=${encodeURIComponent(email)}`), 1600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The code could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the secret is still visible for manual entry.
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-bold tracking-[-0.02em] text-slate-950">
          Authenticator enrolled.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in with your email and the 6-digit code from your authenticator
          app. Redirecting to sign-in…
        </p>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <form onSubmit={confirm} className="space-y-5">
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <p className="text-[13px] font-semibold text-slate-800">
            1 · Scan with Google Authenticator (or any TOTP app)
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrDataUrl && (
              <Image
                src={qrDataUrl}
                alt="Authenticator enrollment QR code"
                width={176}
                height={176}
                unoptimized
                className="h-44 w-44 shrink-0 rounded-md border border-slate-200"
              />
            )}
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xs leading-5 text-slate-500">
                Can&apos;t scan? Enter this setup key manually:
              </p>
              <code className="mt-2 block break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] tracking-wide text-slate-800">
                {secret}
              </code>
              <button
                type="button"
                onClick={() => void copySecret()}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 transition hover:text-ktf-blue-deep"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy setup key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <label className="block">
          <span className={labelClass}>2 · Enter the 6-digit code from the app</span>
          <input
            value={totp}
            onChange={(event) => setTotp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            required
            placeholder="000000"
            className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || totp.length !== 6}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ktf-blue text-sm font-semibold text-white shadow-sm transition hover:bg-ktf-blue-deep disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Confirm and finish enrollment
        </button>
        <p className="text-[11px] leading-4 text-slate-400">
          The setup expires after 15 minutes. Confirming retires any previously
          enrolled authenticator for this identity.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={begin} className="space-y-5">
      <label className="block">
        <span className={labelClass}>Admin email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
          placeholder="name@bespoketech.com.ng"
        />
      </label>
      <label className="block">
        <span className={labelClass}>Registration code</span>
        <input
          value={registrationCode}
          onChange={(event) => setRegistrationCode(event.target.value)}
          name="registrationCode"
          type="password"
          autoComplete="off"
          required
          className={inputClass}
          placeholder="Provided privately by the founder"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ktf-blue text-sm font-semibold text-white shadow-sm transition hover:bg-ktf-blue-deep disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Continue to authenticator setup
      </button>

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        Only pre-authorized Bespoke admin identities can register. The code
        alone grants nothing.
      </p>
    </form>
  );
}
