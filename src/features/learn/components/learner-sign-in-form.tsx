"use client";

import { FormEvent, useState } from "react";

type Phase = "email" | "code";

export function LearnerSignInForm() {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/learn/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("request_failed");
      setPhase("code");
      setStatus("If that address can receive a sign-in code, it has been sent. Check your inbox before continuing.");
    } catch {
      setError("We could not request a sign-in code. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/learn/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "verification_failed");
      window.location.assign("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== "verification_failed" ? cause.message : "The code is invalid, expired, or has already been used.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md px-5 py-14 sm:py-20" aria-labelledby="learn-sign-in-title">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ktf-blue">Bespoke Learn</p>
      <h1 id="learn-sign-in-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ktf-navy">Sign in to Bespoke Learn</h1>
      <p className="mt-3 text-sm leading-6 text-ktf-gray-600">We use a six-digit verification code instead of a password.</p>
      {status && <p className="mt-6 rounded-md border border-ktf-blue/25 bg-ktf-blue/5 p-4 text-sm leading-6 text-ktf-navy" role="status" aria-live="polite">{status}</p>}
      {error && <p className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error}</p>}
      {phase === "email" ? (
        <form className="mt-8 space-y-5" onSubmit={requestCode}>
          <div>
            <label htmlFor="learn-email" className="block text-sm font-semibold text-ktf-navy">Email address</label>
            <input id="learn-email" name="email" type="email" autoComplete="email" spellCheck={false} autoCapitalize="none" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-ktf-gray-300 bg-white px-3 text-base text-ktf-navy shadow-xs outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/25" />
          </div>
          <button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ktf-blue px-5 text-sm font-semibold text-white hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ktf-blue">{submitting ? "Sending…" : "Send sign-in code"}</button>
        </form>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={verifyCode}>
          <div>
            <label htmlFor="learn-code" className="block text-sm font-semibold text-ktf-navy">Six-digit code</label>
            <input id="learn-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" spellCheck={false} pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-2 min-h-12 w-full rounded-md border border-ktf-gray-300 bg-white px-3 font-mono text-lg tracking-[0.2em] text-ktf-navy shadow-xs outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/25" />
          </div>
          <button type="submit" disabled={submitting || code.length !== 6} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ktf-blue px-5 text-sm font-semibold text-white hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ktf-blue">{submitting ? "Verifying…" : "Verify and sign in"}</button>
          <button type="button" disabled={submitting} onClick={() => { setPhase("email"); setCode(""); setStatus(""); setError(""); }} className="inline-flex min-h-11 w-full items-center justify-center rounded-md text-sm font-semibold text-ktf-blue hover:text-ktf-blue-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Use a different email address</button>
        </form>
      )}
    </section>
  );
}
