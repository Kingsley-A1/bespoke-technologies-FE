"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthAlert, AuthNote, authPrimaryButtonClass } from "@/features/admin/components/admin-auth-ui";
import { AuthenticatorSetup } from "@/features/admin/components/authenticator-setup";

export function RecoverySetupFlow({
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

  return (
    <form onSubmit={submit} className="space-y-5">
      <AuthenticatorSetup qrDataUrl={qrDataUrl} secret={secret} qrAlt="Recovery authenticator setup QR code" code={code} onCodeChange={setCode} />
      {error ? <AuthAlert>{error}</AuthAlert> : null}
      <button type="submit" className={authPrimaryButtonClass} disabled={busy || code.length !== 6}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Confirm new authenticator
      </button>
      <AuthNote>
        This session expires <time dateTime={expiresAt}>within ten minutes</time>. Confirming signs out every other Admin
        session for this account.
      </AuthNote>
    </form>
  );
}
