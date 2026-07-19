import { CheckCircle2, Database, KeyRound, ServerCog, ShieldCheck, UserCog, type LucideIcon } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { listAdminSessions } from "@/features/admin/auth";
import { isAdminDatabaseConfigured } from "@/features/admin/db";
import { formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { inputClass, labelClass, Panel, PanelHeader, primaryButtonClass, StatusPill, textareaClass } from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import { listSiteAssetsSafe, SITE_ASSET_KEYS } from "@/features/admin/site-assets/repository";
import { isR2Configured } from "@/lib/storage/r2";
import { resolveApprovalAction, revokeSessionAction, setUserStateAction, updateSettingsAction } from "../actions";
import { HeroAssetManager } from "./hero-asset-manager";

export default async function SettingsPage() {
  const session = await requireAdminPermission("dashboard.view");
  const snapshot = await getAdminSnapshot();
  const founder = session.role === "founder_admin";
  const sessions = founder ? await listAdminSessions() : await listAdminSessions(session.userId);
  const currentTime = new Date().getTime();
  const siteAssets = founder ? await listSiteAssetsSafe() : {};
  const configuredHeroSlots = SITE_ASSET_KEYS.filter((key) => Boolean(siteAssets[key]));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HealthCard icon={Database} label="Operational database" ready={isAdminDatabaseConfigured()} detail={isAdminDatabaseConfigured() ? "CockroachDB is configured" : "Awaiting DATABASE_URL"} />
        <HealthCard icon={KeyRound} label="Access verifier" ready={Boolean(process.env.ADMIN_FOUNDER_TOTP_SECRET && process.env.ADMIN_MANAGER_TOTP_SECRET)} detail={process.env.ADMIN_FOUNDER_TOTP_SECRET ? "Rotating code configured" : "Configure TOTP secrets"} />
        <HealthCard icon={ShieldCheck} label="Enrollment bootstrap" ready={process.env.ADMIN_ALLOW_BOOTSTRAP !== "true"} detail={process.env.ADMIN_ALLOW_BOOTSTRAP === "true" ? "One-time enrollment open" : "Disabled — fail-closed"} />
        <HealthCard icon={ServerCog} label="Recurring scheduler" ready={Boolean(process.env.ADMIN_CRON_SECRET)} detail={process.env.ADMIN_CRON_SECRET ? "Protected job endpoint ready" : "Add ADMIN_CRON_SECRET"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader title="Verified company identity" description="Only approved facts flow into issued documents." />
          {founder ? (
            <form action={updateSettingsAction} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label><span className={labelClass}>Company name</span><input className={inputClass} name="name" defaultValue={snapshot.settings.name} required /></label>
              <label><span className={labelClass}>Registration number</span><input className={inputClass} name="registrationNumber" defaultValue={snapshot.settings.registrationNumber} required /></label>
              <label><span className={labelClass}>Website</span><input className={inputClass} name="website" defaultValue={snapshot.settings.website} required /></label>
              <label><span className={labelClass}>Email</span><input className={inputClass} name="email" type="email" defaultValue={snapshot.settings.email} required /></label>
              <label><span className={labelClass}>Phone</span><input className={inputClass} name="phone" defaultValue={snapshot.settings.phone} required /></label>
              <label><span className={labelClass}>Address</span><input className={inputClass} name="address" defaultValue={snapshot.settings.address} /></label>
              <label className="sm:col-span-2"><span className={labelClass}>Public motto</span><input className={inputClass} name="motto" defaultValue={snapshot.settings.motto} required /></label>
              <label><span className={labelClass}>Default currency</span><select className={inputClass} name="defaultCurrency" defaultValue={snapshot.settings.defaultCurrency}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
              <label><span className={labelClass}>Default payment terms</span><input className={inputClass} name="defaultPaymentTermsDays" type="number" min="0" max="365" defaultValue={snapshot.settings.defaultPaymentTermsDays} /></label>
              <label><span className={labelClass}>Manager approval threshold</span><input className={inputClass} name="invoiceApprovalThreshold" type="number" min="0" defaultValue={snapshot.settings.invoiceApprovalThreshold} /></label>
              <label className="sm:col-span-2"><span className={labelClass}>Verified payment instructions</span><textarea className={textareaClass} name="paymentInstructions" defaultValue={snapshot.settings.paymentInstructions} placeholder="Leave empty until approved." /></label>
              <label className="sm:col-span-2"><span className={labelClass}>Change reason</span><input className={inputClass} name="reason" placeholder="Why are these controlled settings changing?" required /></label>
              <div className="sm:col-span-2"><button className={primaryButtonClass}>Save controlled settings</button></div>
            </form>
          ) : (
            <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
              <div><dt className="text-xs text-slate-400">Company</dt><dd className="mt-1 font-semibold">{snapshot.settings.name}</dd></div>
              <div><dt className="text-xs text-slate-400">Registration</dt><dd className="mt-1 font-semibold">{snapshot.settings.registrationNumber}</dd></div>
              <div><dt className="text-xs text-slate-400">Website</dt><dd className="mt-1 font-semibold">{snapshot.settings.website}</dd></div>
              <div><dt className="text-xs text-slate-400">Approval threshold</dt><dd className="mt-1 font-semibold">{formatMoney(snapshot.settings.invoiceApprovalThreshold)}</dd></div>
            </dl>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Admin people and access" description="Named identities preserve accountability." action={<UserCog className="h-4 w-4 text-blue-700" />} />
          <div className="divide-y divide-slate-100">
            {snapshot.users.map((user) => (
              <article key={user.id} className="p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{user.displayName}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></div><StatusPill value={user.state} /></div>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[11px] text-slate-400">{user.role.replaceAll("_", " ")} · Last login {formatAdminDate(user.lastLoginAt)}</p>
                  {founder && user.id !== session.userId && (
                    <details className="w-full sm:w-64">
                      <summary className="cursor-pointer text-right text-[11px] font-semibold text-slate-600">Change access</summary>
                      <form action={setUserStateAction} className="mt-2 flex flex-col gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="state" value={user.state === "suspended" ? "active" : "suspended"} />
                        <input className={inputClass} name="reason" placeholder="Required reason" required />
                        <button className="h-8 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600">{user.state === "suspended" ? "Reactivate" : "Suspend"}</button>
                      </form>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      {founder && (
        <Panel>
          <PanelHeader
            title="Homepage hero screenshots"
            description="The three phone screens on the public homepage. Empty slots render the designed fallback."
          />
          <HeroAssetManager configured={configuredHeroSlots} storageReady={isR2Configured()} />
        </Panel>
      )}

      {founder && (
        <Panel>
          <PanelHeader title="Founder approval queue" description="Review exceptional requests with a recorded outcome." />
          <div className="divide-y divide-slate-100">
            {snapshot.approvals.map((approval) => (
              <article key={approval.id} className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                <div><p className="text-sm font-bold text-slate-900">{approval.action.replaceAll(".", " ")}</p><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{approval.reason}</p><p className="mt-2 text-[11px] text-slate-400">Created {formatAdminDate(approval.createdAt)} · {approval.entityType}</p></div>
                <div className="flex flex-col items-end gap-2"><StatusPill value={approval.state} />{approval.state === "pending" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <form action={resolveApprovalAction} className="flex gap-2"><input type="hidden" name="id" value={approval.id} /><input type="hidden" name="resolution" value="approved" /><input className={inputClass} name="note" placeholder="Approval reason" required /><button className="h-10 rounded-lg bg-slate-950 px-3 text-[11px] font-semibold text-white">Approve</button></form>
                    <form action={resolveApprovalAction} className="flex gap-2"><input type="hidden" name="id" value={approval.id} /><input type="hidden" name="resolution" value="rejected" /><input className={inputClass} name="note" placeholder="Rejection reason" required /><button className="h-10 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600">Reject</button></form>
                  </div>
                )}</div>
              </article>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader title="Active sessions" description="Revoke access immediately when a device or session is no longer trusted." />
        <div className="divide-y divide-slate-100">
          {sessions.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div><p className="text-sm font-semibold text-slate-800">{item.displayName} <span className="font-normal text-slate-400">· {item.role.replaceAll("_", " ")}</span></p><p className="mt-1 text-[11px] text-slate-400">Last seen {formatAdminDate(item.lastSeenAt)} · Expires {formatAdminDate(item.expiresAt)}</p></div>
              <div className="flex items-center gap-2"><StatusPill value={item.revokedAt ? "revoked" : Date.parse(item.expiresAt) <= currentTime ? "expired" : "active"} />{founder && !item.revokedAt && Date.parse(item.expiresAt) > currentTime && item.id !== session.id && (
                <details><summary className="cursor-pointer text-[11px] font-semibold text-rose-700">Revoke</summary><form action={revokeSessionAction} className="mt-2 flex gap-2"><input type="hidden" name="id" value={item.id} /><input className={inputClass} name="reason" placeholder="Required reason" required /><button className="h-10 rounded-lg border border-rose-200 px-3 text-[11px] font-semibold text-rose-700">Confirm</button></form></details>
              )}</div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HealthCard({ icon: Icon, label, ready, detail }: { icon: LucideIcon; label: string; ready: boolean; detail: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon className="h-5 w-5" /></span>{ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-2 w-2 rounded-full bg-amber-500" />}</div><p className="mt-4 text-sm font-bold text-slate-900">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>;
}
