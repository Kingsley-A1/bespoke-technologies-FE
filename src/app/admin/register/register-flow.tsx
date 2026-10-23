"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthAlert, AuthNote, authInputClass, authLabelClass, authPrimaryButtonClass } from "@/features/admin/components/admin-auth-ui";
import { AuthenticatorSetup } from "@/features/admin/components/authenticator-setup";

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

  if (step === "done") {
    return (
      <div role="status" className="flex flex-col items-center py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-950">Authenticator registered</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">Taking you to sign in…</p>
      </div>
    );
  }

  if (step === "confirm" && qrDataUrl && secret) {
    return (
      <form onSubmit={confirm} className="space-y-5">
        <StepLabel step={2} title="Add the authenticator" />
        <AuthenticatorSetup qrDataUrl={qrDataUrl} secret={secret} qrAlt="Authenticator enrollment QR code" code={totp} onCodeChange={setTotp} />
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <button type="submit" disabled={busy || totp.length !== 6} className={authPrimaryButtonClass}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Finish registration
        </button>
        <AuthNote>This setup expires after 15 minutes. Finishing replaces any authenticator registered before for this account.</AuthNote>
      </form>
    );
  }

  return (
    <form onSubmit={begin} className="space-y-5">
      <StepLabel step={1} title="Verify your identity" />
      <label className="block">
        <span className={authLabelClass}>Work email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          name="email"
          type="email"
          autoComplete="username"
          required
          className={authInputClass}
          placeholder="name@bespoketech.com.ng"
        />
      </label>
      <label className="block">
        <span className={authLabelClass}>Registration code</span>
        <input
          value={registrationCode}
          onChange={(event) => setRegistrationCode(event.target.value)}
          name="registrationCode"
          type="password"
          autoComplete="off"
          required
          className={authInputClass}
        />
      </label>
      {error ? <AuthAlert>{error}</AuthAlert> : null}
      <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Continue
      </button>
      <AuthNote>Only pre-approved staff accounts can register. The code alone grants no access.</AuthNote>
    </form>
  );
}

function StepLabel({ step, title }: { step: number; title: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
      Step {step} of 2 <span aria-hidden="true">·</span> <span className="normal-case tracking-normal text-slate-700">{title}</span>
    </p>
  );
}
