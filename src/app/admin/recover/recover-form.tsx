"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthAlert, AuthNote, authInputClass, authLabelClass, authPrimaryButtonClass } from "@/features/admin/components/admin-auth-ui";

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
        <span className={authLabelClass}>Work email</span>
        <input
          className={authInputClass}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@bespoketech.com.ng"
        />
      </label>
      <label className="block">
        <span className={authLabelClass}>Recovery code</span>
        <input
          className={`${authInputClass} font-mono uppercase tracking-wide`}
          autoComplete="off"
          spellCheck={false}
          required
          value={recoveryCode}
          onChange={(event) => setRecoveryCode(event.target.value.toUpperCase().slice(0, 40))}
          placeholder="BT-XXXX-XXXX-XXXX-XXXX"
        />
      </label>
      {error ? <AuthAlert>{error}</AuthAlert> : null}
      <button type="submit" className={authPrimaryButtonClass} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {busy ? "Checking code…" : "Continue"}
      </button>
      <AuthNote>
        A recovery code does not open Admin. It only allows a ten-minute session to replace your authenticator, and it
        can be used once.
      </AuthNote>
    </form>
  );
}
