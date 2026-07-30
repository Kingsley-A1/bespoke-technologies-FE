"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

const inputClass = "h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-xs outline-none transition focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15";

export function RecoverForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/admin/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoveryCode }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; next?: string };
      if (!response.ok || !payload.next) throw new Error(payload.error ?? "Recovery could not be started.");
      router.push(payload.next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recovery could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-slate-800">Admin email</span>
        <input
          className={inputClass}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@bespoketech.com.ng"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-slate-800">Single-use recovery code</span>
        <input
          className={`${inputClass} font-mono uppercase tracking-wide`}
          autoComplete="off"
          required
          value={recoveryCode}
          onChange={(event) => setRecoveryCode(event.target.value.toUpperCase().slice(0, 40))}
          placeholder="BT-XXXX-XXXX-XXXX-XXXX"
        />
      </label>
      {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ktf-blue text-sm font-semibold text-white shadow-sm transition hover:bg-ktf-blue-deep disabled:opacity-50"
        disabled={busy}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Verify recovery code
      </button>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        This code cannot open the admin workspace. It unlocks a ten-minute, authenticator-replacement-only session.
      </p>
    </form>
  );
}
