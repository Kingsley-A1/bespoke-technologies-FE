"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { AdminSession } from "../types";
import {
  inputClass,
  Panel,
  PanelHeader,
  primaryButtonClass,
  secondaryButtonClass,
  StatusPill,
} from "../components/admin-ui";

interface SecurityEvent {
  id: string;
  action: string;
  entityId?: string;
  createdAt: string;
}

interface RotationSetup {
  secret: string;
  qrDataUrl: string;
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function eventLabel(action: string) {
  const labels: Record<string, string> = {
    "admin.authenticator.rotation_started": "Authenticator change started",
    "admin.authenticator.rotated": "Authenticator changed",
    "admin.authenticator.rotation_rejected": "Authenticator change rejected",
    "admin.authenticator.rotation_confirm_failed": "New authenticator confirmation failed",
    "admin.recovery_codes.issued": "New recovery codes generated",
    "admin.recovery_codes.issue_rejected": "Recovery-code generation rejected",
    "admin.recovery.started": "Lost-device recovery started",
    "admin.recovery.completed": "Lost-device recovery completed",
    "admin.recovery.rejected": "Lost-device recovery rejected",
    "admin.recovery.confirm_failed": "Recovery authenticator confirmation failed",
    "admin.session.created": "Admin session created",
    "admin.session.revoked": "Admin session revoked",
    "admin.session.expired": "Admin session expired",
    "admin.login.failed": "Sign-in attempt failed",
    "admin.login.locked": "Sign-in temporarily locked",
  };
  return labels[action] ?? action.replaceAll(".", " ").replaceAll("_", " ");
}

export function SecurityManager({
  currentSessionId,
  sessions,
  authenticatorConfirmedAt,
  recoveryCodesRemaining,
  events,
  recovered,
}: {
  currentSessionId: string;
  sessions: AdminSession[];
  authenticatorConfirmedAt?: string;
  recoveryCodesRemaining: number;
  events: SecurityEvent[];
  recovered: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    recovered ? "Authenticator replaced successfully. Every earlier admin session was revoked." : null,
  );
  const [rotationCode, setRotationCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [rotation, setRotation] = useState<RotationSetup | null>(null);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  async function request<T>(url: string, body: Record<string, string>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "The security request could not be completed.");
    return payload;
  }

  async function beginRotation(event: React.FormEvent) {
    event.preventDefault();
    setBusy("rotation");
    setError(null);
    setNotice(null);
    try {
      const payload = await request<RotationSetup>("/admin/api/security/authenticator/start", {
        currentCode: rotationCode,
      });
      setRotation(payload);
      setRotationCode("");
      setNotice("Current app verified. It remains active until the new app is confirmed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authenticator change could not start.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmRotation(event: React.FormEvent) {
    event.preventDefault();
    setBusy("confirm");
    setError(null);
    try {
      const payload = await request<{ revokedSessions: number }>("/admin/api/security/authenticator/confirm", {
        code: newCode,
      });
      setRotation(null);
      setNewCode("");
      setNotice(`New authenticator confirmed. ${payload.revokedSessions} other session${payload.revokedSessions === 1 ? "" : "s"} revoked.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The new app could not be confirmed.");
    } finally {
      setBusy(null);
    }
  }

  async function generateCodes(event: React.FormEvent) {
    event.preventDefault();
    setBusy("codes");
    setError(null);
    setNotice(null);
    try {
      const payload = await request<{ codes: string[] }>("/admin/api/security/recovery-codes", {
        currentCode: recoveryCode,
      });
      setCodes(payload.codes);
      setRecoveryCode("");
      setNotice("New recovery codes generated. Every older unused recovery code is now invalid.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recovery codes could not be generated.");
    } finally {
      setBusy(null);
    }
  }

  async function copyCodes() {
    if (!codes) return;
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadCodes() {
    if (!codes) return;
    const contents = [
      "Bespoke Technologies admin recovery codes",
      "Each code works once. Store this file offline and delete insecure copies.",
      "",
      ...codes,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([contents], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bespoke-admin-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function revokeSession(sessionId: string) {
    setBusy(sessionId);
    setError(null);
    try {
      const payload = await request<{ currentSession: boolean }>("/admin/api/security/sessions/revoke", { sessionId });
      if (payload.currentSession) {
        window.location.assign("/admin/login");
        return;
      }
      setNotice("Session revoked.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The session could not be revoked.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {(notice || error) && (
        <div
          role={error ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
        >
          {error ?? notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Authenticator app"
            description={`Current authenticator confirmed ${formatDate(authenticatorConfirmedAt)}.`}
            action={<KeyRound className="h-5 w-5 text-ktf-blue" />}
          />
          <div className="p-5 sm:p-6">
            {rotation ? (
              <form onSubmit={confirmRotation} className="space-y-5">
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
                  <p className="text-sm font-bold text-slate-900">Set up the new app</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Scan this QR with the replacement authenticator. Your old app still works until the code below is confirmed.
                  </p>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                    <Image
                      src={rotation.qrDataUrl}
                      alt="New authenticator setup QR code"
                      width={176}
                      height={176}
                      unoptimized
                      className="h-44 w-44 rounded-md border border-slate-200 bg-white"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Manual setup key</p>
                      <code className="mt-2 block break-all rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800">
                        {rotation.secret}
                      </code>
                    </div>
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Code from the new app</span>
                  <input
                    className={`${inputClass} font-mono tracking-[0.3em]`}
                    value={newCode}
                    onChange={(event) => setNewCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    required
                    autoFocus
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className={primaryButtonClass} disabled={busy === "confirm" || newCode.length !== 6}>
                    {busy === "confirm" && <Loader2 className="h-4 w-4 animate-spin" />} Confirm new app
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={() => setRotation(null)}>
                    Keep current app
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={beginRotation} className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  Changing apps is a two-step handover. First verify the current app; the new app must then produce a valid code before the old one is disabled.
                </p>
                <label className="block max-w-xs">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Current authenticator code</span>
                  <input
                    className={`${inputClass} font-mono tracking-[0.3em]`}
                    value={rotationCode}
                    onChange={(event) => setRotationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    required
                  />
                </label>
                <button className={primaryButtonClass} disabled={busy === "rotation" || rotationCode.length !== 6}>
                  {busy === "rotation" && <Loader2 className="h-4 w-4 animate-spin" />}
                  <RefreshCw className="h-4 w-4" /> Verify and change app
                </button>
              </form>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Lost-device recovery"
            description={`${recoveryCodesRemaining} unused recovery code${recoveryCodesRemaining === 1 ? "" : "s"} available.`}
            action={<ShieldAlert className="h-5 w-5 text-amber-600" />}
          />
          <div className="p-5 sm:p-6">
            {codes ? (
              <div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                  These plaintext codes will not be shown again. Each code is single-use; only its HMAC hash is stored.
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {codes.map((code) => (
                    <code key={code} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">{code}</code>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className={secondaryButtonClass} onClick={() => void copyCodes()}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy all"}
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={downloadCodes}>
                    <Download className="h-4 w-4" /> Download once
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={() => setCodes(null)}>I stored them safely</button>
                </div>
              </div>
            ) : (
              <form onSubmit={generateCodes} className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  Generate a fresh set and store it offline. This immediately retires every older recovery code.
                </p>
                <label className="block max-w-xs">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Current authenticator code</span>
                  <input
                    className={`${inputClass} font-mono tracking-[0.3em]`}
                    value={recoveryCode}
                    onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    required
                  />
                </label>
                <button className={primaryButtonClass} disabled={busy === "codes" || recoveryCode.length !== 6}>
                  {busy === "codes" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Generate new recovery codes
                </button>
              </form>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader title="Your sessions" description="Revoke a device immediately when it is no longer trusted." action={<MonitorSmartphone className="h-5 w-5 text-ktf-blue" />} />
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => {
              const active = session.isActive ?? !session.revokedAt;
              return (
                <article key={session.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {session.id === currentSessionId ? "This device" : "Admin session"}
                      </p>
                      <StatusPill value={session.revokedAt ? "revoked" : active ? "active" : "expired"} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Last seen {formatDate(session.lastSeenAt)} · Created {formatDate(session.createdAt)}</p>
                  </div>
                  {active && (
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      disabled={busy === session.id}
                      onClick={() => void revokeSession(session.id)}
                    >
                      {busy === session.id && <Loader2 className="h-4 w-4 animate-spin" />} Revoke
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Security activity" description="Recent events for your own admin identity." action={<ShieldCheck className="h-5 w-5 text-emerald-600" />} />
          <div className="divide-y divide-slate-100">
            {events.length ? events.map((event) => (
              <article key={event.id} className="p-5">
                <p className="text-sm font-semibold capitalize text-slate-800">{eventLabel(event.action)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(event.createdAt)}</p>
              </article>
            )) : (
              <p className="p-6 text-sm text-slate-500">No security activity has been recorded yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
